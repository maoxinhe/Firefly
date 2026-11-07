<script lang="ts">
import Icon from "@/components/common/Icon.svelte";
import I18nKey from "@/i18n/i18nKey";
import { i18n } from "@/i18n/translation";
import { aiConfig } from "@/config/aiConfig";
import { onMount } from "svelte";

interface Props {
	title: string;
	words: number;
	minutes: number;
	contentSelector?: string;
}

let {
	title,
	words,
	minutes,
	contentSelector = ".markdown-content",
}: Props = $props();

type Status = "idle" | "loading" | "success" | "error";

let status: Status = $state("idle");
let errorMsg = $state("");
let collapsed = $state(false);

interface AnalysisResult {
	summary: string;
	keyPoints: string[];
	difficulty: string;
	readingTime: number;
}

let result: AnalysisResult | null = $state(null);

const difficultyColors: Record<string, string> = {
	"简单": "text-green-500",
	"中等": "text-yellow-500",
	"较难": "text-red-500",
	Simple: "text-green-500",
	Medium: "text-yellow-500",
	Hard: "text-red-500",
};

const CACHE_PREFIX = "ai-analysis:v2:";
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 天
const REQUEST_TIMEOUT = 45_000;

function getDifficultyColor(d: string): string {
	return difficultyColors[d] || "text-(--primary)";
}

function cacheKey(): string {
	if (typeof window === "undefined") return CACHE_PREFIX + title;
	return CACHE_PREFIX + decodeURIComponent(window.location.pathname);
}

function readCache(): AnalysisResult | null {
	if (typeof localStorage === "undefined") return null;
	try {
		const raw = localStorage.getItem(cacheKey());
		if (!raw) return null;
		const parsed = JSON.parse(raw) as { t: number; d: AnalysisResult };
		if (!parsed?.d || Date.now() - parsed.t > CACHE_TTL) {
			localStorage.removeItem(cacheKey());
			return null;
		}
		return parsed.d;
	} catch {
		return null;
	}
}

function writeCache(data: AnalysisResult) {
	if (typeof localStorage === "undefined") return;
	try {
		localStorage.setItem(
			cacheKey(),
			JSON.stringify({ t: Date.now(), d: data }),
		);
	} catch {
		/* 忽略配额异常 */
	}
}

function extractArticleText(): string {
	const el = document.querySelector(contentSelector);
	if (!el) return "";
	const clone = el.cloneNode(true) as HTMLElement;
	// 移除代码块、图片说明、脚注等对分析无意义的内容
	clone
		.querySelectorAll("pre, script, style, .expressive-code, figcaption, noscript")
		.forEach((node) => node.remove());
	return clone.textContent?.replace(/\s+/g, " ").trim() || "";
}

function buildPrompt(content: string): string {
	return `你是一位资深的技术编辑，擅长为读者提炼文章价值。请通读下面这篇文章并完成分析。

写作要求：
1. 摘要必须具体，点出文章真正讲了什么（用了哪些方法/结论），禁止"本文介绍了……"这类空泛套话，2-3 句话，不超过 120 字。
2. 核心要点 3-5 条，每条是一句完整、可独立理解的结论或知识点，不要罗列章节标题。
3. 难度按读者的实际门槛判断：简单 / 中等 / 较难。
4. 阅读时间按文章信息密度估算，返回整数分钟。
5. 全部使用简体中文。

文章标题：${title}
文章字数：${words}
系统估算阅读时间：${minutes} 分钟

文章内容：
${content}

只返回纯 JSON（不要 markdown 代码块），格式：
{
  "summary": "……",
  "keyPoints": ["……", "……", "……"],
  "difficulty": "简单/中等/较难",
  "readingTime": 整数
}`;
}

