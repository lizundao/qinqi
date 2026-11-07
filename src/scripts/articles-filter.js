/** 文章库前端筛选：搜索 + 栏目 + 分页，纯本地，无外部依赖 */
const cards = Array.from(document.querySelectorAll('[data-article-card]'));
const grid = document.querySelector('[data-article-grid]');
if (grid && cards.length) {
  const search = document.querySelector('[data-search]');
  const filterBar = document.querySelector('[data-topic-filters]');
  const count = document.querySelector('[data-result-count]');
  const empty = document.querySelector('[data-empty]');
  const pagination = document.querySelector('[data-pagination]');
  const pageLabel = document.querySelector('[data-page-label]');
  const prev = document.querySelector('[data-page="prev"]');
  const next = document.querySelector('[data-page="next"]');
  const PER_PAGE = 12;

  let topic = 'all';
  let query = '';
  let page = 1;

  function apply() {
    const matched = cards.filter((card) => {
      const topicOk = topic === 'all' || card.dataset.topic === topic;
      const textOk = !query || (card.dataset.search || '').includes(query);
      return topicOk && textOk;
    });

    const pages = Math.max(1, Math.ceil(matched.length / PER_PAGE));
    if (page > pages) page = pages;
    const start = (page - 1) * PER_PAGE;
    const visible = new Set(matched.slice(start, start + PER_PAGE));

    cards.forEach((card) => card.classList.toggle('is-hidden', !visible.has(card)));
    if (count) count.textContent = `共 ${matched.length} 篇${query ? ` · 关键词「${query}」` : ''}`;
    if (empty) empty.hidden = matched.length > 0;
    if (pagination) pagination.hidden = matched.length <= PER_PAGE;
    if (pageLabel) pageLabel.textContent = `${page} / ${pages}`;
    if (prev) prev.disabled = page <= 1;
    if (next) next.disabled = page >= pages;
  }

  let timer;
  search?.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      query = (search.value || '').trim().toLowerCase();
      page = 1;
      apply();
    }, 120);
  });

  filterBar?.addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-topic-filter]');
    if (!btn) return;
    topic = btn.dataset.topicFilter || 'all';
    page = 1;
    filterBar.querySelectorAll('.chip').forEach((chip) => chip.classList.toggle('is-active', chip === btn));
    apply();
  });

  prev?.addEventListener('click', () => {
    if (page > 1) {
      page -= 1;
      apply();
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  next?.addEventListener('click', () => {
    page += 1;
    apply();
    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  apply();
}
