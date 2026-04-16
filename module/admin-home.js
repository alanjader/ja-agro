// ============================================================
// JA AGRO — Admin Module: Home (Dashboard)
// modules/admin-home.js
// ============================================================

window.module_home = async function() {

  setTopbar('Dashboard', 'Visão geral do sistema');
  setLoading('mainContent');

  // Busca todos os totais em paralelo
  try {
    var [
      { count: totalFazendas },
      { count: totalUsuarios },
      { count: totalTalhoes },
      { count: totalSafras },
      { count: totalLancamentos },
      { count: totalPendentes },
      { data: safrasAbertas },
      { data: ultimosLancamentos },
    ] = await Promise.all([
      sb.from('fazendas').select('*', { count: 'exact', head: true }).eq('ativo', true),
      sb.from('usuarios').select('*', { count: 'exact', head: true }).eq('ativo', true).neq('role','admin'),
      sb.from('talhoes').select('*', { count: 'exact', head: true }).eq('ativo', true),
      sb.from('safras').select('*', { count: 'exact', head: true }),
      sb.from('lancamentos').select('*', { count: 'exact', head: true }),
      sb.from('lancamentos_offline').select('*', { count: 'exact', head: true }).eq('status','pendente'),
      sb.from('safras').select('nome, fazendas(nome)').eq('status','aberta').order('criado_em', { ascending: false }).limit(5),
      sb.from('lancamentos')
        .select('id, data_lancamento, categorias_lancamento(nome), talhoes(nome), fazendas(nome), custo_total')
        .order('criado_em', { ascending: false })
        .limit(8),
    ]);

    renderHome({
      totalFazendas:    totalFazendas  || 0,
      totalUsuarios:    totalUsuarios  || 0,
      totalTalhoes:     totalTalhoes   || 0,
      totalSafras:      totalSafras    || 0,
      totalLancamentos: totalLancamentos || 0,
      totalPendentes:   totalPendentes || 0,
      safrasAbertas:    safrasAbertas  || [],
      ultimosLancamentos: ultimosLancamentos || [],
    });

  } catch(e) {
    document.getElementById('mainContent').innerHTML =
      '<div class="page-loading"><div style="font-size:48px">⚠️</div>'
      + '<div class="loading-text">Erro ao carregar: ' + e.message + '</div></div>';
  }
};

function renderHome(d) {
  var html = '';

  // ── CARDS DE TOTAIS ──────────────────────────
  html += '<div class="stats-grid">';

  html += statCard('🏢', d.totalFazendas, 'Fazendas ativas', 'green',
    d.totalFazendas === 0 ? 'Nenhuma cadastrada ainda' : 'Clientes ativos no sistema');

  html += statCard('👤', d.totalUsuarios, 'Usuários ativos', 'blue',
    'Produtores, gerentes e operadores');

  html += statCard('🌾', d.totalTalhoes, 'Talhões', 'orange',
    'Total de talhões cadastrados');

  html += statCard('📋', d.totalLancamentos, 'Lançamentos', 'purple',
    d.totalPendentes > 0
      ? '<span style="color:var(--warn)">⚠ ' + d.totalPendentes + ' pendentes de sync</span>'
      : 'Todos sincronizados ✓');

  html += '</div>';

  // ── LINHA INFERIOR: SAFRAS + ÚLTIMOS LANÇAMENTOS ──
  html += '<div style="display:grid;grid-template-columns:1fr 1.6fr;gap:20px;align-items:start;">';

  // SAFRAS ABERTAS
  html += '<div class="table-wrap">';
  html += '<div class="table-header"><div class="table-title">🌱 Safras abertas</div>';
  html += '<button class="topbar-btn btn-ghost" style="font-size:12px;padding:6px 12px" onclick="loadModule(\'safras\', document.querySelector(\'[data-module=safras]\'))">Ver todas</button>';
  html += '</div>';

  if (d.safrasAbertas.length === 0) {
    html += '<div class="table-empty">Nenhuma safra aberta</div>';
  } else {
    html += '<table><thead><tr><th>Safra</th><th>Fazenda</th><th>Status</th></tr></thead><tbody>';
    d.safrasAbertas.forEach(function(s) {
      html += '<tr>'
        + '<td><strong>' + esc(s.nome) + '</strong></td>'
        + '<td style="color:var(--muted)">' + esc(s.fazendas?.nome || '—') + '</td>'
        + '<td><span class="badge badge-green">Aberta</span></td>'
        + '</tr>';
    });
    html += '</tbody></table>';
  }

  if (d.totalSafras > 5) {
    html += '<div style="padding:12px 16px;font-size:12px;color:var(--muted);border-top:1px solid var(--brd)">+'
      + (d.totalSafras - 5) + ' safras no total</div>';
  }
  html += '</div>';

  // ÚLTIMOS LANÇAMENTOS
  html += '<div class="table-wrap">';
  html += '<div class="table-header"><div class="table-title">📋 Últimos lançamentos</div>';
  html += '<button class="topbar-btn btn-ghost" style="font-size:12px;padding:6px 12px" onclick="loadModule(\'lancamentos\', document.querySelector(\'[data-module=lancamentos]\'))">Ver todos</button>';
  html += '</div>';

  if (d.ultimosLancamentos.length === 0) {
    html += '<div class="table-empty">Nenhum lançamento ainda</div>';
  } else {
    html += '<table><thead><tr><th>Data</th><th>Fazenda</th><th>Talhão</th><th>Categoria</th><th style="text-align:right">Custo</th></tr></thead><tbody>';
    d.ultimosLancamentos.forEach(function(l) {
      var custo = l.custo_total
        ? 'R$ ' + Number(l.custo_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        : '—';
      var data = l.data_lancamento
        ? new Date(l.data_lancamento + 'T00:00:00').toLocaleDateString('pt-BR')
        : '—';
      html += '<tr>'
        + '<td style="color:var(--muted);white-space:nowrap">' + data + '</td>'
        + '<td>' + esc(l.fazendas?.nome || '—') + '</td>'
        + '<td style="color:var(--muted)">' + esc(l.talhoes?.nome || '—') + '</td>'
        + '<td><span class="badge badge-gray">' + esc(l.categorias_lancamento?.nome || '—') + '</span></td>'
        + '<td style="text-align:right;font-weight:600;color:var(--text)">' + custo + '</td>'
        + '</tr>';
    });
    html += '</tbody></table>';
  }
  html += '</div>';

  html += '</div>'; // fim grid inferior

  // ALERTA SE PENDENTES
  if (d.totalPendentes > 0) {
    html = '<div style="background:var(--warn-lt);border:1.5px solid var(--warn);border-radius:var(--r-lg);padding:14px 20px;margin-bottom:20px;display:flex;align-items:center;gap:12px;">'
      + '<span style="font-size:22px">⚠️</span>'
      + '<div><strong>' + d.totalPendentes + ' lançamento(s) offline</strong> aguardando sincronização. '
      + '<a href="#" style="color:var(--warn);font-weight:700" onclick="loadModule(\'offline\',document.querySelector(\'[data-module=offline]\'));return false">Ver fila →</a></div>'
      + '</div>' + html;
  }

  document.getElementById('mainContent').innerHTML = html;
}

function statCard(icon, val, label, color, sub) {
  return '<div class="stat-card ' + color + '">'
    + '<span class="stat-card-icon">' + icon + '</span>'
    + '<div class="stat-card-val">' + val + '</div>'
    + '<div class="stat-card-lbl">' + label + '</div>'
    + '<div class="stat-card-change neutral">' + sub + '</div>'
    + '</div>';
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
