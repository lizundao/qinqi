// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import starlight from '@astrojs/starlight';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
    site: 'https://qinqi.wiki',
    markdown: {
        processor: unified({
            gfm: true,
            smartypants: true,
        }),
    },
    vite: {
      optimizeDeps: {
          include: ['relationship.js'],
      },

      ssr: {
          noExternal: ['relationship.js'],
      },

      plugins: [tailwindcss()],
    },
    integrations: [
        starlight({
            components: {
                Header: './src/components/Header.astro',
                PageFrame: './src/components/PageFrame.astro',
            },
            title: '亲戚百科',
            description: '帮现代人搞清亲戚称呼、读懂亲缘分寸。含关系计算器与亲戚常识，辨别亲疏、珍重亲情。',
            logo: {
                light: './src/assets/logo.svg',
                dark: './src/assets/logo-dark.svg',
                alt: '亲戚百科',
            },
            favicon: '/favicon.svg',
            defaultLocale: 'root',
            locales: {
                root: {
                    label: '简体中文',
                    lang: 'zh-CN',
                },
            },
            social: [
                {
                    icon: 'github',
                    label: 'GitHub',
                    href: 'https://github.com/lizundao/qinqi',
                },
            ],
            customCss: ['./src/styles/global.css'],
            pagination: false,
            sidebar: [],
            head: [
                {
                    tag: 'meta',
                    attrs: {
                        name: 'keywords',
                        content: '亲戚称呼,亲戚关系,中国亲戚,称谓计算器,娘亲舅大',
                    },
                },
                {
                    tag: 'link',
                    attrs: {
                        rel: 'preconnect',
                        href: 'https://fonts.googleapis.com',
                    },
                },
                {
                    tag: 'link',
                    attrs: {
                        rel: 'preconnect',
                        href: 'https://fonts.gstatic.com',
                        crossorigin: true,
                    },
                },
            ],
        }),
        // 放在 Starlight 之后，且 optimize: false，否则 MDX 表格会变成纯文本
        mdx({ gfm: true, optimize: false }),
    ],
});