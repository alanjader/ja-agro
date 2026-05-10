// admin-documentos.js — Módulo Documentos / Anexos
// JA Agro Intelligence v2.0
// Repositório central de documentos vinculado a todos os módulos

window.module_documentos = async function(el) {
  const sb = window.supabase;

  const TIPOS_DOC = [
    { valor: 'NOTA_FISCAL',          icone: '🧾', label: 'Nota Fiscal' },
    { valor: 'CONTRATO',             icone: '📝', label: 'Contrato' },
    { valor: 'LAUDO_LABORATORIAL',   icone: '🔬', label: 'Laudo Laboratorial' },
    { valor: 'FOTO_AMOSTRA',         icone: '📷', label: 'Foto de Amostra' },
    { valor: 'FOTO_LOTE',            icone: '📸', label: 'Foto do Lote' },
    { valor: 'FOTO_CARGA',           icone: '🚛', label: 'Foto de Carga' },
    { valor: 'RELATORIO_TECNICO',    icone: '📊', label: 'Relatório Técnico' },
    { valor: 'CERTIFICADO',          icone: '🏅', label: 'Certificado' },
    { valor: 'DOCUMENTO_TRANSPORTE', icone: '📦', label: 'Doc. de Transporte' },
    { valor: 'RASTREABILIDADE',      icone: '🔍', label: 'Rastreabilidade' },
    { valor: 'ANALISE_SOLO',         icone: '🌱', label: 'Análise de Solo' },
    { valor: 'OUTROS',               icone: '📎', label: 'Outros' },
  ];

  const MODULOS_ORIGEM = [
    { valor: '',            label: 'Todos os módulos' },
    { valor: 'vendas',      label: 'Vendas' },
    { valor: 'qualidade',   label: 'Qualidade de Lotes' },
    { valor: 'certificacao',label: 'Certificação' },
    { valor: 'analise_solo',label: 'Análise de Solo' },
    { valor: 'safras',      label: 'Safras' },
    { valor: 'talhoes',     label: 'Talhões' },
    { valor: 'fazendas',    label: 'Fazendas' },
    { valor: 'insumos',     label: 'Insumos' },
    { valor: 'maquinas',    label: 'Máquinas' },
    { valor: 'lancamentos', label: 'Lançamentos' },
    { valor: 'outros',      label: 'Outros' },
  ];

  const EXTS_ACEITAS = '.pdf,.jpg,.jpeg,.png,.gif,.webp,.xlsx,.xls,.csv,.doc,.docx,.txt,.zip';
  let docs = [];
  let filtros = { tipo: '', modulo: '', texto: '', destaque: false };
  let viewMode = 'grid';

  // ── Helpers
  function getTipoInfo(v) { return TIPOS_DOC.find(t => t.valor === v) || { icone: '📎', label: v || 'Outros' }; }
  function getModuloLabel(v) { const m = MODULOS_ORIGEM.find(x => x.valor === v); return m ? m.label : (v || '—'); }
  function fmtData(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  function fmtSize(b) {
    if (!b) return '';
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b/1024).toFixed(1) + ' KB';
    return (b/1048576).toFixed(2) + ' MB';
  }
  function getIcone(nome, tipo) {
    const t = getTipoInfo(tipo);
    if (t.icone !== '📎') return t.icone;
    const ext = (nome || '').split('.').pop().toLowerCase();
    const m = { pdf: '📄', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️',
                xlsx: '📊', xls: '📊', csv: '📊',
                doc: '📝', docx: '📝', txt: '📝', zip: '🗂️' };
    return m[ext] || '📎';
  }
  function ehImagem(nome) {
    const ext = (nome || '').split('.').pop().toLowerCase();
    return ['jpg','jpeg','png','gif','webp'].includes(ext);
  }
  function sanitize(s) { return String(s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function $ (id) { return document.getElementById(id); }
  function on(id, ev, fn) { const el = $(id); if (el) el.addEventListener(ev, fn); }

  // ── CSS
  function injectCSS() {
    if (document.getElementById('doc-css')) return;
    const s = document.createElement('style');
    s.id = 'doc-css';
    s.textContent = [
      '#doc-module { padding:0 }',
      '.doc-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; padding:20px 24px 0 }',
      '.doc-header-left { display:flex; align-items:center; gap:12px }',
      '.doc-header h2 { font-size:22px; font-weight:700; color:var(--text); margin:0 }',
      '.doc-header p { font-size:13px; color:var(--muted); margin:0 }',
      '.doc-header-actions { display:flex; gap:8px; flex-wrap:wrap }',
      '.doc-btn { padding:8px 16px; border-radius:var(--r); border:none; cursor:pointer; font-size:13px; font-weight:600; transition:all .15s }',
      '.doc-btn-primary { background:var(--green); color:#fff }',
      '.doc-btn-primary:hover { background:var(--green2) }',
      '.doc-btn-secondary { background:rgba(255,255,255,.07); color:var(--text) }',
      '.doc-btn-secondary:hover { background:rgba(255,255,255,.12) }',
      '.doc-btn-icon { padding:8px 10px; background:rgba(255,255,255,.07); color:var(--text); border-radius:var(--r); border:none; cursor:pointer; font-size:16px }',
      '.doc-btn-icon:hover { background:rgba(255,255,255,.12) }',
      '.doc-btn-icon.active { background:rgba(124,179,66,.2); color:var(--green) }',
      '.doc-toolbar { display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:16px 24px; border-bottom:1px solid rgba(255,255,255,.06) }',
      '.doc-search { flex:1; min-width:200px; position:relative }',
      '.doc-search input { width:100%; padding:8px 12px 8px 36px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:var(--r); color:var(--text); font-size:13px; box-sizing:border-box }',
      '.doc-search input:focus { outline:none; border-color:var(--green) }',
      '.doc-search::before { content:"\ud83d\udd0d"; position:absolute; left:10px; top:50%; transform:translateY(-50%); font-size:14px; pointer-events:none }',
      '.doc-select { padding:8px 12px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:var(--r); color:var(--text); font-size:13px; cursor:pointer }',
      '.doc-toggle-destaque { display:flex; align-items:center; gap:6px; padding:8px 12px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:var(--r); color:var(--text); font-size:13px; cursor:pointer; white-space:nowrap }',
      '.doc-toggle-destaque.ativo { background:rgba(255,200,0,.1); border-color:rgba(255,200,0,.3); color:#ffc800 }',
      '.doc-stats { display:flex; gap:12px; flex-wrap:wrap; padding:16px 24px 0 }',
      '.doc-stat { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); border-radius:var(--r); padding:12px 16px; flex:1; min-width:120px; text-align:center }',
      '.doc-stat-num { font-size:24px; font-weight:700; color:var(--green) }',
      '.doc-stat-lbl { font-size:11px; color:var(--muted); margin-top:2px }',
      '.doc-content { padding:16px 24px 32px }',
      '.doc-section-title { font-size:11px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:.08em; margin:16px 0 10px }',
      '.doc-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:14px }',
      '.doc-card { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); border-radius:10px; padding:16px; cursor:pointer; transition:all .15s; position:relative }',
      '.doc-card:hover { background:rgba(255,255,255,.07); border-color:rgba(124,179,66,.3); transform:translateY(-2px) }',
      '.doc-card.destaque { border-color:rgba(255,200,0,.4) }',
      '.doc-card.destaque::before { content:"\u2b50"; position:absolute; top:8px; right:8px; font-size:12px }',
      '.doc-card-icon { font-size:36px; text-align:center; margin-bottom:10px }',
      '.doc-card-preview { width:100%; height:100px; object-fit:cover; border-radius:6px; margin-bottom:10px }',
      '.doc-card-name { font-size:13px; font-weight:600; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis }',
      '.doc-card-meta { font-size:11px; color:var(--muted); margin-top:4px }',
      '.doc-card-tipo { display:inline-block; background:rgba(124,179,66,.15); color:var(--green); font-size:10px; font-weight:700; padding:2px 7px; border-radius:10px; margin-top:6px }',
      '.doc-card-modulo { display:inline-block; background:rgba(255,255,255,.07); color:var(--muted); font-size:10px; padding:2px 7px; border-radius:10px; margin-top:4px; margin-left:4px }',
      '.doc-list { display:flex; flex-direction:column; gap:6px }',
      '.doc-list-item { display:flex; align-items:center; gap:14px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); border-radius:8px; padding:12px 16px; cursor:pointer; transition:all .15s }',
      '.doc-list-item:hover { background:rgba(255,255,255,.07); border-color:rgba(124,179,66,.3) }',
      '.doc-list-item.destaque { border-color:rgba(255,200,0,.3) }',
      '.doc-list-icon { font-size:24px; flex-shrink:0; width:32px; text-align:center }',
      '.doc-list-info { flex:1; min-width:0 }',
      '.doc-list-name { font-size:13px; font-weight:600; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis }',
      '.doc-list-meta { font-size:11px; color:var(--muted); margin-top:2px }',
      '.doc-list-right { display:flex; align-items:center; gap:8px; flex-shrink:0 }',
      '.doc-list-tipo { background:rgba(124,179,66,.15); color:var(--green); font-size:10px; font-weight:700; padding:2px 7px; border-radius:10px }',
      '.doc-list-size { font-size:11px; color:var(--muted) }',
      '.doc-dropzone { border:2px dashed rgba(124,179,66,.35); border-radius:12px; padding:32px; text-align:center; cursor:pointer; transition:all .2s; background:rgba(124,179,66,.03); margin-bottom:20px }',
      '.doc-dropzone:hover, .doc-dropzone.drag-over { border-color:var(--green); background:rgba(124,179,66,.08) }',
      '.doc-dropzone-icon { font-size:40px; margin-bottom:10px }',
      '.doc-dropzone-text { font-size:14px; font-weight:600; color:var(--text) }',
      '.doc-dropzone-sub { font-size:12px; color:var(--muted); margin-top:4px }',
      '.doc-dropzone input { display:none }',
      '.doc-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.6); z-index:1000; display:flex; align-items:center; justify-content:center; padding:16px }',
      '.doc-modal { background:var(--dark2); border:1px solid rgba(255,255,255,.1); border-radius:14px; width:100%; max-width:560px; max-height:90vh; overflow-y:auto; padding:24px; position:relative }',
      '.doc-modal h3 { font-size:18px; font-weight:700; color:var(--text); margin:0 0 20px }',
      '.doc-form-group { margin-bottom:14px }',
      '.doc-form-group label { display:block; font-size:12px; font-weight:600; color:var(--muted); margin-bottom:6px; text-transform:uppercase; letter-spacing:.06em }',
      '.doc-form-group input, .doc-form-group select, .doc-form-group textarea { width:100%; padding:10px 12px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:var(--r); color:var(--text); font-size:13px; box-sizing:border-box }',
      '.doc-form-group textarea { resize:vertical; min-height:80px }',
      '.doc-form-row { display:grid; grid-template-columns:1fr 1fr; gap:12px }',
      '.doc-modal-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:20px }',
      '.doc-modal-close { position:absolute; top:16px; right:16px; background:none; border:none; color:var(--muted); font-size:20px; cursor:pointer; padding:4px 8px; border-radius:4px }',
      '.doc-modal-close:hover { color:var(--text); background:rgba(255,255,255,.07) }',
      '.doc-preview-modal { max-width:800px }',
      '.doc-preview-img { width:100%; border-radius:8px; margin-bottom:16px; max-height:400px; object-fit:contain }',
      '.doc-preview-pdf { width:100%; height:500px; border:none; border-radius:8px }',
      '.doc-preview-meta { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px }',
      '.doc-preview-meta-item { background:rgba(255,255,255,.04); border-radius:8px; padding:10px 12px }',
      '.doc-preview-meta-item .lbl { font-size:11px; color:var(--muted) }',
      '.doc-preview-meta-item .val { font-size:13px; font-weight:600; color:var(--text); margin-top:2px }',
      '.doc-preview-desc { background:rgba(255,255,255,.04); border-radius:8px; padding:12px; font-size:13px; color:var(--text); line-height:1.5 }',
      '.doc-preview-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:16px }',
      '.dossie-section { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); border-radius:10px; padding:16px; margin-bottom:12px }',
      '.dossie-section h4 { font-size:13px; font-weight:700; color:var(--green); margin:0 0 10px }',
      '.dossie-doc-item { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid rgba(255,255,255,.05) }',
      '.dossie-doc-item:last-child { border-bottom:none }',
      '.doc-empty { text-align:center; padding:60px 20px; color:var(--muted) }',
      '.doc-empty-icon { font-size:48px; margin-bottom:12px }',
      '.doc-file-selected { background:rgba(124,179,66,.08); border:1px solid rgba(124,179,66,.3); border-radius:8px; padding:12px; margin-top:12px; font-size:13px; color:var(--green) }',
      '.doc-upload-progress { height:4px; background:rgba(255,255,255,.1); border-radius:2px; margin-top:8px; overflow:hidden }',
      '.doc-upload-progress-bar { height:100%; background:var(--green); border-radius:2px; transition:width .3s }',
      '.doc-versao-badge { background:rgba(255,255,255,.1); color:var(--muted); font-size:10px; padding:1px 6px; border-radius:8px; margin-left:6px }'
    ].join(' ');
    document.head.appendChild(s);
  }

  // ── Render shell
  function renderShell(mc) {
    const tiposOpts = TIPOS_DOC.map(t => '<option value="' + t.valor + '">' + t.icone + ' ' + t.label + '</option>').join('');
    const modulosOpts = MODULOS_ORIGEM.map(m => '<option value="' + m.valor + '">' + m.label + '</option>').join('');
    mc.innerHTML =
      '<div id="doc-module">' +
      '<div class="doc-header">' +
        '<div class="doc-header-left">' +
          '<div style="font-size:32px">📁</div>' +
          '<div><h2>Documentos e Anexos</h2><p>Repositório central — todos os módulos</p></div>' +
        '</div>' +
        '<div class="doc-header-actions">' +
          '<button class="doc-btn-icon" id="docBtnList" title="Lista">☰</button>' +
          '<button class="doc-btn-icon active" id="docBtnGrid" title="Grade">⊞</button>' +
          '<button class="doc-btn doc-btn-secondary" id="docBtnDossie">📂 Dosiê do Lote</button>' +
          '<button class="doc-btn doc-btn-primary" id="docBtnUpload">+ Novo Documento</button>' +
        '</div>' +
      '</div>' +
      '<div class="doc-stats" id="docStats"></div>' +
      '<div class="doc-toolbar">' +
        '<div class="doc-search"><input type="text" id="docSearch" placeholder="Buscar por nome, descrição..." /></div>' +
        '<select class="doc-select" id="docFiltroTipo"><option value="">Todos os tipos</option>' + tiposOpts + '</select>' +
        '<select class="doc-select" id="docFiltroModulo">' + modulosOpts + '</select>' +
        '<button class="doc-toggle-destaque" id="docFiltroDestaque">⭐ Destaques</button>' +
      '</div>' +
      '<div class="doc-content">' +
        '<div class="doc-dropzone" id="docDropzone">' +
          '<input type="file" id="docFileInput" multiple accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.xlsx,.xls,.csv,.doc,.docx,.txt,.zip" />' +
          '<div class="doc-dropzone-icon">📂</div>' +
          '<div class="doc-dropzone-text">Arraste arquivos aqui ou clique para selecionar</div>' +
          '<div class="doc-dropzone-sub">PDF, imagens, planilhas e documentos • Múltiplos arquivos aceitos</div>' +
        '</div>' +
        '<div id="docItems"></div>' +
      '</div>' +
    '</div>';
  }

  // ── Stats
  function renderStats(lista) {
    const el = $('docStats'); if (!el) return;
    const total = lista.length;
    const destaques = lista.filter(d => d.destaque).length;
    const porTipo = {};
    lista.forEach(d => { porTipo[d.tipo_documento] = (porTipo[d.tipo_documento] || 0) + 1; });
    const tipoMaisComum = Object.entries(porTipo).sort((a,b) => b[1]-a[1])[0];
    el.innerHTML =
      '<div class="doc-stat"><div class="doc-stat-num">' + total + '</div><div class="doc-stat-lbl">Total de documentos</div></div>' +
      '<div class="doc-stat"><div class="doc-stat-num">' + destaques + '</div><div class="doc-stat-lbl">⭐ Destaques</div></div>' +
      '<div class="doc-stat"><div class="doc-stat-num">' + Object.keys(porTipo).length + '</div><div class="doc-stat-lbl">Tipos diferentes</div></div>' +
      (tipoMaisComum ? '<div class="doc-stat"><div class="doc-stat-num">' + getTipoInfo(tipoMaisComum[0]).icone + '</div><div class="doc-stat-lbl">Tipo mais freq.</div></div>' : '');
  }

  // ── Render items
  function renderItems(lista) {
    const el = $('docItems'); if (!el) return;
    if (!lista.length) {
      el.innerHTML = '<div class="doc-empty"><div class="doc-empty-icon">📁</div><div>Nenhum documento encontrado</div><div style="font-size:12px;margin-top:6px">Faça upload de arquivos ou ajuste os filtros</div></div>';
      return;
    }
    if (viewMode === 'grid') {
      el.innerHTML = '<div class="doc-grid">' + lista.map(doc => renderCardGrid(doc)).join('') + '</div>';
    } else {
      el.innerHTML = '<div class="doc-list">' + lista.map(doc => renderCardList(doc)).join('') + '</div>';
    }
    // attach click handlers
    el.querySelectorAll('[data-docid]').forEach(card => {
      card.addEventListener('click', function() { abrirPreview(this.dataset.docid); });
    });
  }

  function renderCardGrid(doc) {
    const t = getTipoInfo(doc.tipo_documento);
    const icone = getIcone(doc.nome_arquivo, doc.tipo_documento);
    const isImg = ehImagem(doc.nome_arquivo);
    const imgHtml = (isImg && doc.url_arquivo)
      ? '<img class="doc-card-preview" src="' + sanitize(doc.url_arquivo) + '" alt="" loading="lazy" />'
      : '<div class="doc-card-icon">' + icone + '</div>';
    return '<div class="doc-card' + (doc.destaque ? ' destaque' : '') + '" data-docid="' + doc.id + '">' +
      imgHtml +
      '<div class="doc-card-name" title="' + sanitize(doc.nome_arquivo) + '">' + sanitize(doc.nome_arquivo || 'Sem nome') + '</div>' +
      '<div class="doc-card-meta">' + fmtData(doc.created_at) + '</div>' +
      (doc.descricao ? '<div class="doc-card-meta" style="margin-top:4px">' + sanitize(doc.descricao).slice(0,60) + (doc.descricao.length > 60 ? '...' : '') + '</div>' : '') +
      '<div>' +
        '<span class="doc-card-tipo">' + t.icone + ' ' + t.label + '</span>' +
        '<span class="doc-card-modulo">' + getModuloLabel(doc.modulo_origem) + '</span>' +
      '</div>' +
    '</div>';
  }

  function renderCardList(doc) {
    const t = getTipoInfo(doc.tipo_documento);
    const icone = getIcone(doc.nome_arquivo, doc.tipo_documento);
    return '<div class="doc-list-item' + (doc.destaque ? ' destaque' : '') + '" data-docid="' + doc.id + '">' +
      '<div class="doc-list-icon">' + icone + '</div>' +
      '<div class="doc-list-info">' +
        '<div class="doc-list-name">' + sanitize(doc.nome_arquivo || 'Sem nome') + (doc.destaque ? ' ⭐' : '') + '</div>' +
        '<div class="doc-list-meta">' + fmtData(doc.created_at) + ' • ' + getModuloLabel(doc.modulo_origem) + (doc.entidade_descricao ? ' • ' + sanitize(doc.entidade_descricao) : '') + '</div>' +
      '</div>' +
      '<div class="doc-list-right">' +
        '<span class="doc-list-tipo">' + t.icone + ' ' + t.label + '</span>' +
        (doc.tamanho_bytes ? '<span class="doc-list-size">' + fmtSize(doc.tamanho_bytes) + '</span>' : '') +
      '</div>' +
    '</div>';
  }

  // ── Carregar documentos
  async function carregarDocs() {
    try {
      let q = sb.from('documentos').select('*').order('created_at', { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      docs = data || [];
      aplicarFiltros();
    } catch(e) {
      console.error('Erro ao carregar documentos:', e);
      // Modo demonstração sem banco
      docs = [];
      aplicarFiltros();
    }
  }

  // ── Aplicar filtros
  function aplicarFiltros() {
    let lista = [...docs];
    if (filtros.tipo) lista = lista.filter(d => d.tipo_documento === filtros.tipo);
    if (filtros.modulo) lista = lista.filter(d => d.modulo_origem === filtros.modulo);
    if (filtros.destaque) lista = lista.filter(d => d.destaque);
    if (filtros.texto) {
      const txt = filtros.texto.toLowerCase();
      lista = lista.filter(d =>
        (d.nome_arquivo || '').toLowerCase().includes(txt) ||
        (d.descricao || '').toLowerCase().includes(txt) ||
        (d.entidade_descricao || '').toLowerCase().includes(txt)
      );
    }
    renderStats(docs);
    renderItems(lista);
  }

  // ── Modal de upload
  function abrirModalUpload(arquivos) {
    const tiposOpts = TIPOS_DOC.map(t => '<option value="' + t.valor + '">' + t.icone + ' ' + t.label + '</option>').join('');
    const modulosOpts = MODULOS_ORIGEM.filter(m => m.valor).map(m => '<option value="' + m.valor + '">' + m.label + '</option>').join('');
    const nomesArquivos = arquivos ? Array.from(arquivos).map(f => f.name).join(', ') : '';
    const overlay = document.createElement('div');
    overlay.className = 'doc-modal-overlay';
    overlay.id = 'docUploadOverlay';
    overlay.innerHTML =
      '<div class="doc-modal">' +
        '<button class="doc-modal-close" id="docModalClose">×</button>' +
        '<h3>📁 Novo Documento</h3>' +
        (nomesArquivos ? '<div class="doc-file-selected">📎 ' + sanitize(nomesArquivos) + '</div>' : '') +
        '<div id="docUploadProgress" style="display:none" class="doc-upload-progress"><div class="doc-upload-progress-bar" id="docProgressBar" style="width:0%"></div></div>' +
        '<div class="doc-form-group" style="margin-top:14px">' +
          '<label>Arquivo(s)</label>' +
          '<input type="file" id="docModalFile" multiple accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.xlsx,.xls,.csv,.doc,.docx,.txt,.zip" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);padding:8px;width:100%;box-sizing:border-box;color:var(--text);border-radius:var(--r)" />' +
        '</div>' +
        '<div class="doc-form-row">' +
          '<div class="doc-form-group">' +
            '<label>Tipo de Documento</label>' +
            '<select id="docModalTipo"><option value="">Selecione...</option>' + tiposOpts + '</select>' +
          '</div>' +
          '<div class="doc-form-group">' +
            '<label>Módulo de Origem</label>' +
            '<select id="docModalModulo"><option value="">Selecione...</option>' + modulosOpts + '</select>' +
          '</div>' +
        '</div>' +
        '<div class="doc-form-group">' +
          '<label>Entidade Vinculada (ex: Venda #123, Lote ABC)</label>' +
          '<input type="text" id="docModalEntidade" placeholder="Opcional..." />' +
        '</div>' +
        '<div class="doc-form-group">' +
          '<label>Descrição</label>' +
          '<textarea id="docModalDesc" placeholder="Descreva o conteúdo do documento..."></textarea>' +
        '</div>' +
        '<div class="doc-form-group">' +
          '<label>URL do Arquivo (caso já hospedado)</label>' +
          '<input type="text" id="docModalUrl" placeholder="https://..." />' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">' +
          '<input type="checkbox" id="docModalDestaque" style="width:auto" />' +
          '<label for="docModalDestaque" style="font-size:13px;color:var(--text);text-transform:none;letter-spacing:0;margin:0">⭐ Marcar como documento importante (destaque)</label>' +
        '</div>' +
        '<div class="doc-modal-actions">' +
          '<button class="doc-btn doc-btn-secondary" id="docModalCancelar">Cancelar</button>' +
          '<button class="doc-btn doc-btn-primary" id="docModalSalvar">💾 Salvar Documento</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    if (arquivos) { try { $('docModalFile').files = arquivos; } catch(e) {} }
    $('docModalClose').onclick = $('docModalCancelar').onclick = function() { overlay.remove(); };
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
    $('docModalSalvar').addEventListener('click', function() { salvarDocumento(overlay); });
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', esc); } });
  }

  // ── Salvar documento
  async function salvarDocumento(overlay) {
    const tipo = $('docModalTipo').value;
    const modulo = $('docModalModulo').value;
    const desc = $('docModalDesc').value.trim();
    const entidade = $('docModalEntidade').value.trim();
    const urlArq = $('docModalUrl').value.trim();
    const destaque = $('docModalDestaque').checked;
    const fileInput = $('docModalFile');
    const arquivos = fileInput && fileInput.files.length > 0 ? fileInput.files : null;
    if (!tipo) { alert('Selecione o tipo de documento.'); return; }
    if (!arquivos && !urlArq) { alert('Selecione um arquivo ou informe a URL.'); return; }
    const btnSalvar = $('docModalSalvar');
    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando...';
    try {
      const registros = [];
      if (arquivos) {
        for (const arquivo of Array.from(arquivos)) {
          // Upload simulado — em produção: usar Supabase Storage
          // const { data: upData } = await sb.storage.from('documentos').upload(Date.now() + '_' + arquivo.name, arquivo);
          // const url = sb.storage.from('documentos').getPublicUrl(upData.path).data.publicUrl;
          registros.push({
            nome_arquivo: arquivo.name,
            tipo_documento: tipo,
            modulo_origem: modulo || null,
            entidade_descricao: entidade || null,
            descricao: desc || null,
            url_arquivo: urlArq || null,
            tamanho_bytes: arquivo.size || null,
            destaque: destaque,
            versao: 1
          });
        }
      } else {
        registros.push({
          nome_arquivo: urlArq.split('/').pop() || 'documento',
          tipo_documento: tipo,
          modulo_origem: modulo || null,
          entidade_descricao: entidade || null,
          descricao: desc || null,
          url_arquivo: urlArq,
          tamanho_bytes: null,
          destaque: destaque,
          versao: 1
        });
      }
      const { error } = await sb.from('documentos').insert(registros);
      if (error) throw error;
      overlay.remove();
      await carregarDocs();
    } catch(e) {
      console.error('Erro ao salvar:', e);
      alert('Erro ao salvar documento: ' + (e.message || e));
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.textContent = '💾 Salvar Documento';
    }
  }

  // ── Preview de documento
  function abrirPreview(id) {
    const doc = docs.find(d => String(d.id) === String(id));
    if (!doc) return;
    const t = getTipoInfo(doc.tipo_documento);
    const icone = getIcone(doc.nome_arquivo, doc.tipo_documento);
    const isImg = ehImagem(doc.nome_arquivo);
    const isPdf = (doc.nome_arquivo || '').toLowerCase().endsWith('.pdf');
    let previewHtml = '';
    if (isImg && doc.url_arquivo) {
      previewHtml = '<img class="doc-preview-img" src="' + sanitize(doc.url_arquivo) + '" alt="Preview" />';
    } else if (isPdf && doc.url_arquivo) {
      previewHtml = '<iframe class="doc-preview-pdf" src="' + sanitize(doc.url_arquivo) + '"></iframe>';
    } else {
      previewHtml = '<div style="font-size:64px;text-align:center;padding:20px">' + icone + '</div>';
    }
    const overlay = document.createElement('div');
    overlay.className = 'doc-modal-overlay';
    overlay.innerHTML =
      '<div class="doc-modal doc-preview-modal">' +
        '<button class="doc-modal-close" id="docPreviewClose">×</button>' +
        '<h3>' + icone + ' ' + sanitize(doc.nome_arquivo || 'Documento') + '</h3>' +
        previewHtml +
        '<div class="doc-preview-meta">' +
          '<div class="doc-preview-meta-item"><div class="lbl">Tipo</div><div class="val">' + t.icone + ' ' + t.label + '</div></div>' +
          '<div class="doc-preview-meta-item"><div class="lbl">Módulo</div><div class="val">' + getModuloLabel(doc.modulo_origem) + '</div></div>' +
          '<div class="doc-preview-meta-item"><div class="lbl">Data</div><div class="val">' + fmtData(doc.created_at) + '</div></div>' +
          '<div class="doc-preview-meta-item"><div class="lbl">Tamanho</div><div class="val">' + (fmtSize(doc.tamanho_bytes) || '—') + '</div></div>' +
        '</div>' +
        (doc.entidade_descricao ? '<div class="doc-preview-meta-item" style="margin-bottom:10px"><div class="lbl">Vinculado a</div><div class="val">' + sanitize(doc.entidade_descricao) + '</div></div>' : '') +
        (doc.descricao ? '<div class="doc-preview-desc">' + sanitize(doc.descricao) + '</div>' : '') +
        '<div class="doc-preview-actions">' +
          (doc.url_arquivo ? '<a href="' + sanitize(doc.url_arquivo) + '" target="_blank" rel="noopener" class="doc-btn doc-btn-primary">🔗 Abrir</a>' : '') +
          (doc.url_arquivo ? '<a href="' + sanitize(doc.url_arquivo) + '" download class="doc-btn doc-btn-secondary">⬇️ Baixar</a>' : '') +
          '<button class="doc-btn doc-btn-secondary" id="docPreviewDestaque">' + (doc.destaque ? '⭐ Remover destaque' : '☆ Marcar destaque') + '</button>' +
          '<button class="doc-btn" style="background:rgba(220,50,50,.15);color:#e05555" id="docPreviewExcluir">🗑️ Excluir</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    $('docPreviewClose').onclick = function() { overlay.remove(); };
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', esc); } });
    $('docPreviewDestaque').addEventListener('click', async function() {
      await sb.from('documentos').update({ destaque: !doc.destaque }).eq('id', doc.id);
      overlay.remove(); await carregarDocs();
    });
    $('docPreviewExcluir').addEventListener('click', async function() {
      if (!confirm('Excluir este documento? Esta ação não pode ser desfeita.')) return;
      await sb.from('documentos').delete().eq('id', doc.id);
      overlay.remove(); await carregarDocs();
    });
  }

  // ── Dosiê do Lote
  function abrirDossie() {
    // Agrupa documentos por tipo de módulo
    const grupos = {};
    docs.forEach(d => {
      const grp = d.modulo_origem || 'outros';
      if (!grupos[grp]) grupos[grp] = [];
      grupos[grp].push(d);
    });
    const sections = Object.entries(grupos).map(([mod, itens]) => {
      const label = getModuloLabel(mod);
      const itemsHtml = itens.map(d => {
        const icone = getIcone(d.nome_arquivo, d.tipo_documento);
        return '<div class="dossie-doc-item">' +
          '<div style="font-size:20px">' + icone + '</div>' +
          '<div>' +
            '<div style="font-size:12px;font-weight:600;color:var(--text)">' + sanitize(d.nome_arquivo || 'Sem nome') + '</div>' +
            '<div style="font-size:11px;color:var(--muted)">' + getTipoInfo(d.tipo_documento).label + ' • ' + fmtData(d.created_at) + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
      return '<div class="dossie-section"><h4>📂 ' + label + ' (' + itens.length + ')</h4>' + itemsHtml + '</div>';
    }).join('');
    const overlay = document.createElement('div');
    overlay.className = 'doc-modal-overlay';
    overlay.innerHTML =
      '<div class="doc-modal" style="max-width:700px">' +
        '<button class="doc-modal-close" id="dossieClose">×</button>' +
        '<h3>📂 Dosiê do Lote</h3>' +
        '<p style="font-size:13px;color:var(--muted);margin-bottom:16px">Consolidação automática de todos os documentos organizados por módulo</p>' +
        (sections || '<div class="doc-empty"><div class="doc-empty-icon">📁</div><div>Nenhum documento cadastrado</div></div>') +
        '<div class="doc-modal-actions">' +
          '<button class="doc-btn doc-btn-secondary" id="dossieClose2">Fechar</button>' +
          '<button class="doc-btn doc-btn-primary" onclick="window.print()">Imprimir / PDF</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    $('dossieClose').onclick = $('dossieClose2').onclick = function() { overlay.remove(); };
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  }

  // ── Conectar eventos
  function conectarEventos() {
    on('docBtnUpload', 'click', function() { abrirModalUpload(null); });
    on('docBtnDossie', 'click', abrirDossie);
    on('docSearch', 'input', function() { filtros.texto = this.value; aplicarFiltros(); });
    on('docFiltroTipo', 'change', function() { filtros.tipo = this.value; aplicarFiltros(); });
    on('docFiltroModulo', 'change', function() { filtros.modulo = this.value; aplicarFiltros(); });
    on('docFiltroDestaque', 'click', function() {
      filtros.destaque = !filtros.destaque;
      this.classList.toggle('ativo', filtros.destaque);
      aplicarFiltros();
    });
    // Toggle de visualização
    on('docBtnGrid', 'click', function() {
      viewMode = 'grid';
      this.classList.add('active');
      const listBtn = $('docBtnList');
      if (listBtn) listBtn.classList.remove('active');
      aplicarFiltros();
    });
    on('docBtnList', 'click', function() {
      viewMode = 'list';
      this.classList.add('active');
      const gridBtn = $('docBtnGrid');
      if (gridBtn) gridBtn.classList.remove('active');
      aplicarFiltros();
    });
    // Dropzone
    const dz = $('docDropzone');
    const fi = $('docFileInput');
    if (dz) {
      dz.addEventListener('click', function(e) { if (e.target !== fi) fi && fi.click(); });
      dz.addEventListener('dragover', function(e) { e.preventDefault(); dz.classList.add('drag-over'); });
      dz.addEventListener('dragleave', function() { dz.classList.remove('drag-over'); });
      dz.addEventListener('drop', function(e) {
        e.preventDefault();
        dz.classList.remove('drag-over');
        const files = e.dataTransfer && e.dataTransfer.files;
        if (files && files.length) abrirModalUpload(files);
      });
    }
    if (fi) fi.addEventListener('change', function() { if (this.files.length) abrirModalUpload(this.files); });
  }

  // ── Inicialização principal
  const mc = document.getElementById('mainContent');
  if (!mc) return;
  injectCSS();
  renderShell(mc);
  conectarEventos();
  await carregarDocs();
};

// ── API pública para outros módulos usarem
// Permite que qualquer módulo abra o modal de upload vinculado a uma entidade
window.AdminDocumentos = {
  abrirUpload: function(modulo, entidadeId, entidadeDesc) {
    // Garante que o CSS está injetado
    if (!document.getElementById('doc-css')) {
      // CSS mínimo para o modal funcionar fora do módulo
      const s = document.createElement('style');
      s.id = 'doc-css-mini';
      s.textContent = '.doc-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px}' +
        '.doc-modal{background:var(--dark2);border:1px solid rgba(255,255,255,.1);border-radius:14px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;padding:24px;position:relative}' +
        '.doc-modal h3{font-size:18px;font-weight:700;color:var(--text);margin:0 0 20px}' +
        '.doc-form-group{margin-bottom:14px}' +
        '.doc-form-group label{display:block;font-size:12px;font-weight:600;color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em}' +
        '.doc-form-group input,.doc-form-group select,.doc-form-group textarea{width:100%;padding:10px 12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:var(--r);color:var(--text);font-size:13px;box-sizing:border-box}' +
        '.doc-form-group textarea{resize:vertical;min-height:80px}' +
        '.doc-btn{padding:8px 16px;border-radius:var(--r);border:none;cursor:pointer;font-size:13px;font-weight:600}' +
        '.doc-btn-primary{background:var(--green);color:#fff}' +
        '.doc-btn-secondary{background:rgba(255,255,255,.07);color:var(--text)}' +
        '.doc-modal-close{position:absolute;top:16px;right:16px;background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer}' +
        '.doc-modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:20px}' +
        '.doc-form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}';
      document.head.appendChild(s);
    }
    const tiposDoc = [
      { valor: 'NOTA_FISCAL', icone: '🧾', label: 'Nota Fiscal' },
      { valor: 'CONTRATO', icone: '📝', label: 'Contrato' },
      { valor: 'LAUDO_LABORATORIAL', icone: '🔬', label: 'Laudo Laboratorial' },
      { valor: 'FOTO_AMOSTRA', icone: '📷', label: 'Foto de Amostra' },
      { valor: 'FOTO_LOTE', icone: '📸', label: 'Foto do Lote' },
      { valor: 'FOTO_CARGA', icone: '🚛', label: 'Foto de Carga' },
      { valor: 'RELATORIO_TECNICO', icone: '📊', label: 'Relatório Técnico' },
      { valor: 'CERTIFICADO', icone: '🏅', label: 'Certificado' },
      { valor: 'DOCUMENTO_TRANSPORTE', icone: '📦', label: 'Doc. de Transporte' },
      { valor: 'RASTREABILIDADE', icone: '🔍', label: 'Rastreabilidade' },
      { valor: 'ANALISE_SOLO', icone: '🌱', label: 'Análise de Solo' },
      { valor: 'OUTROS', icone: '📎', label: 'Outros' },
    ];
    const tiposOpts = tiposDoc.map(t => '<option value="' + t.valor + '">' + t.icone + ' ' + t.label + '</option>').join('');
    const overlay = document.createElement('div');
    overlay.className = 'doc-modal-overlay';
    overlay.innerHTML =
      '<div class="doc-modal">' +
        '<button class="doc-modal-close" id="extDocClose">×</button>' +
        '<h3>📁 Anexar Documento</h3>' +
        '<div style="background:rgba(124,179,66,.08);border:1px solid rgba(124,179,66,.25);border-radius:8px;padding:10px 12px;margin-bottom:16px;font-size:13px;color:var(--green)">' +
          '🔗 Vinculando a: <strong>' + (entidadeDesc || modulo) + '</strong>' +
        '</div>' +
        '<div class="doc-form-group">' +
          '<label>Arquivo</label>' +
          '<input type="file" id="extDocFile" multiple accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.xlsx,.xls,.csv,.doc,.docx,.txt,.zip" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);padding:8px;width:100%;box-sizing:border-box;color:var(--text);border-radius:var(--r)" />' +
        '</div>' +
        '<div class="doc-form-row">' +
          '<div class="doc-form-group">' +
            '<label>Tipo de Documento</label>' +
            '<select id="extDocTipo"><option value="">Selecione...</option>' + tiposOpts + '</select>' +
          '</div>' +
          '<div class="doc-form-group">' +
            '<label>Descrição</label>' +
            '<input type="text" id="extDocDesc" placeholder="Opcional..." />' +
          '</div>' +
        '</div>' +
        '<div class="doc-modal-actions">' +
          '<button class="doc-btn doc-btn-secondary" id="extDocCancelar">Cancelar</button>' +
          '<button class="doc-btn doc-btn-primary" id="extDocSalvar">💾 Anexar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    function fechar() { overlay.remove(); }
    document.getElementById('extDocClose').onclick = document.getElementById('extDocCancelar').onclick = fechar;
    overlay.addEventListener('click', function(e) { if (e.target === overlay) fechar(); });
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { fechar(); document.removeEventListener('keydown', esc); } });
    document.getElementById('extDocSalvar').addEventListener('click', async function() {
      const tipo = document.getElementById('extDocTipo').value;
      const desc = document.getElementById('extDocDesc').value.trim();
      const fileInput = document.getElementById('extDocFile');
      if (!tipo) { alert('Selecione o tipo de documento.'); return; }
      if (!fileInput || !fileInput.files.length) { alert('Selecione um arquivo.'); return; }
      this.disabled = true; this.textContent = 'Salvando...';
      try {
        const registros = Array.from(fileInput.files).map(f => ({
          nome_arquivo: f.name,
          tipo_documento: tipo,
          modulo_origem: modulo || null,
          entidade_id: entidadeId || null,
          entidade_descricao: entidadeDesc || null,
          descricao: desc || null,
          tamanho_bytes: f.size || null,
          destaque: false,
          versao: 1
        }));
        const sb = window.supabase;
        const { error } = await sb.from('documentos').insert(registros);
        if (error) throw error;
        fechar();
        alert('✅ ' + fileInput.files.length + ' documento(s) anexado(s) com sucesso!');
      } catch(e) {
        alert('Erro: ' + (e.message || e));
        this.disabled = false; this.textContent = '💾 Anexar';
      }
    });
  },
  // Lista documentos de uma entidade específica
  listarPorEntidade: async function(modulo, entidadeId) {
    try {
      const sb = window.supabase;
      let q = sb.from('documentos').select('*');
      if (modulo) q = q.eq('modulo_origem', modulo);
      if (entidadeId) q = q.eq('entidade_id', entidadeId);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch(e) {
      console.error('AdminDocumentos.listar:', e);
      return [];
    }
  }
  // listarPorEntidade already defined above
};
