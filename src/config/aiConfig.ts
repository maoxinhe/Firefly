import type { AIConfig } from "../types/aiConfig";

export const aiConfig: AIConfig = {
	// 是否启用 AI 文章分析功能
	enable: true,
	// 智谱 AI API Key（在 https://open.bigmodel.cn/ 获取，glm-4-flash 免费模型）
	apiKey: "99db6108504a4e6a8f5d3d1fe7e6da3c.o9P6TO8VG8Vx7P8b",
	// 使用的模型（glm-4-flash 为免费模型）
	model: "glm-4-flash",
	// 智谱 AI API 端点地址
	apiUrl: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
};
