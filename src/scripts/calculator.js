/**
 * 亲戚称呼计算器 · 浏览器端逻辑
 * 算法：relationship.js v1.2.9（MIT）+ 官方 north / guangdong 方言数据
 * 与微信小程序「亲戚称呼计算器」共用同一套十单字原语与性别约束：
 *   父/兄/弟/子/夫 之后屏蔽「夫」；母/姐/妹/女/妻 之后屏蔽「妻」。
 */
import relationship from 'relationship.js';
import { north, guangdong } from './locale-data.js';

// 注册官方方言；default 用空数据强制每次重建反向索引，避免方言词残留
relationship.setMode('north', north.data);
relationship.setMode('guangdong', guangdong.data);
relationship.setMode('default', {});

const CHAIN_SEX = {
  父: 1, 兄: 1, 弟: 1, 夫: 1, 子: 1,
  母: 0, 姐: 0, 妹: 0, 妻: 0, 女: 0,
};
const MODE_NAMES = { default: '通用', north: '北方', guangdong: '广东' };
const EXPRESSION_RE = /[？?]|如何称呼|怎么称呼|是什么关系|叫什么|称呼什么|是什么人|是谁|是哪门亲/;
const HISTORY_KEY = 'qinqi_site_history_v1';

function normalize(output) {
  const list = Array.isArray(output) ? output : [output];
  return list.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim());
}

function readHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function pushHistory(item) {
  const next = [
    item,
    ...readHistory().filter((x) => !(x.text === item.text && x.mode === item.mode && x.type === item.type)),
  ].slice(0, 8);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* 隐私模式下忽略 */
  }
  return next;
}

async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand('copy');
    } catch {
      /* 复制失败时保持按钮原样 */
    }
    area.remove();
  }
  if (button) {
    const original = button.dataset.originalLabel || button.textContent;
    button.dataset.originalLabel = original;
    button.textContent = '已复制 ✓';
    setTimeout(() => {
      button.textContent = original;
    }, 1400);
  }
}

