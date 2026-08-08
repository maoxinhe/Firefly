import type { SiteConfig } from "@/types/siteConfig";

// 站点语言
const SITE_LANG = "zh_CN";

export const siteConfig: SiteConfig = {
	// 站点标题
	title: "maoxinhe 的博客",

	// 站点副标题
	subtitle: "个人知识库 / 技术笔记",

	// 站点 URL（换成你自己的域名）
	site_url: "https://wiki.catfix.top",

	// 站点描述
	description: "maoxinhe 的个人博客，记录学习与思考",

	// 站点关键词
	keywords: [
		"maoxinhe",
		"博客",
		"技术博客",
		"静态博客",
		"wiki",
	],

	// 主题色
	themeColor: {
		hue: 165,
		defaultMode: "system",
	},

	// 页面整体宽度
	pageWidth: 100,

	// 网站 Card 样式
	card: {
		border: false,
		followTheme: false,
	},

	// Favicon（使用 QQ 头像 API，QQ号：1096550598）
	favicon: [
		{
			src: "https://q1.qlogo.cn/g?b=qq&nk=1096550598&s=100",
		},
	],

	// 导航栏
	navbar: {
		logo: {
			type: "image",
			value: "https://q1.qlogo.cn/g?b=qq&nk=1096550598&s=640",
			valueDark: "https://q1.qlogo.cn/g?b=qq&nk=1096550598&s=640",
			alt: "maoxinhe",
		},
		title: "maoxinhe",
		widthFull: false,
		menuAlign: "center",
		followTheme: false,
		stickyNavbar: true,
	},

	// 站点开始日期
	siteStartDate: "2026-01-01",

	// 时区
	timezone: "Asia/Shanghai",

	// 页面开关（关掉所有你不需要的）
	pages: {
		friends: false,      // 关掉友链
		sponsor: false,      // 关掉打赏
		guestbook: false,    // 关掉留言板
		bangumi: false,      // 关掉番组计划
		gallery: false,      // 关掉相册
		anime: false,        // 关掉追番
		dynamic: false,     // 关掉动态
		booknav: false,     // 关掉书签导航
	},

	// 分类导航栏
	categoryBar: true,

	// 归档折叠
	foldArticle: true,

	// 文章列表布局
	postListLayout: {
		defaultMode: "list",
		mobileDefaultMode: "grid",
		coverPosition: "right",
		descriptionLines: 2,
		showStatsIcons: true,
		tagsPosition: "bottom",
		meta: {
			showPublished: true,
			showCategory: true,
			showTags: true,
			tagCount: 5,
			showWords: false,
			showReadingTime: false,
		},
		stats: {
			showPublished: true,
			showWords: true,
			showReadingTime: true,
		},
		grid: {
			masonry: false,
			columnWidth: 320,
		},
	},

	// 文章内容页
	post: {
		rehypeCallouts: {
			theme: "github",
			enablePythonMarkdownAdmonitions: false,
		},
		showLastModified: true,
		outdatedThreshold: 30,
		sharePoster: false,        // 关掉分享海报（避免外链）
		generateOgImages: false,
	},

	// bangumi（已关闭，配置保留但不生效）
	bangumi: {
		userId: "",
		mode: "dynamic",
		apiUrl: "",
		subjectBaseUrl: "",
		categoryOrder: ["anime", "book", "music", "game"],
	},

	// 追番（已关闭，bilibili UID 清空）
	anime: {
		bilibili: {
			uid: "",
		},
	},

	// 分页
	pagination: {
		postsPerPage: 10,
	},

	// 图像优化
	imageOptimization: {
		formats: "webp",
		quality: 85,
		noReferrerDomains: [],
	},

	// 站点语言
	lang: SITE_LANG,
};
