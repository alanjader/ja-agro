// ============================================================
// JA AGROTEC · Modulo Produtor — História
// admin-sobre-historia.js
// ============================================================
window['module_sobre-historia'] = function() {
  const mc = document.getElementById('mainContent');
  if (!mc) return;
  mc.innerHTML =
    '<div class="page-header topbar-content">' +
      '<div class="topbar-title"><span>📖 História</span></div>' +
    '</div>' +
    '<div class="card" style="padding:24px;max-width:980px;margin:0 auto">' +
            '<h1 style="color:var(--green);margin-bottom:8px">📖 História do JA Agrotec</h1>' +
            '<p style="color:var(--muted);margin-bottom:20px">A trajetória de uma plataforma feita por e para produtores</p>' +
            '<h2 style="margin-top:20px;color:var(--dark)">Origem (2024)</h2>' +
            '<p style="line-height:1.7;margin-top:8px">' +
              'O projeto nasceu da observação de que pequenos e médios produtores rurais precisavam de uma ' +
              'ferramenta digital simples, em português, com modo offline (pelas dificuldades de conectividade no campo) ' +
              'e que falasse a linguagem da operação real — não a do contador ou do agrônomo isolado, mas a do dia-a-dia.' +
            '</p>' +
            '<h2 style="margin-top:20px;color:var(--dark)">JA Agro Intelligence v1.0 (Abril 2026)</h2>' +
            '<p style="line-height:1.7;margin-top:8px">' +
              'Primeira versão pública, batizada de "JA Agro Intelligence", focada exclusivamente na gestão da ' +
              'propriedade. Lançado com 22 módulos operacionais cobrindo desde cadastro de fazendas até vendas de grãos.' +
            '</p>' +
            '<h2 style="margin-top:20px;color:var(--dark)">JA Agrotec — Módulo Produtor v1.1 (Maio 2026)</h2>' +
            '<p style="line-height:1.7;margin-top:8px">' +
              'O sistema é renomeado para integrar o <b>ecossistema JA Agrotec</b>, que passa a contemplar três módulos ' +
              'complementares (Produtor, Cooperativa, Agenda). Esta é a versão atual, com 15 bugs corrigidos via QA ' +
              'estruturado e nova arquitetura preparando integrações entre os módulos.' +
            '</p>' +
            '<h2 style="margin-top:20px;color:var(--dark)">Próximos passos</h2>' +
            '<ul style="margin:8px 0 0 24px;line-height:1.9">' +
              '<li>Módulo Cooperativa — recebimento, classificação e comercialização agregada</li>' +
              '<li>Módulo Agenda — calendário operacional integrado</li>' +
              '<li>Integrações Produtor ↔ Cooperativa (entregas, contratos)</li>' +
              '<li>App mobile dedicado para apontamentos de campo</li>' +
            '</ul>' +
    '</div>';
};
