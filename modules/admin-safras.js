// ============================================================
// JA AGRO - Admin Module: Safras (v2.0 - reescrito limpo)
// ============================================================
window.module_safras = async function(){
  "use strict";
  var esc = function(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); };
  var fmtDate = function(d){ if(!d) return "--"; try{ return new Date(d+"T00:00:00").toLocaleDateString("pt-BR"); }catch(e){ return "--"; } };
  var fmtN = function(v,dec){ if(v==null||isNaN(v)) return "--"; return Number(v).toLocaleString("pt-BR",{minimumFractionDigits:dec||0,maximumFractionDigits:dec||0}); };
  var fmtBR = function(v){ if(v==null||isNaN(v)) return "R$ --"; return "R$ "+Number(v).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}); };
  
  var _safras = [], _fazendas = [], _talhoesPorSafra = {};
  var _search = "", _filtroStatus = "", _filtroFazenda = "";
  
  var statusInfo = {
    "aberta":       { label:"Em andamento", color:"#16a34a", bg:"#dcfce7" },
    "planejamento": { label:"Planejamento", color:"#a16207", bg:"#fef3c7" },
    "encerrada":    { label:"Encerrada",    color:"#6b7280", bg:"#e5e7eb" }
  };
  
  async function carregar(){
    try{
      var pFaz = sb.from("fazendas").select("id,nome").eq("ativo",true).order("nome");
      var pSaf = sb.from("safras").select("*, fazendas(nome)").order("data_plantio",{ascending:false, nullsFirst:false});
      var pTal = sb.from("talhoes").select("id,safra_id,area_ha");
      var resFaz = await pFaz, resSaf = await pSaf, resTal = await pTal;
      if(resFaz.error) throw resFaz.error;
      if(resSaf.error) throw resSaf.error;
      _fazendas = resFaz.data || [];
      _safras   = resSaf.data || [];
      _talhoesPorSafra = {};
      (resTal.data||[]).forEach(function(t){
        if(!t.safra_id) return;
        if(!_talhoesPorSafra[t.safra_id]) _talhoesPorSafra[t.safra_id] = { count:0, area:0 };
        _talhoesPorSafra[t.safra_id].count++;
        _talhoesPorSafra[t.safra_id].area += Number(t.area_ha||0);
      });
    }catch(e){
      console.error("[safras] carregar:", e);
      toast("Erro ao carregar safras: "+(e.message||e),"bad");
    }
  }
  
  function filtrarSafras(){
    var q = (_search||"").toLowerCase().trim();
    return _safras.filter(function(s){
      if(_filtroStatus && s.status !== _filtroStatus) return false;
      if(_filtroFazenda && s.fazenda_id !== _filtroFazenda) return false;
      if(q){
        var hay = ((s.nome||"")+" "+(s.cultura||"")+" "+(s.ano_agricola||"")+" "+((s.fazendas&&s.fazendas.nome)||"")).toLowerCase();
        if(hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }
  
  function calcKpis(){
    var lst = _safras;
    var total = lst.length;
    var abertas = lst.filter(function(s){return s.status==="aberta";}).length;
    var plan = lst.filter(function(s){return s.status==="planejamento";}).length;
    var encerradas = lst.filter(function(s){return s.status==="encerrada";}).length;
    var area = lst.reduce(function(a,s){return a + Number(s.area_ha||0);},0);
    return { total: total, abertas: abertas, plan: plan, encerradas: encerradas, area: area };
  }
  
  function render(){
    var k = calcKpis();
    var fazendasOpt = '<option value="">Todas as fazendas</option>' +
      _fazendas.map(function(f){
        return '<option value="'+f.id+'"'+(_filtroFazenda===f.id?' selected':'')+'>'+esc(f.nome)+'</option>';
      }).join("");
    var html = ""+
      '<div style="padding:18px 22px;max-width:1400px;margin:0 auto">'+
      
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:18px">'+
          kpiCard("Total de Safras", k.total, "#0f766e", "#ccfbf1", "📅")+
          kpiCard("Em Andamento",    k.abertas, "#16a34a", "#dcfce7", "🌱")+
          kpiCard("Em Planejamento", k.plan, "#a16207", "#fef3c7", "📝")+
          kpiCard("Encerradas",      k.encerradas, "#6b7280", "#e5e7eb", "✅")+
          kpiCard("Area Total",      fmtN(k.area,0)+" ha", "#1d4ed8", "#dbeafe", "📐")+
        '</div>'+
        
        '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px;background:#fff;padding:12px 14px;border:1px solid #e5e7eb;border-radius:12px">'+
          '<input id="safSearch" type="text" placeholder="🔍 Buscar safra, cultura ou fazenda..." value="'+esc(_search)+'" '+
            'oninput="window._safSearch(this.value)" '+
            'style="flex:1;min-width:220px;padding:9px 12px;border:1px solid #e5e7eb;border-radius:9px;font-size:14px">'+
          
          '<select onchange="window._safFiltroStatus(this.value)" '+
            'style="padding:9px 12px;border:1px solid #e5e7eb;border-radius:9px;font-size:14px;background:#fff">'+
            '<option value="">Todos os status</option>'+
            '<option value="aberta"'+(_filtroStatus==="aberta"?' selected':'')+'>Em andamento</option>'+
            '<option value="planejamento"'+(_filtroStatus==="planejamento"?' selected':'')+'>Planejamento</option>'+
            '<option value="encerrada"'+(_filtroStatus==="encerrada"?' selected':'')+'>Encerrada</option>'+
          '</select>'+
          
          '<select onchange="window._safFiltroFazenda(this.value)" '+
            'style="padding:9px 12px;border:1px solid #e5e7eb;border-radius:9px;font-size:14px;background:#fff;max-width:240px">'+
            fazendasOpt+
          '</select>'+
          
          '<button onclick="window._safNova()" '+
            'style="background:#16a34a;color:#fff;border:none;padding:9px 16px;border-radius:9px;font-weight:600;cursor:pointer;font-size:14px">'+
            '+ Nova Safra</button>'+
        '</div>'+
        
        '<div id="safList"></div>'+
      '</div>';
    
    document.getElementById("mainContent").innerHTML = html;
    renderLista();
  }
  
  function kpiCard(label, valor, cor, bg, ico){
    return '<div style="background:#fff;border:1px solid #e5e7eb;border-left:4px solid '+cor+';border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:12px">'+
      '<div style="width:42px;height:42px;background:'+bg+';border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px">'+ico+'</div>'+
      '<div>'+
        '<div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;font-weight:600">'+label+'</div>'+
        '<div style="font-size:22px;font-weight:700;color:'+cor+';line-height:1.2">'+valor+'</div>'+
      '</div>'+
    '</div>';
  }
  
  function renderLista(){
    var filtradas = filtrarSafras();
    var holder = document.getElementById("safList");
    if(!holder) return;
    
    if(filtradas.length === 0){
      holder.innerHTML = '<div style="background:#fff;border:1px dashed #e5e7eb;border-radius:12px;padding:60px;text-align:center;color:#9ca3af">'+
        '<div style="font-size:48px;margin-bottom:12px">🌾</div>'+
        '<div style="font-size:16px;font-weight:600;color:#6b7280">Nenhuma safra encontrada</div>'+
        '<div style="font-size:13px;margin-top:6px">Ajuste os filtros ou clique em <b>+ Nova Safra</b> para começar</div>'+
      '</div>';
      return;
    }
    
    var rows = filtradas.map(function(s){
      var st = statusInfo[s.status] || { label: s.status||"--", color:"#6b7280", bg:"#e5e7eb" };
      var fazNome = (s.fazendas && s.fazendas.nome) || "(Sem fazenda)";
      var tal = _talhoesPorSafra[s.id] || { count:0, area:0 };
      var prod = s.producao_sc ? fmtN(s.producao_sc,0)+" sc" : "--";
      var roi = (s.custo_total>0 && s.receita_total>0) ? (((s.receita_total - s.custo_total)/s.custo_total)*100).toFixed(1)+"%" : "--";
      
      return '<div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px 18px;margin-bottom:10px;display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;transition:box-shadow .15s" '+
        'onmouseover="this.style.boxShadow=\'0 4px 12px rgba(0,0,0,.06)\'" onmouseout="this.style.boxShadow=\'none\'">'+
        
        '<div>'+
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap">'+
            '<span style="font-size:16px;font-weight:700;color:#111">'+esc(s.nome)+'</span>'+
            '<span style="background:'+st.bg+';color:'+st.color+';padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.4px">'+st.label+'</span>'+
            (s.cultura ? '<span style="background:#f0fdf4;color:#15803d;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600">'+esc(s.cultura)+'</span>' : '')+
            (s.ano_agricola ? '<span style="color:#6b7280;font-size:12px;font-weight:600">'+esc(s.ano_agricola)+'</span>' : '')+
          '</div>'+
          
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;font-size:12px;color:#374151">'+
            '<div><span style="color:#9ca3af">🏡 Fazenda:</span><br><b>'+esc(fazNome)+'</b></div>'+
            '<div><span style="color:#9ca3af">📐 Area:</span><br><b>'+fmtN(s.area_ha,0)+' ha</b></div>'+
            '<div><span style="color:#9ca3af">🌾 Talhões:</span><br><b>'+tal.count+' talhão(s)'+(tal.area>0?' ('+fmtN(tal.area,0)+' ha)':'')+'</b></div>'+
            '<div><span style="color:#9ca3af">🌱 Plantio:</span><br><b>'+fmtDate(s.data_plantio)+'</b></div>'+
            '<div><span style="color:#9ca3af">🌽 Colheita:</span><br><b>'+fmtDate(s.data_colheita)+'</b></div>'+
            '<div><span style="color:#9ca3af">📊 Produção:</span><br><b>'+prod+'</b></div>'+
            '<div><span style="color:#9ca3af">💰 Receita:</span><br><b>'+fmtBR(s.receita_total)+'</b></div>'+
            '<div><span style="color:#9ca3af">📈 ROI:</span><br><b style="color:'+(roi.indexOf("-")===0?"#dc2626":"#16a34a")+'">'+roi+'</b></div>'+
          '</div>'+
        '</div>'+
        
        '<div style="display:flex;flex-direction:column;gap:6px">'+
          '<button onclick="window._safEditar(\''+s.id+'\')" style="background:#3b82f6;color:#fff;border:none;padding:8px 14px;border-radius:8px;font-size:13px;cursor:pointer;font-weight:600">✏️ Editar</button>'+
          '<button onclick="window._safExcluir(\''+s.id+'\',\''+esc(s.nome).replace(/'/g,"&#39;")+'\')" style="background:#fee2e2;color:#dc2626;border:none;padding:8px 14px;border-radius:8px;font-size:13px;cursor:pointer;font-weight:600">🗑 Excluir</button>'+
        '</div>'+
      '</div>';
    }).join("");
    
    holder.innerHTML = rows;
  }
  
  window._safSearch = function(v){ _search = v; renderLista(); };
  window._safFiltroStatus  = function(v){ _filtroStatus = v; render(); };
  window._safFiltroFazenda = function(v){ _filtroFazenda = v; render(); };
  window._safNova    = function(){ abrirForm(null); };
  window._safEditar  = function(id){ var s = _safras.find(function(x){return x.id===id;}); if(s) abrirForm(s); };
  
  window._safExcluir = async function(id, nome){
    if(!confirm("Excluir a safra \""+nome+"\"?\n\nIsso NAO removera talhoes ou lancamentos vinculados, apenas a safra em si.\nDeseja continuar?")) return;
    try{
      var r = await sb.from("safras").delete().eq("id", id);
      if(r.error) throw r.error;
      toast("Safra excluida com sucesso","ok");
      await carregar(); render();
    }catch(e){
      toast("Erro ao excluir: "+(e.message||e),"bad");
    }
  };
  
  function abrirForm(s){
    var isNovo = !s;
    var fazOpts = '<option value="">-- Selecione --</option>' + _fazendas.map(function(f){
      return '<option value="'+f.id+'"'+(s&&s.fazenda_id===f.id?' selected':'')+'>'+esc(f.nome)+'</option>';
    }).join("");
    var culturas = ["Soja","Milho","Algodão","Café","Feijão","Trigo","Cana","Arroz","Sorgo","Girassol"];
    var cultOpts = '<option value="">-- Selecione --</option>' + culturas.map(function(c){
      return '<option value="'+c+'"'+(s&&s.cultura===c?' selected':'')+'>'+c+'</option>';
    }).join("");
    
    var html = ''+
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px">'+
        campo("Nome da Safra *","saf_nome","text", s?s.nome:"", "ex: Safra Soja 2025/26")+
        campoSelect("Fazenda *","saf_fazenda", fazOpts)+
        campoSelect("Cultura *","saf_cultura", cultOpts)+
        campo("Ano Agrícola","saf_ano","text", s?s.ano_agricola:"", "ex: 2025/26")+
        campoSelect("Status *","saf_status",
          '<option value="planejamento"'+(s&&s.status==="planejamento"?' selected':'')+'>Em Planejamento</option>'+
          '<option value="aberta"'+(!s||s.status==="aberta"?' selected':'')+'>Em Andamento</option>'+
          '<option value="encerrada"'+(s&&s.status==="encerrada"?' selected':'')+'>Encerrada</option>'
        )+
        campo("Area (ha)","saf_area","number", s?s.area_ha:"", "0", "0.01")+
        campo("Data de Plantio","saf_plantio","date", s?s.data_plantio:"")+
        campo("Data de Colheita","saf_colheita","date", s?s.data_colheita:"")+
      '</div>'+
      '<div style="margin-top:12px">'+
        '<label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:4px">Observações</label>'+
        '<textarea id="saf_obs" rows="3" style="width:100%;padding:9px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:14px;resize:vertical">'+esc(s?s.observacoes:"")+'</textarea>'+
      '</div>';
    
    showModal(isNovo ? "+ Nova Safra" : "Editar Safra", html, async function(){
      var nome = document.getElementById("saf_nome").value.trim();
      var fazId = document.getElementById("saf_fazenda").value;
      var cultura = document.getElementById("saf_cultura").value;
      var ano = document.getElementById("saf_ano").value.trim() || null;
      var status = document.getElementById("saf_status").value;
      var area = parseFloat(document.getElementById("saf_area").value);
      var plantio = document.getElementById("saf_plantio").value || null;
      var colheita = document.getElementById("saf_colheita").value || null;
      var obs = document.getElementById("saf_obs").value.trim() || null;
      
      if(!nome){ toast("Informe o nome da safra","bad"); return false; }
      if(!fazId){ toast("Selecione a fazenda","bad"); return false; }
      if(!cultura){ toast("Selecione a cultura","bad"); return false; }
      
      var payload = {
        nome: nome, fazenda_id: fazId, cultura: cultura, ano_agricola: ano,
        status: status, area_ha: isNaN(area)?null:area,
        data_plantio: plantio, data_colheita: colheita, observacoes: obs
      };
      
      try{
        var r;
        if(isNovo){
          r = await sb.from("safras").insert([payload]).select();
        } else {
          r = await sb.from("safras").update(payload).eq("id", s.id).select();
        }
        if(r.error) throw r.error;
        toast(isNovo ? "Safra criada" : "Safra atualizada", "ok");
        await carregar(); render();
        return true;
      }catch(e){
        console.error(e);
        toast("Erro ao salvar: "+(e.message||e),"bad");
        return false;
      }
    });
  }
  
  function campo(label, id, type, val, placeholder, step){
    return '<div>'+
      '<label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:4px">'+label+'</label>'+
      '<input id="'+id+'" type="'+type+'" value="'+esc(val||"")+'" placeholder="'+(placeholder||"")+'"'+(step?' step="'+step+'"':'')+
      ' style="width:100%;padding:9px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:14px;box-sizing:border-box">'+
    '</div>';
  }
  function campoSelect(label, id, options){
    return '<div>'+
      '<label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:4px">'+label+'</label>'+
      '<select id="'+id+'" style="width:100%;padding:9px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:14px;background:#fff;box-sizing:border-box">'+options+'</select>'+
    '</div>';
  }
  
  setLoading && setLoading("mainContent");
  await carregar();
  render();
};
