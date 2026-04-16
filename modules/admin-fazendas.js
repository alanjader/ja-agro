// ============================================================
// JA AGRO — Admin Module: Fazendas
// modules/admin-fazendas.js
// ============================================================

window.module_fazendas = async function() {
  setTopbar('Fazendas', 'Gestão de clientes',
    '<button class="topbar-btn btn-primary" onclick="novaFazenda()">+ Nova Fazenda</button>'
  );
  await renderFazendas();
};

// ── ESTADO ────────────────────────────────────
var _fazPage    = 0;
var _fazLimit   = 12;
var _fazSearch  = '';
var _fazTotal   = 0;

// ── RENDER PRINCIPAL ──────────────────────────
async function renderFazendas() {
  setLoading('mainContent');
  try {
    var query = sb.from('fazendas')
      .select('*', { count: 'exact' })
      .order('nome');

    if (_fazSearch) {
      query = query.ilike('nome', '%' + _fazSearch + '%');
    }

    query = query.range(_fazPage * _fazLimit, (_fazPage + 1) * _fazLimit - 1);

    var { data, count, error } = await query;
    if (error) throw error;

    _fazTotal = count || 0;

    var html = '';

    // BARRA DE BUSCA + CONTADOR
    html += '<div class="table-wrap">';
    html += '<div class="table-header">';
    html += '<div class="table-title">Fazendas <span style="font-size:12px;color:var(--muted);font-weight:500">(' + _fazTotal + ' no total)</span></div>';
    html += '<input class="search-input" type="text" placeholder="Buscar fazenda..." value="' + esc(_fazSearch) + '" oninput="fazSearch(this.value)" id="fazSearchInput"/>';
    html += '</div>';

    if (!data || data.length === 0) {
      html += '<div class="table-empty">';
      html += _fazSearch
        ? '🔍 Nenhuma fazenda encontrada para "<strong>' + esc(_fazSearch) + '</strong>"'
        : '🏢 Nenhuma fazenda cadastrada ainda.<br><br><button class="topbar-btn btn-primary" onclick="novaFazenda()">+ Cadastrar primeira fazenda</button>';
      html += '</div>';
    } else {
      html += '<table>';
      html += '<thead><tr>'
        + '<th>Fazenda</th>'
        + '<th>Cidade / Estado</th>'
        + '<th>Área (ha)</th>'
        + '<th>Talhões</th>'
        + '<th>Usuários</th>'
        + '<th>Status</th>'
        + '<th>Ações</th>'
        + '</tr></thead><tbody>';

      // Busca contagens de talhões e usuários para cada fazenda
      var ids = data.map(function(f) { return f.id; });

      var [
        { data: talhoesCounts },
        { data: usuariosCounts },
      ] = await Promise.all([
        sb.from('talhoes').select('fazenda_id').in('fazenda_id', ids).eq('ativo', true),
        sb.from('usuarios').select('fazenda_id').in('fazenda_id', ids).eq('ativo', true),
      ]);

      var tMap = {}, uMap = {};
      (talhoesCounts  || []).forEach(function(r) { tMap[r.fazenda_id] = (tMap[r.fazenda_id] || 0) + 1; });
      (usuariosCounts || []).forEach(function(r) { uMap[r.fazenda_id] = (uMap[r.fazenda_id] || 0) + 1; });

      data.forEach(function(f) {
        var statusBadge = f.ativo
          ? '<span class="badge badge-green">Ativa</span>'
          : '<span class="badge badge-red">Inativa</span>';
        var area = f.area_total_ha
          ? Number(f.area_total_ha).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' ha'
          : '—';
        var cidade = [f.cidade, f.estado].filter(Boolean).join(' / ') || '—';

        html += '<tr>'
          + '<td><strong>' + esc(f.nome) + '</strong></td>'
          + '<td style="color:var(--muted)">' + esc(cidade) + '</td>'
          + '<td>' + area + '</td>'
          + '<td><span style="font-weight:600">' + (tMap[f.id] || 0) + '</span></td>'
          + '<td><span style="font-weight:600">' + (uMap[f.id] || 0) + '</span></td>'
          + '<td>' + statusBadge + '</td>'
          + '<td><div class="td-actions">'
          + '<button class="action-btn" onclick="editarFazenda(\'' + f.id + '\')">Editar</button>'
          + (f.ativo
            ? '<button class="action-btn danger" onclick="toggleFazenda(\'' + f.id + '\',false,\'' + esc(f.nome) + '\')">Desativar</button>'
            : '<button class="action-btn" onclick="toggleFazenda(\'' + f.id + '\',true,\'' + esc(f.nome) + '\')">Ativar</button>')
          + '</div></td>'
          + '</tr>';
      });

      html += '</tbody></table>';

      // PAGINAÇÃO
      var totalPages = Math.ceil(_fazTotal / _fazLimit);
      if (totalPages > 1) {
        var inicio = _fazPage * _fazLimit + 1;
        var fim    = Math.min((_fazPage + 1) * _fazLimit, _fazTotal);
        html += '<div class="pagination">';
        html += '<span>Mostrando ' + inicio + '–' + fim + ' de ' + _fazTotal + '</span>';
        html += '<div class="pagination-btns">';
        html += '<button class="page-btn" onclick="fazPagina(' + (_fazPage - 1) + ')" ' + (_fazPage === 0 ? 'disabled' : '') + '>← Anterior</button>';
        for (var p = 0; p < totalPages; p++) {
          html += '<button class="page-btn ' + (p === _fazPage ? 'active' : '') + '" onclick="fazPagina(' + p + ')">' + (p + 1) + '</button>';
        }
        html += '<button class="page-btn" onclick="fazPagina(' + (_fazPage + 1) + ')" ' + (_fazPage >= totalPages - 1 ? 'disabled' : '') + '>Próxima →</button>';
        html += '</div></div>';
      }
    }

    html += '</div>';
    document.getElementById('mainContent').innerHTML = html;

    // Re-foca o campo de busca se estava buscando
    if (_fazSearch) {
      var inp = document.getElementById('fazSearchInput');
      if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
    }

  } catch(e) {
    document.getElementById('mainContent').innerHTML =
      '<div class="page-loading"><div style="font-size:48px">⚠️</div>'
      + '<div class="loading-text">Erro: ' + e.message + '</div></div>';
  }
}

