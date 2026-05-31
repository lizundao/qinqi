// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
    site: 'https://qinqi.wiki',
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
                Hero: './src/components/Hero.astro',
                PageFrame: './src/components/PageFrame.astro',
            },
            title: '亲戚百科',
            description: '中国亲戚关系计算器与亲戚常识文章',
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
            sidebar: [
                {
                    label: '关于',
                    slug: 'about',
                },
            ],
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
    ],
});