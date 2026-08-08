
<div align="center">

# maoxinhe 博客
> maoxinhe 的个人知识库与技术博客

</div>

基于 Astro 构建的个人博客系统。

## ✨ Features

### Core Features
  <tr>
    <td colspan="3" align="center">
      <img src="./docs/images/1.webp" >
      <br>Banner Mode</td>
    </td>
  </tr>
  <tr>
    <td align="center"><img src="./docs/images/3.webp" width="300"><br>Overlay Mode</td>
    <td align="center"><img src="./docs/images/2.webp" width="300"><br>Fullscreen Wallpaper Mode</td>
    <td align="center"><img src="./docs/images/4.webp" width="300"><br>Solid Color Mode</td>
  </tr>
</table>
<img alt="Lighthouse" src="./docs/images/Lighthouse.png" />

>[!TIP]
>
基于 Astro 构建的个人博客系统。

## ✨ Features

### Core Features

- [x] **Astro + Tailwind CSS** - Ultra-fast static site generation based on modern tech stack
- [x] **Smooth Animations** - Swup page transition animations for silky smooth browsing experience
- [x] **Responsive Design** - Perfect adaptation for desktop, tablet and mobile devices
- [x] **Multi-language Support** - i18n internationalization ui, supports Simplified Chinese, Traditional Chinese, English, Japanese, Russian, Korean
- [x] **Full-text Search** - Client-side search based on Pagefind, supports article content indexing.

### Personalization
- [x] **Dynamic Sidebar** - Supports single sidebar, dual sidebar configuration
- [x] **Article Layout** - Supports list (single column) and grid (multi-column/masonry) layout
- [x] **Font Management** - Custom font support with rich font selector
- [x] **Footer Configuration** - HTML content injection, fully customizable
- [x] **Light/Dark Mode** - Supports light/dark/system three modes
- [x] **Navbar Customization** - Logo, title, links fully customizable
- [x] **Wallpaper Mode Switching** - Banner wallpaper, fullscreen wallpaper, fullscreen transparent wallpaper, solid background
- [x] **Theme Color Customization** - 360° hue adjustment

## 🚀 Quick Start

### Requirements

- Node.js ≥ 22
- pnpm ≥ 9

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/maoxinhe/maoxinhe.git
   cd maoxinhe
   ```
   
   **First [Fork](https://github.com/maoxinhe/maoxinhe/fork) to your own repository then clone (recommended).**

   ```bash
   git clone https://github.com/your-github-name/maoxinhe.git
   cd maoxinhe
   ```
3. **Install dependencies:**
   ```bash
   # Install pnpm if not installed
   npm install -g pnpm
   
   # Install project dependencies
   pnpm install
   ```

4. **Configure blog:**
   - Edit configuration files in `src/config/` directory to customize blog settings

5. **Start development server:**
   ```bash
   pnpm dev
   ```
   Blog will be available at `http://localhost:4321`

### Platform Hosting Deployment
- **Refer to the [official guide](https://docs.astro.build/en/guides/deploy/) to deploy your blog to Vercel, Netlify, Cloudflare Pages, EdgeOne Pages, etc.**
- **Vercel**, **Netlify** and other major platforms auto-deploy, automatically selecting the appropriate adapter based on the environment.

   Framework Preset: `Astro`

   Root Directory: `./`

   Output Directory: `dist`

   Build Command: `pnpm run build`

   Install Command: `pnpm install`

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/maoxinhe/maoxinhe&project-name=maoxinhe&repository-name=maoxinhe)
   [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/maoxinhe/maoxinhe)

## 📖 Configuration

> 📚 配置文件位于 `src/config/` 目录，可根据需要自定义。

### Setting Website Language

To set the default language for your blog, edit the `src/config/siteConfig.ts` file:

```typescript
// Define site language
const SITE_LANG = "zh_CN";
```

**Supported language codes:**
- `zh_CN` - Simplified Chinese
- `zh_TW` - Traditional Chinese
- `en` - English
- `ja` - Japanese
- `ru` - Russian
- `ko` - Korean

### Configuration File Structure

