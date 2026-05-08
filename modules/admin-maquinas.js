// ============================================================
// JA AGRO — Admin Module: Máquinas (Compartilhamento Multi-Fazenda)
// admin-maquinas.js
// ============================================================
window.module_maquinas = async function() {
  var c = document.getElementById('mainContent');
  if (!c) return;
  c.innerHTML = '<div style="padding:20px;text-align:center;color:#888">Carregando máquinas...</div>';

  var sb = window._sb || window.sb;
  if (!sb) { c.innerHTML='<div style="padding:20px;color:red">Supabase não inicializado.</div>'; return; }

  var _maquinas = [], _fazendas = [], _talhoes = [], _operadores = [];
  var _fazFiltro = 'todas', _busca = '';

  async function render() {
    try {
      var [fazRes, macRes, talRes, opRes] = await Promise.all([
        sb.from('fazendas').select('id,nome').eq('ativo', true).order('nome'),
        sb.from('maquinas').select('*, fazendas!maquinas_fazenda_id_fkey(nome)').eq('ativo', true).order('nome'),
        sb.from('talhoes').select('id,nome,fazenda_id').eq('ativo', true).order('nome'),
        sb.from('operadores').select('id,nome').eq('ativo', true).order('nome')
      ]);
      _fazendas = fazRes.data || [];
      _maquinas = macRes.data || [];
      _talhoes = talRes.data || [];
      _operadores = opRes.data || [];
      renderUI();
    } catch(e) {
      c.innerHTML = '<div style="padding:20px;color:red">Erro: '+e.message+'</div>';
    }
  }

  function calcStats() {
    var lista = filtrados();
    var tipos = {};
    lista.forEach(function(m){ tipos[m.tipo||'OUTRO'] = (tipos[m.tipo||'OUTRO']||0)+1; });
    return { total: lista.length, tipos: tipos };
  }

  function filtrados() {
    return _maquinas.filter(function(m) {
      var okFaz = _fazFiltro === 'todas' || m.fazenda_id === _fazFiltro || m.fazenda_atual_id === _fazFiltro;
      var okBusca = !_busca || (m.nome||'').toLowerCase().includes(_busca.toLowerCase()) || (m.modelo||'').toLowerCase().includes(_busca.toLowerCase()) || (m.tipo||'').toLowerCase().includes(_busca.toLowerCase());
      return okFaz && okBusca;
    });
  }

  function statusBadge(m) {
    var s = (m.status||'disponivel').toLowerCase();
    var cfg = { disponivel:['#2d7d32','#e8f5e9','✅ Disponível'], operacao:['#e65100','#fff3e0','⚙️ Em Operação'], manutencao:['#c62828','#ffebee','🔧 Manutenção'], deslocamento:['#1565c0','#e3f2fd','🚛 Deslocamento'] };
    var c2 = cfg[s] || ['#555','#f5f5f5', s];
    return '<span style="background:'+c2[1]+';color:'+c2[0]+';border-radius:4px;padding:2px 8px;font-size:11px;font-weight:600">'+c2[2]+'</span>';
  }

  function renderRows() {
    var lista = filtrados();
    if (!lista.length) return '<tr><td colspan="7" style="padding:24px;text-align:center;color:#aaa">Nenhuma máquina encontrada.</td></tr>';
    return lista.map(function(m) {
      var fazProp = _fazendas.find(function(f){ return f.id===m.fazenda_id; });
      var fazAtual = m.fazenda_atual_id ? _fazendas.find(function(f){ return f.id===m.fazenda_atual_id; }) : null;
      var isShared = fazAtual && fazAtual.id !== m.fazenda_id;
      var manutVenc = m.proxima_manutencao_h && m.horimetro_atual >= m.proxima_manutencao_h;
      var idQ = JSON.stringify(m.id);

      // Fazenda display
      var fazDisplay = fazProp ? fazProp.nome : '—';
      if (fazAtual && isShared) {
        fazDisplay = '<span style="color:#888;text-decoration:line-through;font-size:11px">'+fazDisplay+'</span>'
          + '<br><span style="background:#fff3e0;color:#e65100;border-radius:3px;padding:1px 6px;font-size:11px;font-weight:600">📍 '+fazAtual.nome+'</span>';
      } else {
        fazDisplay = '<span style="font-size:12px">'+fazDisplay+'</span>';
      }

      return '<tr style="border-bottom:1px solid #f0f0f0">'
        + '<td style="padding:10px"><strong>'+m.nome+'</strong>'
        + '<br><span style="color:#888;font-size:11px">'+(m.modelo||'')+'</span>'
        + (isShared ? '<br><span style="background:#e3f2fd;color:#1565c0;border-radius:3px;padding:1px 6px;font-size:10px;font-weight:600">🔄 Compartilhada</span>' : '')
        + '</td>'
        + '<td style="padding:10px"><span style="background:#f3e5f5;color:#7b1fa2;border-radius:4px;padding:2px 7px;font-size:11px;font-weight:600">'+(m.tipo||'—')+'</span></td>'
        + '<td style="padding:10px">'+fazDisplay+'</td>'
        + '<td style="padding:10px;text-align:center">'+statusBadge(m)+'</td>'
        + '<td style="padding:10px;text-align:right;font-weight:600;color:'+(manutVenc?'#c62828':'#333')+'">'
        + (manutVenc?'⚠️ ':'')+parseFloat(m.horimetro_atual||0).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+' h'
        + (m.proxima_manutencao_h?'<br><span style="color:#aaa;font-size:10px">Mán: '+m.proxima_manutencao_h+' h</span>':'')
        + '</td>'
        + '<td style="padding:10px;text-align:center;white-space:nowrap">'
        + '<button onclick="window._mac_apontamento('+idQ+')" title="Registrar uso em uma fazenda" style="background:#e65100;color:#fff;border:none;border-radius:4px;padding:4px 8px;font-size:11px;cursor:pointer;margin:1px">⚙️ Uso</button> '
        + '<button onclick="window._mac_deslocar('+idQ+')" title="Mover máquina para outra fazenda" style="background:#1565c0;color:#fff;border:none;border-radius:4px;padding:4px 8px;font-size:11px;cursor:pointer;margin:1px">🚛 Mover</button> '
        + '<button onclick="window._mac_abrirForm('+idQ+')" style="background:#555;color:#fff;border:none;border-radius:4px;padding:4px 8px;font-size:11px;cursor:pointer;margin:1px">Editar</button> '
        + '<button onclick="window._mac_excluir('+idQ+')" style="background:#c62828;color:#fff;border:none;border-radius:4px;padding:4px 8px;font-size:11px;cursor:pointer;margin:1px">Excluir</button>'
        + '</td></tr>';
    }).join('');
  }

  function renderUI() {
    var stats = calcStats();
    var fazOpts = '<option value="todas">🏘️ Todas as Fazendas</option>'
      + _fazendas.map(function(f){ return '<option value="'+f.id+'"'+(f.id===_fazFiltro?' selected':'')+'>'+f.nome+'</option>'; }).join('');

    var tipoKpis = Object.entries(stats.tipos).map(function(kv){
      var colors = {TRATOR:'#2d7d32',COLHEITADEIRA:'#e65100',PULVERIZADOR:'#1565c0',CAMINHÃO:'#7b1fa2',DRONE:'#00838f'};
      return '<div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:10px 14px;min-width:90px">'
        + '<div style="font-size:20px;font-weight:700;color:'+(colors[kv[0]]||'#555')+'">'+kv[1]+'</div>'
        + '<div style="font-size:11px;color:#888;text-transform:uppercase;margin-top:2px">'+kv[0]+'</div>'
        + '</div>';
    }).join('');

    c.innerHTML = '<div style="padding:16px 20px 8px">'
      + '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px">'
      + '<span style="font-weight:700;font-size:15px;color:#333">Máquinas</span>'
      + '<select id="mac_fazFiltro" onchange="window._mac_setFaz(this.value)" style="border:1px solid #ccc;border-radius:6px;padding:4px 10px;font-size:13px;background:#1b4332;color:#fff;border-color:rgba(255,255,255,0.4)">'+fazOpts+'</select>'
      + '<input id="mac_busca" type="text" placeholder="Buscar máquina..." value="'+_busca+'" oninput="window._mac_setBusca(this.value)" style="border:1px solid #ccc;border-radius:6px;padding:5px 10px;font-size:13px;min-width:180px">'
      + '<button onclick="window._mac_abrirForm(null)" style="margin-left:auto;background:#2d7d32;color:#fff;border:none;border-radius:6px;padding:7px 16px;font-size:13px;cursor:pointer;font-weight:600">+ Nova Máquina</button>'
      + '</div>'
      + '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px">'
      + '<div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:10px 16px;min-width:100px">'
      + '<div style="font-size:20px;font-weight:700;color:#333">'+stats.total+'</div><div style="font-size:11px;color:#888;text-transform:uppercase;margin-top:2px">Total</div></div>'
      + tipoKpis
      + '</div>'
      + '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">'
      + '<thead><tr style="background:#f5f5f5;border-bottom:2px solid #e0e0e0">'
      + '<th style="padding:8px 10px;text-align:left;color:#555;font-weight:600">NOME / MODELO</th>'
      + '<th style="padding:8px 10px;text-align:left;color:#555;font-weight:600">TIPO</th>'
      + '<th style="padding:8px 10px;text-align:left;color:#555;font-weight:600">FAZENDA</th>'
      + '<th style="padding:8px 10px;text-align:center;color:#555;font-weight:600">STATUS</th>'
      + '<th style="padding:8px 10px;text-align:right;color:#555;font-weight:600">HORÍMETRO</th>'
      + '<th style="padding:8px 10px;text-align:center;color:#555;font-weight:600">AÇÕES</th>'
      + '</tr></thead>'
      + '<tbody id="mac_tbody">'+renderRows()+'</tbody>'
      + '</table></div></div>';
  }

  window._mac_setFaz = function(v) { _fazFiltro = v; var tb=document.getElementById('mac_tbody'); if(tb) tb.innerHTML=renderRows(); };
  window._mac_setBusca = function(v) { _busca = v; var tb=document.getElementById('mac_tbody'); if(tb) tb.innerHTML=renderRows(); };

  // REGISTRAR USO / APONTAMENTO
  window._mac_apontamento = function(macId) {
    var m = _maquinas.find(function(x){ return x.id===macId; });
    if (!m) return;
    var fazOpts = _fazendas.map(function(f){ return '<option value="'+f.id+'"'+(f.id===m.fazenda_atual_id?' selected':f.id===m.fazenda_id?' selected':'')+'>'+f.nome+'</option>'; }).join('');
    var talOpts = '<option value="">— Nenhum talhão específico —</option>'
      + _talhoes.map(function(t){ return '<option value="'+t.id+'">'+t.nome+'</option>'; }).join('');
    var opOpts = '<option value="">— Operador não informado —</option>'
      + _operadores.map(function(op){ return '<option value="'+op.id+'">'+op.nome+'</option>'; }).join('');
    var old = document.getElementById('mac_modal_apt'); if(old) old.remove();
    var modal = document.createElement('div');
    modal.id = 'mac_modal_apt';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
    modal.innerHTML = '<div style="background:#fff;border-radius:10px;padding:24px;width:460px;max-width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.2)">'
      + '<h3 style="margin:0 0 4px;font-size:15px;color:#e65100">⚙️ Registrar Uso de Máquina</h3>'
      + '<p style="font-size:13px;font-weight:600;margin:0 0 16px;color:#555">'+m.nome+' — '+m.tipo+'</p>'
      + '<div style="margin-bottom:10px"><label style="font-size:12px;color:#555;display:block;margin-bottom:4px">Fazenda onde operou *</label>'
      + '<select id="apt_fazenda" style="width:100%;border:1px solid #ccc;border-radius:6px;padding:7px 10px;font-size:13px">'+fazOpts+'</select></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">'
      + '<div><label style="font-size:12px;color:#555;display:block;margin-bottom:4px">Data de Início</label><input id="apt_inicio" type="date" value="'+new Date().toISOString().split("T")[0]+'" style="width:100%;border:1px solid #ccc;border-radius:6px;padding:7px 10px;font-size:13px;box-sizing:border-box"></div>'
      + '<div><label style="font-size:12px;color:#555;display:block;margin-bottom:4px">Data de Fim</label><input id="apt_fim" type="date" value="'+new Date().toISOString().split("T")[0]+'" style="width:100%;border:1px solid #ccc;border-radius:6px;padding:7px 10px;font-size:13px;box-sizing:border-box"></div>'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">'
      + '<div><label style="font-size:12px;color:#555;display:block;margin-bottom:4px">Horas Trabalhadas</label><input id="apt_horas" type="number" min="0" step="0.1" placeholder="Ex: 6.5" style="width:100%;border:1px solid #ccc;border-radius:6px;padding:7px 10px;font-size:13px;box-sizing:border-box"></div>'
      + '<div><label style="font-size:12px;color:#555;display:block;margin-bottom:4px">Combustível (litros)</label><input id="apt_comb" type="number" min="0" step="0.1" placeholder="Ex: 42.0" style="width:100%;border:1px solid #ccc;border-radius:6px;padding:7px 10px;font-size:13px;box-sizing:border-box"></div>'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">'
      + '<div><label style="font-size:12px;color:#555;display:block;margin-bottom:4px">Horímetro Inicial (h)</label><input id="apt_hor_ini" type="number" min="0" step="0.1" value="'+parseFloat(m.horimetro_atual||0).toFixed(1)+'" style="width:100%;border:1px solid #ccc;border-radius:6px;padding:7px 10px;font-size:13px;box-sizing:border-box"></div>'
      + '<div><label style="font-size:12px;color:#555;display:block;margin-bottom:4px">Horímetro Final (h)</label><input id="apt_hor_fim" type="number" min="0" step="0.1" style="width:100%;border:1px solid #ccc;border-radius:6px;padding:7px 10px;font-size:13px;box-sizing:border-box"></div>'
      + '</div>'
      + '<div style="margin-bottom:10px"><label style="font-size:12px;color:#555;display:block;margin-bottom:4px">Talhão (opcional)</label>'
      + '<select id="apt_talhao" style="width:100%;border:1px solid #ccc;border-radius:6px;padding:7px 10px;font-size:13px">'+talOpts+'</select></div>'
      + '<div style="margin-bottom:10px"><label style="font-size:12px;color:#555;display:block;margin-bottom:4px">Operador</label>'
      + '<select id="apt_operador" style="width:100%;border:1px solid #ccc;border-radius:6px;padding:7px 10px;font-size:13px">'+opOpts+'</select></div>'
      + '<div style="margin-bottom:10px"><label style="font-size:12px;color:#555;display:block;margin-bottom:4px">Atividade</label>'
      + '<select id="apt_atividade" style="width:100%;border:1px solid #ccc;border-radius:6px;padding:7px 10px;font-size:13px">'
      + ['Plantio','Pulverização','Colheita','Adubação','Calagem','Gradagem','Subsolagem','Transporte','Manutenção','Outro'].map(function(a){ return '<option value="'+a+'">'+a+'</option>'; }).join('')
      + '</select></div>'
      + '<div style="margin-bottom:16px"><label style="font-size:12px;color:#555;display:block;margin-bottom:4px">Observações</label>'
      + '<input id="apt_obs" type="text" placeholder="Detalhes da operação..." style="width:100%;border:1px solid #ccc;border-radius:6px;padding:7px 10px;font-size:13px;box-sizing:border-box"></div>'
      + '<div style="background:#e8f5e9;border:1px solid #a5d6a7;border-radius:6px;padding:10px 12px;margin-bottom:14px;font-size:12px;color:#2d7d32">💡 O horímetro da máquina será atualizado automaticamente para o horímetro final informado.</div>'
      + '<div style="display:flex;gap:8px;justify-content:flex-end">'
      + '<button onclick="document.getElementById('mac_modal_apt').remove()" style="border:1px solid #ccc;background:#fff;border-radius:6px;padding:8px 16px;font-size:13px;cursor:pointer">Cancelar</button>'
      + '<button onclick="window._mac_salvarApontamento(''+macId+'')" style="background:#e65100;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-size:13px;cursor:pointer;font-weight:600">Registrar Uso</button>'
      + '</div></div>';
    document.body.appendChild(modal);
  };

  window._mac_salvarApontamento = async function(macId) {
    var fazId = document.getElementById('apt_fazenda').value;
    var horas = parseFloat(document.getElementById('apt_horas').value)||0;
    var horFim = parseFloat(document.getElementById('apt_hor_fim').value)||null;
    if (!fazId) { alert('Selecione a fazenda onde a máquina operou.'); return; }
    if (horas<=0 && !horFim) { alert('Informe as horas trabalhadas ou o horímetro final.'); return; }

    var upd = { fazenda_atual_id: fazId, atualizado_em: new Date().toISOString() };
    if (horFim) upd.horimetro_atual = horFim;
    else {
      var m = _maquinas.find(function(x){ return x.id===macId; });
      if (m) upd.horimetro_atual = parseFloat(m.horimetro_atual||0) + horas;
    }
    // Set status to available after logging use
    upd.status = 'disponivel';

    var {error} = await sb.from('maquinas').update(upd).eq('id', macId);
    if (error) { alert('Erro: '+error.message); return; }
    document.getElementById('mac_modal_apt').remove();
    await render();
  };

  // MOVER MÁQUINA PARA OUTRA FAZENDA
  window._mac_deslocar = function(macId) {
    var m = _maquinas.find(function(x){ return x.id===macId; });
    if (!m) return;
    var fazAtual = m.fazenda_atual_id || m.fazenda_id;
    var fazAtualObj = _fazendas.find(function(f){ return f.id===fazAtual; });
    var destOpts = _fazendas.map(function(f){ return '<option value="'+f.id+'"'+(f.id===fazAtual?' selected':'')+'>'+f.nome+'</option>'; }).join('');
    var old = document.getElementById('mac_modal_desl'); if(old) old.remove();
    var modal = document.createElement('div');
    modal.id = 'mac_modal_desl';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center';
    modal.innerHTML = '<div style="background:#fff;border-radius:10px;padding:24px;width:360px;max-width:95vw;box-shadow:0 8px 32px rgba(0,0,0,0.2)">'
      + '<h3 style="margin:0 0 4px;font-size:15px;color:#1565c0">🚛 Mover Máquina</h3>'
      + '<p style="font-size:13px;font-weight:600;margin:0 0 12px;color:#555">'+m.nome+'</p>'
      + '<div style="background:#e3f2fd;border:1px solid #90caf9;border-radius:6px;padding:10px 12px;margin-bottom:14px;font-size:12px">'
      + '📍 Localização atual: <strong>'+(fazAtualObj?fazAtualObj.nome:'Não definida')+'</strong></div>'
      + '<div style="margin-bottom:10px"><label style="font-size:12px;color:#555;display:block;margin-bottom:4px">Mover para Fazenda</label>'
      + '<select id="desl_dest" style="width:100%;border:1px solid #ccc;border-radius:6px;padding:7px 10px;font-size:13px">'+destOpts+'</select></div>'
      + '<div style="margin-bottom:10px"><label style="font-size:12px;color:#555;display:block;margin-bottom:4px">Novo Status</label>'
      + '<select id="desl_status" style="width:100%;border:1px solid #ccc;border-radius:6px;padding:7px 10px;font-size:13px">'
      + '<option value="deslocamento">🚛 Em Deslocamento</option>'
      + '<option value="disponivel">✅ Disponível (já chegou)</option>'
      + '<option value="operacao">⚙️ Em Operação</option>'
      + '</select></div>'
      + '<div style="margin-bottom:16px"><label style="font-size:12px;color:#555;display:block;margin-bottom:4px">Observação (opcional)</label>'
      + '<input id="desl_obs" type="text" placeholder="Ex: Safra milho segunda safra..." style="width:100%;border:1px solid #ccc;border-radius:6px;padding:7px 10px;font-size:13px;box-sizing:border-box"></div>'
      + '<div style="display:flex;gap:8px;justify-content:flex-end">'
      + '<button onclick="document.getElementById('mac_modal_desl').remove()" style="border:1px solid #ccc;background:#fff;border-radius:6px;padding:8px 16px;font-size:13px;cursor:pointer">Cancelar</button>'
      + '<button onclick="window._mac_confirmarDeslocamento(''+macId+'')" style="background:#1565c0;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-size:13px;cursor:pointer;font-weight:600">Confirmar Movimentação</button>'
      + '</div></div>';
    document.body.appendChild(modal);
  };

  window._mac_confirmarDeslocamento = async function(macId) {
    var destId = document.getElementById('desl_dest').value;
    var status = document.getElementById('desl_status').value;
    var {error} = await sb.from('maquinas').update({ fazenda_atual_id: destId, status: status, atualizado_em: new Date().toISOString() }).eq('id', macId);
    if (error) { alert('Erro: '+error.message); return; }
    document.getElementById('mac_modal_desl').remove();
    await render();
  };

  // FORM NOVO/EDITAR
  window._mac_abrirForm = function(macId) {
    var m = macId ? _maquinas.find(function(x){ return x.id===macId; }) : null;
    var v = m||{};
    var fazOpts = _fazendas.map(function(f){ return '<option value="'+f.id+'"'+(f.id===v.fazenda_id?' selected':'')+'>'+f.nome+'</option>'; }).join('');
    var tipos = ['TRATOR','COLHEITADEIRA','PULVERIZADOR','CAMINHÃO','DRONE','IMPLEMENTO','OUTRO'];
    var old = document.getElementById('mac_modal_form'); if(old) old.remove();
    var modal = document.createElement('div');
    modal.id = 'mac_modal_form';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
    modal.innerHTML = '<div style="background:#fff;border-radius:10px;padding:24px;width:440px;max-width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.2)">'
      + '<h3 style="margin:0 0 16px;font-size:15px;color:#333">'+(m?'Editar':'Nova')+' Máquina</h3>'
      + '<div style="margin-bottom:10px"><label style="font-size:12px;color:#555;display:block;margin-bottom:4px">Nome *</label><input id="mac_nome" type="text" value="'+(v.nome||'')+'" style="width:100%;border:1px solid #ccc;border-radius:6px;padding:7px 10px;font-size:13px;box-sizing:border-box"></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">'
      + '<div><label style="font-size:12px;color:#555;display:block;margin-bottom:4px">Tipo</label><select id="mac_tipo" style="width:100%;border:1px solid #ccc;border-radius:6px;padding:7px 10px;font-size:13px">'+tipos.map(function(t){ return '<option value="'+t+'"'+(t===v.tipo?' selected':'')+'>'+t+'</option>'; }).join('')+'</select></div>'
      + '<div><label style="font-size:12px;color:#555;display:block;margin-bottom:4px">Modelo</label><input id="mac_modelo" type="text" value="'+(v.modelo||'')+'" style="width:100%;border:1px solid #ccc;border-radius:6px;padding:7px 10px;font-size:13px;box-sizing:border-box"></div>'
      + '</div>'
      + '<div style="margin-bottom:10px"><label style="font-size:12px;color:#555;display:block;margin-bottom:4px">🏘️ Fazenda Proprietária</label>'
      + '<select id="mac_faz" style="width:100%;border:1px solid #ccc;border-radius:6px;padding:7px 10px;font-size:13px">'+fazOpts+'</select>'
      + '<p style="font-size:11px;color:#888;margin:3px 0 0">Fazenda dona da máquina (pode operar em outras via "Mover")</p></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">'
      + '<div><label style="font-size:11px;color:#555;display:block;margin-bottom:3px">Placa</label><input id="mac_placa" type="text" value="'+(v.placa||'')+'" style="width:100%;border:1px solid #ccc;border-radius:6px;padding:6px 8px;font-size:13px;box-sizing:border-box"></div>'
      + '<div><label style="font-size:11px;color:#555;display:block;margin-bottom:3px">Ano</label><input id="mac_ano" type="number" value="'+(v.ano||'')+'" style="width:100%;border:1px solid #ccc;border-radius:6px;padding:6px 8px;font-size:13px;box-sizing:border-box"></div>'
      + '<div><label style="font-size:11px;color:#555;display:block;margin-bottom:3px">Horímetro (h)</label><input id="mac_hor" type="number" step="0.1" value="'+(v.horimetro_atual||0)+'" style="width:100%;border:1px solid #ccc;border-radius:6px;padding:6px 8px;font-size:13px;box-sizing:border-box"></div>'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">'
      + '<div><label style="font-size:11px;color:#555;display:block;margin-bottom:3px">Próx. Manutenção (h)</label><input id="mac_prox_man" type="number" step="1" value="'+(v.proxima_manutencao_h||'')+'" style="width:100%;border:1px solid #ccc;border-radius:6px;padding:6px 8px;font-size:13px;box-sizing:border-box"></div>'
      + '<div><label style="font-size:11px;color:#555;display:block;margin-bottom:3px">Nº de Série</label><input id="mac_serie" type="text" value="'+(v.numero_serie||'')+'" style="width:100%;border:1px solid #ccc;border-radius:6px;padding:6px 8px;font-size:13px;box-sizing:border-box"></div>'
      + '</div>'
      + '<div style="display:flex;gap:8px;justify-content:flex-end">'
      + '<button onclick="document.getElementById('mac_modal_form').remove()" style="border:1px solid #ccc;background:#fff;border-radius:6px;padding:8px 16px;font-size:13px;cursor:pointer">Cancelar</button>'
      + '<button onclick="window._mac_salvar(''+( macId||''  )+'')" style="background:#2d7d32;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-size:13px;cursor:pointer;font-weight:600">Salvar</button>'
      + '</div></div>';
    document.body.appendChild(modal);
  };

  window._mac_salvar = async function(macId) {
    var dados = {
      nome: (document.getElementById('mac_nome').value||'').trim(),
      tipo: document.getElementById('mac_tipo').value,
      modelo: document.getElementById('mac_modelo').value.trim()||null,
      fazenda_id: document.getElementById('mac_faz').value||null,
      placa: document.getElementById('mac_placa').value.trim()||null,
      ano: parseInt(document.getElementById('mac_ano').value)||null,
      horimetro_atual: parseFloat(document.getElementById('mac_hor').value)||0,
      proxima_manutencao_h: parseFloat(document.getElementById('mac_prox_man').value)||null,
      numero_serie: document.getElementById('mac_serie').value.trim()||null,
      ativo: true, atualizado_em: new Date().toISOString()
    };
    if (!dados.nome){ alert('Informe o nome da máquina.'); return; }
    var {error} = macId
      ? await sb.from('maquinas').update(dados).eq('id', macId)
      : await sb.from('maquinas').insert([dados]);
    if (error){ alert('Erro: '+error.message); return; }
    document.getElementById('mac_modal_form').remove();
    await render();
  };

  window._mac_excluir = async function(macId) {
    if (!confirm('Excluir esta máquina? Esta ação não pode ser desfeita.')) return;
    var {error} = await sb.from('maquinas').update({ativo:false,atualizado_em:new Date().toISOString()}).eq('id',macId);
    if (error){ alert('Erro: '+error.message); return; }
    await render();
  };

  await render();
};
