// admin-dashboard.js - Dashboard Analytics
// JA Agro Intelligence v1.0

(async function() {
  if (typeof setTopbar === 'function') setTopbar('Dashboard', 'Analytics · Gráficos e KPIs');
  if (typeof setLoading === 'function') setLoading('mainContent');

  const cont = document.getElementById('mainContent');
  if (!cont) return;

  try {
    const [
      { data: lancamentos },
      { data: safras },
      { data: fazendas }
    ] = await Promise.all([
      sb.from('lancamentos').select('tipo,valor,data,categorias_lancamento(nome)').order('data', { ascending: false }).limit(50),
      sb.from('safras').select('nome,cultura,status,area_total,fazendas(nome)').order('created_at', { ascending: false }),
      sb.from('fazendas').select('id,nome,area_total').order('nome')
    ]);

    const despesas = (lancamentos||[]).filter(l => l.tipo === 'despesa').reduce((s, l) => s + (l.valor||0), 0);
    const receitas = (lancamentos||[]).filter(l => l.tipo === 'receita').reduce((s, l) => s + (l.valor||0), 0);
    const saldo = receitas - despesas;
    const safrasAbertas = (safras||[]).filter(s => s.status === 'aberta');
    const areaTotal = (fazendas||[]).reduce((sum, f) => sum + (f.area_total||0), 0);

    const catMap = {};
    (lancamentos||[]).forEach(function(l) {
      const cat = (l.categorias_lancamento && l.categorias_lancamento.nome) || l.tipo || 'Outros';
      if (!catMap[cat]) catMap[cat] = { receita: 0, despesa: 0 };
      if (l.tipo === 'receita') catMap[cat].receita += l.valor || 0;
      else catMap[cat].despesa += l.valor || 0;
    });

    const cultMap = {};
    (safras||[]).forEach(function(s) {
      const c = s.cultura || 'Outros';
      if (!cultMap[c]) cultMap[c] = { area: 0, count: 0 };
      cultMap[c].area += s.area_total || 0;
      cultMap[c].count++;
    });

    function fmtMoeda(v) {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
    }

    function kpi(icon, label, value, color) {
      return '<div style="background:#fff;border:1.5px solid #e5e7eb;border-radius:12px;padding:20px;border-top:3px solid ' + color + '">' +
        '<div style="font-size:1.6rem">' + icon + '</div>' +
        '<div style="font-size:1.5rem;font-weight:700;color:#1a3a1a;margin:6px 0 4px">' + value + '</div>' +
        '<div style="font-size:.8rem;font-weight:700;text-transform:uppercase;color:' + color + ';letter-spacing:.05em">' + label + '</div>' +
        '</div>';
    }

    var catRows = Object.entries(catMap).slice(0, 8).map(function(entry) {
      var cat = entry[0]; var vals = entry[1];
      return { categoria: cat, receita: fmtMoeda(vals.receita), despesa: fmtMoeda(vals.despesa) };
    });

    var safraRows = (safras||[]).slice(0, 10).map(function(s) {
      var statusColor = s.status === 'aberta' ? '#dcfce7;color:#16a34a' : s.status === 'encerrada' ? '#fee2e2;color:#dc2626' : '#f3f4f6;color:#6b7280';
      return {
        safra: s.nome || '-',
        fazenda: (s.fazendas && s.fazendas.nome) || '-',
        cultura: s.cultura || '-',
        area: (s.area_total || 0).toFixed(1) + ' ha',
        status: '<span style="padding:2px 8px;border-radius:10px;font-size:.75rem;font-weight:600;background:' + statusColor + '">' + (s.status || '-') + '</span>'
      };
    });

    var catHTML = catRows.length ? catRows.map(function(r) {
      return '<tr><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">' + r.categoria + '</td>' +
        '<td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right;color:#16a34a">' + r.receita + '</td>' +
        '<td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right;color:#dc2626">' + r.despesa + '</td></tr>';
    }).join('') : '<tr><td colspan="3" style="text-align:center;color:#9ca3af;padding:20px">Sem dados</td></tr>';

    var cultHTML = Object.entries(cultMap).map(function(entry) {
      var c = entry[0]; var v = entry[1];
      return '<tr><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">' + c + '</td>' +
        '<td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right">' + v.area.toFixed(1) + '</td>' +
        '<td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right">' + v.count + '</td></tr>';
    }).join('') || '<tr><td colspan="3" style="text-align:center;color:#9ca3af;padding:20px">Sem dados</td></tr>';

    var safrHTML = safraRows.length ? safraRows.map(function(r) {
      return '<tr><td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-weight:600">' + r.safra + '</td>' +
        '<td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">' + r.fazenda + '</td>' +
        '<td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">' + r.cultura + '</td>' +
        '<td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right">' + r.area + '</td>' +
        '<td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">' + r.status + '</td></tr>';
    }).join('') : '<tr><td colspan="5" style="text-align:center;color:#9ca3af;padding:20px">Sem safras</td></tr>';

    cont.innerHTML = '<div style="padding:24px;max-width:1200px;margin:0 auto">' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:28px">' +
      kpi('💰', 'Receitas', fmtMoeda(receitas), '#16a34a') +
      kpi('💸', 'Despesas', fmtMoeda(despesas), '#dc2626') +
      kpi('📊', 'Saldo', fmtMoeda(saldo), saldo >= 0 ? '#16a34a' : '#dc2626') +
      kpi('🌱', 'Safras Abertas', safrasAbertas.length.toString(), '#2563eb') +
      kpi('🏡', 'Área Total', areaTotal.toFixed(0) + ' ha', '#7c3aed') +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">' +
      '<div style="background:#fff;border:1.5px solid #e5e7eb;border-radius:12px;padding:20px">' +
      '<h3 style="margin:0 0 16px;font-size:1rem;font-weight:700;color:#1a3a1a">📋 Lançamentos por Categoria</h3>' +
      '<table style="width:100%;border-collapse:collapse;font-size:.85rem"><thead>' +
      '<tr style="background:#f9fafb"><th style="padding:8px 12px;text-align:left;font-size:.75rem;text-transform:uppercase;color:#9ca3af">Categoria</th>' +
      '<th style="padding:8px 12px;text-align:right;color:#16a34a">Receita</th>' +
      '<th style="padding:8px 12px;text-align:right;color:#dc2626">Despesa</th></tr></thead>' +
      '<tbody>' + catHTML + '</tbody></table></div>' +
      '<div style="background:#fff;border:1.5px solid #e5e7eb;border-radius:12px;padding:20px">' +
      '<h3 style="margin:0 0 16px;font-size:1rem;font-weight:700;color:#1a3a1a">🌾 Culturas por Área</h3>' +
      '<table style="width:100%;border-collapse:collapse;font-size:.85rem"><thead>' +
      '<tr style="background:#f9fafb"><th style="padding:8px 12px;text-align:left;font-size:.75rem;text-transform:uppercase;color:#9ca3af">Cultura</th>' +
      '<th style="padding:8px 12px;text-align:right">Área (ha)</th>' +
      '<th style="padding:8px 12px;text-align:right">Safras</th></tr></thead>' +
      '<tbody>' + cultHTML + '</tbody></table></div></div>' +
      '<div style="background:#fff;border:1.5px solid #e5e7eb;border-radius:12px;padding:20px">' +
      '<h3 style="margin:0 0 16px;font-size:1rem;font-weight:700;color:#1a3a1a">🌱 Safras Cadastradas</h3>' +
      '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.85rem"><thead>' +
      '<tr style="background:#f9fafb">' +
      '<th style="padding:8px 12px;text-align:left;font-size:.75rem;text-transform:uppercase;color:#9ca3af">Safra</th>' +
      '<th style="padding:8px 12px;text-align:left">Fazenda</th>' +
      '<th style="padding:8px 12px;text-align:left">Cultura</th>' +
      '<th style="padding:8px 12px;text-align:right">Área</th>' +
      '<th style="padding:8px 12px;text-align:left">Status</th>' +
      '</tr></thead><tbody>' + safrHTML + '</tbody></table></div></div></div>';

  } catch(e) {
    if (cont) cont.innerHTML = '<div style="padding:40px;text-align:center;color:#dc2626">Erro: ' + e.message + '</div>';
  }
})();

window.module_dashboard = function() {};
window.AdminDashboard = { render: function() {} };
