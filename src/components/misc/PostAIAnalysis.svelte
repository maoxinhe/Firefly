<script lang="ts">
import Icon from "@/components/common/Icon.svelte";
import I18nKey from "@/i18n/i18nKey";
import { i18n } from "@/i18n/translation";

interface AnalysisResult {
	summary: string;
	keyPoints: string[];
	difficulty: string;
	readingTime: number;
	updated?: string;
}

interface Props {
	title: string;
	words: number;
	minutes: number;
	analysis?: AnalysisResult | null;
}

let { title, words, minutes, analysis = null }: Props = $props();

let collapsed = $state(false);

const difficultyColors: Record<string, string> = {
	简单: "text-green-500",
	中等: "text-yellow-500",
	较难: "text-red-500",
	Simple: "text-green-500",
	Medium: "text-yellow-500",
	Hard: "text-red-500",
};

function getDifficultyColor(d: string): string {
	return difficultyColors[d] || "text-(--primary)";
}

function toggleCollapse() {
	collapsed = !collapsed;
}
</script>

{#if analysis && analysis.summary}
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
			<div class="space-y-3 ai-analysis-body">
				<div>
					<div class="flex items-center gap-1.5 mb-1 text-sm font-medium text-black/60 dark:text-white/60">
						<Icon icon="material-symbols:summarize-outline" class="text-base text-(--primary)" />
						{i18n(I18nKey.aiAnalysisSummary)}
					</div>
					<p class="text-sm text-black/70 dark:text-white/70 leading-relaxed pl-6">
						{analysis.summary}
					</p>
				</div>

				{#if analysis.keyPoints.length > 0}
					<div>
						<div class="flex items-center gap-1.5 mb-1 text-sm font-medium text-black/60 dark:text-white/60">
							<Icon icon="material-symbols:lightbulb-outline" class="text-base text-(--primary)" />
							{i18n(I18nKey.aiAnalysisKeyPoints)}
						</div>
						<ul class="pl-6 space-y-0.5">
							{#each analysis.keyPoints as point}
								<li class="text-sm text-black/70 dark:text-white/70 leading-relaxed flex gap-1.5">
									<span class="text-(--primary) shrink-0">•</span>
									<span>{point}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				<div class="flex flex-wrap gap-4 pt-2 border-t border-(--line-divider)">
					{#if analysis.difficulty}
						<div class="flex items-center gap-1.5 text-sm">
							<span class="text-black/40 dark:text-white/40">{i18n(I18nKey.aiAnalysisDifficulty)}:</span>
							<span class={getDifficultyColor(analysis.difficulty)}>{analysis.difficulty}</span>
						</div>
					{/if}
					<div class="flex items-center gap-1.5 text-sm">
						<span class="text-black/40 dark:text-white/40">{i18n(I18nKey.aiAnalysisReadingTime)}:</span>
						<span class="text-(--primary) font-medium">{analysis.readingTime} {i18n(I18nKey.minutesCount)}</span>
					</div>
				</div>

				<p class="text-[11px] text-black/25 dark:text-white/25 pt-1">内容由 AI 生成，仅供参考</p>
			</div>
		{/if}
	</div>
{/if}
