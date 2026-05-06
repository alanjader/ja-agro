window.module_qualidade_lotes = async function() {
  var cont = document.getElementById("mainContent");
  if (!cont) return;
  cont.innerHTML = "<div style=\"padding:20px;text-align:center;color:#888\">Carregando Qualidade de Lotes...</div>";

  // ── Dados base ──────────────────────────────────────────────
  var fRes = await sb.from("fazendas").select("id,nome").eq("ativo",true).order("nome");
  var sRes = await sb.from("safras").select("id,nome,cultura,ano_agricola,fazenda_id").order("nome");
  var tRes = await sb.from("talhoes").select("id,nome,fazenda_id").order("nome");
  var aRes = await sb.from("qualidade_analise").select("*,fazendas(nome),safras(nome,cultura,ano_agricola),talhoes(nome)").order("data_analise",{ascending:false});

  var fazendas = fRes.data || [];
  var safras   = sRes.data || [];
  var talhoes  = tRes.data || [];
  var analises = aRes.error ? [] : (aRes.data || []);

  // ── Definição de parâmetros por cultura ─────────────────────
  var culturaParams = {
    cafe: [
      {k:"umidade",      l:"Umidade (%)",          tipo:"number", un:"%",   min:0,  max:14,  alerta:12},
      {k:"peneira",      l:"Peneira",              tipo:"text",   un:"",    min:0,  max:0,   alerta:0},
      {k:"bebida",       l:"Prova de Bebida (pts)",tipo:"number", un:"pts", min:0,  max:100, alerta:80},
      {k:"defeitos",     l:"Defeitos (d/300g)",    tipo:"number", un:"d",   min:0,  max:360, alerta:360},
      {k:"tipo",         l:"Tipo",                 tipo:"text",   un:"",    min:0,  max:0,   alerta:0},
      {k:"catacao",      l:"Catação (%)",          tipo:"number", un:"%",   min:0,  max:100, alerta:5},
      {k:"impureza",     l:"Impurezas (%)",        tipo:"number", un:"%",   min:0,  max:100, alerta:1},
      {k:"sensorial",    l:"Pontuação Sensorial",  tipo:"number", un:"pts", min:0,  max:100, alerta:80},
      {k:"classificacao",l:"Classificação",        tipo:"text",   un:"",    min:0,  max:0,   alerta:0},
      {k:"obs_tecnica",  l:"Obs. Técnicas",        tipo:"textarea",un:"",   min:0,  max:0,   alerta:0}
    ],
    soja: [
      {k:"umidade",      l:"Umidade (%)",          tipo:"number", un:"%",   min:0,  max:14,  alerta:14},
      {k:"impureza",     l:"Impurezas (%)",        tipo:"number", un:"%",   min:0,  max:100, alerta:1},
      {k:"avariados",    l:"Grãos Avariados (%)",  tipo:"number", un:"%",   min:0,  max:100, alerta:8},
      {k:"quebrados",    l:"Grãos Quebrados (%)",  tipo:"number", un:"%",   min:0,  max:100, alerta:30},
      {k:"verdes",       l:"Grãos Verdes (%)",     tipo:"number", un:"%",   min:0,  max:100, alerta:8},
      {k:"ardidos",      l:"Ardidos (%)",          tipo:"number", un:"%",   min:0,  max:100, alerta:1},
      {k:"proteina",     l:"Proteína (%)",         tipo:"number", un:"%",   min:0,  max:50,  alerta:36},
      {k:"oleo",         l:"Óleo (%)",             tipo:"number", un:"%",   min:0,  max:30,  alerta:18},
      {k:"classificacao",l:"Classificação",        tipo:"text",   un:"",    min:0,  max:0,   alerta:0}
    ],
    milho: [
      {k:"umidade",      l:"Umidade (%)",          tipo:"number", un:"%",   min:0,  max:14,  alerta:14},
      {k:"impureza",     l:"Impurezas (%)",        tipo:"number", un:"%",   min:0,  max:100, alerta:1},
      {k:"ardidos",      l:"Grãos Ardidos (%)",    tipo:"number", un:"%",   min:0,  max:100, alerta:6},
      {k:"quebrados",    l:"Grãos Quebrados (%)",  tipo:"number", un:"%",   min:0,  max:100, alerta:6},
      {k:"carunchados",  l:"Grãos Carunchados (%)",tipo:"number", un:"%",   min:0,  max:100, alerta:2},
      {k:"micotoxinas",  l:"Micotoxinas (ppb)",    tipo:"number", un:"ppb", min:0,  max:9999,alerta:500},
      {k:"ph",           l:"Peso Hectolítrico (kg)",tipo:"number",un:"kg",  min:0,  max:100, alerta:72},
      {k:"classificacao",l:"Classificação",        tipo:"text",   un:"",    min:0,  max:0,   alerta:0}
    ],
    cana: [
      {k:"atr",          l:"ATR (kg/t)",           tipo:"number", un:"kg/t",min:0,  max:200, alerta:120},
      {k:"brix",         l:"Brix (%)",             tipo:"number", un:"%",   min:0,  max:30,  alerta:16},
      {k:"pol",          l:"Pol (%)",              tipo:"number", un:"%",   min:0,  max:20,  alerta:14},
      {k:"pureza",       l:"Pureza (%)",           tipo:"number", un:"%",   min:0,  max:100, alerta:85},
      {k:"fibra",        l:"Fibra (%)",            tipo:"number", un:"%",   min:0,  max:20,  alerta:14},
      {k:"imp_vegetal",  l:"Impureza Vegetal (%)", tipo:"number", un:"%",   min:0,  max:100, alerta:5},
      {k:"imp_mineral",  l:"Impureza Mineral (%)", tipo:"number", un:"%",   min:0,  max:100, alerta:1},
      {k:"ton_cana",     l:"Tonelada de Cana (t)", tipo:"number", un:"t",   min:0,  max:99999,alerta:0},
      {k:"qual_ind",     l:"Qualidade Industrial", tipo:"text",   un:"",    min:0,  max:0,   alerta:0}
    ]
  };

  var tiposAnalise = ["Recebimento","Armazenagem","Pre-Venda","Venda","Entrega","Beneficiamento","Auditoria","Producao"];
  var culturaLabel = {cafe:"Café",soja:"Soja",milho:"Milho",cana:"Cana-de-Açúcar"};
  var culturaIcon  = {cafe:"&#9749;",soja:"&#127807;",milho:"&#127806;",cana:"&#127803;"};

  function fmtDate(d) { if(!d) return ""; var p=d.split("-"); return p[2]+"/"+p[1]+"/"+p[0]; }

  // ── Estado do módulo ────────────────────────────────────────
  var estado = {modo:"lista", analise:null, filtroFaz:"", filtroSaf:"", filtroCult:"", filtroTipo:"", comparando:[]};

  // ── Render principal ─────────────────────────────────────────
  function render() {
    if (estado.modo === "lista")   renderLista();
    else if (estado.modo === "form")    renderForm(estado.analise);
    else if (estado.modo === "detalhe") renderDetalhe(estado.analise);
    else if (estado.modo === "comparar") renderComparar();
  }

  // ── LISTA ───────────────────────────────────────────────────
  function renderLista() {
    var filtered = analises.filter(function(a) {
      if (estado.filtroFaz  && a.fazenda_id !== estado.filtroFaz)  return false;
      if (estado.filtroSaf  && a.safra_id   !== estado.filtroSaf)  return false;
      if (estado.filtroCult && a.cultura     !== estado.filtroCult) return false;
      if (estado.filtroTipo && a.tipo_analise !== estado.filtroTipo) return false;
      return true;
    });

    var optFaz  = "<option value=\"\">Todas as Fazendas</option>" + fazendas.map(function(f){ return "<option value=\""+f.id+"\">"+ f.nome +"</option>"; }).join("");
    var optSaf  = "<option value=\"\">Todas as Safras</option>"   + safras.map(function(s){   return "<option value=\""+s.id+"\">"+ s.nome +" ("+ s.ano_agricola +")</option>"; }).join("");
    var optCult = "<option value=\"\">Todas as Culturas</option>"
      + "<option value=\"cafe\">Café</option>"
      + "<option value=\"soja\">Soja</option>"
      + "<option value=\"milho\">Milho</option>"
      + "<option value=\"cana\">Cana-de-Açúcar</option>";
    var optTipo = "<option value=\"\">Todos os Tipos</option>" + tiposAnalise.map(function(t){ return "<option value=\""+t+"\">"+ t +"</option>"; }).join("");

    var rows = filtered.length === 0
      ? "<tr><td colspan=\"7\" style=\"text-align:center;color:#888;padding:30px\">Nenhuma análise encontrada</td></tr>"
      : filtered.map(function(a) {
          var cult = a.cultura || "";
          var icon = culturaIcon[cult] || "&#128200;";
          var cLbl = culturaLabel[cult] || cult;
          var fNome = a.fazendas ? a.fazendas.nome : "-";
          var sNome = a.safras   ? a.safras.nome   : "-";
          var tNome = a.talhoes  ? a.talhoes.nome  : "-";
          var ref = a.referencia_lote ? "<span style=\"background:#7CB342;color:#fff;border-radius:4px;padding:1px 6px;font-size:10px\">REF</span>" : "";
          var cb = "<input type=\"checkbox\" class=\"comp-cb\" data-id=\""+a.id+"\" " + (estado.comparando.indexOf(a.id)!==-1?"checked":"") + " onchange=\"window._qlToggleComp('"+a.id+"')\"> ";
          return "<tr style=\"cursor:pointer\">"
            + "<td style=\"padding:8px 6px\">" + cb + "</td>"
            + "<td style=\"padding:8px 6px\">" + icon + " " + cLbl + " " + ref + "</td>"
            + "<td style=\"padding:8px 6px\">" + fNome + "</td>"
            + "<td style=\"padding:8px 6px\">" + sNome + "</td>"
            + "<td style=\"padding:8px 6px\">" + tNome + "</td>"
            + "<td style=\"padding:8px 6px\">" + (a.tipo_analise||"-") + "</td>"
            + "<td style=\"padding:8px 6px\">" + fmtDate(a.data_analise) + "</td>"
            + "<td style=\"padding:8px 6px;white-space:nowrap\">"
              + "<button onclick=\"window._qlVerDetalhe('"+a.id+"')\">Ver</button> "
              + "<button onclick=\"window._qlExcluir('"+a.id+"')\">&#128465;</button>"
            + "</td>"
            + "</tr>";
        }).join("");

    cont.innerHTML = "<div style=\"padding:20px\">"
      + "<div style=\"display:flex;justify-content:space-between;align-items:center;margin-bottom:16px\">"
        + "<div>"
          + "<h2 style=\"margin:0;color:#1A2E1A\">&#128203; Qualidade de Lotes</h2>"
          + "<p style=\"margin:4px 0 0;color:#666;font-size:13px\">Registre e acompanhe análises de qualidade por lote, safra e cultura</p>"
        + "</div>"
        + "<div style=\"display:flex;gap:8px\">"
          + "<button id=\"btnComparar\" onclick=\"window._qlComparar()\" style=\"background:#1976D2;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:13px\">&#128201; Comparar Selecionados</button>"
          + "<button onclick=\"window._qlNovaAnalise()\" style=\"background:#7CB342;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:13px\">+ Nova Análise</button>"
        + "</div>"
      + "</div>"
      + "<div style=\"display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;background:#f5f5f5;padding:12px;border-radius:8px\">"
        + "<select id=\"filtFaz\" onchange=\"window._qlFiltro()\" style=\"padding:6px;border:1px solid #ddd;border-radius:4px\">" + optFaz + "</select>"
        + "<select id=\"filtSaf\" onchange=\"window._qlFiltro()\" style=\"padding:6px;border:1px solid #ddd;border-radius:4px\">" + optSaf + "</select>"
        + "<select id=\"filtCult\" onchange=\"window._qlFiltro()\" style=\"padding:6px;border:1px solid #ddd;border-radius:4px\">" + optCult + "</select>"
        + "<select id=\"filtTipo\" onchange=\"window._qlFiltro()\" style=\"padding:6px;border:1px solid #ddd;border-radius:4px\">" + optTipo + "</select>"
      + "</div>"
      + "<div style=\"overflow-x:auto\">"
        + "<table style=\"width:100%;border-collapse:collapse;font-size:13px\">"
          + "<thead><tr style=\"background:#1A2E1A;color:#fff\">"
            + "<th style=\"padding:10px 6px;text-align:left;width:32px\">&#10003;</th>"
            + "<th style=\"padding:10px 6px;text-align:left\">Cultura</th>"
            + "<th style=\"padding:10px 6px;text-align:left\">Fazenda</th>"
            + "<th style=\"padding:10px 6px;text-align:left\">Safra</th>"
            + "<th style=\"padding:10px 6px;text-align:left\">Talhão</th>"
            + "<th style=\"padding:10px 6px;text-align:left\">Tipo</th>"
            + "<th style=\"padding:10px 6px;text-align:left\">Data</th>"
            + "<th style=\"padding:10px 6px;text-align:left\">Ações</th>"
          + "</tr></thead>"
          + "<tbody>" + rows + "</tbody>"
        + "</table>"
      + "</div>"
    + "</div>";

    // restore filter values
    var sf = document.getElementById("filtFaz");  if(sf && estado.filtroFaz)  sf.value = estado.filtroFaz;
    var ss = document.getElementById("filtSaf");  if(ss && estado.filtroSaf)  ss.value = estado.filtroSaf;
    var sc = document.getElementById("filtCult"); if(sc && estado.filtroCult) sc.value = estado.filtroCult;
    var st = document.getElementById("filtTipo"); if(st && estado.filtroTipo) st.value = estado.filtroTipo;
  }
  // ── FORMULÁRIO ──────────────────────────────────────────────
  function renderForm(analiseExist) {
    var isEdit = analiseExist && analiseExist.id;
    var a = analiseExist || {};
    var cultAtual = a.cultura || "cafe";

    var optFazF = fazendas.map(function(f){ return "<option value=\""+f.id+"\"" + (a.fazenda_id===f.id?" selected":"") + ">"+ f.nome +"</option>"; }).join("");
    var optSafF = safras.map(function(s){ return "<option value=\""+s.id+"\"" + (a.safra_id===s.id?" selected":"") + ">"+ s.nome +" ("+ s.ano_agricola +")</option>"; }).join("");
    var optTalF = talhoes.map(function(t){ return "<option value=\""+t.id+"\"" + (a.talhao_id===t.id?" selected":"") + ">"+ t.nome +"</option>"; }).join("");
    var optTipoF = tiposAnalise.map(function(t){ return "<option value=\""+t+"\"" + (a.tipo_analise===t?" selected":"") + ">"+ t +"</option>"; }).join("");

    var params = culturaParams[cultAtual] || [];
    var dadosQ = a.dados_qualidade || {};
    var paramFields = params.map(function(p) {
      var val = dadosQ[p.k] !== undefined ? dadosQ[p.k] : "";
      var inp = "";
      if (p.tipo === "textarea") {
        inp = "<textarea id=\"qp_"+p.k+"\" rows=\"2\" style=\"width:100%;padding:6px;border:1px solid #ddd;border-radius:4px;font-size:13px\">"+val+"</textarea>";
      } else {
        inp = "<input type=\"" + p.tipo + "\" id=\"qp_"+p.k+"\" value=\""+val+"\" style=\"width:100%;padding:6px;border:1px solid #ddd;border-radius:4px;font-size:13px\"" + (p.tipo==="number"?" step=\"0.01\"":"") + ">";
      }
      return "<div style=\"margin-bottom:12px\">"
        + "<label style=\"display:block;font-size:12px;color:#555;margin-bottom:4px;font-weight:600\">"+ p.l + (p.un ? " ("+p.un+")" : "") +"</label>"
        + inp
        + "</div>";
    }).join("");

    cont.innerHTML = "<div style=\"max-width:900px;margin:0 auto;padding:20px\">"
      + "<div style=\"display:flex;align-items:center;gap:12px;margin-bottom:20px\">"
        + "<button onclick=\"window._qlVoltar()\" style=\"background:#eee;border:none;padding:8px 14px;border-radius:6px;cursor:pointer\">&#8592; Voltar</button>"
        + "<h2 style=\"margin:0;color:#1A2E1A\">" + (isEdit?"Editar":"Nova") + " Análise de Qualidade</h2>"
      + "</div>"
      + "<div style=\"background:#fff;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.1);padding:24px\">"
        + "<h3 style=\"margin:0 0 16px;color:#1A2E1A;border-bottom:2px solid #7CB342;padding-bottom:8px\">Identificação do Lote</h3>"
        + "<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px\">"
          + "<div>"
            + "<label style=\"display:block;font-size:12px;color:#555;margin-bottom:4px;font-weight:600\">Cultura *</label>"
            + "<select id=\"fCultura\" onchange=\"window._qlChangeCultura()\" style=\"width:100%;padding:8px;border:1px solid #ddd;border-radius:4px\">"
              + "<option value=\"cafe\"" + (cultAtual==="cafe"?" selected":"") + ">Café</option>"
              + "<option value=\"soja\"" + (cultAtual==="soja"?" selected":"") + ">Soja</option>"
              + "<option value=\"milho\"" + (cultAtual==="milho"?" selected":"") + ">Milho</option>"
              + "<option value=\"cana\"" + (cultAtual==="cana"?" selected":"") + ">Cana-de-Açúcar</option>"
            + "</select>"
          + "</div>"
          + "<div>"
            + "<label style=\"display:block;font-size:12px;color:#555;margin-bottom:4px;font-weight:600\">Fazenda *</label>"
            + "<select id=\"fFazenda\" style=\"width:100%;padding:8px;border:1px solid #ddd;border-radius:4px\"><option value=\"\">Selecione...</option>" + optFazF + "</select>"
          + "</div>"
          + "<div>"
            + "<label style=\"display:block;font-size:12px;color:#555;margin-bottom:4px;font-weight:600\">Safra</label>"
            + "<select id=\"fSafra\" style=\"width:100%;padding:8px;border:1px solid #ddd;border-radius:4px\"><option value=\"\">Selecione...</option>" + optSafF + "</select>"
          + "</div>"
          + "<div>"
            + "<label style=\"display:block;font-size:12px;color:#555;margin-bottom:4px;font-weight:600\">Talhão</label>"
            + "<select id=\"fTalhao\" style=\"width:100%;padding:8px;border:1px solid #ddd;border-radius:4px\"><option value=\"\">Selecione...</option>" + optTalF + "</select>"
          + "</div>"
          + "<div>"
            + "<label style=\"display:block;font-size:12px;color:#555;margin-bottom:4px;font-weight:600\">Tipo de Análise *</label>"
            + "<select id=\"fTipoAn\" style=\"width:100%;padding:8px;border:1px solid #ddd;border-radius:4px\"><option value=\"\">Selecione...</option>" + optTipoF + "</select>"
          + "</div>"
          + "<div>"
            + "<label style=\"display:block;font-size:12px;color:#555;margin-bottom:4px;font-weight:600\">Data da Análise *</label>"
            + "<input type=\"date\" id=\"fData\" value=\"" + (a.data_analise||"") + "\" style=\"width:100%;padding:8px;border:1px solid #ddd;border-radius:4px\">"
          + "</div>"
          + "<div>"
            + "<label style=\"display:block;font-size:12px;color:#555;margin-bottom:4px;font-weight:600\">Responsável / Avaliador</label>"
            + "<input type=\"text\" id=\"fResp\" value=\"" + (a.responsavel||"") + "\" placeholder=\"Nome ou laboratório\" style=\"width:100%;padding:8px;border:1px solid #ddd;border-radius:4px\">"
          + "</div>"
          + "<div>"
            + "<label style=\"display:block;font-size:12px;color:#555;margin-bottom:4px;font-weight:600\">Lote / Referência</label>"
            + "<input type=\"text\" id=\"fLote\" value=\"" + (a.lote_ref||"") + "\" placeholder=\"Ex: L-2024-001\" style=\"width:100%;padding:8px;border:1px solid #ddd;border-radius:4px\">"
          + "</div>"
          + "<div style=\"display:flex;align-items:center;gap:8px;padding-top:20px\">"
            + "<input type=\"checkbox\" id=\"fRefLote\"" + (a.referencia_lote?" checked":"") + ">"
            + "<label for=\"fRefLote\" style=\"font-size:13px;cursor:pointer\">Marcar como análise de referência do lote</label>"
          + "</div>"
        + "</div>"
        + "<h3 style=\"margin:0 0 16px;color:#1A2E1A;border-bottom:2px solid #7CB342;padding-bottom:8px\">Parâmetros de Qualidade</h3>"
        + "<div id=\"paramArea\" style=\"display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px\">" + paramFields + "</div>"
        + "<h3 style=\"margin:16px 0 12px;color:#1A2E1A;border-bottom:2px solid #7CB342;padding-bottom:8px\">Observações</h3>"
        + "<textarea id=\"fObs\" rows=\"3\" placeholder=\"Observações gerais, recomendações técnicas...\" style=\"width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:13px\">" + (a.observacoes||"") + "</textarea>"
        + "<div style=\"display:flex;gap:8px;justify-content:flex-end;margin-top:16px\">"
          + "<button onclick=\"window._qlVoltar()\" style=\"background:#eee;border:none;padding:10px 20px;border-radius:6px;cursor:pointer\">Cancelar</button>"
          + "<button onclick=\"window._qlSalvar()\" style=\"background:#7CB342;color:#fff;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:600\">Salvar Análise</button>"
        + "</div>"
      + "</div>"
    + "</div>";
  }
  // ── DETALHE ─────────────────────────────────────────────────
  function renderDetalhe(analise) {
    if (!analise) { estado.modo="lista"; render(); return; }
    var cult = analise.cultura || "cafe";
    var params = culturaParams[cult] || [];
    var dadosQ = analise.dados_qualidade || {};
    var fNome = analise.fazendas ? analise.fazendas.nome : "-";
    var sNome = analise.safras   ? analise.safras.nome   : "-";
    var tNome = analise.talhoes  ? analise.talhoes.nome  : "-";
    var alertas = [];
    var paramRows = params.map(function(p) {
      var val = dadosQ[p.k];
      if (val === undefined || val === null || val === "") return "";
      var alerta = "";
      if (p.tipo === "number" && p.alerta > 0) {
        var v = parseFloat(val);
        if (!isNaN(v)) {
          // For umidade/impureza/defeitos etc: alert if ABOVE threshold
          // For bebida/sensorial/proteina/atr: alert if BELOW threshold
          var alertaTipo = (p.k==="bebida"||p.k==="sensorial"||p.k==="proteina"||p.k==="oleo"||p.k==="atr"||p.k==="pureza"||p.k==="ph") ? "below" : "above";
          if (alertaTipo==="above" && v > p.alerta) {
            alerta = "<span style=\"color:#e53935;font-size:10px;margin-left:4px\">&#9888; Acima do limite</span>";
            alertas.push(p.l + ": " + v + p.un + " (limite " + p.alerta + p.un + ")");
          } else if (alertaTipo==="below" && v < p.alerta) {
            alerta = "<span style=\"color:#e53935;font-size:10px;margin-left:4px\">&#9888; Abaixo do mínimo</span>";
            alertas.push(p.l + ": " + v + p.un + " (mínimo " + p.alerta + p.un + ")");
          }
        }
      }
      return "<div style=\"background:#f9f9f9;border-radius:6px;padding:10px\">"
        + "<div style=\"font-size:11px;color:#888\">" + p.l + "</div>"
        + "<div style=\"font-size:18px;font-weight:700;color:#1A2E1A\">" + val + (p.un?" <small style=\"font-size:12px;font-weight:400\">"+p.un+"</small>":"") + alerta + "</div>"
        + "</div>";
    }).join("");

    var alertaBlock = alertas.length > 0
      ? "<div style=\"background:#fff3e0;border-left:4px solid #e53935;padding:12px;border-radius:6px;margin-bottom:16px\">"
          + "<strong style=\"color:#e53935\">&#9888; Alertas de Qualidade</strong><ul style=\"margin:6px 0 0;padding-left:20px\"><li>" + alertas.join("</li><li>") + "</li></ul></div>"
      : "<div style=\"background:#e8f5e9;border-left:4px solid #7CB342;padding:12px;border-radius:6px;margin-bottom:16px\"><strong style=\"color:#7CB342\">&#10003; Todos os parâmetros dentro do padrão</strong></div>";

    var refBadge = analise.referencia_lote ? " <span style=\"background:#7CB342;color:#fff;border-radius:4px;padding:2px 8px;font-size:11px\">REFERÊNCIA DO LOTE</span>" : "";

    cont.innerHTML = "<div style=\"max-width:900px;margin:0 auto;padding:20px\">"
      + "<div style=\"display:flex;align-items:center;gap:12px;margin-bottom:20px\">"
        + "<button onclick=\"window._qlVoltar()\" style=\"background:#eee;border:none;padding:8px 14px;border-radius:6px;cursor:pointer\">&#8592; Voltar</button>"
        + "<h2 style=\"margin:0;color:#1A2E1A\">" + (culturaIcon[cult]||"") + " Análise de " + (culturaLabel[cult]||cult) + refBadge + "</h2>"
        + "<button onclick=\"window._qlEditar()\" style=\"background:#1976D2;color:#fff;border:none;padding:8px 14px;border-radius:6px;cursor:pointer;margin-left:auto\">&#9998; Editar</button>"
      + "</div>"
      + "<div style=\"background:#fff;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.1);padding:24px;margin-bottom:16px\">"
        + "<div style=\"display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px\">"
          + "<div><small style=\"color:#888\">Fazenda</small><br><strong>" + fNome + "</strong></div>"
          + "<div><small style=\"color:#888\">Safra</small><br><strong>" + sNome + "</strong></div>"
          + "<div><small style=\"color:#888\">Talhão</small><br><strong>" + tNome + "</strong></div>"
          + "<div><small style=\"color:#888\">Tipo</small><br><strong>" + (analise.tipo_analise||"-") + "</strong></div>"
          + "<div><small style=\"color:#888\">Data</small><br><strong>" + fmtDate(analise.data_analise) + "</strong></div>"
          + "<div><small style=\"color:#888\">Responsável</small><br><strong>" + (analise.responsavel||"-") + "</strong></div>"
          + "<div><small style=\"color:#888\">Lote/Ref</small><br><strong>" + (analise.lote_ref||"-") + "</strong></div>"
        + "</div>"
        + alertaBlock
        + "<h3 style=\"margin:0 0 12px;color:#1A2E1A;border-bottom:2px solid #7CB342;padding-bottom:6px\">Parâmetros de Qualidade</h3>"
        + "<div style=\"display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px\">" + paramRows + "</div>"
        + (analise.observacoes ? "<div style=\"background:#f5f5f5;border-radius:6px;padding:12px\">"
            + "<small style=\"color:#888\">Observações</small>"
            + "<p style=\"margin:4px 0 0\">" + analise.observacoes + "</p></div>" : "")
      + "</div>"
    + "</div>";
  }

  // ── COMPARAR ─────────────────────────────────────────────────
  function renderComparar() {
    var selecionadas = analises.filter(function(a){ return estado.comparando.indexOf(a.id) !== -1; });
    if (selecionadas.length < 2) {
      alert("Selecione pelo menos 2 análises para comparar.");
      estado.modo="lista"; render(); return;
    }
    var cult = selecionadas[0].cultura || "cafe";
    var params = culturaParams[cult] || [];

    var headerCols = selecionadas.map(function(a){ return "<th style=\"padding:8px;background:#1A2E1A;color:#fff\">" + fmtDate(a.data_analise) + "<br><small>" + (a.tipo_analise||"") + "</small></th>"; }).join("");
    var rows = params.map(function(p) {
      var vals = selecionadas.map(function(a){ return (a.dados_qualidade||{})[p.k]; });
      var hasData = vals.some(function(v){ return v!==undefined && v!==""; });
      if (!hasData) return "";
      var cells = vals.map(function(v){ return "<td style=\"padding:8px;text-align:center\">" + (v!==undefined&&v!==""?v+(" "+p.un).trim():"-") + "</td>"; }).join("");
      return "<tr><td style=\"padding:8px;font-weight:600;background:#f5f5f5\">" + p.l + "</td>" + cells + "</tr>";
    }).join("");

    cont.innerHTML = "<div style=\"max-width:1000px;margin:0 auto;padding:20px\">"
      + "<div style=\"display:flex;align-items:center;gap:12px;margin-bottom:20px\">"
        + "<button onclick=\"window._qlVoltar()\" style=\"background:#eee;border:none;padding:8px 14px;border-radius:6px;cursor:pointer\">&#8592; Voltar</button>"
        + "<h2 style=\"margin:0;color:#1A2E1A\">&#128201; Comparativo de Análises</h2>"
      + "</div>"
      + "<div style=\"background:#fff;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.1);padding:24px\">"
        + "<div style=\"overflow-x:auto\">"
          + "<table style=\"width:100%;border-collapse:collapse;font-size:13px\">"
            + "<thead><tr>"
              + "<th style=\"padding:8px;background:#1A2E1A;color:#fff;text-align:left\">Parâmetro</th>"
              + headerCols
            + "</tr></thead>"
            + "<tbody>" + rows + "</tbody>"
          + "</table>"
        + "</div>"
      + "</div>"
    + "</div>";
  }
  // ── Callbacks globais ────────────────────────────────────────
  window._qlNovaAnalise = function() { estado.modo="form"; estado.analise=null; renderForm(null); };
  window._qlVoltar = function() { estado.modo="lista"; render(); };
  window._qlEditar = function() { estado.modo="form"; renderForm(estado.analise); };
  window._qlFiltro = function() {
    var sf = document.getElementById("filtFaz");
    var ss = document.getElementById("filtSaf");
    var sc = document.getElementById("filtCult");
    var st = document.getElementById("filtTipo");
    estado.filtroFaz  = sf ? sf.value : "";
    estado.filtroSaf  = ss ? ss.value : "";
    estado.filtroCult = sc ? sc.value : "";
    estado.filtroTipo = st ? st.value : "";
    renderLista();
  };

  window._qlVerDetalhe = function(id) {
    var a = analises.find(function(x){ return x.id === id; });
    if (!a) return;
    estado.analise = a;
    estado.modo = "detalhe";
    renderDetalhe(a);
  };

  window._qlToggleComp = function(id) {
    var idx = estado.comparando.indexOf(id);
    if (idx === -1) estado.comparando.push(id);
    else estado.comparando.splice(idx,1);
  };

  window._qlComparar = function() {
    if (estado.comparando.length < 2) { alert("Selecione pelo menos 2 análises usando as caixas de seleção."); return; }
    estado.modo = "comparar";
    renderComparar();
  };

  window._qlChangeCultura = function() {
    var el = document.getElementById("fCultura");
    if (!el) return;
    var cult = el.value;
    var params = culturaParams[cult] || [];
    var dadosQ = {};
    var paramFields = params.map(function(p) {
      var inp = "";
      if (p.tipo === "textarea") {
        inp = "<textarea id=\"qp_"+p.k+"\" rows=\"2\" style=\"width:100%;padding:6px;border:1px solid #ddd;border-radius:4px;font-size:13px\"></textarea>";
      } else {
        inp = "<input type=\"" + p.tipo + "\" id=\"qp_"+p.k+"\" style=\"width:100%;padding:6px;border:1px solid #ddd;border-radius:4px;font-size:13px\"" + (p.tipo==="number"?" step=\"0.01\"":"") + ">";
      }
      return "<div style=\"margin-bottom:12px\">"
        + "<label style=\"display:block;font-size:12px;color:#555;margin-bottom:4px;font-weight:600\">"+ p.l + (p.un?" ("+p.un+")":"") +"</label>"
        + inp
        + "</div>";
    }).join("");
    var area = document.getElementById("paramArea");
    if (area) area.innerHTML = paramFields;
  };

  window._qlSalvar = async function() {
    var cult    = (document.getElementById("fCultura") || {}).value || "";
    var fazId   = (document.getElementById("fFazenda") || {}).value || null;
    var safId   = (document.getElementById("fSafra")   || {}).value || null;
    var talId   = (document.getElementById("fTalhao")  || {}).value || null;
    var tipoAn  = (document.getElementById("fTipoAn")  || {}).value || null;
    var data    = (document.getElementById("fData")    || {}).value || null;
    var resp    = (document.getElementById("fResp")    || {}).value || null;
    var loteRef = (document.getElementById("fLote")    || {}).value || null;
    var refLote = (document.getElementById("fRefLote") || {}).checked || false;
    var obs     = (document.getElementById("fObs")     || {}).value || null;

    if (!cult || !fazId || !data || !tipoAn) {
      alert("Preencha: Cultura, Fazenda, Tipo de Análise e Data.");
      return;
    }

    var params = culturaParams[cult] || [];
    var dadosQ = {};
    params.forEach(function(p) {
      var el = document.getElementById("qp_" + p.k);
      if (el && el.value !== "") {
        dadosQ[p.k] = p.tipo === "number" ? parseFloat(el.value) : el.value;
      }
    });

    var payload = {
      cultura: cult,
      fazenda_id: fazId,
      safra_id: safId || null,
      talhao_id: talId || null,
      tipo_analise: tipoAn,
      data_analise: data,
      responsavel: resp,
      lote_ref: loteRef,
      referencia_lote: refLote,
      dados_qualidade: dadosQ,
      observacoes: obs
    };

    var res;
    if (estado.analise && estado.analise.id) {
      res = await sb.from("qualidade_analise").update(payload).eq("id", estado.analise.id);
    } else {
      res = await sb.from("qualidade_analise").insert(payload);
    }

    if (res.error) {
      alert("Erro ao salvar: " + res.error.message);
      return;
    }

    // Reload data
    var aRes2 = await sb.from("qualidade_analise").select("*,fazendas(nome),safras(nome,cultura,ano_agricola),talhoes(nome)").order("data_analise",{ascending:false});
    analises = aRes2.error ? [] : (aRes2.data || []);
    estado.modo = "lista";
    estado.analise = null;
    render();
  };

  window._qlExcluir = async function(id) {
    if (!confirm("Excluir esta análise de qualidade?")) return;
    var res = await sb.from("qualidade_analise").delete().eq("id",id);
    if (res.error) { alert("Erro: " + res.error.message); return; }
    analises = analises.filter(function(a){ return a.id !== id; });
    render();
  };

  // ── Render inicial ───────────────────────────────────────────
  render();
};
window.module_qualidade_lotes();
