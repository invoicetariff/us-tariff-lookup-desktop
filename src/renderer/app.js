/* global tariff */
'use strict';

const $ = (id) => document.getElementById(id);

const I18N = {
  en: {
    tagline: 'Offline US tariff & HTS lookup for importers',
    searchHint: 'HTS code (6109.10.00), English keyword, or 中文关键词',
    searchNone: 'No matches in the curated 484-code set — try the full table at invoicetariff.com/hts',
    searchShort: 'Type at least 2 characters',
    emptyTitle: 'Everything runs on your machine',
    emptyBody:
      'Pick an HTS code on the left, then stack MFN + Section 301 + Section 232 duties, MPF/HMF fees, and landed cost — no network, no sign-up.',
    badgeOffline: '100% offline',
    badgeStacked: 'MFN + 301 + 232',
    badgeLicense: 'MIT',
    tryThese: 'Try one of these',
    sampleTshirts: 'Cotton T-shirts',
    sampleLaptops: 'Laptops',
    sampleThermos: '保温杯 (中文搜索)',
    sampleFlag: 'sample rate',
    fOrigin: 'Origin country',
    fMode: 'Transport mode',
    fValue: 'Declared value (USD)',
    fUnits: 'Units',
    fDate: 'Entry date',
    fCalc: 'Calculate landed cost',
    modeSea: 'Sea (FCL/LCL)',
    modeAir: 'Air',
    modeExpress: 'Express courier',
    modePostal: 'Postal',
    rTotal: 'Duties + fees',
    rRate: 'Effective rate',
    rLanded: 'Landed total',
    rPerUnit: 'Per unit',
    rLayers: 'Duty layers',
    rFees: 'Entry fees',
    thLayer: 'Layer',
    thFee: 'Fee',
    thRate: 'Rate',
    thAmount: 'Amount',
    thBasis: 'Legal basis / source',
    errInvalid: 'Enter a value greater than 0 and pick a code first.',
    errEngine: 'Calculation failed: ',
    disclaimer:
      'Estimates for planning and pricing scenarios. Most rate lines carry sample/unverified flags — not certified for customs declarations. Sources: USITC / USTR / CBP / Federal Register.',
    offlineBadge: 'Offline · data bundled (no network calls)',
    webCalc: 'Web calculator',
    quickLinks: 'Quick links — most-used tools on invoicetariff.com',
    qlCalc: 'Web calculator',
    qlInvoice: 'Invoice generator',
    qlBatch: 'Batch calculator',
    qlHts: 'HTS code database',
    qlByCountry: 'Tariffs by country',
    ql301: 'China Section 301',
    qlIeepa: 'IEEPA refunds',
    qlRadar: 'Tariff radar',
    feeMpf: 'Merchandise Processing Fee (MPF)',
    feeHmf: 'Harbor Maintenance Fee (HMF)',
    feeInformal: 'Informal entry fee',
    feeOther: 'Entry fee',
  },
  zh: {
    tagline: '离线美国关税 / HTS 编码查询，进口商随身带',
    searchHint: 'HTS 编码（6109.10.00）、英文关键词或中文关键词',
    searchNone: '高频 484 码库中未命中——全量表请用网页版 invoicetariff.com/hts',
    searchShort: '至少输入 2 个字符',
    emptyTitle: '全部计算在本机完成',
    emptyBody: '左侧选一个 HTS 编码，右侧叠加 MFN + 301 + 232 税层、MPF/HMF 规费与到岸成本——不联网、免注册。',
    badgeOffline: '完全离线',
    badgeStacked: 'MFN + 301 + 232',
    badgeLicense: 'MIT 开源',
    tryThese: '试一试',
    sampleTshirts: '棉制 T 恤',
    sampleLaptops: '笔记本电脑',
    sampleThermos: '保温杯（中文）',
    sampleFlag: '示意税率',
    fOrigin: '原产国',
    fMode: '运输方式',
    fValue: '申报货值（USD）',
    fUnits: '数量（件）',
    fDate: '申报日期',
    fCalc: '计算到岸成本',
    modeSea: '海运',
    modeAir: '空运',
    modeExpress: '快递',
    modePostal: '邮政',
    rTotal: '关税 + 规费',
    rRate: '综合税负',
    rLanded: '到岸总额',
    rPerUnit: '单位成本',
    rLayers: '税层明细',
    rFees: '报关规费',
    thLayer: '税层',
    thFee: '规费',
    thRate: '税率',
    thAmount: '金额',
    thBasis: '法律依据 / 来源',
    errInvalid: '请先选择编码，并输入大于 0 的货值。',
    errEngine: '计算失败：',
    disclaimer:
      '结果为方案测算估算值：多数税率行带 sample/unverified 标注，不用于正式报关。来源：USITC / USTR / CBP / 联邦公报。',
    offlineBadge: '离线 · 数据内置（无任何网络请求）',
    webCalc: '网页版',
    quickLinks: '常用链接 — invoicetariff.com 高频工具',
    qlCalc: '网页版计算器',
    qlInvoice: '发票生成器',
    qlBatch: '批量测算',
    qlHts: 'HTS 编码库',
    qlByCountry: '各国关税',
    ql301: '对华 301',
    qlIeepa: 'IEEPA 退税',
    qlRadar: '关税雷达',
    feeMpf: '商品处理费（MPF）',
    feeHmf: '港口维护费（HMF）',
    feeInformal: '非正式报关费',
    feeOther: '报关规费',
  },
};

