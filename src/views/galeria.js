function render(session) {
  const token = session.token;
  const role = session.role;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<link rel="icon" href="data:,">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Galeria de Imoveis - Gestao</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { max-width: 100vw; overflow-x: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f7; color: #1a1a2e; }
  header { background: #fff; border-bottom: 1px solid #e5e7eb; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 10; }
  header h1 { font-size: 16px; font-weight: 600; }
  header .role { font-size: 12px; color: #6b7280; padding: 4px 10px; background: #f3f4f6; border-radius: 20px; }
  .filter-bar { padding: 12px 16px; background: #fff; border-bottom: 1px solid #e5e7eb; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .filter-bar button { padding: 6px 14px; background: #fff; border: 1px solid #d1d5db; border-radius: 20px; font-size: 13px; cursor: pointer; }
  .filter-bar button.active { background: #1f2937; color: #fff; border-color: #1f2937; }
  .selection-info { padding: 10px 16px; background: #eff6ff; color: #1e40af; font-size: 13px; font-weight: 500; display: none; }
  .selection-info.show { display: block; }
  #grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; padding: 16px; padding-bottom: 120px; }
  .card { background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); cursor: pointer; position: relative; transition: transform 0.15s, box-shadow 0.15s; }
  .card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  .card.selected { outline: 3px solid #3b82f6; }
  .card-img { width: 100%; aspect-ratio: 4/3; object-fit: cover; background: #e5e7eb; display: block; }
  .card-noimg { width: 100%; aspect-ratio: 4/3; background: #f3f4f6; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 13px; }
  .card-body { padding: 10px 12px; }
  .card-title { font-size: 13px; font-weight: 600; margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .card-meta { font-size: 11px; color: #6b7280; }
  .card-check { position: absolute; top: 8px; left: 8px; width: 24px; height: 24px; background: rgba(255,255,255,0.95); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #3b82f6; font-weight: 700; }
  .card.selected .card-check::before { content: 'v'; font-family: monospace; }
  .badge { position: absolute; top: 8px; right: 8px; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; background: rgba(0,0,0,0.7); color: #fff; }
  .badge.rascunho { background: #f59e0b; }
  .badge.vinculado { background: #3b82f6; }
  .badge.publicado { background: #10b981; }
  .badge.oculto { background: #6b7280; }
  .badge.aguardando { background: #8b5cf6; }
  #action-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; border-top: 1px solid #e5e7eb; padding: 12px 16px; display: none; gap: 8px; flex-wrap: wrap; box-shadow: 0 -4px 12px rgba(0,0,0,0.06); }
  #action-bar.show { display: flex; }
  #action-bar select, #action-bar button { padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 13px; background: #fff; cursor: pointer; }
  #action-bar button.primary { background: #1f2937; color: #fff; border-color: #1f2937; }
  #action-bar button.danger { background: #dc2626; color: #fff; border-color: #dc2626; }
  #action-bar .flex-grow { flex: 1; }
  #empty { padding: 60px 20px; text-align: center; color: #6b7280; }
  #loading { padding: 60px 20px; text-align: center; color: #6b7280; }
  .toast { position: fixed; top: 70px; left: 50%; transform: translateX(-50%); padding: 12px 20px; background: #1f2937; color: #fff; border-radius: 8px; font-size: 14px; z-index: 100; opacity: 0; transition: opacity 0.2s; pointer-events: none; }
  .toast.show { opacity: 1; }
  .toast.success { background: #10b981; }
  .toast.error { background: #dc2626; }
  @media (max-width: 640px) {
    #grid { grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 8px; padding-bottom: 140px; }
    .card-title { font-size: 12px; }
    .card-meta { font-size: 10px; }
    header h1 { font-size: 14px; }
    #action-bar { padding: 10px; }
    #action-bar select, #action-bar button { padding: 8px 10px; font-size: 12px; }
  }
</style>
</head>
<body>

<header>
  <h1>Galeria de Imoveis</h1>
  <span class="role">${role.toUpperCase()}</span>
</header>

<div class="filter-bar" id="filter-bar">
  <button data-status="all" class="active">Todos</button>
  <button data-status="rascunho">Rascunho</button>
  <button data-status="vinculado">Vinculado</button>
  <button data-status="publicado">Publicado</button>
  <button data-status="oculto">Oculto</button>
  <button data-status="aguardando_curadoria">Aguardando Curadoria</button>
</div>

<div class="selection-info" id="selection-info"></div>

<div id="loading">Carregando...</div>
<div id="empty" style="display:none">Nenhum imovel encontrado.</div>
<div id="grid"></div>

<div id="action-bar">
  <select id="action-corretor">
    <option value="">Selecione o corretor...</option>
  </select>
  <button class="primary" onclick="doAction('vincular')">Vincular</button>
  <button onclick="doAction('visibility', { visibility: 'explicito' })">Explicito</button>
  <button onclick="doAction('visibility', { visibility: 'oculto' })">Oculto</button>
  <button onclick="askCuradoria()">Curadoria IA?</button>
  <button class="primary" onclick="doAction('publicar')">Publicar</button>
  ${role === 'adm' ? '<button class="danger" onclick="doAction(&quot;excluir&quot;)">Excluir</button>' : ''}
  <span class="flex-grow"></span>
  <button onclick="clearSelection()">Limpar</button>
</div>

<div class="toast" id="toast"></div>

<script>
const TOKEN = '${token}';
const API_BASE = '/api/galeria/' + TOKEN;
let imoveis = [];
let corretores = [];
let selected = new Set();
let currentFilter = 'all';

function toast(msg, type) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show ' + (type || '');
  setTimeout(() => { el.className = 'toast'; }, 2500);
}

function badgeClass(status, visibility) {
  if (visibility === 'oculto') return 'oculto';
  if (status === 'aguardando_curadoria') return 'aguardando';
  return status || '';
}

function render() {
  const grid = document.getElementById('grid');
  const empty = document.getElementById('empty');
  const loading = document.getElementById('loading');
  loading.style.display = 'none';

  const filtered = currentFilter === 'all' ? imoveis : imoveis.filter(i => i.status === currentFilter);

  if (filtered.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  grid.innerHTML = filtered.map(im => {
    const firstImage = (im.images && im.images[0]) ? im.images[0] : '';
    const imgHtml = firstImage
      ? '<img class="card-img" src="' + firstImage + '" loading="lazy" onerror="this.outerHTML=\\'<div class=card-noimg>sem foto</div>\\'">'
      : '<div class="card-noimg">sem foto</div>';
    const preco = im.amount ? 'R$ ' + Number(im.amount).toLocaleString('pt-BR') : 'Sob consulta';
    const label = im.visibility === 'oculto' ? 'Oculto' : (im.status || '');
    return '<div class="card ' + (selected.has(im.id) ? 'selected' : '') + '" data-id="' + im.id + '" onclick="toggleSelect(' + im.id + ')">' +
      imgHtml +
      '<span class="badge ' + badgeClass(im.status, im.visibility) + '">' + label + '</span>' +
      '<div class="card-check"></div>' +
      '<div class="card-body">' +
      '<div class="card-title">' + escapeHtml(im.titulo || '#' + im.id) + '</div>' +
      '<div class="card-meta">' + preco + (im.neighborhood ? ' | ' + escapeHtml(im.neighborhood) : '') + '</div>' +
      '</div></div>';
  }).join('');

  updateSelectionBar();
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}

function toggleSelect(id) {
  if (selected.has(id)) selected.delete(id);
  else selected.add(id);
  render();
}

function clearSelection() {
  selected.clear();
  render();
}

function updateSelectionBar() {
  const bar = document.getElementById('action-bar');
  const info = document.getElementById('selection-info');
  if (selected.size > 0) {
    bar.classList.add('show');
    info.classList.add('show');
    info.textContent = selected.size + ' imovel(is) selecionado(s)';
  } else {
    bar.classList.remove('show');
    info.classList.remove('show');
  }
}

function populateCorretores() {
  const select = document.getElementById('action-corretor');
  select.innerHTML = '<option value="">Selecione o corretor...</option>' +
    corretores.map(c => '<option value="' + c.id + '">' + escapeHtml(c.nome) + (c.autonomo ? ' (autonomo)' : '') + '</option>').join('');
}

async function loadData() {
  try {
    const r = await fetch(API_BASE + '/imoveis');
    const data = await r.json();
    if (data.error) throw new Error(data.error);
    imoveis = data.imoveis;
    corretores = data.corretores;
    populateCorretores();
    render();
  } catch (e) {
    toast('Erro: ' + e.message, 'error');
    document.getElementById('loading').textContent = 'Erro: ' + e.message;
  }
}

async function doAction(action, payload) {
  if (selected.size === 0) { toast('Selecione pelo menos 1 imovel', 'error'); return; }

  if (action === 'vincular') {
    const cId = Number(document.getElementById('action-corretor').value);
    if (!cId) { toast('Escolha um corretor', 'error'); return; }
    payload = { corretor_id: cId };
  }

  if (action === 'excluir') {
    if (!confirm('Excluir ' + selected.size + ' imovel(is)?')) return;
  }

  try {
    const r = await fetch(API_BASE + '/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imovel_ids: Array.from(selected), action, payload }),
    });
    const data = await r.json();
    if (data.error) throw new Error(data.error);
    toast(data.updated + ' imovel(is) atualizado(s)', 'success');
    selected.clear();
    await loadData();
  } catch (e) {
    toast('Erro: ' + e.message, 'error');
  }
}

async function askCuradoria() {
  if (selected.size === 0) { toast('Selecione pelo menos 1 imovel', 'error'); return; }
  const yes = confirm('Deseja usar a Curadoria com IA para melhorar descricao e imagens dos ' + selected.size + ' imovel(is)?\\n\\nOK = Sim (entra na Curadoria na Sprint 2)\\nCancelar = Nao (publica direto)');
  try {
    const r = await fetch(API_BASE + '/curadoria', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imovel_ids: Array.from(selected), resposta: yes ? 'sim' : 'nao' }),
    });
    const data = await r.json();
    if (data.error) throw new Error(data.error);
    toast(yes ? 'Marcado para Curadoria' : 'Publicacao direta', 'success');
    selected.clear();
    await loadData();
  } catch (e) {
    toast('Erro: ' + e.message, 'error');
  }
}

document.getElementById('filter-bar').addEventListener('click', e => {
  if (e.target.tagName !== 'BUTTON') return;
  document.querySelectorAll('#filter-bar button').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  currentFilter = e.target.dataset.status;
  render();
});

loadData();
</script>

</body>
</html>`;
}

module.exports = { render };