// ── BUSCA COM DEBOUNCE ────────────────────────
var _fazSearchTimer;
window.fazSearch = function(val) {
  _fazSearch = val;
  _fazPage   = 0;
  clearTimeout(_fazSearchTimer);
  _fazSearchTimer = setTimeout(renderFazendas, 350);
};

window.fazPagina = function(p) {
  _fazPage = p;
  renderFazendas();
};

// ── FORM HTML ─────────────────────────────────
function fazendaFormHtml(f) {
  f = f || {};
  return '<div class="form-grid">'

    + '<div class="form-field">'
    + '<label>Nome da Fazenda <span class="req">*</span></label>'
    + '<input type="text" id="faz_nome" value="' + esc(f.nome || '') + '" placeholder="Ex: Fazenda Boa Vista" maxlength="100"/>'
    + '</div>'

    + '<div class="form-grid c2">'

    + '<div class="form-field">'
    + '<label>Cidade</label>'
    + '<input type="text" id="faz_cidade" value="' + esc(f.cidade || '') + '" placeholder="Ex: Franca" maxlength="80"/>'
    + '</div>'

    + '<div class="form-field">'
    + '<label>Estado</label>'
    + '<select id="faz_estado">'
    + estadoOptions(f.estado)
    + '</select>'
    + '</div>'

    + '</div>'

    + '<div class="form-field">'
    + '<label>Área Total (ha)</label>'
    + '<input type="number" id="faz_area" value="' + (f.area_total_ha || '') + '" placeholder="Ex: 150.5" step="0.1" min="0"/>'
    + '<div class="form-hint">Soma de todos os talhões da fazenda</div>'
    + '</div>'

    + '</div>';
}

