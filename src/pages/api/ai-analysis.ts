import { aiConfig } from "@/config/aiConfig";

export const prerender = false;

interface AnalysisResult {
	summary: string;
	keyPoints: string[];
	difficulty: string;
	readingTime: number;
}

export async function POST({ request }: { request: Request }): Promise<Response> {
	if (!aiConfig.enable) {
		return new Response(
			JSON.stringify({ error: "AI analysis is disabled" }),
			{ status: 403, headers: { "Content-Type": "application/json" } },
		);
	}

	if (!aiConfig.apiKey) {
		return new Response(
			JSON.stringify({ error: "AI API Key not configured" }),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}

	try {
		const body = await request.json();
		const { title, content, words, minutes } = body as {
			title: string;
			content: string;
			words?: number;
			minutes?: number;
		};

		if (!content || content.trim().length === 0) {
			return new Response(
				JSON.stringify({ error: "Article content is empty" }),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		// 截取前 4000 字符，避免超出 token 限制
		const truncatedContent = content.slice(0, 4000);

		const prompt = `你是一个专业的文章分析助手。请分析以下文章，并返回 JSON 格式的分析结果。

文章标题：${title}
文章字数：${words || "未知"}
系统估算阅读时间：${minutes || "未知"} 分钟

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
			const errorText = await response.text();
			console.error("Zhipu AI API error:", response.status, errorText);
			return new Response(
				JSON.stringify({ error: `AI API error: ${response.status}` }),
				{ status: 502, headers: { "Content-Type": "application/json" } },
			);
		}

		const data = await response.json();
		const aiContent: string =
			data?.choices?.[0]?.message?.content || "";

		// 解析 AI 返回的 JSON（去除可能的 markdown 代码块标记）
		let jsonStr = aiContent.trim();
		jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

		// 尝试提取 JSON 部分
		const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			jsonStr = jsonMatch[0];
		}

		const result: AnalysisResult = JSON.parse(jsonStr);

		return new Response(JSON.stringify(result), {
			headers: { "Content-Type": "application/json; charset=utf-8" },
		});
	} catch (err) {
		console.error("AI analysis error:", err);
		return new Response(
			JSON.stringify({ error: "Failed to analyze article" }),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}
}