const KIND_LABEL = {
  en: {
    mfn: 'MFN',
    china301: 'China 301',
    global301: 'Global 301',
    section232: 'Section 232',
    section338: 'Section 338',
    ieepa: 'IEEPA',
  },
  zh: {
    mfn: 'MFN 基准',
    china301: '对华 301',
    global301: '全球 301',
    section232: '232 措施',
    section338: '338 条款',
    ieepa: 'IEEPA',
  },
};

// 常用原产国（引擎按全球 301 60 档取值；未列出的国家走「其他」语义 = 仅 MFN）
const ORIGINS = [
  ['CN', 'China', '中国'],
  ['VN', 'Vietnam', '越南'],
  ['IN', 'India', '印度'],
  ['TH', 'Thailand', '泰国'],
  ['MY', 'Malaysia', '马来西亚'],
  ['ID', 'Indonesia', '印度尼西亚'],
  ['MX', 'Mexico', '墨西哥'],
  ['CA', 'Canada', '加拿大'],
  ['KR', 'South Korea', '韩国'],
  ['JP', 'Japan', '日本'],
  ['TW', 'Taiwan', '中国台湾'],
  ['DE', 'Germany', '德国'],
  ['IT', 'Italy', '意大利'],
  ['FR', 'France', '法国'],
  ['GB', 'United Kingdom', '英国'],
  ['TR', 'Türkiye', '土耳其'],
  ['BR', 'Brazil', '巴西'],
  ['AU', 'Australia', '澳大利亚'],
];

// 首页快捷入口：网站最常用工具（新开系统浏览器，主进程 setWindowOpenHandler 接管）
const QUICK_LINKS = [
  { href: 'https://invoicetariff.com/tariff-calculator', t: 'qlCalc' },
  { href: 'https://invoicetariff.com/invoice', t: 'qlInvoice' },
  { href: 'https://invoicetariff.com/batch', t: 'qlBatch' },
  { href: 'https://invoicetariff.com/hts', t: 'qlHts' },
  { href: 'https://invoicetariff.com/tariffs-by-country', t: 'qlByCountry' },
  { href: 'https://invoicetariff.com/section-301', t: 'ql301' },
  { href: 'https://invoicetariff.com/ieepa-refund', t: 'qlIeepa' },
  { href: 'https://invoicetariff.com/radar', t: 'qlRadar' },
];

const state = { lang: 'en', entry: null };
let metaInfo = null;

function t(key) {
  return I18N[state.lang][key] ?? I18N.en[key] ?? key;
}

const fmtUsd = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

function fmtCode(hts8) {
  const d = String(hts8).replace(/\D/g, '');
  if (d.length === 8) return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}`;
  if (d.length === 10) return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}.${d.slice(8)}`;
  return d;
}

function updateChips() {
  if (!metaInfo) return;
  $('chip-version').textContent = `v${metaInfo.appVersion}`;
  $('chip-ruleset').textContent =
    state.lang === 'zh'
      ? `规则库 ${metaInfo.rulesetVersion} · ${metaInfo.asOf} · ${metaInfo.mfnCount} 码`
      : `Ruleset ${metaInfo.rulesetVersion} · ${metaInfo.asOf} · ${metaInfo.mfnCount} codes`;
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  $('q').placeholder = t('searchHint');
  const modes = ['modeSea', 'modeAir', 'modeExpress', 'modePostal'];
  [...$('f-mode').options].forEach((opt, i) => {
    opt.textContent = t(modes[i]);
  });
  document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : 'en';
  $('lang-en').classList.toggle('active', state.lang === 'en');
  $('lang-zh').classList.toggle('active', state.lang === 'zh');
  updateChips();
  renderQuickLinks();
  renderOriginOptions();
  if (state.entry) renderDetail();
  renderResults(lastHits);
}

function setLang(lang) {
  state.lang = lang;
  localStorage.setItem('usl-lang', lang);
  applyI18n();
}

function renderQuickLinks() {
  const grid = $('ql-grid');
  grid.innerHTML = '';
  for (const link of QUICK_LINKS) {
    const a = document.createElement('a');
    a.className = 'ql';
    a.href = link.href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = t(link.t);
    grid.appendChild(a);
  }
}