function init(root) {
  const input = root.querySelector('[data-input]');
  const result = root.querySelector('[data-result]');
  if (!input || !result) return;

  const $ = (sel) => root.querySelector(sel);
  const $$ = (sel) => Array.from(root.querySelectorAll(sel));
  const isFull = root.dataset.variant === 'full';
  const syncUrl = root.dataset.syncUrl === 'true';

  const main = $('[data-result-main]');
  const alt = $('[data-result-alt]');
  const meta = $('[data-result-meta]');
  const chainBox = $('[data-chain]');
  const keysHint = $('[data-keys-hint]');
  const keyButtons = $$('[data-key]');
  const historyBox = $('[data-history]');
  const historyList = $('[data-history-list]');

  const state = {
    text: '',
    tokens: [],
    sex: -1,
    reverse: false,
    type: 'default',
    mode: 'default',
    optimal: false,
  };

  function lastSex() {
    if (state.tokens.length) {
      const last = state.tokens[state.tokens.length - 1];
      return Object.prototype.hasOwnProperty.call(CHAIN_SEX, last) ? CHAIN_SEX[last] : -1;
    }
    return state.sex === 1 || state.sex === 0 ? state.sex : -1;
  }

  function updateKeys() {
    const sex = lastSex();
    const blocked = sex === 1 ? '夫' : sex === 0 ? '妻' : '';
    keyButtons.forEach((btn) => {
      btn.disabled = Boolean(blocked) && btn.dataset.key === blocked;
    });
    if (keysHint) {
      keysHint.textContent = sex === 1
        ? 'TA 是男的 · 已屏蔽「夫」'
        : sex === 0
          ? 'TA 是女的 · 已屏蔽「妻」'
          : '单字可无限组合';
    }
  }

  function renderChain() {
    if (!chainBox) return;
    chainBox.replaceChildren();
    if (!state.text) {
      const empty = document.createElement('span');
      empty.className = 'calc__chain-empty';
      empty.textContent = '关系链：尚未输入';
      chainBox.appendChild(empty);
      return;
    }
    const label = document.createElement('span');
    label.className = 'calc__chain-empty';
    label.textContent = state.tokens.length ? '关系链：' : '当前输入：';
    chainBox.appendChild(label);
    const parts = state.tokens.length ? state.tokens : [state.text];
    parts.forEach((part, index) => {
      if (index > 0) {
        const sep = document.createElement('span');
        sep.className = 'calc__chain-sep';
        sep.textContent = '的';
        chainBox.appendChild(sep);
      }
      const token = document.createElement('span');
      token.className = 'calc__chain-token';
      token.textContent = part;
      chainBox.appendChild(token);
    });
  }

  function setMain(text, kind) {
    main.className = `result__main${kind ? ` is-${kind}` : ''}`;
    main.textContent = text;
  }

  function resetResult() {
    setMain('点单字拼一条关系链，或直接输入后按「计算」。', 'empty');
    alt.replaceChildren();
    meta.textContent = '例如「父的父」= 爷爷，「母的母的兄」= 舅外公。';
  }

  function shareUrl() {
    const url = new URL('/calc/', window.location.origin);
    url.searchParams.set('chain', state.text);
    if (state.sex !== -1) url.searchParams.set('sex', String(state.sex));
    if (state.reverse) url.searchParams.set('reverse', '1');
    if (state.type !== 'default') url.searchParams.set('type', state.type);
    if (state.mode !== 'default') url.searchParams.set('mode', state.mode);
    if (state.optimal) url.searchParams.set('optimal', '1');
    return url.href;
  }

  function syncCurrentUrl() {
    if (!syncUrl) return;
    const url = new URL(window.location.href);
    ['chain', 'q', 'sex', 'reverse', 'type', 'mode', 'optimal'].forEach((k) => url.searchParams.delete(k));
    if (state.text) url.searchParams.set('chain', state.text);
    if (state.sex !== -1) url.searchParams.set('sex', String(state.sex));
    if (state.reverse) url.searchParams.set('reverse', '1');
    if (state.type !== 'default') url.searchParams.set('type', state.type);
    if (state.mode !== 'default') url.searchParams.set('mode', state.mode);
    if (state.optimal) url.searchParams.set('optimal', '1');
    window.history.replaceState({}, '', url);
  }

  function renderHistory() {
    if (!isFull || !historyBox || !historyList) return;
    const items = readHistory();
    historyBox.hidden = items.length === 0;
    historyList.replaceChildren();
    items.forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = item.text;
      btn.addEventListener('click', () => {
        applyText(item.text, '');
        compute();
      });
      historyList.appendChild(btn);
    });
  }

  function compute() {
    const text = state.text.trim();
    renderChain();
    updateKeys();
    syncCurrentUrl();
    if (!text) {
      resetResult();
      return;
    }

    let list = [];
    try {
      if (EXPRESSION_RE.test(text)) {
        list = normalize(relationship(text));
        if (!list.length) {
          list = normalize(relationship({
            text, sex: state.sex, reverse: state.reverse,
            type: state.type, mode: state.mode, optimal: state.optimal,
          }));
        }
      } else {
        list = normalize(relationship({
          text, sex: state.sex, reverse: state.reverse,
          type: state.type, mode: state.mode, optimal: state.optimal,
        }));
      }
    } catch (error) {
      setMain(`计算出错了：${error instanceof Error ? error.message : '请换个说法试试'}`, 'error');
      alt.replaceChildren();
      meta.textContent = '';
      return;
    }

    if (!list.length) {
      setMain('没算出结果。换个说法，或把「计算类型」切到「称呼 → 关系」试试。', 'empty');
      alt.replaceChildren();
      meta.textContent = `当前输入：${text}`;
      return;
    }

    setMain(list[0], '');
    alt.replaceChildren();
    list.slice(1).forEach((value) => {
      const span = document.createElement('span');
      span.textContent = value;
      alt.appendChild(span);
    });

    const direction = state.reverse ? '对方称呼我' : '我称呼对方';
    const kind = state.type === 'chain' ? '称呼 → 关系' : '关系 → 称呼';
    meta.textContent = `「${text}」 · ${MODE_NAMES[state.mode] || '通用'}叫法 · ${direction} · ${kind}${list.length > 1 ? ' · 也可叫' : ''}`;

    if (isFull) {
      pushHistory({ text, mode: state.mode, type: state.type });
      renderHistory();
    }
  }

  function applyText(text, chain) {
    state.text = text;
    input.value = text;
    if (chain && chain.split('的').every((token) => Object.prototype.hasOwnProperty.call(CHAIN_SEX, token))) {
      state.tokens = chain.split('的');
    } else {
      state.tokens = [];
    }
    renderChain();
    updateKeys();
  }

  let timer;
  function debouncedCompute() {
    clearTimeout(timer);
    timer = setTimeout(compute, 180);
  }

  input.addEventListener('input', () => {
    state.text = input.value;
    if (state.text !== state.tokens.join('的')) state.tokens = [];
    renderChain();
    updateKeys();
    debouncedCompute();
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      clearTimeout(timer);
      compute();
    }
  });

  keyButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      state.tokens.push(btn.dataset.key);
      state.text = state.tokens.join('的');
      input.value = state.text;
      clearTimeout(timer);
      compute();
    });
  });

  $$('[data-tool]').forEach((btn) => {
    btn.addEventListener('click', () => {
      clearTimeout(timer);
      if (btn.dataset.tool === 'clear') {
        applyText('', '');
      } else {
        if (state.tokens.length) {
          state.tokens.pop();
          applyText(state.tokens.join('的'), state.tokens.join('的'));
        } else {
          const parts = state.text.split('的');
          parts.pop();
          applyText(parts.join('的'), '');
        }
      }
      compute();
    });
  });

  $$('[data-example]').forEach((btn) => {
    btn.addEventListener('click', () => {
      clearTimeout(timer);
      applyText(btn.dataset.example || '', btn.dataset.chain || '');
      compute();
    });
  });

  $('[data-submit]')?.addEventListener('click', () => {
    clearTimeout(timer);
    compute();
  });

  $$('[data-option]').forEach((group) => {
    if (group instanceof HTMLSelectElement) {
      group.addEventListener('change', () => {
        state.mode = group.value;
        clearTimeout(timer);
        compute();
      });
      return;
    }
    group.addEventListener('click', (event) => {
      const btn = event.target.closest('button[data-value]');
      if (!btn) return;
      const option = group.dataset.option;
      const value = btn.dataset.value;
      group.querySelectorAll('.seg__btn').forEach((item) => item.classList.remove('is-on'));
      btn.classList.add('is-on');
      if (option === 'sex') state.sex = Number(value);
      if (option === 'reverse') state.reverse = value === 'true';
      if (option === 'type') state.type = value;
      if (option === 'optimal') state.optimal = value === 'true';
      clearTimeout(timer);
      compute();
    });
  });

  $$('[data-copy-result]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = main.classList.contains('is-empty') || main.classList.contains('is-error')
        ? ''
        : [main.textContent, ...Array.from(alt.children).map((x) => x.textContent)].join('、');
      if (value) copyText(value, btn);
    });
  });

  $$('[data-copy-link]').forEach((btn) => {
    btn.addEventListener('click', () => copyText(shareUrl(), btn));
  });

  $('[data-history-clear]')?.addEventListener('click', () => {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      /* ignore */
    }
    renderHistory();
  });

  // URL 参数还原（仅完整计算器页），兼容旧版 ?q=
  if (isFull) {
    const params = new URLSearchParams(window.location.search);
    const initial = params.get('chain') || params.get('q') || '';
    const sex = params.get('sex');
    const mode = params.get('mode');
    const type = params.get('type');
    if (sex === '1' || sex === '0') state.sex = Number(sex);
    if (mode && MODE_NAMES[mode]) state.mode = mode;
    if (type === 'chain' || type === 'default') state.type = type;
    state.reverse = params.get('reverse') === '1';
    state.optimal = params.get('optimal') === '1';

    // 把参数状态同步回 UI
    root.querySelectorAll('[data-option]').forEach((group) => {
      if (group instanceof HTMLSelectElement) {
        group.value = state.mode;
        return;
      }
      const expected = {
        sex: String(state.sex),
        reverse: String(state.reverse),
        type: state.type,
        optimal: String(state.optimal),
      }[group.dataset.option];
      group.querySelectorAll('button[data-value]').forEach((btn) => {
        btn.classList.toggle('is-on', btn.dataset.value === expected);
      });
    });

    if (initial) applyText(initial, initial);
  }

  renderChain();
  updateKeys();
  renderHistory();
  if (state.text) compute();
  else resetResult();
}

document.querySelectorAll('[data-calc]').forEach(init);
