import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/**
 * 构建前预生成文章的 AI 分析结果，写入 src/data/ai-analysis.json。
 * 这样页面在运行时无需请求第三方接口（也绕开了智谱接口的 CORS 限制）。
 *
 * 用法：npx tsx scripts/gen-ai-analysis.ts [--force]
 */

const ROOT = path.resolve(process.cwd());
const POSTS_DIR = path.join(ROOT, "src/content/posts");
const OUT_FILE = path.join(ROOT, "src/data/ai-analysis.json");

const API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const API_KEY = process.env.ZHIPU_API_KEY || "99db6108504a4e6a8f5d3d1fe7e6da3c.o9P6TO8VG8Vx7P8b";
const MODEL = process.env.ZHIPU_MODEL || "glm-4-flash";

const force = process.argv.includes("--force");

interface AnalysisResult {
	summary: string;
	keyPoints: string[];
	difficulty: string;
	readingTime: number;
	updated: string;
}

function walk(dir: string): string[] {
	const out: string[] = [];
	for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, item.name);
		if (item.isDirectory()) out.push(...walk(full));
		else if (/\.(md|mdx)$/.test(item.name)) out.push(full);
	}
	return out;
}

function plainText(markdown: string): string {
	return markdown
		.replace(/^---[\s\S]*?---/, "")
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/<[^>]+>/g, " ")
		.replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "")
		.replace(/[*_~`|]/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

async function callAI(title: string, content: string, words: number): Promise<AnalysisResult | null> {
	const prompt = `你是一位资深的技术编辑，擅长为读者提炼文章价值。请通读下面这篇文章并完成分析。

写作要求：
1. 摘要必须具体，点出文章真正讲了什么（用了哪些方法/结论），禁止"本文介绍了……"这类空泛套话，2-3 句话，不超过 120 字。
2. 核心要点 3-5 条，每条是一句完整、可独立理解的结论或知识点，不要罗列章节标题。
3. 难度按读者的实际门槛判断：简单 / 中等 / 较难。
4. 阅读时间按文章信息密度估算，返回整数分钟。
5. 全部使用简体中文。

文章标题：${title}
文章字数：${words}

文章内容：
${content.slice(0, 6000)}

只返回纯 JSON（不要 markdown 代码块），格式：
{
  "summary": "……",
  "keyPoints": ["……", "……", "……"],
  "difficulty": "简单/中等/较难",
  "readingTime": 整数
}`;

	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			const controller = new AbortController();
			const timer = setTimeout(() => controller.abort(), 45_000);
			const resp = await fetch(API_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${API_KEY}`,
				},
				body: JSON.stringify({
					model: MODEL,
					messages: [{ role: "user", content: prompt }],
					temperature: 0.2,
					stream: false,
				}),
				signal: controller.signal,
			});
			clearTimeout(timer);
			if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
			const data: any = await resp.json();
			let text: string = data?.choices?.[0]?.message?.content || "";
			text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
			const m = text.match(/\{[\s\S]*\}/);
			if (m) text = m[0];
			const parsed = JSON.parse(text);
			return {
				summary: String(parsed.summary || "").trim(),
				keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.map(String) : [],
				difficulty: String(parsed.difficulty || "中等"),
				readingTime: Number(parsed.readingTime) || 1,
				updated: new Date().toISOString().slice(0, 10),
			};
		} catch (err) {
			console.log(`   重试 ${attempt + 1}/3:`, err instanceof Error ? err.message : err);
			await new Promise((r) => setTimeout(r, 1500));
		}
	}
	return null;
}

async function main() {
	const files = walk(POSTS_DIR);
	const existing: Record<string, AnalysisResult> = fs.existsSync(OUT_FILE)
		? JSON.parse(fs.readFileSync(OUT_FILE, "utf8"))
		: {};
	const next: Record<string, AnalysisResult> = {};

	fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });

	for (const file of files) {
		const rel = path.relative(POSTS_DIR, file).replace(/\.(md|mdx)$/, "");
		const raw = fs.readFileSync(file, "utf8");
		const { data, content } = matter(raw);
		// 与 Astro 内容集合的 id 保持一致：优先使用 frontmatter 的 slug
		const key = data.slug ? String(data.slug) : rel;

		if (data.password || data.draft === true) {
			console.log(`跳过（加密/草稿）: ${key}`);
			continue;
		}

		if (!force && existing[rel]) {
			next[key] = existing[rel] || existing[key];
			console.log(`复用: ${key}`);
			continue;
		}

		const text = plainText(content);
		if (text.length < 50) {
			console.log(`跳过（正文过短）: ${key}`);
			continue;
		}

		process.stdout.write(`分析中: ${key} ... `);
		const result = await callAI(String(data.title || key), text, text.length);
		if (result) {
			next[key] = result;
			console.log("ok");
		} else {
			console.log("失败，沿用旧结果");
			if (existing[rel] || existing[key]) next[key] = existing[rel] || existing[key];
		}
	}

	fs.writeFileSync(OUT_FILE, `${JSON.stringify(next, null, "\t")}\n`, "utf8");
	console.log(`\n已写入 ${OUT_FILE}（${Object.keys(next).length} 篇）`);
}

main();