function renderOriginOptions() {
  const sel = $('f-origin');
  const cur = sel.value || 'CN';
  sel.innerHTML = '';
  for (const [code, en, zh] of ORIGINS) {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = state.lang === 'zh' ? `${zh} (${code})` : `${en} (${code})`;
    sel.appendChild(opt);
  }
  const other = document.createElement('option');
  other.value = 'OTHER';
  other.textContent = state.lang === 'zh' ? '其他 / 未列出' : 'Other / not listed';
  sel.appendChild(other);
  sel.value = [...sel.options].some((o) => o.value === cur) ? cur : 'CN';
}

/* ── search ──────────────────────────────────────── */

let lastHits = [];
let searchSeq = 0;

async function runSearch(q) {
  const seq = ++searchSeq;
  const list = $('results');
  if (q.trim().length < 2) {
    lastHits = [];
    list.innerHTML = '';
    return;
  }
  try {
    const hits = await tariff.search(q, 40);
    if (seq !== searchSeq) return;
    lastHits = hits;
    renderResults(hits);
  } catch {
    if (seq === searchSeq) list.innerHTML = '';
  }
}

function renderResults(hits) {
  const list = $('results');
  list.innerHTML = '';
  if (!hits.length) {
    if ($('q').value.trim().length >= 2) {
      const li = document.createElement('li');
      li.className = 'empty-note';
      li.textContent = t('searchNone');
      list.appendChild(li);
    }
    return;
  }
  for (const { entry } of hits) {
    const li = document.createElement('li');
    li.setAttribute('data-hts8', entry.hts8);
    if (state.entry && state.entry.hts8 === entry.hts8) li.classList.add('selected');
    const code = document.createElement('span');
    code.className = 'r-code';
    code.textContent = fmtCode(entry.hts8);
    const desc = document.createElement('span');
    desc.className = 'r-desc';
    desc.textContent = entry.description;
    const zh = document.createElement('span');
    zh.className = 'r-zh';
    zh.textContent = entry.descriptionZh || '';
    li.append(code, desc, zh);
    li.addEventListener('click', () => selectEntry(entry));
    list.appendChild(li);
  }
}

/* ── detail + calculator ─────────────────────────── */

function selectEntry(entry) {
  state.entry = entry;
  $('empty').classList.add('hidden');
  $('detail').classList.remove('hidden');
  $('calc-error').classList.add('hidden');
  $('calc-result').classList.add('hidden');
  renderDetail();
  document.querySelectorAll('.results li').forEach((li) => {
    li.classList.toggle('selected', li.getAttribute('data-hts8') === entry.hts8);
  });
  $('calc-btn').scrollIntoView({ block: 'nearest' });
}

function renderDetail() {
  const e = state.entry;
  $('code-num').textContent = fmtCode(e.hts8);
  $('code-sample').classList.toggle('hidden', !e.sample);
  $('code-desc').textContent = e.description;
  $('code-desc-zh').textContent = e.descriptionZh || '';
}

async function runCalc(ev) {
  ev.preventDefault();
  if (!state.entry) return;
  const btn = $('calc-btn');
  const value = Number($('f-value').value);
  const units = Number($('f-units').value);
  const origin = $('f-origin').value === 'OTHER' ? 'XX' : $('f-origin').value;
  if (!Number.isFinite(value) || value <= 0 || !Number.isFinite(units) || units < 1) {
    showError(t('errInvalid'));
    return;
  }
  btn.disabled = true;
  try {
    const result = await tariff.calc({
      hts: state.entry.hts8,
      value,
      units,
      originCountry: origin,
      mode: $('f-mode').value,
      entryDate: $('f-date').value,
      locale: state.lang,
    });
    renderResult(result, units);
  } catch (err) {
    showError(
      err && err.message === 'INVALID_INPUT'
        ? t('errInvalid')
        : t('errEngine') + (err && err.message ? err.message : String(err)),
    );
  } finally {
    btn.disabled = false;
  }
}

function showError(msg) {
  const el = $('calc-error');
  el.textContent = msg;
  el.classList.remove('hidden');
  $('calc-result').classList.add('hidden');
}

function kindChip(kind, labelOverride) {
  const chip = document.createElement('span');
  chip.className = `kind-chip kind-${kind}`;
  chip.textContent = labelOverride || KIND_LABEL[state.lang][kind] || kind;
  return chip;
}

function basisCell(layer) {
  const wrap = document.createElement('span');
  wrap.className = 'basis';
  wrap.textContent = layer.legalBasis || '';
  if (layer.source && layer.source.url) {
    wrap.appendChild(document.createTextNode(' '));
    const a = document.createElement('a');
    a.href = layer.source.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = layer.source.title || 'source';
    wrap.appendChild(a);
  }
  return wrap;
}

