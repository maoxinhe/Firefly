export interface AIConfig {
	// 是否启用 AI 文章分析功能
	enable: boolean;
	// 智谱 AI API Key（在 https://open.bigmodel.cn/ 获取）
	apiKey: string;
	// 使用的模型（glm-4-flash 为免费模型）
	model: string;
	// API 端点地址
	apiUrl: string;
}
