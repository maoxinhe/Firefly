<script lang="ts">
import Icon from "@/components/common/Icon.svelte";
import I18nKey from "@/i18n/i18nKey";
import { i18n } from "@/i18n/translation";
import { aiConfig } from "@/config/aiConfig";

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
	"Simple": "text-green-500",
	"Medium": "text-yellow-500",
	"Hard": "text-red-500",
};

function getDifficultyColor(d: string): string {
	return difficultyColors[d] || "text-(--primary)";
}

function extractArticleText(): string {
	const el = document.querySelector(contentSelector);
	if (!el) return "";
	// 提取纯文本，保留段落换行
	const clone = el.cloneNode(true) as HTMLElement;
	// 移除代码块内容（太长且无阅读价值）
	clone.querySelectorAll("pre").forEach((pre) => pre.remove());
	return clone.textContent?.trim() || "";
}

async function analyze() {
	if (status === "loading") return;

	if (!aiConfig.apiKey) {
		status = "error";
		errorMsg = "API Key not configured";
		return;
	}

	status = "loading";
	errorMsg = "";
	result = null;

	try {
		const content = extractArticleText();

		// 截取前 4000 字符，避免超出 token 限制
		const truncatedContent = content.slice(0, 4000);

		const prompt = `你是一个专业的文章分析助手。请分析以下文章，并返回 JSON 格式的分析结果。

文章标题：${title}
文章字数：${words}
系统估算阅读时间：${minutes} 分钟

文章内容：
${truncatedContent}

请严格按照以下 JSON 格式返回结果（不要包含 markdown 代码块标记，直接返回纯 JSON）：
{
  "summary": "用 2-3 句话概括文章的核心内容",
  "keyPoints": ["要点1", "要点2", "要点3"],
  "difficulty": "简单/中等/较难（根据文章技术深度和内容复杂度判断）",
  "readingTime": 根据文章难度和长度推算的实际阅读时间（整数分钟）
}`;

		const response = await fetch(aiConfig.apiUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${aiConfig.apiKey}`,
			},
			body: JSON.stringify({
				model: aiConfig.model,
				messages: [
					{
						role: "user",
						content: prompt,
					},
				],
				temperature: 0.3,
				stream: false,
			}),
		});

		if (!response.ok) {
			throw new Error(`AI API error: ${response.status}`);
		}

		const data = await response.json();
		const aiContent: string =
			data?.choices?.[0]?.message?.content || "";

		// 解析 AI 返回的 JSON（去除可能的 markdown 代码块标记）
		let jsonStr = aiContent.trim();
		jsonStr = jsonStr
			.replace(/^```(?:json)?\s*/i, "")
			.replace(/\s*```$/i, "");

		// 尝试提取 JSON 部分
		const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			jsonStr = jsonMatch[0];
		}

		const parsed = JSON.parse(jsonStr);
		result = {
			summary: parsed.summary || "",
			keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
			difficulty: parsed.difficulty || "未知",
			readingTime: parsed.readingTime || minutes,
		};
		status = "success";
	} catch (err) {
		errorMsg = err instanceof Error ? err.message : "Unknown error";
		status = "error";
	}
}

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

	<!-- 未分析状态：显示按钮 -->
	{#if status === "idle"}
		<button
			class="w-full py-2.5 rounded-lg bg-(--primary)/10 hover:bg-(--primary)/20 text-(--primary) font-medium text-sm transition flex items-center justify-center gap-2"
			onclick={analyze}
		>
			<Icon icon="material-symbols:psychology-outline" class="text-lg" />
			{i18n(I18nKey.aiAnalysisBtn)}
		</button>
	{/if}

	<!-- 加载状态 -->
	{#if status === "loading"}
		<div class="flex items-center justify-center py-4 gap-2 text-black/50 dark:text-white/50">
			<Icon icon="material-symbols:progress-activity" class="text-xl animate-spin" />
			<span class="text-sm">{i18n(I18nKey.aiAnalysisLoading)}</span>
		</div>
	{/if}

	<!-- 错误状态 -->
	{#if status === "error"}
		<div class="text-center py-3">
			<p class="text-sm text-red-500 mb-2">{i18n(I18nKey.aiAnalysisError)}</p>
			{#if errorMsg.includes("not configured") || errorMsg.includes("API Key")}
				<p class="text-xs text-black/40 dark:text-white/40 mb-2">{i18n(I18nKey.aiAnalysisNoApiKey)}</p>
			{/if}
			<button
				class="px-4 py-1.5 rounded-lg bg-(--primary)/10 hover:bg-(--primary)/20 text-(--primary) text-sm font-medium transition"
				onclick={analyze}
			>
				{i18n(I18nKey.aiAnalysisRetry)}
			</button>
		</div>
	{/if}

	<!-- 成功状态：显示分析结果 -->
	{#if status === "success" && result}
		<!-- 折叠/展开切换 -->
		<div class="flex justify-end mb-2">
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
			<div class="space-y-3">
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
			</div>
		{/if}
	{/if}
</div>

<style>
.ai-analysis-card {
	transition: all 0.3s ease;
}
</style>
