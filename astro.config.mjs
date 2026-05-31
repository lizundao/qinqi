// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://qinqi.wiki',
	integrations: [
		starlight({
			title: '亲戚百科',
			description: '中国亲戚关系计算器与科普文章',
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
			customCss: ['./src/styles/custom.css'],
			sidebar: [
				{
					label: '在线计算器',
					link: '/calc/',
					attrs: { 'data-pagefind-ignore': true },
				},
				{
					label: '科普文章',
					items: [{ autogenerate: { directory: 'articles' } }],
				},
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
			],
		}),
	],
});
