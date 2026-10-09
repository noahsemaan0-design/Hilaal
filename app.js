/* Hilaal Studios — brand dashboard
   Everything is saved in this browser (IndexedDB). Use Export backup to keep a copy. */

// ---------- Config ----------

const NAV = [
  ['overview', 'Overview'],
  ['ideas', 'Ideas'],
  ['references', 'References'],
  ['spending', 'Spending'],
  ['ads', 'Ads'],
  ['inspo', 'Ad Inspo'],
];

const SECTIONS = {
  ideas: {
    title: 'Ideas', single: 'Idea',
    subtitle: 'Designs, drops, names, slogans — get it out of your head.',
    view: 'cards', filterKey: 'category', tagKeys: ['status'],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { row: [
        { key: 'category', label: 'Category', type: 'select', options: ['Clothing design', 'Collection / Drop', 'Branding', 'Marketing', 'Business', 'Other'] },
        { key: 'status', label: 'Status', type: 'select', options: ['Raw', 'Developing', 'Ready'] },
      ] },
      { key: 'image', label: 'Sketch / image', type: 'image' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  references: {
    title: 'References', single: 'Reference',
    subtitle: 'Moodboard — silhouettes, fabrics, colours, brands you admire.',
    view: 'masonry', filterKey: 'category',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'select', options: ['Silhouette', 'Fabric', 'Colour', 'Graphics', 'Photography', 'Packaging', 'Brand', 'Other'] },
      { key: 'image', label: 'Image', type: 'image' },
      { key: 'link', label: 'Link', type: 'url' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  spending: {
    title: 'Spending', single: 'Expense',
    subtitle: 'Every cost of getting the brand off the ground. Ad spend from the Ads page is included in totals.',
    filterKey: 'category',
    fields: [
      { key: 'item', label: 'Item', type: 'text', required: true },
      { row: [
        { key: 'amount', label: 'Amount', type: 'number', required: true },
        { key: 'date', label: 'Date', type: 'date', default: () => today() },
      ] },
      { key: 'category', label: 'Category', type: 'select', options: ['Samples', 'Production', 'Fabric', 'Branding', 'Website', 'Marketing', 'Packaging', 'Photography', 'Other'] },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  ads: {
    title: 'Ads', single: 'Ad',
    subtitle: 'Plan and track your campaigns.',
    filterKey: 'status',
    fields: [
      { key: 'name', label: 'Campaign name', type: 'text', required: true },
      { row: [
        { key: 'platform', label: 'Platform', type: 'select', options: ['Instagram', 'TikTok', 'Facebook', 'YouTube', 'Google', 'Influencer', 'Other'] },
        { key: 'status', label: 'Status', type: 'select', options: ['Idea', 'Planned', 'Live', 'Paused', 'Finished'] },
      ] },
      { row: [
        { key: 'budget', label: 'Budget', type: 'number' },
        { key: 'spent', label: 'Spent so far', type: 'number' },
      ] },
      { row: [
        { key: 'start', label: 'Start', type: 'date' },
        { key: 'end', label: 'End', type: 'date' },
      ] },
      { key: 'image', label: 'Creative', type: 'image' },
      { key: 'link', label: 'Link', type: 'url' },
      { key: 'notes', label: 'Concept / results', type: 'textarea' },
    ],
  },
  inspo: {
    title: 'Ad Inspo', single: 'Inspo',
    subtitle: 'Ads and content from other brands worth learning from.',
    view: 'masonry', filterKey: 'format', tagKeys: ['platform'],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { row: [
        { key: 'brand', label: 'Brand', type: 'text' },
        { key: 'platform', label: 'Platform', type: 'select', options: ['Instagram', 'TikTok', 'Facebook', 'YouTube', 'Billboard / Print', 'Other'] },
      ] },
      { key: 'format', label: 'Format', type: 'select', options: ['Image', 'Video', 'Carousel', 'Story', 'UGC', 'Other'] },
      { key: 'image', label: 'Screenshot', type: 'image' },
      { key: 'link', label: 'Link', type: 'url' },
      { key: 'notes', label: 'Why it works', type: 'textarea' },
    ],
  },
};

const CURRENCIES = ['$', '£', '€', 'A$', 'C$', 'AED ', 'SAR '];

const EMPTY_STATE = () => ({
  version: 1,
  currency: '$',
  budget: 0,
  brand: { mission: '', audience: '', notes: '' },
  tasks: [],
  ideas: [], references: [], spending: [], ads: [], inspo: [],
});

// ---------- Storage (IndexedDB, falls back to localStorage) ----------

const store = (() => {
  const DB = 'hilaal-dashboard', OS = 'kv', KEY = 'state';
  let dbp = null;
  function open() {
    if (!('indexedDB' in window)) return Promise.reject(new Error('no idb'));
    dbp = dbp || new Promise((res, rej) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(OS);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function load() {
    try {
      const db = await open();
      return await new Promise((res, rej) => {
        const r = db.transaction(OS).objectStore(OS).get(KEY);
        r.onsuccess = () => res(r.result || null);
        r.onerror = () => rej(r.error);
      });
    } catch {
      try { return JSON.parse(localStorage.getItem(DB) || 'null'); } catch { return null; }
    }
  }
  async function save(data) {
    try {
      const db = await open();
      await new Promise((res, rej) => {
        const tx = db.transaction(OS, 'readwrite');
        tx.objectStore(OS).put(data, KEY);
        tx.oncomplete = res;
        tx.onerror = () => rej(tx.error);
      });
    } catch {
      try { localStorage.setItem(DB, JSON.stringify(data)); }
      catch { alert('Storage is full. Export a backup and remove some large images.'); }
    }
  }
  return { load, save };
})();

let state = EMPTY_STATE();
let saveTimer = null;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => store.save(state), 250);
}

// ---------- Helpers ----------

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const num = (v) => Number(v) || 0;
function today() { return new Date().toISOString().slice(0, 10); }
function money(v) {
  const n = num(v);
  return state.currency + n.toLocaleString(undefined, { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
}
function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return isNaN(dt) ? d : dt.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
function safeUrl(u) {
  if (!u) return '';
  const s = String(u).trim();
  if (/^data:image\//i.test(s)) return s;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[\w.-]+\.[a-z]{2,}/i.test(s)) return 'https://' + s;
  return '';
}
function hostname(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } }
function flatFields(fields) { return fields.flatMap((f) => f.row || [f]); }
function titleOf(item) { return item.title || item.name || item.item || 'Untitled'; }
function adSpend() { return state.ads.reduce((a, x) => a + num(x.spent), 0); }
function totalSpent() { return state.spending.reduce((a, x) => a + num(x.amount), 0) + adSpend(); }

function resizeImage(file, max = 1400) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onerror = rej;
    reader.onload = () => {
      const img = new Image();
      img.onerror = rej;
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// ---------- UI state ----------

const ui = { filter: {}, search: {} };

// ---------- Routing ----------

function route() {
  const page = (location.hash.slice(1) || 'overview');
  return NAV.some(([k]) => k === page) ? page : 'overview';
}

function render() {
  const page = route();
  $('#nav').innerHTML = NAV.map(([k, label]) =>
    `<a href="#${k}" class="${k === page ? 'active' : ''}">${label}</a>`).join('');
  const main = $('#main');
  if (page === 'overview') main.innerHTML = overviewHTML();
  else if (page === 'spending') main.innerHTML = spendingHTML();
  else if (page === 'ads') main.innerHTML = adsHTML();
  else main.innerHTML = collectionHTML(page);
  document.title = page === 'overview' ? 'Hilaal Studios' : `${SECTIONS[page].title} · Hilaal Studios`;
}

// ---------- Shared pieces ----------

function pageHead(key, extra = '') {
  const s = SECTIONS[key];
  return `
    <div class="page-head">
      <div><h1>${s.title}</h1><p>${s.subtitle}</p></div>
      <div class="head-actions">
        ${extra}
        <input class="search" type="search" placeholder="Search…" data-search="${key}" value="${esc(ui.search[key] || '')}">
        <button class="btn" data-new="${key}">+ New ${s.single.toLowerCase()}</button>
      </div>
    </div>`;
}

function filterChips(key) {
  const s = SECTIONS[key];
  const field = flatFields(s.fields).find((f) => f.key === s.filterKey);
  const used = new Set(state[key].map((x) => x[s.filterKey]).filter(Boolean));
  const opts = field.options.filter((o) => used.has(o));
  if (!opts.length) return '';
  const cur = ui.filter[key] || '';
  return `<div class="filters">
    <button class="chip ${!cur ? 'active' : ''}" data-filter="${key}" data-value="">All</button>
    ${opts.map((o) => `<button class="chip ${cur === o ? 'active' : ''}" data-filter="${key}" data-value="${esc(o)}">${esc(o)}</button>`).join('')}
  </div>`;
}

function visibleItems(key) {
  const s = SECTIONS[key];
  const f = ui.filter[key];
  const q = (ui.search[key] || '').toLowerCase().trim();
  return state[key].filter((x) => {
    if (f && x[s.filterKey] !== f) return false;
    if (q && !flatFields(s.fields).some((fd) => fd.type !== 'image' && String(x[fd.key] ?? '').toLowerCase().includes(q))) return false;
    return true;
  });
}

function emptyHTML(key, msg) {
  const s = SECTIONS[key];
  return `<div class="empty">
    <img src="assets/logo-mark.png" alt="">
    <p>${msg || `No ${s.title.toLowerCase()} yet.`}</p>
    <button class="btn" data-new="${key}">+ Add your first ${s.single.toLowerCase()}</button>
  </div>`;
}

// ---------- Card collections (ideas, references, inspo) ----------

function cardHTML(key, x) {
  const s = SECTIONS[key];
  const img = safeUrl(x.image);
  const link = safeUrl(x.link);
  const tags = [x[s.filterKey], ...(s.tagKeys || []).map((k) => x[k]), x.brand].filter(Boolean);
  return `<article class="card" data-edit="${key}" data-id="${x.id}">
    ${img ? `<img class="card-img" src="${esc(img)}" alt="" loading="lazy">` : ''}
    <div class="card-body">
      <p class="card-title">${esc(titleOf(x))}</p>
      ${tags.length ? `<div class="card-meta">${tags.map((t) => `<span class="tag ${t === 'Ready' ? 'solid' : ''}">${esc(t)}</span>`).join('')}</div>` : ''}
      ${x.notes ? `<p class="card-text">${esc(x.notes)}</p>` : ''}
      ${link ? `<a class="card-link" href="${esc(link)}" target="_blank" rel="noopener" data-stop>↗ ${esc(hostname(link))}</a>` : ''}
    </div>
  </article>`;
}

function collectionHTML(key) {
  const s = SECTIONS[key];
  const items = visibleItems(key);
  let body;
  if (!state[key].length) body = emptyHTML(key);
  else if (!items.length) body = `<p class="muted">Nothing matches.</p>`;
  else body = `<div class="${s.view === 'masonry' ? 'masonry' : 'cards'}">${items.map((x) => cardHTML(key, x)).join('')}</div>`;
  return pageHead(key) + filterChips(key) + body;
}

// ---------- Spending ----------

function spendingHTML() {
  const spent = totalSpent();
  const budget = num(state.budget);
  const pct = budget ? Math.min(100, (spent / budget) * 100) : 0;
  const over = budget && spent > budget;

  const byCat = {};
  state.spending.forEach((x) => { const c = x.category || 'Other'; byCat[c] = (byCat[c] || 0) + num(x.amount); });
  if (adSpend()) byCat['Ads'] = (byCat['Ads'] || 0) + adSpend();
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(1, ...cats.map((c) => c[1]));

  const items = visibleItems('spending').slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const currencySel = `<select data-setting="currency" style="width:auto">${CURRENCIES.map((c) =>
    `<option value="${esc(c)}" ${c === state.currency ? 'selected' : ''}>${esc(c.trim())}</option>`).join('')}</select>`;

  return `
    ${pageHead('spending', currencySel)}
    <div class="stats" style="grid-template-columns:repeat(3,1fr)">
      <div class="stat">
        <div class="stat-label">Startup budget</div>
        <input type="number" min="0" step="any" data-setting="budget" value="${budget || ''}" placeholder="Set a budget" style="margin-top:8px">
      </div>
      <div class="stat">
        <div class="stat-label">Spent</div>
        <div class="stat-value">${money(spent)}</div>
        ${budget ? `<div class="bar ${over ? 'over' : ''}"><span style="width:${pct}%"></span></div>` : ''}
      </div>
      <div class="stat">
        <div class="stat-label">Remaining</div>
        <div class="stat-value" ${over ? 'style="color:var(--danger)"' : ''}>${budget ? money(budget - spent) : '—'}</div>
        ${budget ? `<div class="stat-note">${Math.round((spent / budget) * 100)}% of budget used</div>` : ''}
      </div>
    </div>
    ${cats.length ? `<div class="panel" style="margin-bottom:24px">
      <h3>By category</h3>
      <div class="breakdown">${cats.map(([c, v]) => `
        <div class="breakdown-row"><span>${esc(c)}</span><div class="bar"><span style="width:${(v / maxCat) * 100}%"></span></div><span class="num">${money(v)}</span></div>`).join('')}
      </div>
    </div>` : ''}
    ${filterChips('spending')}
    ${!state.spending.length ? emptyHTML('spending', 'No expenses logged yet.') : !items.length ? '<p class="muted">Nothing matches.</p>' : `
    <div class="table-wrap"><table>
      <thead><tr><th>Date</th><th>Item</th><th>Category</th><th>Notes</th><th class="num">Amount</th></tr></thead>
      <tbody>${items.map((x) => `
        <tr data-edit="spending" data-id="${x.id}">
          <td>${esc(fmtDate(x.date))}</td>
          <td><strong>${esc(x.item)}</strong></td>
          <td>${x.category ? `<span class="tag">${esc(x.category)}</span>` : ''}</td>
          <td class="wrap">${esc(x.notes || '')}</td>
          <td class="num">${money(x.amount)}</td>
        </tr>`).join('')}
      </tbody>
    </table></div>`}`;
}

// ---------- Ads ----------

function adsHTML() {
  const items = visibleItems('ads');
  const live = state.ads.filter((x) => x.status === 'Live').length;
  const budget = state.ads.reduce((a, x) => a + num(x.budget), 0);
  return `
    ${pageHead('ads')}
    ${state.ads.length ? `<div class="stats">
      <div class="stat"><div class="stat-label">Campaigns</div><div class="stat-value">${state.ads.length}</div></div>
      <div class="stat"><div class="stat-label">Live now</div><div class="stat-value">${live}</div></div>
      <div class="stat"><div class="stat-label">Ad budget</div><div class="stat-value">${money(budget)}</div></div>
      <div class="stat"><div class="stat-label">Ad spend</div><div class="stat-value">${money(adSpend())}</div></div>
    </div>` : ''}
    ${filterChips('ads')}
    ${!state.ads.length ? emptyHTML('ads', 'No campaigns yet. Plan your first one.') : !items.length ? '<p class="muted">Nothing matches.</p>' : `
    <div class="table-wrap"><table>
      <thead><tr><th>Campaign</th><th>Platform</th><th>Status</th><th>Dates</th><th class="num">Budget</th><th class="num">Spent</th></tr></thead>
      <tbody>${items.map((x) => `
        <tr data-edit="ads" data-id="${x.id}">
          <td><strong>${esc(x.name)}</strong>${x.notes ? `<div class="muted" style="font-size:12px;max-width:320px;overflow:hidden;text-overflow:ellipsis">${esc(x.notes)}</div>` : ''}</td>
          <td>${esc(x.platform || '')}</td>
          <td>${x.status ? `<span class="tag ${x.status === 'Live' ? 'solid' : ''}">${esc(x.status)}</span>` : ''}</td>
          <td>${esc([fmtDate(x.start), fmtDate(x.end)].filter(Boolean).join(' – '))}</td>
          <td class="num">${x.budget ? money(x.budget) : '—'}</td>
          <td class="num">${x.spent ? money(x.spent) : '—'}</td>
        </tr>`).join('')}
      </tbody>
    </table></div>`}`;
}

// ---------- Overview ----------

function overviewHTML() {
  const spent = totalSpent();
  const budget = num(state.budget);
  const openTasks = state.tasks.filter((t) => !t.done).length;
  const recentIdeas = state.ideas.slice(0, 5);
  const recentSpend = state.spending.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5);
  const tasks = state.tasks.slice().sort((a, b) => (a.done - b.done) || (a.due || '9').localeCompare(b.due || '9'));

  return `
    <section class="hero">
      <img src="assets/logo-full.png" alt="Hilaal Studios">
      <div>
        <h1>Building the brand.</h1>
        <p>${openTasks ? `${openTasks} thing${openTasks === 1 ? '' : 's'} on your list.` : 'Your list is clear.'} ${fmtDate(today())}</p>
      </div>
    </section>

    <div class="stats">
      <a class="stat" href="#ideas" style="text-decoration:none"><div class="stat-label">Ideas</div><div class="stat-value">${state.ideas.length}</div><div class="stat-note">${state.ideas.filter((x) => x.status === 'Ready').length} ready</div></a>
      <a class="stat" href="#references" style="text-decoration:none"><div class="stat-label">References</div><div class="stat-value">${state.references.length + state.inspo.length}</div><div class="stat-note">incl. ${state.inspo.length} ad inspo</div></a>
      <a class="stat" href="#spending" style="text-decoration:none"><div class="stat-label">Spent</div><div class="stat-value">${money(spent)}</div>
        ${budget ? `<div class="bar ${spent > budget ? 'over' : ''}"><span style="width:${Math.min(100, (spent / budget) * 100)}%"></span></div><div class="stat-note">of ${money(budget)}</div>` : '<div class="stat-note">No budget set</div>'}</a>
      <a class="stat" href="#ads" style="text-decoration:none"><div class="stat-label">Live ads</div><div class="stat-value">${state.ads.filter((x) => x.status === 'Live').length}</div><div class="stat-note">${state.ads.length} campaign${state.ads.length === 1 ? '' : 's'} total</div></a>
    </div>

    <div class="grid-2">
      <div class="panel">
        <h3>To do</h3>
        ${tasks.length ? `<ul class="list">${tasks.map((t) => `
          <li class="${t.done ? 'done' : ''}">
            <input type="checkbox" data-task-toggle="${t.id}" ${t.done ? 'checked' : ''}>
            <span class="grow">${esc(t.text)}</span>
            ${t.due ? `<span class="sub">${esc(fmtDate(t.due))}</span>` : ''}
            <button class="x" data-task-del="${t.id}" title="Remove">×</button>
          </li>`).join('')}</ul>` : '<p class="muted" style="margin:0">Add your next steps — samples, logo files, website, first drop.</p>'}
        <form class="add-row" id="taskForm">
          <input name="text" placeholder="Add a task…" autocomplete="off">
          <input name="due" type="date">
          <button class="btn">Add</button>
        </form>
      </div>

      <div class="panel">
        <h3>Brand foundation</h3>
        <label>Mission</label>
        <textarea data-brand="mission" placeholder="What is Hilaal about? Why does it exist?">${esc(state.brand.mission)}</textarea>
        <label>Target customer</label>
        <textarea data-brand="audience" placeholder="Who are you designing for?">${esc(state.brand.audience)}</textarea>
        <label>Notes</label>
        <textarea data-brand="notes" placeholder="Values, tone of voice, price point, anything…">${esc(state.brand.notes)}</textarea>
      </div>

      <div class="panel">
        <h3>Latest ideas <a href="#ideas">View all →</a></h3>
        ${recentIdeas.length ? `<ul class="list">${recentIdeas.map((x) => `
          <li data-edit="ideas" data-id="${x.id}" style="cursor:pointer">
            <span class="grow">${esc(x.title)}</span>
            ${x.status ? `<span class="tag ${x.status === 'Ready' ? 'solid' : ''}">${esc(x.status)}</span>` : ''}
          </li>`).join('')}</ul>` : `<p class="muted" style="margin:0 0 12px">No ideas yet.</p><button class="btn ghost small" data-new="ideas">+ New idea</button>`}
      </div>

      <div class="panel">
        <h3>Recent spending <a href="#spending">View all →</a></h3>
        ${recentSpend.length ? `<ul class="list">${recentSpend.map((x) => `
          <li data-edit="spending" data-id="${x.id}" style="cursor:pointer">
            <span class="grow">${esc(x.item)} <span class="sub">· ${esc(fmtDate(x.date))}</span></span>
            <span style="font-variant-numeric:tabular-nums">${money(x.amount)}</span>
          </li>`).join('')}</ul>` : `<p class="muted" style="margin:0 0 12px">Nothing logged yet.</p><button class="btn ghost small" data-new="spending">+ Log expense</button>`}
      </div>
    </div>`;
}

// ---------- Modal form ----------

const modal = $('#modal');
let editing = null; // { key, id, image }

function fieldHTML(f, item) {
  const v = item[f.key] ?? (f.default ? f.default() : '');
  const req = f.required ? 'required' : '';
  let input;
  switch (f.type) {
    case 'textarea':
      input = `<textarea name="${f.key}" ${req}>${esc(v)}</textarea>`; break;
    case 'select':
      input = `<select name="${f.key}"><option value="">—</option>${f.options.map((o) =>
        `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`; break;
    case 'number':
      input = `<input type="number" step="any" min="0" name="${f.key}" value="${esc(v)}" ${req}>`; break;
    case 'image':
      return `<div class="field"><span>${f.label}</span><div class="img-field" id="imgField"></div></div>`;
    default:
      input = `<input type="${f.type === 'url' ? 'text' : f.type}" name="${f.key}" value="${esc(v)}" ${req} ${f.type === 'url' ? 'placeholder="https://"' : ''}>`;
  }
  return `<label class="field"><span>${f.label}</span>${input}</label>`;
}

function renderImageField() {
  const el = $('#imgField');
  if (!el) return;
  const src = safeUrl(editing.image);
  el.innerHTML = `
    ${src ? `<img class="img-preview" src="${esc(src)}" alt="">` : ''}
    <div class="img-actions">
      <label class="btn ghost small">${src ? 'Replace' : 'Upload'} image<input type="file" accept="image/*" id="imgFile" hidden></label>
      ${src ? '<button type="button" class="btn ghost small danger" id="imgRemove">Remove</button>' : ''}
      <span class="muted" style="font-size:12px">or paste an image / image link</span>
    </div>`;
}

function openModal(key, id) {
  const s = SECTIONS[key];
  const item = id ? state[key].find((x) => x.id === id) : {};
  if (id && !item) return;
  editing = { key, id, image: item.image || '' };
  $('#modalTitle').textContent = id ? `Edit ${s.single.toLowerCase()}` : `New ${s.single.toLowerCase()}`;
  $('#modalFields').innerHTML = s.fields.map((f) =>
    f.row ? `<div class="field-row">${f.row.map((r) => fieldHTML(r, item)).join('')}</div>` : fieldHTML(f, item)).join('');
  $('#deleteBtn').style.visibility = id ? 'visible' : 'hidden';
  renderImageField();
  modal.showModal();
  const first = $('#modalFields input, #modalFields textarea');
  if (first && !id) first.focus();
}

async function setImageFromFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  try { editing.image = await resizeImage(file); renderImageField(); }
  catch { alert('Could not read that image.'); }
}

$('#modalFields').addEventListener('change', (e) => {
  if (e.target.id === 'imgFile') setImageFromFile(e.target.files[0]);
});
$('#modalFields').addEventListener('click', (e) => {
  if (e.target.id === 'imgRemove') { editing.image = ''; renderImageField(); }
});
modal.addEventListener('paste', (e) => {
  if (!$('#imgField')) return;
  const file = [...(e.clipboardData?.files || [])].find((f) => f.type.startsWith('image/'));
  if (file) { e.preventDefault(); setImageFromFile(file); return; }
  const text = e.clipboardData?.getData('text') || '';
  const isTyping = e.target.matches('input, textarea');
  if (!isTyping && /^https?:\/\/\S+\.(png|jpe?g|gif|webp|avif)(\?\S*)?$/i.test(text.trim())) {
    e.preventDefault(); editing.image = text.trim(); renderImageField();
  }
});

$('#modalForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const { key, id } = editing;
  const s = SECTIONS[key];
  const data = Object.fromEntries(new FormData(e.target));
  const rec = {};
  flatFields(s.fields).forEach((f) => {
    if (f.type === 'image') rec.image = editing.image;
    else if (f.type === 'number') rec[f.key] = data[f.key] === '' ? '' : num(data[f.key]);
    else rec[f.key] = (data[f.key] ?? '').trim();
  });
  if (id) Object.assign(state[key].find((x) => x.id === id), rec, { updated: Date.now() });
  else state[key].unshift({ id: uid(), created: Date.now(), ...rec });
  persist();
  modal.close();
  render();
});

$('#cancelBtn').addEventListener('click', () => modal.close());
$('#deleteBtn').addEventListener('click', () => {
  const { key, id } = editing;
  if (!id || !confirm('Delete this for good?')) return;
  state[key] = state[key].filter((x) => x.id !== id);
  persist();
  modal.close();
  render();
});
modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });

// ---------- Global events ----------

document.addEventListener('click', (e) => {
  if (e.target.closest('[data-stop]')) return;
  const n = e.target.closest('[data-new]');
  if (n) return openModal(n.dataset.new);
  const ed = e.target.closest('[data-edit]');
  if (ed && !e.target.closest('dialog')) return openModal(ed.dataset.edit, ed.dataset.id);
  const fl = e.target.closest('[data-filter]');
  if (fl) { ui.filter[fl.dataset.filter] = fl.dataset.value; return render(); }
  const td = e.target.closest('[data-task-del]');
  if (td) { state.tasks = state.tasks.filter((t) => t.id !== td.dataset.taskDel); persist(); return render(); }
});

document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.taskToggle) {
    const task = state.tasks.find((x) => x.id === t.dataset.taskToggle);
    if (task) { task.done = t.checked; persist(); render(); }
  } else if (t.dataset.setting === 'currency') {
    state.currency = t.value; persist(); render();
  } else if (t.dataset.setting === 'budget') {
    state.budget = num(t.value); persist(); render();
  }
});

document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.dataset.brand) { state.brand[t.dataset.brand] = t.value; persist(); }
  else if (t.dataset.search) {
    ui.search[t.dataset.search] = t.value;
    const pos = t.selectionStart;
    render();
    const again = $(`[data-search="${t.dataset.search}"]`);
    again.focus(); again.setSelectionRange(pos, pos);
  }
});

document.addEventListener('submit', (e) => {
  if (e.target.id !== 'taskForm') return;
  e.preventDefault();
  const text = e.target.text.value.trim();
  if (!text) return;
  state.tasks.push({ id: uid(), text, due: e.target.due.value, done: false });
  persist();
  render();
  $('#taskForm input[name=text]').focus();
});

// ---------- Backup ----------

$('#exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `hilaal-backup-${today()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

$('#importInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (typeof data !== 'object' || !Array.isArray(data.ideas)) throw new Error();
    if (!confirm('Replace everything in this dashboard with the backup?')) return;
    state = { ...EMPTY_STATE(), ...data, brand: { ...EMPTY_STATE().brand, ...(data.brand || {}) } };
    persist();
    render();
  } catch { alert('That file is not a Hilaal backup.'); }
});

// ---------- Boot ----------

window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });

(async () => {
  const saved = await store.load();
  if (saved) state = { ...EMPTY_STATE(), ...saved, brand: { ...EMPTY_STATE().brand, ...(saved.brand || {}) } };
  render();
})();
