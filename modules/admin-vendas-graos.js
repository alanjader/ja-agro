window.module_vendas_graos = async function() {
  var c = document.getElementById("mainContent");
  if (!c) return;
  c.innerHTML = "<div style=\"padding:16px\"><p>Carregando...</p></div>";

  // Load fazendas for filter
  var fRes = await sb.from("fazendas").select("id,nome").eq("ativo",true).order("nome");
  var fazendas = (fRes.data || []);

  // Load safras
  var sRes = await sb.from("safras").select("id,nome,cultura,ano_agricola,fazenda_id,status").order("criado_em",{ascending:false});
  var safras = (sRes.data || []);

  // Load existing vendas
  var vRes = await sb.from("vendas_graos").select("*,fazendas(nome),safras(nome,cultura)").order("criado_em",{ascending:false});
  var vendas = (vRes.data || []);

  // Load entregas
  var eRes = await sb.from("entregas_graos").select("*,vendas_graos(cultura,tipo_contrato),talhoes(nome)");
  var entregas = (eRes.data || []);

  // KPIs
  var totalContratado = vendas.reduce(function(a,v){ return a + parseFloat(v.quantidade_sc||0); },0);
  var totalEntregue = entregas.reduce(function(a,e){ return a + parseFloat(e.quantidade_sc||0); },0);
  var totalReceita = vendas.reduce(function(a,v){ return a + (parseFloat(v.quantidade_sc||0)*parseFloat(v.preco_saca||0)); },0);
  var precoMedio = totalContratado > 0 ? (totalReceita/totalContratado) : 0;
  var saldoEntregar = totalContratado - totalEntregue;

  // Build Fazenda options
  var fazOpts = fazendas.map(function(f){ return "<option value=\""+f.id+"\">"+f.nome+"</option>"; }).join("");
  var safOpts = safras.map(function(s){ return "<option value=\""+s.id+"\">"+s.nome+" ("+s.cultura+" "+s.ano_agricola+")</option>"; }).join("");

  function fmtSc(n){ return parseFloat(n||0).toLocaleString("pt-BR",{minimumFractionDigits:0,maximumFractionDigits:1}); }
  function fmtBrl(n){ return "R$ "+parseFloat(n||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function fmtDate(d){ if(!d) return ""; var p=d.split("-"); return p[2]+"/"+p[1]+"/"+p[0]; }

  var html = "";
  html += "<div style=\"max-width:1200px;margin:0 auto;padding:8px 0\">"
  html += "<div style=\"display:flex;align-items:center;justify-content:space-between;margin-bottom:20px\">"
  html += "<div><h2 style=\"margin:0;font-size:22px;color:#1a2e1a\">&#127807; Vendas</h2>"
  html += "<p style=\"margin:2px 0 0;color:#666;font-size:13px\">Contratos, entregas parciais e receita</p></div>"
  html += "<button onclick=\"window._vgShowForm();\" style=\"background:#2d7d32;color:#fff;border:none;border-radius:8px;padding:10px 20px;cursor:pointer;font-size:13px;font-weight:600\">+ Novo Contrato</button>"
  html += "</div>"

  // KPIs
  html += "<div style=\"display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px\">"
  html += "<div style=\"background:#fff;border-radius:12px;padding:16px;border-left:4px solid #2d7d32;box-shadow:0 1px 4px rgba(0,0,0,0.08)\">"
  html += "<div style=\"font-size:11px;text-transform:uppercase;color:#888;letter-spacing:0.5px\">Contratado</div>"
  html += "<div style=\"font-size:24px;font-weight:700;color:#2d7d32;margin:4px 0\">"+fmtSc(totalContratado)+" sc</div>"
  html += "<div style=\"font-size:11px;color:#888\">"+vendas.length+" contrato(s)</div></div>"

  html += "<div style=\"background:#fff;border-radius:12px;padding:16px;border-left:4px solid #1565c0;box-shadow:0 1px 4px rgba(0,0,0,0.08)\">"
  html += "<div style=\"font-size:11px;text-transform:uppercase;color:#888;letter-spacing:0.5px\">Entregue</div>"
  html += "<div style=\"font-size:24px;font-weight:700;color:#1565c0;margin:4px 0\">"+fmtSc(totalEntregue)+" sc</div>"
  html += "<div style=\"font-size:11px;color:#888\">"+entregas.length+" entrega(s)</div></div>"

  html += "<div style=\"background:#fff;border-radius:12px;padding:16px;border-left:4px solid #e65100;box-shadow:0 1px 4px rgba(0,0,0,0.08)\">"
  html += "<div style=\"font-size:11px;text-transform:uppercase;color:#888;letter-spacing:0.5px\">Saldo a Entregar</div>"
  html += "<div style=\"font-size:24px;font-weight:700;color:#e65100;margin:4px 0\">"+fmtSc(saldoEntregar)+" sc</div>"
  html += "<div style=\"font-size:11px;color:#888\">"+(totalContratado>0?Math.round((totalEntregue/totalContratado)*100):0)+"% entregue</div></div>"

  html += "<div style=\"background:#fff;border-radius:12px;padding:16px;border-left:4px solid #7b1fa2;box-shadow:0 1px 4px rgba(0,0,0,0.08)\">"
  html += "<div style=\"font-size:11px;text-transform:uppercase;color:#888;letter-spacing:0.5px\">Receita Total</div>"
  html += "<div style=\"font-size:24px;font-weight:700;color:#7b1fa2;margin:4px 0\">"+fmtBrl(totalReceita)+"</div>"
  html += "<div style=\"font-size:11px;color:#888\">Pm: "+fmtBrl(precoMedio)+"/sc</div></div>"
  html += "</div>"

  // Form panel (hidden by default)
  html += "<div id=\"vgFormPanel\" style=\"display:none;background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,0.1);margin-bottom:20px\">"
  html += "<h3 style=\"margin:0 0 16px;font-size:16px\">&#128196; Novo Contrato de Venda</h3>"
  html += "<div style=\"display:grid;grid-template-columns:repeat(3,1fr);gap:12px\">"
  html += "<div><label style=\"font-size:12px;color:#555;display:block;margin-bottom:4px\">Fazenda *</label>"
  html += "<select id=\"vgFazenda\" style=\"width:100%;padding:8px;border:1px solid #ddd;border-radius:6px\"><option value=\"\">Selecione...</option>"+fazOpts+"</select></div>"
  html += "<div><label style=\"font-size:12px;color:#555;display:block;margin-bottom:4px\">Safra *</label>"
  html += "<select id=\"vgSafra\" style=\"width:100%;padding:8px;border:1px solid #ddd;border-radius:6px\"><option value=\"\">Selecione...</option>"+safOpts+"</select></div>"
  html += "<div><label style=\"font-size:12px;color:#555;display:block;margin-bottom:4px\">Cultura *</label>"
  html += "<input id=\"vgCultura\" type=\"text\" placeholder=\"Soja, Milho...\" style=\"width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box\"></div>"
  html += "<div><label style=\"font-size:12px;color:#555;display:block;margin-bottom:4px\">Tipo Contrato</label>"
  html += "<select id=\"vgTipoContrato\" style=\"width:100%;padding:8px;border:1px solid #ddd;border-radius:6px\">"
  html += "<option value=\"disponivel\">Disponivel</option>"
  html += "<option value=\"forward\">Forward (Prazo)</option>"
  html += "<option value=\"troca\">Troca (Barter)</option>"
  html += "<option value=\"fixacao\">Fixacao</option>"
  html += "<option value=\"cbot\">CBOT (Bolsa)</option>"
  html += "</select></div>"
  html += "<div><label style=\"font-size:12px;color:#555;display:block;margin-bottom:4px\">Qtd Sacas *</label>"
  html += "<input id=\"vgQtdSc\" type=\"number\" min=\"0\" step=\"0.001\" placeholder=\"0\" style=\"width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box\"></div>"
  html += "<div><label style=\"font-size:12px;color:#555;display:block;margin-bottom:4px\">Preco/Saca (R$)</label>"
  html += "<input id=\"vgPrecoSc\" type=\"number\" min=\"0\" step=\"0.01\" placeholder=\"0.00\" style=\"width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box\"></div>"
  html += "<div><label style=\"font-size:12px;color:#555;display:block;margin-bottom:4px\">Data Contrato</label>"
  html += "<input id=\"vgDataContrato\" type=\"date\" style=\"width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box\"></div>"
  html += "<div><label style=\"font-size:12px;color:#555;display:block;margin-bottom:4px\">Data Entrega</label>"
  html += "<input id=\"vgDataEntrega\" type=\"date\" style=\"width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box\"></div>"
  html += "<div><label style=\"font-size:12px;color:#555;display:block;margin-bottom:4px\">Comprador</label>"
  html += "<input id=\"vgComprador\" type=\"text\" placeholder=\"Nome da trading...\" style=\"width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box\"></div>"
  html += "<div><label style=\"font-size:12px;color:#555;display:block;margin-bottom:4px\">Numero Contrato</label>"
  html += "<input id=\"vgNumContrato\" type=\"text\" style=\"width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box\"></div>"
  html += "</div>"
  html += "<div style=\"margin-top:12px;display:flex;gap:8px\">"
  html += "<button onclick=\"window._vgSalvar();\" style=\"background:#2d7d32;color:#fff;border:none;border-radius:8px;padding:10px 24px;cursor:pointer;font-weight:600\">Salvar Contrato</button>"
  html += "<button onclick=\"window._vgHideForm();\" style=\"background:#eee;color:#333;border:none;border-radius:8px;padding:10px 24px;cursor:pointer\">Cancelar</button>"
  html += "</div>"
  html += "</div>"

  // Contracts table
  html += "<div style=\"background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.08);overflow:hidden\">"
  html += "<div style=\"padding:16px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center\">"
  html += "<h3 style=\"margin:0;font-size:15px\">&#128196; Contratos</h3>"
  html += "</div>"
  if (vendas.length === 0) {
    html += "<div style=\"padding:40px;text-align:center;color:#999\">Nenhum contrato cadastrado ainda</div>"
  } else {
    html += "<table style=\"width:100%;border-collapse:collapse;font-size:13px\">"
    html += "<thead><tr style=\"background:#f8f9fa\">"
    html += "<th style=\"padding:10px 12px;text-align:left;color:#555;font-weight:600;border-bottom:1px solid #eee\">Fazenda</th>"
    html += "<th style=\"padding:10px 12px;text-align:left;color:#555;font-weight:600;border-bottom:1px solid #eee\">Safra</th>"
    html += "<th style=\"padding:10px 12px;text-align:left;color:#555;font-weight:600;border-bottom:1px solid #eee\">Tipo</th>"
    html += "<th style=\"padding:10px 12px;text-align:right;color:#555;font-weight:600;border-bottom:1px solid #eee\">Qtd (sc)</th>"
    html += "<th style=\"padding:10px 12px;text-align:right;color:#555;font-weight:600;border-bottom:1px solid #eee\">Preco/sc</th>"
    html += "<th style=\"padding:10px 12px;text-align:right;color:#555;font-weight:600;border-bottom:1px solid #eee\">Total</th>"
    html += "<th style=\"padding:10px 12px;text-align:center;color:#555;font-weight:600;border-bottom:1px solid #eee\">Status</th>"
    html += "<th style=\"padding:10px 12px;text-align:center;color:#555;font-weight:600;border-bottom:1px solid #eee\">Acoes</th>"
    html += "</tr></thead><tbody>"
    var statusColors = {aberto:"#e8f5e9|#2d7d32",parcialmente_entregue:"#fff3e0|#e65100",entregue:"#e3f2fd|#1565c0",cancelado:"#fce4ec|#c62828"};
    vendas.forEach(function(v) {
      var sc = v.statusColors || (statusColors[v.status] || "#f5f5f5|#666");
      var scParts = (statusColors[v.status]||"#f5f5f5|#666").split("|");
      var bg = scParts[0]; var fg = scParts[1];
      var total = parseFloat(v.quantidade_sc||0)*parseFloat(v.preco_saca||0);
      var fzNome = v.fazendas ? v.fazendas.nome : "";
      var sfNome = v.safras ? v.safras.nome : "";
      var entVenda = entregas.filter(function(e){ return e.venda_id===v.id; });
      var entQtd = entVenda.reduce(function(a,e){ return a+parseFloat(e.quantidade_sc||0); },0);
      html += "<tr style=\"border-bottom:1px solid #f9f9f9;\">"
      html += "<td style=\"padding:10px 12px\">"+fzNome+"</td>"
      html += "<td style=\"padding:10px 12px\">"+sfNome+"</td>"
      html += "<td style=\"padding:10px 12px\">"+v.tipo_contrato+"</td>"
      html += "<td style=\"padding:10px 12px;text-align:right\">"+fmtSc(v.quantidade_sc)+"</td>"
      html += "<td style=\"padding:10px 12px;text-align:right\">"+fmtBrl(v.preco_saca)+"</td>"
      html += "<td style=\"padding:10px 12px;text-align:right;font-weight:600\">"+fmtBrl(total)+"</td>"
      html += "<td style=\"padding:10px 12px;text-align:center\"><span style=\"background:"+bg+";color:"+fg+";padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600\">"+v.status+"</span></td>"
      html += "<td style=\"padding:10px 12px;text-align:center\">"
      html += "<button onclick=\"window._vgEntrega('"+v.id+"','"+fmtSc(v.quantidade_sc-entQtd)+"');\" style=\"background:#1565c0;color:#fff;border:none;border-radius:4px;padding:4px 8px;cursor:pointer;font-size:11px;margin:0 2px\">+ Entrega</button>"
      html += "</td>"
      html += "</tr>"
      // Show deliveries sub-rows
      if (entVenda.length > 0) {
        entVenda.forEach(function(e){
          html += "<tr style=\"background:#f0f7ff;border-bottom:1px solid #e8f0fe\">"
          html += "<td colspan=\"2\" style=\"padding:6px 12px 6px 32px;font-size:12px;color:#1565c0\">&#8627; Entrega: "+fmtDate(e.data_entrega)+(e.talhoes?" - Talhao: "+e.talhoes.nome:"")+"</td>"
          html += "<td style=\"font-size:12px;color:#1565c0;padding:6px 12px\">"+e.nota_fiscal+"</td>"
          html += "<td style=\"text-align:right;font-size:12px;color:#1565c0;padding:6px 12px\">"+fmtSc(e.quantidade_sc)+" sc</td>"
          html += "<td colspan=\"4\"></td>"
          html += "</tr>"
        });
      }
    });
    html += "</tbody></table>"
  }
  html += "</div>"
  html += "</div>"

  // Set HTML
  c.innerHTML = "<div style=\"padding:16px\">" + html + "</div>";

  // Entrega modal
  window._vgEntrega = async function(vendaId, saldoDisp) {
    var tRes = await sb.from("talhoes").select("id,nome").eq("ativo",true);
    var tals = (tRes.data || []);
    var talOpts = tals.map(function(t){ return "<option value=\""+t.id+"\">"+t.nome+"</option>"; }).join("");
    var modal = document.createElement("div");
    modal.id = "vgModal";
    modal.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;";
    modal.innerHTML = "<div style=\"background:#fff;border-radius:16px;padding:28px;width:480px;max-width:95vw;box-shadow:0 8px 32px rgba(0,0,0,0.2)\">"
      +"<h3 style=\"margin:0 0 16px;font-size:17px\">&#128666; Registrar Entrega</h3>"
      +"<div style=\"display:grid;grid-template-columns:1fr 1fr;gap:12px\">"
      +"<div><label style=\"font-size:12px;color:#555;display:block;margin-bottom:4px\">Data *</label><input id=\"eData\" type=\"date\" style=\"width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box\"></div>"
      +"<div><label style=\"font-size:12px;color:#555;display:block;margin-bottom:4px\">Qtd Sacas *</label><input id=\"eQtd\" type=\"number\" min=\"0\" step=\"0.001\" max=\""+(saldoDisp)+"\"\ value=\""+(saldoDisp)+"\" style=\"width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box\"></div>"
      +"<div><label style=\"font-size:12px;color:#555;display:block;margin-bottom:4px\">Talhao</label><select id=\"eTalhao\" style=\"width:100%;padding:8px;border:1px solid #ddd;border-radius:6px\"><option value=\"\">Sem talhao</option>"+talOpts+"</select></div>"
      +"<div><label style=\"font-size:12px;color:#555;display:block;margin-bottom:4px\">Nota Fiscal</label><input id=\"eNF\" type=\"text\" style=\"width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box\"></div>"
      +"<div><label style=\"font-size:12px;color:#555;display:block;margin-bottom:4px\">Peso Bruto (kg)</label><input id=\"ePeso\" type=\"number\" style=\"width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box\"></div>"
      +"<div><label style=\"font-size:12px;color:#555;display:block;margin-bottom:4px\">Umidade (%)</label><input id=\"eUmidade\" type=\"number\" step=\"0.1\" style=\"width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box\"></div>"
      +"</div>"
      +"<div style=\"margin-top:16px;display:flex;gap:8px\">"
      +"<button onclick=\"window._vgSalvarEntrega('"+vendaId+"');\" style=\"background:#1565c0;color:#fff;border:none;border-radius:8px;padding:10px 24px;cursor:pointer;font-weight:600\">Confirmar Entrega</button>"
      +"<button onclick=\"document.getElementById('vgModal').remove();\" style=\"background:#eee;color:#333;border:none;border-radius:8px;padding:10px 24px;cursor:pointer\">Cancelar</button>"
      +"</div>"
      +"</div>";
    document.body.appendChild(modal);
  };

  window._vgSalvarEntrega = async function(vendaId) {
    var data = document.getElementById("eData").value;
    var qtd = parseFloat(document.getElementById("eQtd").value);
    var talhaoId = document.getElementById("eTalhao").value || null;
    var nf = document.getElementById("eNF").value;
    var peso = parseFloat(document.getElementById("ePeso").value) || null;
    var umid = parseFloat(document.getElementById("eUmidade").value) || null;
    if (!data || !qtd) { alert("Data e quantidade sao obrigatorios"); return; }
    // Get venda for fazenda_id
    var vRes = await sb.from("vendas_graos").select("fazenda_id,quantidade_sc").eq("id",vendaId).single();
    var payload = { venda_id:vendaId, fazenda_id:vRes.data.fazenda_id, talhao_id:talhaoId, data_entrega:data, quantidade_sc:qtd, nota_fiscal:nf||null, peso_bruto_kg:peso, umidade_pct:umid };
    var ins = await sb.from("entregas_graos").insert(payload);
    if (ins.error) { alert("Erro: "+ins.error.message); return; }
    // Update venda status
    var eSum = await sb.from("entregas_graos").select("quantidade_sc").eq("venda_id",vendaId);
    var totalE = (eSum.data||[]).reduce(function(a,e){ return a+parseFloat(e.quantidade_sc||0); },0);
    var newStatus = totalE >= parseFloat(vRes.data.quantidade_sc) ? "entregue" : "parcialmente_entregue";
    await sb.from("vendas_graos").update({status:newStatus}).eq("id",vendaId);
    document.getElementById("vgModal").remove();
    window.module_vendas_graos();
  };

  // Show/hide form
  window._vgShowForm = function() { document.getElementById("vgFormPanel").style.display="block"; };
  window._vgHideForm = function() { document.getElementById("vgFormPanel").style.display="none"; };

  // Save contract
  window._vgSalvar = async function() {
    var fazId = document.getElementById("vgFazenda").value;
    var safId = document.getElementById("vgSafra").value;
    var cultura = document.getElementById("vgCultura").value;
    var tipo = document.getElementById("vgTipoContrato").value;
    var qtd = parseFloat(document.getElementById("vgQtdSc").value);
    var preco = parseFloat(document.getElementById("vgPrecoSc").value);
    var dtC = document.getElementById("vgDataContrato").value;
    var dtE = document.getElementById("vgDataEntrega").value;
    var comprador = document.getElementById("vgComprador").value;
    var numC = document.getElementById("vgNumContrato").value;
    if (!fazId || !cultura || !qtd) { alert("Fazenda, cultura e quantidade sao obrigatorios"); return; }
    var payload = { fazenda_id:fazId, safra_id:safId||null, cultura:cultura, tipo_contrato:tipo, quantidade_sc:qtd, preco_saca:preco||0, data_contrato:dtC||null, data_entrega:dtE||null, comprador:comprador||null, numero_contrato:numC||null };
    var ins = await sb.from("vendas_graos").insert(payload);
    if (ins.error) { alert("Erro: "+ins.error.message); return; }
    window.module_vendas_graos();
  };

}; // end module_vendas_graos
window.module_vendas_graos();