function renderResult(result, units) {
  $('calc-error').classList.add('hidden');
  $('r-total').textContent = fmtUsd(result.totalDuty);
  $('r-rate').textContent = `${Number(result.effectiveTaxRate).toFixed(2)}%`;
  $('r-landed').textContent = result.landedTotal != null ? fmtUsd(result.landedTotal) : '—';
  $('r-perunit').textContent = result.perUnit != null ? fmtUsd(result.perUnit) : fmtUsd(result.totalDuty / units);

  const tbody = $('r-layers').querySelector('tbody');
  tbody.innerHTML = '';
  let dutySum = 0;
  for (const layer of result.layers || []) {
    const tr = document.createElement('tr');
    const nameTd = document.createElement('td');
    nameTd.appendChild(kindChip(layer.kind));
    nameTd.appendChild(document.createTextNode(layer[state.lang === 'zh' ? 'name' : 'nameEn'] || layer.name || ''));
    if (layer.note) {
      const note = document.createElement('span');
      note.className = 'basis';
      note.textContent = layer.note;
      nameTd.appendChild(note);
    }
    const rateTd = document.createElement('td');
    rateTd.textContent = layer.rateLabel || (layer.rate != null ? `${layer.rate}%` : '—');
    const amtTd = document.createElement('td');
    amtTd.className = 'num';
    amtTd.textContent = layer.amountKnown === false ? '—' : fmtUsd(layer.amount || 0);
    if (layer.amountKnown !== false) dutySum += layer.amount || 0;
    const basisTd = document.createElement('td');
    basisTd.appendChild(basisCell(layer));
    tr.append(nameTd, rateTd, amtTd, basisTd);
    tbody.appendChild(tr);
  }
  const totalTr = document.createElement('tr');
  totalTr.className = 'total-row';
  totalTr.innerHTML = `<td>${t('rTotal')}</td><td></td><td class="num">${fmtUsd(dutySum)}</td><td></td>`;
  tbody.appendChild(totalTr);

  const fbody = $('r-fees').querySelector('tbody');
  fbody.innerHTML = '';
  const fees = Array.isArray(result.fees) ? result.fees : [];
  for (const fee of fees) {
    const tr = document.createElement('tr');
    const nameTd = document.createElement('td');
    nameTd.appendChild(kindChip('fee'));
    nameTd.appendChild(document.createTextNode(fee[state.lang === 'zh' ? 'name' : 'nameEn'] || fee.name || ''));
    const amtTd = document.createElement('td');
    amtTd.className = 'num';
    amtTd.textContent = fee.amountKnown === false ? '—' : fmtUsd(fee.amount || 0);
    const basisTd = document.createElement('td');
    basisTd.appendChild(basisCell(fee));
    tr.append(nameTd, amtTd, basisTd);
    fbody.appendChild(tr);
  }
  if (!fees.length) {
    fbody.innerHTML = `<tr><td colspan="3" style="color:var(--muted)">—</td></tr>`;
  }

  const warnBox = $('r-warnings');
  const warns = result.warnings || [];
  warnBox.classList.toggle('hidden', !warns.length);
  warnBox.textContent = warns.join(' ');
  warnBox.lang = state.lang === 'zh' ? 'zh-CN' : 'en';

  $('calc-result').classList.remove('hidden');
}

/* ── boot ────────────────────────────────────────── */

function defaultDate() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function boot() {
  state.lang = localStorage.getItem('usl-lang') || ((navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en');
  $('f-date').value = defaultDate();
  $('f-value').value = 10000;
  $('f-units').value = 1000;
  $('f-mode').value = 'sea';
  applyI18n();

  try {
    metaInfo = await tariff.meta();
    updateChips();
  } catch {
    $('chip-version').textContent = 'v1.0.0';
  }

  let timer = null;
  $('q').addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => runSearch($('q').value), 180);
  });
  $('q').addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      clearTimeout(timer);
      runSearch($('q').value);
      const first = $('results').querySelector('li[data-hts8]');
      if (first) first.click();
    }
  });
  $('calcform').addEventListener('submit', runCalc);
  $('lang-en').addEventListener('click', () => setLang('en'));
  $('lang-zh').addEventListener('click', () => setLang('zh'));

  document.querySelectorAll('.sample').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const code = btn.getAttribute('data-sample');
      const zhTerm = btn.getAttribute('data-sample-zh');
      if (code) {
        $('q').value = code;
        await runSearch(code);
        const li = $('results').querySelector('li[data-hts8]');
        if (li) li.click();
      } else if (zhTerm) {
        $('q').value = zhTerm;
        await runSearch(zhTerm);
        const li = $('results').querySelector('li[data-hts8]');
        if (li) li.click();
      }
    });
  });
}

boot();
