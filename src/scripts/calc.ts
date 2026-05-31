import relationship from 'relationship.js';

const input = document.getElementById('calc-input') as HTMLInputElement | null;
const result = document.getElementById('calc-result');
const shortcuts = document.getElementById('calc-shortcuts');
const examples = document.getElementById('calc-examples');

/** 与 passer-by.com/relationship 示例一致：末尾为男性时禁「夫」，为女性时禁「妻」 */
const MALE_TOKENS = new Set(['爸爸', '老公', '儿子', '哥哥', '弟弟', '兄弟']);
const FEMALE_TOKENS = new Set(['妈妈', '老婆', '女儿', '姐姐', '妹妹']);

if (!input || !result) {
	console.error('[calc] 缺少必要 DOM 节点');
} else {
	const state = {
		sex: 1,
		reverse: false,
		type: 'default' as string,
	};

	const husbandBtn = shortcuts?.querySelector<HTMLButtonElement>('[data-spouse="husband"]');
	const wifeBtn = shortcuts?.querySelector<HTMLButtonElement>('[data-spouse="wife"]');

	function isMalePerson(name: string) {
		return MALE_TOKENS.has(name);
	}

	function resetSpouseButtons() {
		if (!husbandBtn || !wifeBtn) return;
		husbandBtn.disabled = false;
		wifeBtn.disabled = false;
	}

	/** 有输入内容时，根据链末人物性别禁用夫/妻之一 */
	function detectSpouseButtons() {
		if (!husbandBtn || !wifeBtn) return;

		const value = input.value.trim();
		if (!value) {
			resetSpouseButtons();
			return;
		}

		const chains = relationship({ text: value, sex: -1, type: 'chain' }) as string[];
		const lastFromChain = chains[0]?.split('的').pop()?.trim();
		const lastFromInput = value.split('的').pop()?.trim() ?? '';
		const lastName = lastFromChain || lastFromInput;

		if (!lastName || (!MALE_TOKENS.has(lastName) && !FEMALE_TOKENS.has(lastName))) {
			resetSpouseButtons();
			return;
		}

		const isMale = isMalePerson(lastName);
		husbandBtn.disabled = isMale;
		wifeBtn.disabled = !isMale;
	}

	function setUserSex(sex: 0 | 1) {
		state.sex = sex;
		document.querySelectorAll('[data-option="sex"] .calc-seg-btn').forEach((btn) => {
			if (btn instanceof HTMLButtonElement) {
				btn.classList.toggle('is-on', btn.dataset.value === String(sex));
			}
		});
	}

	/** 根据链首推断「我的性别」（与官方 demo 一致） */
	function syncUserSexFromChain() {
		const value = input.value.trim();
		if (!value) return;

		const first = value.split('的')[0];
		const chains = relationship({ text: first, sex: -1, type: 'chain' }) as string[];
		if (!chains.length) return;

		const allFromHusband = chains.every((chain) => chain.split('的').shift() === '老公');
		const allFromWife = chains.every((chain) => chain.split('的').shift() === '老婆');

		if (allFromHusband) setUserSex(0);
		else if (allFromWife) setUserSex(1);
	}

	function onInputChange() {
		const value = input.value.trim();
		if (!value) {
			resetSpouseButtons();
			return;
		}
		syncUserSexFromChain();
		detectSpouseButtons();
	}

	document.querySelectorAll('[data-option]').forEach((group) => {
		group.addEventListener('click', (event) => {
			const target = event.target;
			if (!(target instanceof HTMLButtonElement) || !target.dataset.value) return;
			const option = group.getAttribute('data-option');
			group.querySelectorAll('.calc-seg-btn').forEach((btn) => btn.classList.remove('is-on'));
			target.classList.add('is-on');
			if (option === 'sex') state.sex = Number(target.dataset.value);
			if (option === 'reverse') state.reverse = target.dataset.value === 'true';
			if (option === 'type') state.type = target.dataset.value;
		});
	});

	function getOptions() {
		return {
			text: input.value.trim(),
			sex: state.sex,
			reverse: state.reverse,
			type: state.type,
		};
	}

	function showResult(values: string | string[], isError = false) {
		result.classList.remove('empty', 'error', 'success');
		result.replaceChildren();

		if (isError) {
			result.classList.add('error');
			result.textContent = typeof values === 'string' ? values : values.join(' ');
			return;
		}

		const list = Array.isArray(values) ? values : [values];
		if (!list.length) {
			result.classList.add('empty');
			const span = document.createElement('span');
			span.className = 'calc-result-placeholder';
			span.textContent = '未找到匹配结果，请检查输入';
			result.appendChild(span);
			return;
		}

		result.classList.add('success');
		list.forEach((value) => {
			const tag = document.createElement('span');
			tag.className = 'calc-result-tag';
			tag.textContent = value;
			result.appendChild(tag);
		});
	}

	function runCalc() {
		const text = input.value.trim();
		if (!text) {
			showResult('请输入关系或称呼', true);
			return;
		}

		try {
			const options = getOptions();
			const output =
				text.includes('？') || text.includes('?') || /如何|什么关系|叫什么/.test(text)
					? relationship(text)
					: relationship(options);

			const values = Array.isArray(output) ? output.map(String) : [String(output)];
			showResult(values.filter(Boolean));
			syncQuery(text);
		} catch (error) {
			showResult(error instanceof Error ? error.message : '计算出错', true);
		}
	}

	function appendToken(token: string) {
		const current = input.value.trim();
		input.value = current ? `${current}的${token}` : token;
		input.focus();
		onInputChange();
	}

	function syncQuery(text: string) {
		const url = new URL(window.location.href);
		if (text) {
			url.searchParams.set('q', text);
		} else {
			url.searchParams.delete('q');
		}
		window.history.replaceState({}, '', url);
	}

	document.getElementById('calc-run')?.addEventListener('click', runCalc);
	document.getElementById('calc-clear')?.addEventListener('click', () => {
		input.value = '';
		syncQuery('');
		result.classList.remove('error', 'success');
		result.classList.add('empty');
		result.replaceChildren();
		const span = document.createElement('span');
		span.className = 'calc-result-placeholder';
		span.textContent = '输入后点「计算」，或点击上方示例';
		result.appendChild(span);
		onInputChange();
	});
	document.getElementById('calc-back')?.addEventListener('click', () => {
		const parts = input.value.trim().split('的');
		parts.pop();
		input.value = parts.join('的');
		onInputChange();
	});

	let inputTimer: ReturnType<typeof setTimeout> | undefined;
	input.addEventListener('input', () => {
		if (inputTimer) clearTimeout(inputTimer);
		inputTimer = setTimeout(onInputChange, 200);
	});
	input.addEventListener('paste', () => {
		if (inputTimer) clearTimeout(inputTimer);
		inputTimer = setTimeout(onInputChange, 200);
	});
	input.addEventListener('keydown', (event) => {
		if (event.key === 'Enter') runCalc();
	});

	shortcuts?.addEventListener('click', (event) => {
		const target = event.target;
		if (!(target instanceof HTMLButtonElement)) return;
		if (target.disabled) return;
		const token = target.dataset.token;
		if (token) appendToken(token);
	});

	examples?.addEventListener('click', (event) => {
		const target = event.target;
		if (!(target instanceof HTMLButtonElement)) return;
		const example = target.dataset.example;
		if (example) {
			input.value = example;
			onInputChange();
			runCalc();
		}
	});

	const params = new URLSearchParams(window.location.search);
	const initial = params.get('q');
	if (initial) {
		input.value = initial;
		onInputChange();
		runCalc();
	}
}
