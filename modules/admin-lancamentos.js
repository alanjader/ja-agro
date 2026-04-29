// ============================================================
// JA AGRO — Admin Module: Lancamentos
// admin-lancamentos.js
// ============================================================
window.module_lancamentos = async function() {
  const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const fmt = n => n != null ? Number(n).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}) : '--';
  const fmtDate = d => d ? new Date(d+'T00:00:00').toLocaleDateString('pt-BR') : '--';

  let _lancamentos = [], _fazendas = [], _safras = [], _talhoes = [], _operadores = [];
  let _search = '', _filtroFaz = '', _filtroTipo = '', _filtroSafra = '';

  async function render() {
    setLoading('mainContent');
    try {
      const [
        { data: fazendas },
        { data: safras },
        { data: talhoes },
        { data: operadores },
        { data: lancamentos, error }
      ] = await Promise.all([
        sb.from('fazendas').select('id,nome').eq('ativo',true).order('nome'),
        sb.from('safras').select('id,nome,fazenda_id').order('nome'),
        sb.from('talhoes').select('id,nome,fazenda_id').eq('ativo',true).order('nome'),
        sb.from('operadores').select('id,nome').eq('ativo',true).order('nome'),
        sb.from('lancamentos').select('*, fazendas(nome), safras(nome), talhoes(nome), operadores(nome)', { count: 'exact' })
          .order('data', { ascending: false }).order('criado_em', { ascending: false }).limit(500)
      ]);
      if(error) throw error;
      _fazendas = fazendas || [];
      _safras = safras || [];
      _talhoes = talhoes || [];
      _operadores = operadores || [];
      _lancamentos = lancamentos || [];
      renderUI();
    } catch(e) {
      document.getElementById('mainContent').innerHTML =
        '<div class="empty-state"><p style="color:var(--danger)">Erro ao carregar lancamentos: '+esc(e.message)+'</p></div>';
    }
  }

  function renderUI() {
    const vis = filtrados();
    const stats = calcStats(vis);
    const fazOpts = '<option value="">Todas as fazendas</option>'+_fazendas.map(function(f){
      return '<option value="'+f.id+'"'+(_filtroFaz===f.id?' selected':'')+'>'+esc(f.nome)+'</option>';
    }).join('');
    const safraOpts = '<option value="">Todas as safras</option>'+_safras.map(function(s){
      return '<option value="'+s.id+'"'+(_filtroSafra===s.id?' selected':'')+'>'+esc(s.nome)+'</option>';
    }).join('');

    document.getElementById('mainContent').innerHTML =
      '<div class="page-header topbar-content">'+
      '<div class="topbar-title"><span>Lancamentos</span></div>'+
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'+
      '<select class="search-input" id="filtFazLanc" onchange="window._lanc_setFaz(this.value)" style="width:160px">'+fazOpts+'</select>'+
      '<select class="search-input" id="filtSafraLanc" onchange="window._lanc_setSafra(this.value)" style="width:160px">'+safraOpts+'</select>'+
      '<select class="search-input" id="filtTipoLanc" onchange="window._lanc_setTipo(this.value)" style="width:130px">'+
      '<option value="">Todos os tipos</option>'+
      '<option value="custo"'+(_filtroTipo==='custo'?' selected':'')+'>Custo</option>'+
      '<option value="receita"'+(_filtroTipo==='receita'?' selected':'')+'>Receita</option>'+
      '</select>'+
      '<input class="search-input" id="srchLanc" placeholder="Buscar..." value="'+esc(_search)+'" oninput="window._lanc_search(this.value)" style="width:160px"/>'+
      '<button class="topbar-btn btn-primary" onclick="window._lanc_novo()">+ Novo Lancamento</button>'+
      '</div></div>'+
      '<div class="stat-row" style="display:flex;gap:12px;flex-wrap:wrap;padding:16px 20px 0">'+
      '<div class="stat-card green"><div class="stat-card-val">'+vis.length+'</div><div class="stat-card-lbl">Lancamentos</div></div>'+
      '<div class="stat-card blue"><div class="stat-card-val">R$ '+fmt(stats.receitas)+'</div><div class="stat-card-lbl">Total Receitas</div></div>'+
      '<div class="stat-card red" style="border-top-color:var(--danger,#dc2626)"><div class="stat-card-val" style="color:var(--danger,#dc2626)">R$ '+fmt(stats.custos)+'</div><div class="stat-card-lbl">Total Custos</div></div>'+
      '<div class="stat-card purple"><div class="stat-card-val">R$ '+fmt(stats.saldo)+'</div><div class="stat-card-lbl">Saldo</div></div>'+
      '</div>'+
      '<div class="table-wrap" style="margin:16px 20px">'+
      '<table class="data-table"><thead><tr>'+
      '<th>Data</th><th>Tipo</th><th>Categoria</th><th>Descricao</th><th>Fazenda</th><th>Safra</th><th>Valor (R$)</th><th>Acoes</th>'+
      '</tr></thead><tbody id="lancBody">'+
      renderRows(vis)+
      '</tbody></table></div>';
  }

  function calcStats(vis) {
    var receitas = 0, custos = 0;
    vis.forEach(function(l) {
      if(l.tipo==='receita') receitas += Number(l.valor||0);
      else custos += Number(l.valor||0);
    });
    return { receitas, custos, saldo: receitas - custos };
  }

  function filtrados() {
    return _lancamentos.filter(function(l) {
      const ok1 = !_filtroFaz || l.fazenda_id === _filtroFaz;
      const ok2 = !_filtroTipo || l.tipo === _filtroTipo;
      const ok3 = !_filtroSafra || l.safra_id === _filtroSafra;
      const ok4 = !_search || (l.descricao||'').toLowerCase().includes(_search.toLowerCase())
                           || (l.categoria||'').toLowerCase().includes(_search.toLowerCase());
      return ok1 && ok2 && ok3 && ok4;
    });
  }

  function renderRows(vis) {
    if(!vis.length) return '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:32px">Nenhum lancamento encontrado</td></tr>';
    return vis.map(function(l) {
      const isCusto = l.tipo === 'custo';
      return '<tr>'+
      '<td>'+fmtDate(l.data)+'</td>'+
      '<td>'+(isCusto ? '<span class="badge" style="background:#fee2e2;color:#991b1b">Custo</span>' : '<span class="badge badge-green">Receita</span>')+'</td>'+
      '<td>'+esc(l.categoria||'--')+'</td>'+
      '<td>'+esc(l.descricao||'--')+'</td>'+
      '<td style="font-size:12px">'+esc((l.fazendas&&l.fazendas.nome)||'--')+'</td>'+
      '<td style="font-size:12px">'+esc((l.safras&&l.safras.nome)||'--')+'</td>'+
      '<td style="font-weight:600;color:'+(isCusto?'var(--danger,#dc2626)':'var(--green)')+'">'+fmt(l.valor)+'</td>'+
      '<td>'+
      '<button class="btn-icon" onclick="window._lanc_edit(this)" data-id="'+l.id+'">Editar</button> '+
      '<button class="btn-icon" onclick="window._lanc_del(this)" data-id="'+l.id+'">Excluir</button>'+
      '</td></tr>';
    }).join('');
  }

  window._lanc_novo = function() { abrirForm(null); };
  window._lanc_edit = function(btn) { var id = btn.dataset.id; abrirForm(_lancamentos.find(function(l){return l.id===id;})); };
  window._lanc_search = function(v) { _search = v; document.getElementById('lancBody').innerHTML = renderRows(filtrados()); };
  window._lanc_setFaz = function(v) { _filtroFaz = v; renderUI(); };
  window._lanc_setTipo = function(v) { _filtroTipo = v; renderUI(); };
  window._lanc_setSafra = function(v) { _filtroSafra = v; renderUI(); };

  function categoriasPorTipo(tipo) {
    if(tipo==='custo') return ['insumos','combustivel','manutencao','mao_de_obra','arrendamento','sementes','servicos','outros'];
    return ['venda_producao','subsidio','servico_prestado','outros'];
  }

  function abrirForm(l) {
    const isNovo = !l;
    const tipoAtual = l ? l.tipo : 'custo';
    const fazOpts = _fazendas.map(function(f){
      return '<option value="'+f.id+'"'+(l&&l.fazenda_id===f.id?' selected':'')+'>'+esc(f.nome)+'</option>';
    }).join('');
    const safraOpts = _safras.map(function(s){
      return '<option value="'+s.id+'"'+(l&&l.safra_id===s.id?' selected':'')+'>'+esc(s.nome)+'</option>';
    }).join('');
    const talhaoOpts = _talhoes.map(function(t){
      return '<option value="'+t.id+'"'+(l&&l.talhao_id===t.id?' selected':'')+'>'+esc(t.nome)+'</option>';
    }).join('');
    const opOpts = _operadores.map(function(o){
      return '<option value="'+o.id+'"'+(l&&l.operador_id===o.id?' selected':'')+'>'+esc(o.nome)+'</option>';
    }).join('');
    var cats = categoriasPorTipo(tipoAtual);
    var catOpts = cats.map(function(c){ return '<option value="'+c+'"'+(l&&l.categoria===c?' selected':'')+'>'+c+'</option>'; }).join('');

    showModal(isNovo ? '+ Novo Lancamento' : 'Editar Lancamento',
      '<div class="form-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'+
      '<div class="form-field"><label>Tipo *</label>'+
      '<select id="lanc_tipo" onchange="window._lanc_updCats(this.value)">'+
      '<option value="custo"'+(tipoAtual==='custo'?' selected':'')+'>Custo</option>'+
      '<option value="receita"'+(tipoAtual==='receita'?' selected':'')+'>Receita</option>'+
      '</select></div>'+
      '<div class="form-field"><label>Categoria *</label>'+
      '<select id="lanc_cat">'+catOpts+'</select></div>'+
      '<div class="form-field"><label>Data *</label>'+
      '<input id="lanc_data" type="date" value="'+(l&&l.data||new Date().toISOString().slice(0,10))+'"/></div>'+
      '<div class="form-field"><label>Valor (R$) *</label>'+
      '<input id="lanc_valor" type="number" step="0.01" min="0" value="'+(l&&l.valor||'')+'"/></div>'+
      '<div class="form-field"><label>Fazenda *</label>'+
      '<select id="lanc_faz"><option value="">Selecione...</option>'+fazOpts+'</select></div>'+
      '<div class="form-field"><label>Safra</label>'+
      '<select id="lanc_safra"><option value="">Nenhuma</option>'+safraOpts+'</select></div>'+
      '<div class="form-field"><label>Talhao</label>'+
      '<select id="lanc_talhao"><option value="">Nenhum</option>'+talhaoOpts+'</select></div>'+
      '<div class="form-field"><label>Operador</label>'+
      '<select id="lanc_op"><option value="">Nenhum</option>'+opOpts+'</select></div>'+
      '<div class="form-field" style="grid-column:1/-1"><label>Descricao</label>'+
      '<input id="lanc_desc" value="'+esc(l&&l.descricao||'')+'" placeholder="Descricao do lancamento"/></div>'+
      '<div class="form-field" style="grid-column:1/-1"><label>Observacoes</label>'+
      '<textarea id="lanc_obs" rows="2" style="width:100%;resize:vertical;padding:8px;border:1px solid var(--brd);border-radius:var(--r)">'+esc(l&&l.observacoes||'')+'</textarea></div>'+
      '</div>',
      async function() {
        const tipo  = document.getElementById('lanc_tipo').value;
        const cat   = document.getElementById('lanc_cat').value;
        const data  = document.getElementById('lanc_data').value;
        const valor = parseFloat(document.getElementById('lanc_valor').value);
        const fazId = document.getElementById('lanc_faz').value;
        const safId = document.getElementById('lanc_safra').value || null;
        const talId = document.getElementById('lanc_talhao').value || null;
        const opId  = document.getElementById('lanc_op').value || null;
        const desc  = document.getElementById('lanc_desc').value.trim() || null;
        const obs   = document.getElementById('lanc_obs').value.trim() || null;

        if(!data) { toast('Informe a data','bad'); return; }
        if(!valor || valor <= 0) { toast('Informe o valor','bad'); return; }
        if(!fazId) { toast('Selecione a fazenda','bad'); return; }
        if(!cat) { toast('Selecione a categoria','bad'); return; }

        const payload = { tipo, categoria: cat, data, valor, fazenda_id: fazId, safra_id: safId, talhao_id: talId, operador_id: opId, descricao: desc, observacoes: obs };
        const { error } = isNovo
          ? await sb.from('lancamentos').insert(payload)
          : await sb.from('lancamentos').update(payload).eq('id', l.id);
        if(error) { toast('Erro: '+error.message,'bad'); return; }
        toast(isNovo ? 'Lancamento registrado!' : 'Lancamento atualizado!','ok');
        closeModal(); render();
      }
    );
    setTimeout(function(){ var el = document.getElementById('lanc_data'); if(el) el.focus(); }, 100);
  }

  window._lanc_updCats = function(tipo) {
    var cats = categoriasPorTipo(tipo);
    var el = document.getElementById('lanc_cat');
    if(el) el.innerHTML = cats.map(function(c){ return '<option value="'+c+'">'+c+'</option>'; }).join('');
  };

  window._lanc_del = function(btn) {
    var id = btn.dataset.id;
    showConfirm('Excluir este lancamento?',
      async function() {
        const { error } = await sb.from('lancamentos').delete().eq('id', id);
        if(error) { toast('Erro: '+error.message,'bad'); return; }
        toast('Lancamento removido','ok'); render();
      }
    );
  };

  render();
};
