// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';

// 纯 Astro 静态站：不再使用 Starlight 壳层与 Tailwind，
// 视觉由 src/styles/site.css 的设计系统统一提供。
export default defineConfig({
  site: 'https://qinqi.wiki',
  trailingSlash: 'always',
  output: 'static',
  markdown: {
    processor: unified({ gfm: true, smartypants: true }),
  },
  vite: {
    ssr: { noExternal: ['relationship.js'] },
  },
  integrations: [
    // optimize: false，避免 MDX 表格在构建阶段被压成纯文本
    mdx({ gfm: true, optimize: false }),
  ],
});
