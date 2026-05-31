const PAGE_SIZE = 6;

function initArticlesPage() {
	const searchInput = document.getElementById('articles-search') as HTMLInputElement | null;
	const list = document.getElementById('articles-list');
	const emptyEl = document.getElementById('articles-empty');
	const paginationEl = document.getElementById('articles-pagination');
	const items = list
		? ([...list.querySelectorAll('[data-article-item]')] as HTMLElement[])
		: [];

	if (!list || items.length === 0) return;

	let currentPage = 1;

	function getFilteredItems() {
		const query = searchInput?.value.trim().toLowerCase() ?? '';
		if (!query) return items;

		return items.filter((item) => (item.dataset.search ?? '').includes(query));
	}

	function renderPagination(totalPages: number) {
		if (!paginationEl) return;

		if (totalPages <= 1) {
			paginationEl.classList.add('hidden');
			paginationEl.replaceChildren();
			return;
		}

		paginationEl.classList.remove('hidden');

		const prevBtn = document.createElement('button');
		prevBtn.type = 'button';
		prevBtn.textContent = '上一页';
		prevBtn.disabled = currentPage <= 1;
		prevBtn.className =
			'rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800';

		const nextBtn = document.createElement('button');
		nextBtn.type = 'button';
		nextBtn.textContent = '下一页';
		nextBtn.disabled = currentPage >= totalPages;
		nextBtn.className = prevBtn.className;

		const info = document.createElement('span');
		info.className = 'inline-flex min-w-[5rem] items-center justify-center text-sm text-slate-500 dark:text-slate-400';
		info.textContent = `${currentPage} / ${totalPages}`;

		prevBtn.addEventListener('click', () => {
			if (currentPage > 1) {
				currentPage -= 1;
				render();
			}
		});

		nextBtn.addEventListener('click', () => {
			if (currentPage < totalPages) {
				currentPage += 1;
				render();
			}
		});

		paginationEl.replaceChildren(prevBtn, info, nextBtn);
	}

	function render() {
		const filtered = getFilteredItems();
		const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

		if (currentPage > totalPages) currentPage = totalPages;

		items.forEach((item) => item.classList.add('hidden'));

		if (filtered.length === 0) {
			emptyEl?.classList.remove('hidden');
			renderPagination(0);
			return;
		}

		emptyEl?.classList.add('hidden');

		const start = (currentPage - 1) * PAGE_SIZE;
		filtered.slice(start, start + PAGE_SIZE).forEach((item) => item.classList.remove('hidden'));

		renderPagination(totalPages);
	}

	searchInput?.addEventListener('input', () => {
		currentPage = 1;
		render();
	});

	render();
}

initArticlesPage();
