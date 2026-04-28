// ============================================================
// JA AGRO — Admin Module: Insumos
// admin-insumos.js
// ============================================================
window.module_insumos = async function() {
  const esc  = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const fmt  = n => n!=null ? Number(n).toLocaleString('pt-BR',{minimumFractionDigits:3,maximumFractionDigits:3}) : '—';
  const fmtR = n => n!=null ? 'R$ '+Number(n).toLocaleString('pt-BR',{minimumFractionDigits:2}) : '—';

  let _insumos=[], _fazendas=[], _search='', _catFiltro='', _fazFiltro='';

  const CATEGORIAS = ['Sementes','Fertilizantes','Defensivos','Combustível','Lubrificantes','Outros'];

  async function render() {
    setLoading('mainContent');
    try {
      const [{ data: fazendas }, { data: insumos, error }] = await Promise.all([
        sb.from('fazendas').select('id,nome').eq('ativo',true).order('nome'),
        sb.from('insumos').select('*, fazendas(nome)').eq('ativo',true).order('nome')
      ]);
      if(error) throw error;
      _insumos = insumos||[];
      _fazendas = fazendas||[];
      renderUI();
    } catch(e) {
      document.getElementById('mainContent').innerHTML =
        '<div class="empty-state"><p style="color:var(--danger)">Erro: '+esc(e.message)+'</p></div>';
    }
  }

  function renderUI() {
    const stats = calcStats();
    const catOpts = CATEGORIAS.map(c=>'<option value="'+c+'"'+(c===_catFiltro?' selected':'')+'>'+c+'</option>').join('');
    document.getElementById('mainContent').innerHTML =
      '<div class="page-header topbar-content">'+
      '<div class="topbar-title"><span>🧪 Insumos</span></div>'+
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'+
      '<select class="search-input" id="fazFiltroI" onchange="window._ins_setFaz(this.value)" style="width:155px">'+
      '<option value="">Todas fazendas</option>'+
      _fazendas.map(f=>'<option value="'+f.id+'"'+(f.id===_fazFiltro?' selected':'')+'>'+esc(f.nome)+'</option>').join('')+
      '</select>'+
      '<select class="search-input" id="catFiltro" onchange="window._ins_setCat(this.value)" style="width:145px">'+
      '<option value="">Todas categorias</option>'+catOpts+
      '</select>'+
      '<input class="search-input" placeholder="🔍 Buscar insumo..." value="'+esc(_search)+'" oninput="window._ins_search(this.value)" style="width:190px"/>'+
      '<button class="topbar-btn btn-primary" onclick="window._ins_novo()">+ Novo Insumo</button>'+
      '</div></div>'+

      '<div style="display:flex;gap:12px;flex-wrap:wrap;padding:16px 20px 0">'+
      '<div class="stat-card green"><div class="stat-card-val">'+stats.total+'</div><div class="stat-card-lbl">Insumos Ativos</div></div>'+
      '<div class="stat-card orange"><div class="stat-card-val">'+stats.baixoEstoque+'</div><div class="stat-card-lbl">Estoque Crítico</div></div>'+
      '<div class="stat-card blue"><div class="stat-card-val">'+fmtR(stats.valorEstoque)+'</div><div class="stat-card-lbl">Valor em Estoque</div></div>'+
      '</div>'+

      '<div class="table-wrap" style="margin:16px 20px">'+
      '<table class="data-table"><thead><tr>'+
      '<th>Nome</th><th>Categoria</th><th>Fazenda</th><th>Estoque</th><th>Mínimo</th><th>Preço Unit.</th><th>Valor Total</th><th>Status</th><th>Ações</th>'+
      '</tr></thead><tbody id="insumosBody">'+
      renderRows()+
      '</tbody></table></div>';
  }

  function calcStats() {
    const vis = filtrados();
    return {
      total: vis.length,
      baixoEstoque: vis.filter(i=>i.estoque_atual<=i.estoque_minimo).length,
      valorEstoque: vis.reduce((s,i)=>s+((i.estoque_atual||0)*(i.preco_unitario||0)),0)
    };
  }

  function filtrados() {
    return _insumos.filter(i=>{
      const ok1 = !_fazFiltro || i.fazenda_id===_fazFiltro;
      const ok2 = !_catFiltro || i.categoria===_catFiltro;
      const ok3 = !_search || (i.nome||'').toLowerCase().includes(_search.toLowerCase())
                           || (i.fabricante||'').toLowerCase().includes(_search.toLowerCase());
      return ok1&&ok2&&ok3;
    });
  }

  function renderRows() {
    const vis = filtrados();
    if(!vis.length) return '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:32px">📋 Nenhum insumo encontrado</td></tr>';
    return vis.map(i=>{
      const baixo = (i.estoque_atual||0)<=(i.estoque_minimo||0);
      const valorTotal = ((i.estoque_atual||0)*(i.preco_unitario||0));
      return '<tr>'+
        '<td><strong>'+esc(i.nome)+'</strong>'+(i.principio_ativo?'<br><small style="color:var(--muted)">'+esc(i.principio_ativo)+'</small>':'')+'</td>'+
        '<td><span class="badge">'+esc(i.categoria||'—')+'</span></td>'+
        '<td style="color:var(--muted)">'+esc(i.fazendas?.nome||'—')+'</td>'+
        '<td><strong style="color:'+(baixo?'var(--danger)':'inherit')+'">'+fmt(i.estoque_atual)+' '+esc(i.unidade)+'</strong></td>'+
        '<td style="color:var(--muted)">'+fmt(i.estoque_minimo)+' '+esc(i.unidade)+'</td>'+
        '<td>'+fmtR(i.preco_unitario)+'</td>'+
        '<td>'+fmtR(valorTotal)+'</td>'+
        '<td>'+(baixo?'<span class="badge badge-red">⚠️ Crítico</span>':'<span class="badge badge-green">✅ OK</span>')+'</td>'+
        '<td>'+
        '<button class="btn-icon" title="Editar" onclick="window._ins_edit(''+i.id+'')">✏️</button> '+
        '<button class="btn-icon" title="Ajustar estoque" onclick="window._ins_estoque(''+i.id+'',''+esc(i.nome)+'','+i.estoque_atual+',''+esc(i.unidade)+'')">📦</button> '+
        '<button class="btn-icon" title="Excluir" onclick="window._ins_del(''+i.id+'',''+esc(i.nome)+'')">🗑️</button>'+
        '</td></tr>';
    }).join('');
  }

  window._ins_search = v=>{ _search=v; document.getElementById('insumosBody').innerHTML=renderRows(); };
  window._ins_setFaz = v=>{ _fazFiltro=v; renderUI(); };
  window._ins_setCat = v=>{ _catFiltro=v; renderUI(); };
  window._ins_novo   = ()=>abrirForm(null);
  window._ins_edit   = id=>abrirForm(_insumos.find(i=>i.id===id));

  function abrirForm(ins) {
    const isNovo = !ins;
    const fazOpts = _fazendas.map(f=>'<option value="'+f.id+'"'+(ins?.fazenda_id===f.id?' selected':'')+'>'+esc(f.nome)+'</option>').join('');
    const catOpts = CATEGORIAS.map(c=>'<option value="'+c+'"'+(ins?.categoria===c?' selected':'')+'>'+c+'</option>').join('');
    const unOpts  = JA.app.unidadesPadrao.map(u=>'<option value="'+u+'"'+(ins?.unidade===u?' selected':'')+'>'+u+'</option>').join('');

    showModal(isNovo?'+ Novo Insumo':'Editar Insumo',
      '<div class="form-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'+
      '<div class="form-field" style="grid-column:1/-1"><label>Nome do Insumo *</label>'+
      '<input id="ins_nome" value="'+esc(ins?.nome||'')+'" placeholder="Ex: Herbicida Glifosato 480"/></div>'+
      '<div class="form-field"><label>Fazenda</label>'+
      '<select id="ins_fazenda"><option value="">Sem fazenda específica</option>'+fazOpts+'</select></div>'+
      '<div class="form-field"><label>Categoria</label>'+
      '<select id="ins_cat"><option value="">Selecione...</option>'+catOpts+'</select></div>'+
      '<div class="form-field"><label>Unidade *</label>'+
      '<select id="ins_un">'+unOpts+'</select></div>'+
      '<div class="form-field"><label>Princípio Ativo</label>'+
      '<input id="ins_pa" value="'+esc(ins?.principio_ativo||'')+'" placeholder="Ex: Glifosato 480 g/L"/></div>'+
      '<div class="form-field"><label>Fabricante</label>'+
      '<input id="ins_fab" value="'+esc(ins?.fabricante||'')+'"/></div>'+
      '<div class="form-field"><label>Registro MAPA</label>'+
      '<input id="ins_mapa" value="'+esc(ins?.registro_mapa||'')+'"/></div>'+
      '<div class="form-field"><label>Estoque Atual</label>'+
      '<input id="ins_est" type="number" step="0.001" min="0" value="'+esc(ins?.estoque_atual||0)+'"/></div>'+
      '<div class="form-field"><label>Estoque Mínimo</label>'+
      '<input id="ins_min" type="number" step="0.001" min="0" value="'+esc(ins?.estoque_minimo||0)+'"/></div>'+
      '<div class="form-field"><label>Preço Unitário (R$)</label>'+
      '<input id="ins_preco" type="number" step="0.0001" min="0" value="'+esc(ins?.preco_unitario||'')+'"/></div>'+
      '</div>',
      async function(){
        const nome   = document.getElementById('ins_nome').value.trim();
        const fazId  = document.getElementById('ins_fazenda').value||null;
        const cat    = document.getElementById('ins_cat').value||null;
        const un     = document.getElementById('ins_un').value;
        const pa     = document.getElementById('ins_pa').value.trim()||null;
        const fab    = document.getElementById('ins_fab').value.trim()||null;
        const mapa   = document.getElementById('ins_mapa').value.trim()||null;
        const est    = parseFloat(document.getElementById('ins_est').value)||0;
        const min    = parseFloat(document.getElementById('ins_min').value)||0;
        const preco  = parseFloat(document.getElementById('ins_preco').value)||null;
        if(!nome){ toast('Informe o nome','bad'); return; }
        const payload={ nome, fazenda_id:fazId, categoria:cat, unidade:un, principio_ativo:pa, fabricante:fab, registro_mapa:mapa, estoque_atual:est, estoque_minimo:min, preco_unitario:preco };
        const { error } = isNovo
          ? await sb.from('insumos').insert({ ...payload, ativo:true })
          : await sb.from('insumos').update(payload).eq('id',ins.id);
        if(error){ toast('Erro: '+error.message,'bad'); return; }
        toast(isNovo?'Insumo cadastrado!':'Insumo atualizado!','ok');
        closeModal(); render();
      }
    );
    setTimeout(()=>document.getElementById('ins_nome')?.focus(),100);
  }

  window._ins_estoque = function(id, nome, atual, unidade) {
    showModal('📦 Ajustar Estoque — '+esc(nome),
      '<div style="margin-bottom:12px"><strong>Estoque atual:</strong> '+fmt(atual)+' '+esc(unidade)+'</div>'+
      '<div class="form-field"><label>Tipo de Ajuste</label>'+
      '<select id="adj_tipo"><option value="entrada">➕ Entrada (compra/recebimento)</option><option value="saida">➖ Saída (uso/perda)</option><option value="acerto">🔄 Acerto de Inventário</option></select></div>'+
      '<div class="form-field"><label>Quantidade ('+esc(unidade)+')</label>'+
      '<input id="adj_qtd" type="number" step="0.001" min="0" placeholder="0,000"/></div>'+
      '<div class="form-field"><label>Observação</label>'+
      '<input id="adj_obs" placeholder="Motivo do ajuste..."/></div>',
      async function(){
        const tipo = document.getElementById('adj_tipo').value;
        const qtd  = parseFloat(document.getElementById('adj_qtd').value)||0;
        if(!qtd){ toast('Informe a quantidade','bad'); return; }
        let novoEstoque = atual;
feat: módulo Insumos — estoque, categorias, alertas de estoque crítico        else if(tipo==='saida') novoEstoque = Math.max(0, atual - qtd);
        else novoEstoque = qtd;
        const { error } = await sb.from('insumos').update({ estoque_atual:novoEstoque }).eq('id',id);
        if(error){ toast('Erro: '+error.message,'bad'); return; }
        toast('Estoque atualizado!','ok'); closeModal(); render();
      }
    );
    setTimeout(()=>document.getElementById('adj_qtd')?.focus(),100);
  };

  window._ins_del = function(id, nome) {
    showConfirm('Excluir insumo <strong>'+esc(nome)+'</strong>?',
      async function(){
        const { error } = await sb.from('insumos').update({ ativo:false }).eq('id',id);
        if(error){ toast('Erro: '+error.message,'bad'); return; }
        toast('Insumo removido','ok'); render();
      }
    );
  };

  render();
};