```
src/
├── config/
│   ├── index.ts                  # Configuration index file
│   ├── siteConfig.ts             # Site basic configuration
│   ├── analyticsConfig.ts        # Analytics configuration
│   ├── announcementConfig.ts     # Announcement configuration
│   ├── backgroundWallpaper.ts    # Background wallpaper configuration
│   ├── commentConfig.ts          # Comment system configuration
│   ├── coverImageConfig.ts       # Cover image configuration
│   ├── displaySettingsConfig.ts  # Settings panel configuration
│   ├── dynamicConfig.ts          # Moments page configuration
│   ├── effectsConfig.ts          # Animation effects config (sakura, etc.)
│   ├── expressiveCodeConfig.ts   # Code highlighting configuration
│   ├── fontConfig.ts             # Font configuration
│   ├── footerConfig.ts           # Footer configuration
│   ├── friendsConfig.ts          # Friend links configuration
│   ├── galleryConfig.ts          # Gallery configuration
│   ├── licenseConfig.ts          # License configuration
│   ├── musicConfig.ts            # Music player configuration
│   ├── navBarConfig.ts           # Navbar configuration
│   ├── pioConfig.ts              # Mascot configuration
│   ├── mermaidConfig.ts          # Mermaid diagram configuration
│   ├── plantumlConfig.ts         # PlantUML diagram configuration
│   ├── profileConfig.ts          # User profile configuration
│   ├── sidebarConfig.ts          # Sidebar layout configuration
│   └── sponsorConfig.ts          # Sponsor configuration
```


## ⚙️ Article Frontmatter

```yaml
---
title: My First Blog Post
published: 2023-09-09
description: This is the first post of my new Astro blog.
image: ./cover.jpg  # Or use "api" to enable random cover images
tags: [Foo, Bar]
category: Front-end
draft: false
lang: zh-CN      # Only set when article language differs from site language in `siteConfig.ts`
pinned: false    # Pin article
comment: true    # Enable comments
---
```

## Moments

Moment files are stored in `src/content/dynamic/`, with one Markdown file per moment. Create one with:

```bash
pnpm new-d The weather is lovely today
```

`pnpm new-dynamic <content>` is the equivalent full command.

```yaml
---
published: 2026-07-15 16:15:29
pinned: true  # Pin article
location: China # Location
---

Moment content supports Markdown.
```

Also supports [Memos](https://www.usememos.com/) as a data source. Configure the `memos` option in `src/config/dynamicConfig.ts` to fetch Memos moments in real-time, with pinned sync and image attachment support.

## 📖 Markdown Extensions

In addition to the default [GitHub Flavored Markdown](https://github.github.com/gfm/) support in Astro, there are some additional Markdown features:

- Admonitions - Supports configuration for GitHub, Obsidian, VitePress, and Docusaurus themes
- GitHub Repository Cards
- Enhanced Code Blocks based on Expressive Code

## 🧞 Commands

All commands need to be executed in the project root directory:

| Command                    | Action                                              |
|:---------------------------|:----------------------------------------------------|
| `pnpm install`             | Install dependencies                                |
| `pnpm dev`                 | Start local development server at `localhost:4321`  |
| `pnpm build`               | Build site to `./dist/`                             |
| `pnpm preview`             | Preview built site locally                          |
| `pnpm check`               | Check for errors in code                            |
| `pnpm format`              | Format your code using Biome                        |
| `pnpm new-post <filename>` | Create new article                                  |
| `pnpm new-d <content>`     | Create a new moment                                 |
| `pnpm new-dynamic <content>` | Create a new moment (full command)                |
| `pnpm astro ...`           | Execute `astro add`, `astro check` and other commands |
| `pnpm astro --help`        | Display Astro CLI help                              |

## 🙏 Acknowledgments

本项目基于 [fuwari](https://github.com/saicaca/fuwari) 模板开发。

### Tech Stack

- [Astro](https://astro.build) 
- [Tailwind CSS](https://tailwindcss.com) 
- [Iconify](https://iconify.design)

### Inspiration Projects

- [fuwari](https://github.com/saicaca/fuwari)
- [hexo-theme-shoka](https://github.com/amehime/hexo-theme-shoka)
- [astro-koharu](https://github.com/cosZone/astro-koharu)
- [Mizuki](https://github.com/matsuzaka-yuki/Mizuki)

### Other References
- [fuwari](https://github.com/saicaca/fuwari)

## 📝 License

This project is licensed under the [MIT license](https://mit-license.org/). See the [LICENSE](./LICENSE) file for details.

Originally forked from [saicaca/fuwari](https://github.com/saicaca/fuwari). Thanks to the original author for their contributions.

**Copyright Notice:**
- Copyright (c) 2024 [saicaca](https://github.com/saicaca) - [fuwari](https://github.com/saicaca/fuwari)

Under the MIT license, you are free to use, modify, and distribute the code, but you must retain the above copyright notice.


<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