async function requestAnalysis(content: string): Promise<AnalysisResult> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

	try {
		const response = await fetch(aiConfig.apiUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${aiConfig.apiKey}`,
			},
			body: JSON.stringify({
				model: aiConfig.model,
				messages: [{ role: "user", content: buildPrompt(content) }],
				temperature: 0.2,
				stream: false,
			}),
			signal: controller.signal,
		});

		if (!response.ok) {
			throw new Error(`AI API error: ${response.status}`);
		}

		const data = await response.json();
		const aiContent: string = data?.choices?.[0]?.message?.content || "";

		let jsonStr = aiContent.trim();
		jsonStr = jsonStr
			.replace(/^```(?:json)?\s*/i, "")
			.replace(/\s*```$/i, "");
		const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
		if (jsonMatch) jsonStr = jsonMatch[0];

		let parsed: Partial<AnalysisResult>;
		try {
			parsed = JSON.parse(jsonStr);
		} catch {
			// 模型没按 JSON 返回时降级：把纯文本当作摘要
			parsed = { summary: aiContent.trim().slice(0, 200) };
		}

		return {
			summary: parsed.summary || "",
			keyPoints: Array.isArray(parsed.keyPoints)
				? parsed.keyPoints.filter(Boolean).map(String)
				: [],
			difficulty: parsed.difficulty || "未知",
			readingTime: Number(parsed.readingTime) || minutes,
		};
	} finally {
		clearTimeout(timer);
	}
}

async function analyze(force = false) {
	if (status === "loading") return;

	if (!aiConfig.enable) return;

	if (!aiConfig.apiKey) {
		status = "error";
		errorMsg = "API Key not configured";
		return;
	}

	if (force) {
		try {
			localStorage.removeItem(cacheKey());
		} catch {
			/* ignore */
		}
	}

	status = "loading";
	errorMsg = "";
	result = null;

	try {
		const content = extractArticleText();
		if (content.length < 50) {
			throw new Error("empty-content");
		}

		let lastError: unknown = null;
		for (let attempt = 0; attempt < 2; attempt++) {
			try {
				result = await requestAnalysis(content.slice(0, 6000));
				lastError = null;
				break;
			} catch (err) {
				lastError = err;
				// 首次失败后短暂退避再重试一次
				if (attempt === 0) {
					await new Promise((r) => setTimeout(r, 1200));
				}
			}
		}

		if (lastError) throw lastError;

		status = "success";
		collapsed = false; // 出结果自动展开
		if (result) writeCache(result);
	} catch (err) {
		const msg = err instanceof Error ? err.message : "Unknown error";
		errorMsg = msg === "empty-content" ? "" : msg;
		status = "error";
	}
}

// 打开文章即自动分析（命中缓存则直接展示，不再请求）
onMount(() => {
	const cached = readCache();
	if (cached) {
		result = cached;
		status = "success";
		collapsed = false;
		return;
	}
	// 等正文渲染完成后再取文本
	const start = () => setTimeout(() => void analyze(), 0);
	if (document.readyState === "complete") start();
	else window.addEventListener("load", start, { once: true });
});

function toggleCollapse() {
	collapsed = !collapsed;
}
</script>

<div class="ai-analysis-card card-base rounded-xl p-5 mb-6 transition onload-animation">
	<!-- Header: 标题 + 阅读时间 -->
	<div class="flex items-center justify-between mb-3">
		<div class="flex items-center gap-2">
			<div
				class="h-8 w-8 rounded-lg bg-(--primary)/10 flex items-center justify-center text-(--primary)"
			>
				<Icon icon="material-symbols:auto-awesome-outline" class="text-lg" />
			</div>
			<span class="font-semibold text-black/80 dark:text-white/80">
				{i18n(I18nKey.aiAnalysis)}
			</span>
		</div>
		<!-- 阅读时间徽章 -->
		<div class="flex items-center gap-3 text-sm">
			<div class="flex items-center gap-1 text-black/50 dark:text-white/50">
				<Icon icon="material-symbols:notes-rounded" class="text-base" />
				<span>{words} {i18n(I18nKey.wordsCount)}</span>
			</div>
			<div class="flex items-center gap-1 text-black/50 dark:text-white/50">
				<Icon icon="material-symbols:schedule-outline-rounded" class="text-base" />
				<span>{minutes} {i18n(I18nKey.minutesCount)}</span>
			</div>
		</div>
	</div>

	<!-- 加载状态 -->
	{#if status === "loading"}
		<div class="space-y-2.5 py-2" aria-live="polite">
			<div class="flex items-center gap-2 text-xs text-black/40 dark:text-white/40">
				<Icon icon="material-symbols:progress-activity" class="text-base animate-spin" />
				<span>{i18n(I18nKey.aiAnalysisLoading)}</span>
			</div>
			<div class="h-3 rounded-full bg-(--primary)/10 animate-pulse"></div>
			<div class="h-3 w-5/6 rounded-full bg-(--primary)/10 animate-pulse"></div>
			<div class="h-3 w-4/6 rounded-full bg-(--primary)/10 animate-pulse"></div>
		</div>
	{/if}

	<!-- 错误状态 -->
	{#if status === "error"}
		<div class="text-center py-3">
			{#if errorMsg}
				<p class="text-sm text-red-500 mb-2">{i18n(I18nKey.aiAnalysisError)}</p>
			{:else}
				<p class="text-sm text-black/40 dark:text-white/40 mb-2">正文过短，暂不生成分析</p>
			{/if}
			{#if errorMsg.includes("not configured") || errorMsg.includes("API Key")}
				<p class="text-xs text-black/40 dark:text-white/40 mb-2">{i18n(I18nKey.aiAnalysisNoApiKey)}</p>
			{/if}
			<button
				class="px-4 py-1.5 rounded-lg bg-(--primary)/10 hover:bg-(--primary)/20 text-(--primary) text-sm font-medium transition"
				onclick={() => analyze(true)}
			>
				{i18n(I18nKey.aiAnalysisRetry)}
			</button>
		</div>
	{/if}

	<!-- 成功状态：显示分析结果（默认展开） -->
	{#if status === "success" && result}
		<!-- 折叠/展开切换 + 重新分析 -->
		<div class="flex items-center justify-between mb-2">
			<button
				class="text-xs text-black/30 dark:text-white/30 hover:text-(--primary) transition flex items-center gap-1"
				onclick={() => analyze(true)}
				title="重新分析"
			>
				<Icon icon="material-symbols:refresh-rounded" class="text-sm" />
				<span>重新分析</span>
			</button>
			<button
				class="text-xs text-black/40 dark:text-white/40 hover:text-(--primary) transition flex items-center gap-1"
				onclick={toggleCollapse}
			>
				{collapsed ? i18n(I18nKey.aiAnalysisExpand) : i18n(I18nKey.aiAnalysisCollapse)}
				<Icon
					icon={collapsed ? "material-symbols:expand-more" : "material-symbols:expand-less"}
					class="text-base"
				/>
			</button>
		</div>

		{#if !collapsed}
			<div class="space-y-3 ai-analysis-body">
				<!-- 摘要 -->
				{#if result.summary}
					<div>
						<div class="flex items-center gap-1.5 mb-1 text-sm font-medium text-black/60 dark:text-white/60">
							<Icon icon="material-symbols:summarize-outline" class="text-base text-(--primary)" />
							{i18n(I18nKey.aiAnalysisSummary)}
						</div>
						<p class="text-sm text-black/70 dark:text-white/70 leading-relaxed pl-6">
							{result.summary}
						</p>
					</div>
				{/if}

				<!-- 核心要点 -->
				{#if result.keyPoints.length > 0}
					<div>
						<div class="flex items-center gap-1.5 mb-1 text-sm font-medium text-black/60 dark:text-white/60">
							<Icon icon="material-symbols:lightbulb-outline" class="text-base text-(--primary)" />
							{i18n(I18nKey.aiAnalysisKeyPoints)}
						</div>
						<ul class="pl-6 space-y-0.5">
							{#each result.keyPoints as point}
								<li class="text-sm text-black/70 dark:text-white/70 leading-relaxed flex gap-1.5">
									<span class="text-(--primary) shrink-0">•</span>
									<span>{point}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				<!-- 难度 + AI推荐阅读时间 -->
				<div class="flex flex-wrap gap-4 pt-2 border-t border-(--line-divider)">
					{#if result.difficulty}
						<div class="flex items-center gap-1.5 text-sm">
							<span class="text-black/40 dark:text-white/40">{i18n(I18nKey.aiAnalysisDifficulty)}:</span>
							<span class={getDifficultyColor(result.difficulty)}>{result.difficulty}</span>
						</div>
					{/if}
					<div class="flex items-center gap-1.5 text-sm">
						<span class="text-black/40 dark:text-white/40">{i18n(I18nKey.aiAnalysisReadingTime)}:</span>
						<span class="text-(--primary) font-medium">{result.readingTime} {i18n(I18nKey.minutesCount)}</span>
					</div>
				</div>

				<p class="text-[11px] text-black/25 dark:text-white/25 pt-1">内容由 AI 生成，仅供参考</p>
			</div>
		{/if}
	{/if}

	<!-- 兜底：极少数情况下未自动触发时保留手动入口 -->
	{#if status === "idle"}
		<button
			class="w-full py-2.5 rounded-lg bg-(--primary)/10 hover:bg-(--primary)/20 text-(--primary) font-medium text-sm transition flex items-center justify-center gap-2"
			onclick={() => analyze()}
		>
			<Icon icon="material-symbols:psychology-outline" class="text-lg" />
			{i18n(I18nKey.aiAnalysisBtn)}
		</button>
	{/if}
</div>

<style>
.ai-analysis-card {
	transition: all 0.3s ease;
}

.ai-analysis-body {
	animation: ai-analysis-fade 0.35s ease;
}

@keyframes ai-analysis-fade {
	from {
		opacity: 0;
		transform: translateY(4px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}
</style>