function estadoOptions(selected) {
  var estados = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
  var html = '<option value="">Selecione</option>';
  estados.forEach(function(uf) {
    html += '<option value="' + uf + '"' + (selected === uf ? ' selected' : '') + '>' + uf + '</option>';
  });
  return html;
}

// ── NOVA FAZENDA ──────────────────────────────
window.novaFazenda = function() {
  openModal('Nova Fazenda', fazendaFormHtml(), async function() {
    var nome   = document.getElementById('faz_nome').value.trim();
    var cidade = document.getElementById('faz_cidade').value.trim();
    var estado = document.getElementById('faz_estado').value;
    var area   = parseFloat(document.getElementById('faz_area').value) || null;

    if (!nome) {
      document.getElementById('faz_nome').classList.add('err');
      document.getElementById('faz_nome').focus();
      toast('Informe o nome da fazenda', 'bad');
      return;
    }

    var btn = document.getElementById('modalSaveBtn');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
      var { error } = await sb.from('fazendas').insert({
        nome, cidade: cidade || null, estado: estado || null,
        area_total_ha: area, ativo: true,
      });
      if (error) throw error;

      closeModal();
      toast('Fazenda cadastrada com sucesso!', 'ok');
      _fazPage = 0;
      await renderFazendas();
    } catch(e) {
      toast('Erro: ' + e.message, 'bad');
      btn.disabled = false;
      btn.textContent = 'Salvar';
    }
  });
  setTimeout(function() { document.getElementById('faz_nome').focus(); }, 100);
};

// ── EDITAR FAZENDA ────────────────────────────
window.editarFazenda = async function(id) {
  try {
    var { data, error } = await sb.from('fazendas').select('*').eq('id', id).single();
    if (error) throw error;

    openModal('Editar Fazenda', fazendaFormHtml(data), async function() {
      var nome   = document.getElementById('faz_nome').value.trim();
      var cidade = document.getElementById('faz_cidade').value.trim();
      var estado = document.getElementById('faz_estado').value;
      var area   = parseFloat(document.getElementById('faz_area').value) || null;

      if (!nome) {
        document.getElementById('faz_nome').classList.add('err');
        document.getElementById('faz_nome').focus();
        toast('Informe o nome da fazenda', 'bad');
        return;
      }

      var btn = document.getElementById('modalSaveBtn');
      btn.disabled = true;
      btn.textContent = 'Salvando...';

      try {
        var { error: err } = await sb.from('fazendas').update({
          nome, cidade: cidade || null, estado: estado || null,
          area_total_ha: area,
        }).eq('id', id);
        if (err) throw err;

        closeModal();
        toast('Fazenda atualizada!', 'ok');
        await renderFazendas();
      } catch(e2) {
        toast('Erro: ' + e2.message, 'bad');
        btn.disabled = false;
        btn.textContent = 'Salvar';
      }
    });
  } catch(e) {
    toast('Erro ao carregar fazenda: ' + e.message, 'bad');
  }
};

// ── ATIVAR / DESATIVAR ────────────────────────
window.toggleFazenda = async function(id, ativar, nome) {
  var acao  = ativar ? 'ativar' : 'desativar';
  var icone = ativar ? '✅' : '⚠️';
  var msg   = ativar
    ? 'A fazenda <strong>' + esc(nome) + '</strong> voltará a aparecer no sistema.'
    : 'A fazenda <strong>' + esc(nome) + '</strong> ficará inativa. Os dados não serão apagados.';

  var ok = await confirm2(
    (ativar ? 'Ativar' : 'Desativar') + ' fazenda?', msg, icone
  );
  if (!ok) return;

  try {
    var { error } = await sb.from('fazendas').update({ ativo: ativar }).eq('id', id);
    if (error) throw error;
    toast('Fazenda ' + (ativar ? 'ativada' : 'desativada') + '!', 'ok');
    await renderFazendas();
  } catch(e) {
    toast('Erro: ' + e.message, 'bad');
  }
};

// ── UTILITÁRIO ────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
