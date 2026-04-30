// ============================================================
// JA AGRO — Admin Module: Operadores
// admin-operadores.js
// ============================================================
window.module_operadores = async function() {
  const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  let _operadores = [], _fazendas = [], _search = '', _filtroFaz = '';

  async function render() {
    setLoading('mainContent');
    try {
      const [{ data: fazendas }, { data: operadores, error }] = await Promise.all([
        sb.from('fazendas').select('id,nome').eq('ativo',true).order('nome'),
        sb.from('operadores').select('*, fazendas(nome)').eq('ativo',true).order('nome')
      ]);
      if(error) throw error;
      _operadores = operadores || [];
      _fazendas = fazendas || [];
      renderUI();
    } catch(e) {
      document.getElementById('mainContent').innerHTML =
        '<div class="empty-state"><p style="color:var(--danger)">Erro ao carregar operadores: '+esc(e.message)+'</p></div>';
    }
  }

  function renderUI() {
    const fazOpts = '<option value="">Todas as fazendas</option>'+_fazendas.map(function(f){
      return '<option value="'+f.id+'"'+(_filtroFaz===f.id?' selected':'')+'>'+esc(f.nome)+'</option>';
    }).join('');

    document.getElementById('mainContent').innerHTML =
      '<div class="page-header topbar-content">'+
      '<div class="topbar-title"><span>Operadores</span></div>'+
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'+
      '<select class="search-input" id="filtroFazOp" onchange="window._operadores_setFaz(this.value)" style="width:180px">'+fazOpts+'</select>'+
      '<input class="search-input" id="srchOp" placeholder="Buscar operador..." value="'+esc(_search)+'" oninput="window._operadores_search(this.value)" style="width:200px"/>'+
      '<button class="topbar-btn btn-primary" onclick="window._operadores_novo()">+ Novo Operador</button>'+
      '</div></div>'+
      '<div class="stat-row" style="display:flex;gap:12px;flex-wrap:wrap;padding:16px 20px 0">'+
      '<div class="stat-card green"><div class="stat-card-val">'+filtrados().length+'</div><div class="stat-card-lbl">Operadores Ativos</div></div>'+
      '</div>'+
      '<div class="table-wrap" style="margin:16px 20px">'+
      '<table class="data-table"><thead><tr>'+
      '<th>Nome</th><th>Funcao</th><th>Fazenda</th><th>Telefone</th><th>CNH</th><th>Acoes</th>'+
      '</tr></thead><tbody id="operadoresBody">'+
      renderRows()+
      '</tbody></table></div>';
  }

  function filtrados() {
    return _operadores.filter(function(o) {
      const ok1 = !_filtroFaz || o.fazenda_id === _filtroFaz;
      const ok2 = !_search || (o.nome||'').toLowerCase().includes(_search.toLowerCase())
                           || (o.funcao||'').toLowerCase().includes(_search.toLowerCase());
      return ok1 && ok2;
    });
  }

  function renderRows() {
    const vis = filtrados();
    if(!vis.length) return '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:32px">Nenhum operador encontrado</td></tr>';
    return vis.map(function(o) {
      return '<tr>'+
      '<td><strong>'+esc(o.nome)+'</strong></td>'+
      '<td><span class="badge">'+esc(o.funcao||'--')+'</span></td>'+
      '<td>'+esc((o.fazendas&&o.fazendas.nome)||'--')+'</td>'+
      '<td>'+esc(o.telefone||'--')+'</td>'+
      '<td>'+(o.cnh ? '<span class="badge badge-green">'+esc(o.categoria_cnh||'CNH')+'</span>' : '--')+'</td>'+
      '<td>'+
      '<button class="btn-icon" onclick="window._operadores_edit(this)" data-id="'+o.id+'">Editar</button> '+
      '<button class="btn-icon" onclick="window._operadores_del(this)" data-id="'+o.id+'" data-nome="'+esc(o.nome)+'">Excluir</button>'+
      '</td></tr>';
    }).join('');
  }

  window._operadores_novo = function() { abrirForm(null); };
  window._operadores_edit = function(btn) { var id = btn.dataset.id; abrirForm(_operadores.find(function(o){return o.id===id;})); };
  window._operadores_search = function(v) { _search = v; document.getElementById('operadoresBody').innerHTML = renderRows(); };
  window._operadores_setFaz = function(v) { _filtroFaz = v; renderUI(); };

  function abrirForm(o) {
    const isNovo = !o;
    const fazOpts = _fazendas.map(function(f){
      return '<option value="'+f.id+'"'+(o&&o.fazenda_id===f.id?' selected':'')+'>'+esc(f.nome)+'</option>';
    }).join('');
    const funcoes = ['operador','motorista','mecanico','agronomico','supervisor','outro'];
    const funcOpts = funcoes.map(function(f){
      return '<option value="'+f+'"'+(o&&o.funcao===f?' selected':'')+'>'+f+'</option>';
    }).join('');
    const cats = ['A','AB','B','C','D','E'];
    const catOpts = cats.map(function(c){
      return '<option value="'+c+'"'+(o&&o.categoria_cnh===c?' selected':'')+'>'+c+'</option>';
    }).join('');

    showModal(isNovo ? '+ Novo Operador' : 'Editar Operador',
      '<div class="form-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'+
      '<div class="form-field"><label>Nome *</label>'+
      '<input id="op_nome" value="'+esc(o&&o.nome||'')+'" placeholder="Nome completo"/></div>'+
      '<div class="form-field"><label>Funcao *</label>'+
      '<select id="op_funcao"><option value="">Selecione...</option>'+funcOpts+'</select></div>'+
      '<div class="form-field"><label>Fazenda *</label>'+
      '<select id="op_fazenda"><option value="">Selecione...</option>'+fazOpts+'</select></div>'+
      '<div class="form-field"><label>Telefone</label>'+
      '<input id="op_tel" value="'+esc(o&&o.telefone||'')+'" placeholder="(99) 99999-9999"/></div>'+
      '<div class="form-field"><label>CPF</label>'+
      '<input id="op_cpf" value="'+esc(o&&o.cpf||'')+'" placeholder="000.000.000-00"/></div>'+
      '<div class="form-field"><label>CNH</label>'+
      '<input id="op_cnh" value="'+esc(o&&o.cnh||'')+'" placeholder="Numero da CNH"/></div>'+
      '<div class="form-field"><label>Categoria CNH</label>'+
      '<select id="op_cat"><option value="">Sem CNH</option>'+catOpts+'</select></div>'+
      '</div>',
      async function() {
        const nome   = document.getElementById('op_nome').value.trim();
        const funcao = document.getElementById('op_funcao').value;
        const fazId  = document.getElementById('op_fazenda').value;
        const tel    = document.getElementById('op_tel').value.trim() || null;
        const cpf    = document.getElementById('op_cpf').value.trim() || null;
        const cnh    = document.getElementById('op_cnh').value.trim() || null;
        const cat    = document.getElementById('op_cat').value || null;

        if(!nome) { toast('Informe o nome do operador','bad'); return; }
        if(!funcao) { toast('Selecione a funcao','bad'); return; }
        if(!fazId) { toast('Selecione a fazenda','bad'); return; }

        const payload = { nome, funcao, fazenda_id: fazId, telefone: tel, cpf, cnh, categoria_cnh: cat };
        const { error } = isNovo
          ? await sb.from('operadores').insert({ ...payload, ativo: true })
          : await sb.from('operadores').update(payload).eq('id', o.id);
        if(error) { toast('Erro: '+error.message,'bad'); return; }
        toast(isNovo ? 'Operador cadastrado!' : 'Operador atualizado!','ok');
        closeModal(); render();
      }
    );
    setTimeout(function(){ var el = document.getElementById('op_nome'); if(el) el.focus(); }, 100);
  }

  window._operadores_del = function(btn) {
    var id = btn.dataset.id;
    var nome = btn.dataset.nome;
    showConfirm('Excluir operador <strong>'+esc(nome)+'</strong>?',
      async function() {
        const { error } = await sb.from('operadores').update({ ativo: false }).eq('id', id);
        if(error) { toast('Erro: '+error.message,'bad'); return; }
        toast('Operador removido','ok'); render();
      }
    );
  };

  render();
};
