// ============================================================
// JA AGRO — Admin Module: Insumos
// admin-insumos.js
// ============================================================
window.module_insumos = async function() {
  const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const fmt = n => n != null ? Number(n).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}) : '--';

  let _insumos = [], _search = '', _filtroTipo = '';

  async function render() {
    setLoading('mainContent');
    try {
      const { data, error } = await sb.from('insumos').select('*').eq('ativo',true).order('nome');
      if(error) throw error;
      _insumos = data || [];
      renderUI();
    } catch(e) {
      document.getElementById('mainContent').innerHTML =
        '<div class="empty-state"><p style="color:var(--danger)">Erro ao carregar insumos: '+esc(e.message)+'</p></div>';
    }
  }

  function renderUI() {
    const stats = calcStats();
    const tipos = ['','herbicida','fungicida','inseticida','fertilizante','semente','adjuvante','outro'];
    const tipoOpts = tipos.map(function(t){
      return '<option value="'+t+'"'+(_filtroTipo===t?' selected':'')+'>'+( t||'Todos os tipos')+'</option>';
    }).join('');

    document.getElementById('mainContent').innerHTML =
      '<div class="page-header topbar-content">'+
      '<div class="topbar-title"><span>Insumos</span></div>'+
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'+
      '<select class="search-input" id="filtroTipo" onchange="window._insumos_setTipo(this.value)" style="width:180px">'+
      tipoOpts+
      '</select>'+
      '<input class="search-input" id="srchIns" placeholder="Buscar insumo..." value="'+esc(_search)+'" oninput="window._insumos_search(this.value)" style="width:200px"/>'+
      '<button class="topbar-btn btn-primary" onclick="window._insumos_novo()">+ Novo Insumo</button>'+
      '</div></div>'+
      '<div class="stat-row" style="display:flex;gap:12px;flex-wrap:wrap;padding:16px 20px 0">'+
      '<div class="stat-card green"><div class="stat-card-val">'+stats.total+'</div><div class="stat-card-lbl">Total Insumos</div></div>'+
      '<div class="stat-card orange"><div class="stat-card-val">'+stats.alerta+'</div><div class="stat-card-lbl">Estoque Baixo</div></div>'+
      '</div>'+
      '<div class="table-wrap" style="margin:16px 20px">'+
      '<table class="data-table"><thead><tr>'+
      '<th>Nome</th><th>Tipo</th><th>Unidade</th><th>Estoque</th><th>Estoque Min</th><th>Preco (R$)</th><th>Acoes</th>'+
      '</tr></thead><tbody id="insumosBody">'+
      renderRows()+
      '</tbody></table></div>';
  }

  function calcStats() {
    const vis = filtrados();
    return {
      total: vis.length,
      alerta: vis.filter(function(i){ return i.estoque_min && i.estoque_atual <= i.estoque_min; }).length
    };
  }

  function filtrados() {
    return _insumos.filter(function(i) {
      const ok1 = !_filtroTipo || i.tipo === _filtroTipo;
      const ok2 = !_search || (i.nome||'').toLowerCase().includes(_search.toLowerCase());
      return ok1 && ok2;
    });
  }

  function renderRows() {
    const vis = filtrados();
    if(!vis.length) return '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:32px">Nenhum insumo encontrado</td></tr>';
    return vis.map(function(i) {
      var estAlerta = i.estoque_min && i.estoque_atual <= i.estoque_min;
      return '<tr>'+
      '<td><strong>'+esc(i.nome)+'</strong></td>'+
      '<td><span class="badge">'+esc(i.tipo||'--')+'</span></td>'+
      '<td>'+esc(i.unidade||'--')+'</td>'+
      '<td style="'+(estAlerta?'color:var(--danger);font-weight:600':'')+'">'+fmt(i.estoque_atual)+'</td>'+
      '<td>'+fmt(i.estoque_min)+'</td>'+
      '<td>'+fmt(i.preco_unitario)+'</td>'+
      '<td>'+
      '<button class="btn-icon" onclick="window._insumos_edit(this)" data-id="'+i.id+'">Editar</button> '+
      '<button class="btn-icon" onclick="window._insumos_del(this)" data-id="'+i.id+'" data-nome="'+esc(i.nome)+'">Excluir</button>'+
      '</td></tr>';
    }).join('');
  }

  window._insumos_novo = function() { abrirForm(null); };
  window._insumos_edit = function(btn) { var id = btn.dataset.id; abrirForm(_insumos.find(function(i){return i.id===id;})); };
  window._insumos_search = function(v) { _search = v; document.getElementById('insumosBody').innerHTML = renderRows(); };
  window._insumos_setTipo = function(v) { _filtroTipo = v; renderUI(); };

  function abrirForm(ins) {
    const isNovo = !ins;
    const tipos = ['herbicida','fungicida','inseticida','fertilizante','semente','adjuvante','outro'];
    const tipoOpts = tipos.map(function(t){
      return '<option value="'+t+'"'+(ins&&ins.tipo===t?' selected':'')+'>'+t+'</option>';
    }).join('');
    const unidades = ['kg','L','g','mL','sc','un','cx','t'];
    const unidOpts = unidades.map(function(u){
      return '<option value="'+u+'"'+(ins&&ins.unidade===u?' selected':'')+'>'+u+'</option>';
    }).join('');

    showModal(isNovo ? '+ Novo Insumo' : 'Editar Insumo',
      '<div class="form-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'+
      '<div class="form-field" style="grid-column:1/-1"><label>Nome *</label>'+
      '<input id="ins_nome" value="'+esc(ins&&ins.nome||'')+'" placeholder="Ex: Glifosato 480 SL"/></div>'+
      '<div class="form-field"><label>Tipo *</label>'+
      '<select id="ins_tipo"><option value="">Selecione...</option>'+tipoOpts+'</select></div>'+
      '<div class="form-field"><label>Unidade *</label>'+
      '<select id="ins_unidade"><option value="">Selecione...</option>'+unidOpts+'</select></div>'+
      '<div class="form-field"><label>Estoque Atual</label>'+
      '<input id="ins_estoque" type="number" step="0.01" min="0" value="'+(ins&&ins.estoque_atual||0)+'"/></div>'+
      '<div class="form-field"><label>Estoque Minimo</label>'+
      '<input id="ins_estoque_min" type="number" step="0.01" min="0" value="'+(ins&&ins.estoque_min||0)+'"/></div>'+
      '<div class="form-field"><label>Preco Unitario (R$)</label>'+
      '<input id="ins_preco" type="number" step="0.01" min="0" value="'+(ins&&ins.preco_unitario||0)+'"/></div>'+
      '<div class="form-field" style="grid-column:1/-1"><label>Fabricante</label>'+
      '<input id="ins_fab" value="'+esc(ins&&ins.fabricante||'')+'" placeholder="Ex: Bayer, Syngenta..."/></div>'+
      '</div>',
      async function() {
        const nome   = document.getElementById('ins_nome').value.trim();
        const tipo   = document.getElementById('ins_tipo').value;
        const unid   = document.getElementById('ins_unidade').value;
        const est    = parseFloat(document.getElementById('ins_estoque').value) || 0;
        const estMin = parseFloat(document.getElementById('ins_estoque_min').value) || 0;
        const preco  = parseFloat(document.getElementById('ins_preco').value) || null;
        const fab    = document.getElementById('ins_fab').value.trim() || null;

        if(!nome) { toast('Informe o nome do insumo','bad'); return; }
        if(!tipo) { toast('Selecione o tipo','bad'); return; }
        if(!unid) { toast('Selecione a unidade','bad'); return; }

        const payload = { nome, tipo, unidade: unid, estoque_atual: est, estoque_min: estMin, preco_unitario: preco, fabricante: fab };
        const { error } = isNovo
          ? await sb.from('insumos').insert({ ...payload, ativo: true })
          : await sb.from('insumos').update(payload).eq('id', ins.id);
        if(error) { toast('Erro: '+error.message,'bad'); return; }
        toast(isNovo ? 'Insumo cadastrado!' : 'Insumo atualizado!','ok');
        closeModal(); render();
      }
    );
    setTimeout(function(){ var el = document.getElementById('ins_nome'); if(el) el.focus(); }, 100);
  }

  window._insumos_del = function(btn) {
    var id = btn.dataset.id;
    var nome = btn.dataset.nome;
    showConfirm('Excluir insumo <strong>'+esc(nome)+'</strong>?',
      async function() {
        const { error } = await sb.from('insumos').update({ ativo: false }).eq('id', id);
        if(error) { toast('Erro: '+error.message,'bad'); return; }
        toast('Insumo removido','ok'); render();
      }
    );
  };

  render();
};
