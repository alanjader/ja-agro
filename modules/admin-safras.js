// ============================================================
// JA AGRO — Admin Module: Safras
// admin-safras.js
// ============================================================
window.module_safras = async function() {
  const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const fmt  = n => n!=null ? Number(n).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}) : '—';
  const fmtR = n => n!=null ? 'R$ '+Number(n).toLocaleString('pt-BR',{minimumFractionDigits:2}) : '—';
  const fmtD = d => d ? new Date(d+'T00:00:00').toLocaleDateString('pt-BR') : '—';

  let _safras=[], _fazendas=[], _search='', _statusFiltro='', _fazFiltro='';

  const STATUS_LABELS = {
    planejamento:'🗓️ Planejamento',
    aberta:      '🌱 Aberta',
    encerrada:   '✅ Encerrada',
    cancelada:   '❌ Cancelada'
  };
  const STATUS_COLORS = {
    planejamento:'badge-yellow', aberta:'badge-green', encerrada:'badge-blue', cancelada:'badge-red'
  };

  async function render() {
    setLoading('mainContent');
    try {
      const [{ data: fazendas }, { data: safras, error }] = await Promise.all([
        sb.from('fazendas').select('id,nome').eq('ativo',true).order('nome'),
        sb.from('safras').select('*, fazendas(nome)', { count:'exact' }).order('criado_em',{ascending:false})
      ]);
      if(error) throw error;
      _safras = safras||[];
      _fazendas = fazendas||[];
      renderUI();
    } catch(e) {
      document.getElementById('mainContent').innerHTML =
        '<div class="empty-state"><p style="color:var(--danger)">Erro: '+esc(e.message)+'</p></div>';
    }
  }

  function renderUI() {
    const stats = calcStats();
    document.getElementById('mainContent').innerHTML =
      '<div class="page-header topbar-content">'+
      '<div class="topbar-title"><span>📅 Safras</span></div>'+
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'+
      '<select class="search-input" id="fazFiltroS" onchange="window._safras_setFaz(this.value)" style="width:160px">'+
      '<option value="">Todas fazendas</option>'+
      _fazendas.map(f=>'<option value="'+f.id+'"'+(f.id===_fazFiltro?' selected':'')+'>'+esc(f.nome)+'</option>').join('')+
      '</select>'+
      '<select class="search-input" id="statusFiltro" onchange="window._safras_setStatus(this.value)" style="width:160px">'+
      '<option value="">Todos status</option>'+
      Object.entries(STATUS_LABELS).map(([k,v])=>'<option value="'+k+'"'+(k===_statusFiltro?' selected':'')+'>'+v+'</option>').join('')+
      '</select>'+
      '<input class="search-input" placeholder="🔍 Buscar safra..." value="'+esc(_search)+'" oninput="window._safras_search(this.value)" style="width:190px"/>'+
      '<button class="topbar-btn btn-primary" onclick="window._safras_novo()">+ Nova Safra</button>'+
      '</div></div>'+

      '<div style="display:flex;gap:12px;flex-wrap:wrap;padding:16px 20px 0">'+
      '<div class="stat-card green"><div class="stat-card-val">'+stats.abertas+'</div><div class="stat-card-lbl">Safras Abertas</div></div>'+
      '<div class="stat-card blue"><div class="stat-card-val">'+fmt(stats.areaTotal)+' ha</div><div class="stat-card-lbl">Área em Produção</div></div>'+
      '<div class="stat-card orange"><div class="stat-card-val">'+fmtR(stats.custoTotal)+'</div><div class="stat-card-lbl">Custo Total (abertas)</div></div>'+
      '<div class="stat-card purple"><div class="stat-card-val">'+fmtR(stats.margem)+'</div><div class="stat-card-lbl">Resultado (abertas)</div></div>'+
      '</div>'+

      '<div class="cards-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;padding:16px 20px" id="safrasBody">'+
      renderCards()+
      '</div>';
  }

  function calcStats() {
    const abertas = _safras.filter(s=>s.status==='aberta');
    return {
      abertas: abertas.length,
      areaTotal: abertas.reduce((s,x)=>s+(x.area_ha||0),0),
      custoTotal: abertas.reduce((s,x)=>s+(x.custo_total||0),0),
      margem: abertas.reduce((s,x)=>s+(x.receita_total||0)-(x.custo_total||0),0)
    };
  }

  function filtrados() {
    return _safras.filter(s=>{
      const ok1 = !_fazFiltro || s.fazenda_id===_fazFiltro;
      const ok2 = !_statusFiltro || s.status===_statusFiltro;
      const ok3 = !_search || (s.nome||'').toLowerCase().includes(_search.toLowerCase())
                           || (s.cultura||'').toLowerCase().includes(_search.toLowerCase());
      return ok1&&ok2&&ok3;
    });
  }

  function renderCards() {
    const vis = filtrados();
    if(!vis.length) return '<div style="grid-column:1/-1;text-align:center;color:var(--muted);padding:48px">'+
      '📋 Nenhuma safra encontrada</div>';

    return vis.map(s => {
      const margem = (s.receita_total||0) - (s.custo_total||0);
      const margemCor = margem >= 0 ? 'var(--success)' : 'var(--danger)';
      const pct = s.area_ha > 0 && s.producao_sc ? (s.producao_sc/s.area_ha).toFixed(1)+' sc/ha' : '—';
      return '<div class="stat-card" style="cursor:default;padding:16px">'+
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">'+
        '<div><strong style="font-size:15px">'+esc(s.nome)+'</strong><br>'+
        '<small style="color:var(--muted)">'+esc(s.fazendas?.nome||'—')+'</small></div>'+
        '<span class="badge '+esc(STATUS_COLORS[s.status]||'')+'">'+esc(STATUS_LABELS[s.status]||s.status)+'</span>'+
        '</div>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;margin:10px 0">'+
        '<div><span style="color:var(--muted)">Cultura</span><br><strong>'+esc(s.cultura)+'</strong></div>'+
        '<div><span style="color:var(--muted)">Área</span><br><strong>'+fmt(s.area_ha)+' ha</strong></div>'+
        '<div><span style="color:var(--muted)">Plantio</span><br><strong>'+fmtD(s.data_plantio)+'</strong></div>'+
        '<div><span style="color:var(--muted)">Colheita</span><br><strong>'+fmtD(s.data_colheita)+'</strong></div>'+
        '<div><span style="color:var(--muted)">Custo</span><br><strong>'+fmtR(s.custo_total)+'</strong></div>'+
        '<div><span style="color:var(--muted)">Receita</span><br><strong>'+fmtR(s.receita_total)+'</strong></div>'+
        '</div>'+
        '<div style="border-top:1px solid var(--brd);padding-top:8px;display:flex;justify-content:space-between;align-items:center">'+
        '<span style="font-size:13px;color:var(--muted)">Resultado: <strong style="color:'+margemCor+'">'+fmtR(margem)+'</strong></span>'+
        '<div style="display:flex;gap:6px">'+
        '<button class="btn-icon" onclick="window._safras_edit(''+s.id+'')">✏️</button>'+
        (s.status==='aberta' ? '<button class="btn-icon" onclick="window._safras_encerrar(''+s.id+'',''+esc(s.nome)+'')">✅</button>' : '')+
        '</div></div></div>';
    }).join('');
  }

  window._safras_search = function(v){ _search=v; document.getElementById('safrasBody').innerHTML=renderCards(); };
  window._safras_setFaz = function(v){ _fazFiltro=v; renderUI(); };
  window._safras_setStatus = function(v){ _statusFiltro=v; renderUI(); };
  window._safras_novo = function(){ abrirForm(null); };
  window._safras_edit = function(id){ abrirForm(_safras.find(s=>s.id===id)); };

  window._safras_encerrar = function(id, nome) {
    showConfirm('Encerrar safra <strong>'+esc(nome)+'</strong>?<br><small>O status mudará para "Encerrada".</small>',
      async function(){
        const { error } = await sb.from('safras').update({ status:'encerrada' }).eq('id',id);
        if(error){ toast('Erro: '+error.message,'bad'); return; }
        toast('Safra encerrada!','ok'); render();
      }
    );
  };

  function abrirForm(s) {
    const isNovo = !s;
    const fazOpts = _fazendas.map(f=>'<option value="'+f.id+'"'+(s?.fazenda_id===f.id?' selected':'')+'>'+esc(f.nome)+'</option>').join('');
    const culturas = JA.app.culturasPadrao.map(c=>'<option value="'+c+'"'+(s?.cultura===c?' selected':'')+'>'+c+'</option>').join('');
    const statusOpts = Object.entries(STATUS_LABELS).map(([k,v])=>
      '<option value="'+k+'"'+(s?.status===k||(!s&&k==='planejamento')?' selected':'')+'>'+v+'</option>').join('');

    showModal(isNovo?'+ Nova Safra':'Editar Safra',
      '<div class="form-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'+
      '<div class="form-field" style="grid-column:1/-1"><label>Nome da Safra *</label>'+
      '<input id="saf_nome" value="'+esc(s?.nome||'')+'" placeholder="Ex: Soja 2025/26 — Talhão A"/></div>'+
      '<div class="form-field"><label>Fazenda *</label>'+
      '<select id="saf_fazenda"><option value="">Selecione...</option>'+fazOpts+'</select></div>'+
      '<div class="form-field"><label>Cultura *</label>'+
      '<select id="saf_cultura"><option value="">Selecione...</option>'+culturas+'</select></div>'+
      '<div class="form-field"><label>Ano Agrícola</label>'+
      '<input id="saf_ano" value="'+esc(s?.ano_agricola||'')+'" placeholder="2025/2026"/></div>'+
      '<div class="form-field"><label>Área (ha)</label>'+
      '<input id="saf_area" type="number" step="0.01" min="0" value="'+esc(s?.area_ha||'')+'"/></div>'+
      '<div class="form-field"><label>Data Plantio</label>'+
      '<input id="saf_plantio" type="date" value="'+esc(s?.data_plantio||'')+'"/></div>'+
      '<div class="form-field"><label>Previsão Colheita</label>'+
      '<input id="saf_colheita" type="date" value="'+esc(s?.data_colheita||'')+'"/></div>'+
      '<div class="form-field"><label>Produção (sc)</label>'+
      '<input id="saf_prod" type="number" step="0.01" min="0" value="'+esc(s?.producao_sc||'')+'"/></div>'+
      '<div class="form-field"><label>Status</label>'+
      '<select id="saf_status">'+statusOpts+'</select></div>'+
      '<div class="form-field" style="grid-column:1/-1"><label>Observações</label>'+
      '<textarea id="saf_obs" rows="2" style="width:100%;resize:vertical;padding:8px 12px;border:1px solid var(--brd);border-radius:var(--r);font-family:var(--f)">'+esc(s?.observacoes||'')+'</textarea></div>'+
      '</div>',
      async function(){
        const nome     = document.getElementById('saf_nome').value.trim();
        const fazId    = document.getElementById('saf_fazenda').value;
        const cultura  = document.getElementById('saf_cultura').value;
        const ano      = document.getElementById('saf_ano').value.trim()||null;
        const area     = parseFloat(document.getElementById('saf_area').value)||null;
        const plantio  = document.getElementById('saf_plantio').value||null;
        const colheita = document.getElementById('saf_colheita').value||null;
        const prod     = parseFloat(document.getElementById('saf_prod').value)||null;
        const status   = document.getElementById('saf_status').value;
        const obs      = document.getElementById('saf_obs').value.trim()||null;
        if(!nome){ toast('Informe o nome','bad'); return; }
        if(!fazId){ toast('Selecione a fazenda','bad'); return; }
        if(!cultura){ toast('Selecione a cultura','bad'); return; }
        const payload={ nome, fazenda_id:fazId, cultura, ano_agricola:ano, area_ha:area, data_plantio:plantio, data_colheita:colheita, producao_sc:prod, status, observacoes:obs };
        const { error } = isNovo
          ? await sb.from('safras').insert(payload)
          : await sb.from('safras').update(payload).eq('id',s.id);
        if(error){ toast('Erro: '+error.message,'bad'); return; }
        toast(isNovo?'Safra criada!':'Safra atualizada!','ok');
        closeModal(); render();
      }
    );
    setTimeout(()=>document.getElementById('saf_nome')?.focus(),100);
  }

  render();
};
