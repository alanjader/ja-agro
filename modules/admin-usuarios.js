// ============================================================
// JA AGRO — Admin Module: Usuários
// modules/admin-usuarios.js
// ============================================================

window.module_usuarios = async function() {
  setTopbar('Usuários', 'Gestão de acessos',
    '<button class="topbar-btn btn-primary" onclick="novoUsuario()">+ Novo Usuário</button>'
  );
  await renderUsuarios();
};

// ── ESTADO ────────────────────────────────────
var _usrPage   = 0;
var _usrLimit  = 12;
var _usrSearch = '';
var _usrTotal  = 0;
var _fazendas  = [];

// ── CARREGAR FAZENDAS (cache) ─────────────────
async function carregarFazendas() {
  if (_fazendas.length > 0) return _fazendas;
  var { data } = await sb.from('fazendas').select('id, nome').eq('ativo', true).order('nome');
  _fazendas = data || [];
  return _fazendas;
}

// ── RENDER PRINCIPAL ──────────────────────────
async function renderUsuarios() {
  setLoading('mainContent');
  try {
    var query = sb.from('usuarios')
      .select('*, fazendas(nome)', { count: 'exact' })
      .neq('role', 'admin')
      .order('nome');

    if (_usrSearch) {
      query = query.or('nome.ilike.%' + _usrSearch + '%,email.ilike.%' + _usrSearch + '%');
    }

    query = query.range(_usrPage * _usrLimit, (_usrPage + 1) * _usrLimit - 1);

    var { data, count, error } = await query;
    if (error) throw error;
    _usrTotal = count || 0;

    var html = '<div class="table-wrap">';
    html += '<div class="table-header">';
    html += '<div class="table-title">Usuários <span style="font-size:12px;color:var(--muted);font-weight:500">(' + _usrTotal + ' no total)</span></div>';
    html += '<input class="search-input" type="text" placeholder="Buscar nome ou e-mail..." value="' + esc(_usrSearch) + '" oninput="usrSearch(this.value)" id="usrSearchInput"/>';
    html += '</div>';

    if (!data || data.length === 0) {
      html += '<div class="table-empty">';
      html += _usrSearch
        ? '🔍 Nenhum usuário encontrado para "<strong>' + esc(_usrSearch) + '</strong>"'
        : '👤 Nenhum usuário cadastrado ainda.<br><br><button class="topbar-btn btn-primary" onclick="novoUsuario()">+ Criar primeiro usuário</button>';
      html += '</div>';
    } else {
      html += '<table><thead><tr>'
        + '<th>Nome</th>'
        + '<th>E-mail</th>'
        + '<th>Perfil</th>'
        + '<th>Fazenda</th>'
        + '<th>Status</th>'
        + '<th>Ações</th>'
        + '</tr></thead><tbody>';

      data.forEach(function(u) {
        var roleBadge = {
          produtor: '<span class="badge badge-green">Produtor</span>',
          gerente:  '<span class="badge badge-info">Gerente</span>',
          operador: '<span class="badge badge-gray">Operador</span>',
        }[u.role] || '<span class="badge badge-gray">' + esc(u.role) + '</span>';

        var statusBadge = u.ativo
          ? '<span class="badge badge-green">Ativo</span>'
          : '<span class="badge badge-red">Inativo</span>';

        var avatar = (u.nome || u.email || 'U')[0].toUpperCase();
        var avatarHtml = '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--green),#2196F3);display:inline-flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff;flex-shrink:0;margin-right:10px">' + avatar + '</div>';

        html += '<tr>'
          + '<td style="display:flex;align-items:center">' + avatarHtml + '<strong>' + esc(u.nome) + '</strong></td>'
          + '<td style="color:var(--muted);font-size:12px">' + esc(u.email) + '</td>'
          + '<td>' + roleBadge + '</td>'
          + '<td>' + esc(u.fazendas?.nome || '—') + '</td>'
          + '<td>' + statusBadge + '</td>'
          + '<td><div class="td-actions">'
          + '<button class="action-btn" onclick="editarUsuario(\'' + u.id + '\')">Editar</button>'
          + '<button class="action-btn" onclick="resetSenha(\'' + esc(u.email) + '\')">Reset senha</button>'
          + (u.ativo
            ? '<button class="action-btn danger" onclick="toggleUsuario(\'' + u.id + '\',false,\'' + esc(u.nome) + '\')">Desativar</button>'
            : '<button class="action-btn" onclick="toggleUsuario(\'' + u.id + '\',true,\'' + esc(u.nome) + '\')">Ativar</button>')
          + '</div></td>'
          + '</tr>';
      });

      html += '</tbody></table>';

      // PAGINAÇÃO
      var totalPages = Math.ceil(_usrTotal / _usrLimit);
      if (totalPages > 1) {
        var inicio = _usrPage * _usrLimit + 1;
        var fim    = Math.min((_usrPage + 1) * _usrLimit, _usrTotal);
        html += '<div class="pagination">';
        html += '<span>Mostrando ' + inicio + '–' + fim + ' de ' + _usrTotal + '</span>';
        html += '<div class="pagination-btns">';
        html += '<button class="page-btn" onclick="usrPagina(' + (_usrPage - 1) + ')" ' + (_usrPage === 0 ? 'disabled' : '') + '>← Anterior</button>';
        for (var p = 0; p < totalPages; p++) {
          html += '<button class="page-btn ' + (p === _usrPage ? 'active' : '') + '" onclick="usrPagina(' + p + ')">' + (p + 1) + '</button>';
        }
        html += '<button class="page-btn" onclick="usrPagina(' + (_usrPage + 1) + ')" ' + (_usrPage >= totalPages - 1 ? 'disabled' : '') + '>Próxima →</button>';
        html += '</div></div>';
      }
    }

    html += '</div>';

    // LEGENDA DE ROLES
    html += '<div style="margin-top:16px;padding:16px 20px;background:var(--white);border:1px solid var(--brd);border-radius:var(--r-lg);display:flex;gap:24px;flex-wrap:wrap;">'
      + '<div style="font-size:12px;font-weight:700;color:var(--muted);margin-right:8px">Perfis:</div>'
      + '<div style="font-size:12px;color:var(--muted)"><span class="badge badge-green" style="margin-right:6px">Produtor</span>Acessa dashboard + app de campo</div>'
      + '<div style="font-size:12px;color:var(--muted)"><span class="badge badge-info" style="margin-right:6px">Gerente</span>Acessa dashboard (somente leitura)</div>'
      + '<div style="font-size:12px;color:var(--muted)"><span class="badge badge-gray" style="margin-right:6px">Operador</span>Somente app de campo</div>'
      + '</div>';

    document.getElementById('mainContent').innerHTML = html;

    if (_usrSearch) {
      var inp = document.getElementById('usrSearchInput');
      if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
    }

  } catch(e) {
    document.getElementById('mainContent').innerHTML =
      '<div class="page-loading"><div style="font-size:48px">⚠️</div>'
      + '<div class="loading-text">Erro: ' + e.message + '</div></div>';
  }
}

// ── BUSCA COM DEBOUNCE ────────────────────────
var _usrSearchTimer;
window.usrSearch = function(val) {
  _usrSearch = val; _usrPage = 0;
  clearTimeout(_usrSearchTimer);
  _usrSearchTimer = setTimeout(renderUsuarios, 350);
};
window.usrPagina = function(p) { _usrPage = p; renderUsuarios(); };

// ── FORM HTML ─────────────────────────────────
async function usuarioFormHtml(u, isNovo) {
  u = u || {};
  var fazendas = await carregarFazendas();

  var fazOptions = '<option value="">Selecione a fazenda</option>';
  fazendas.forEach(function(f) {
    fazOptions += '<option value="' + f.id + '"' + (u.fazenda_id === f.id ? ' selected' : '') + '>' + esc(f.nome) + '</option>';
  });

  var html = '<div class="form-grid">';

  html += '<div class="form-field">'
    + '<label>Nome completo <span class="req">*</span></label>'
    + '<input type="text" id="usr_nome" value="' + esc(u.nome || '') + '" placeholder="Ex: João da Silva" maxlength="100"/>'
    + '</div>';

  html += '<div class="form-field">'
    + '<label>E-mail <span class="req">*</span>' + (isNovo ? '' : ' <span style="font-size:10px;color:var(--muted)">(não pode ser alterado)</span>') + '</label>'
    + '<input type="email" id="usr_email" value="' + esc(u.email || '') + '" placeholder="email@exemplo.com"' + (isNovo ? '' : ' readonly style="opacity:.6;cursor:not-allowed"') + '/>'
    + '</div>';

  if (isNovo) {
    html += '<div class="form-field">'
      + '<label>Senha inicial <span class="req">*</span></label>'
      + '<div style="position:relative">'
      + '<input type="password" id="usr_senha" placeholder="Mínimo 8 caracteres" minlength="8" style="padding-right:48px"/>'
      + '<button type="button" onclick="toggleUsrSenha()" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--dim);font-size:16px">👁</button>'
      + '</div>'
      + '<div class="form-hint">O usuário poderá trocar a senha depois</div>'
      + '</div>';
  }

  html += '<div class="form-grid c2">';

  html += '<div class="form-field">'
    + '<label>Perfil <span class="req">*</span></label>'
    + '<select id="usr_role">'
    + '<option value="operador"' + (u.role === 'operador' ? ' selected' : '') + '>Operador — só app de campo</option>'
    + '<option value="produtor"' + (u.role === 'produtor' || !u.role ? ' selected' : '') + '>Produtor — dashboard + campo</option>'
    + '<option value="gerente"'  + (u.role === 'gerente'  ? ' selected' : '') + '>Gerente — dashboard (leitura)</option>'
    + '</select>'
    + '</div>';

  html += '<div class="form-field">'
    + '<label>Fazenda <span class="req">*</span></label>'
    + '<select id="usr_fazenda">' + fazOptions + '</select>'
    + '</div>';

  html += '</div>'; // c2
  html += '</div>'; // form-grid
  return html;
}

window.toggleUsrSenha = function() {
  var i = document.getElementById('usr_senha');
  if (i) i.type = i.type === 'password' ? 'text' : 'password';
};

// ── NOVO USUÁRIO ──────────────────────────────
window.novoUsuario = async function() {
  var formHtml = await usuarioFormHtml(null, true);
  openModal('Novo Usuário', formHtml, async function() {
    var nome     = document.getElementById('usr_nome').value.trim();
    var email    = document.getElementById('usr_email').value.trim();
    var senha    = document.getElementById('usr_senha').value;
    var role     = document.getElementById('usr_role').value;
    var fazendaId = document.getElementById('usr_fazenda').value;

    // Validações
    var erros = [];
    if (!nome)      { erros.push('usr_nome');    }
    if (!email)     { erros.push('usr_email');   }
    if (!senha || senha.length < 8) { erros.push('usr_senha'); }
    if (!fazendaId) { erros.push('usr_fazenda'); }

    erros.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.classList.add('err');
    });

    if (erros.length) {
      toast('Preencha todos os campos obrigatórios', 'bad');
      return;
    }

    var btn = document.getElementById('modalSaveBtn');
    btn.disabled = true;
    btn.textContent = 'Criando...';

    try {
      // 1. Cria no Supabase Auth usando a service role (via edge function ou admin API)
      // Como estamos usando a publishable key, usamos signUp
      // O usuário receberá um e-mail de confirmação
      var { data: authData, error: authError } = await sb.auth.admin
        ? sb.auth.admin.createUser({ email, password: senha, email_confirm: true })
        : sb.auth.signUp({ email, password: senha, options: { data: { nome, role } } });

      if (authError) throw authError;

      var userId = authData?.user?.id;
      if (!userId) throw new Error('Não foi possível obter o ID do usuário criado.');

      // 2. Insere na tabela usuarios
      var { error: dbError } = await sb.from('usuarios').insert({
        id: userId, nome, email, role, fazenda_id: fazendaId, ativo: true,
      });

      if (dbError) throw dbError;

      closeModal();
      _fazendas = []; // limpa cache
      toast('Usuário criado! E-mail de confirmação enviado para ' + email, 'ok');
      await renderUsuarios();

    } catch(e) {
      var msg = e.message || 'Erro ao criar usuário.';
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        msg = 'Este e-mail já está cadastrado no sistema.';
      } else if (msg.includes('password')) {
        msg = 'A senha deve ter pelo menos 8 caracteres.';
      } else if (msg.includes('valid email')) {
        msg = 'Informe um e-mail válido.';
      }
      toast(msg, 'bad');
      btn.disabled = false;
      btn.textContent = 'Salvar';
    }
  });
};

// ── EDITAR USUÁRIO ────────────────────────────
window.editarUsuario = async function(id) {
  try {
    var { data, error } = await sb.from('usuarios').select('*').eq('id', id).single();
    if (error) throw error;

    var formHtml = await usuarioFormHtml(data, false);
    openModal('Editar Usuário', formHtml, async function() {
      var nome      = document.getElementById('usr_nome').value.trim();
      var role      = document.getElementById('usr_role').value;
      var fazendaId = document.getElementById('usr_fazenda').value;

      if (!nome) {
        document.getElementById('usr_nome').classList.add('err');
        toast('Informe o nome do usuário', 'bad');
        return;
      }
      if (!fazendaId) {
        document.getElementById('usr_fazenda').classList.add('err');
        toast('Selecione a fazenda', 'bad');
        return;
      }

      var btn = document.getElementById('modalSaveBtn');
      btn.disabled = true;
      btn.textContent = 'Salvando...';

      try {
        var { error: err } = await sb.from('usuarios').update({
          nome, role, fazenda_id: fazendaId,
        }).eq('id', id);
        if (err) throw err;

        closeModal();
        _fazendas = [];
        toast('Usuário atualizado!', 'ok');
        await renderUsuarios();
      } catch(e2) {
        toast('Erro: ' + e2.message, 'bad');
        btn.disabled = false;
        btn.textContent = 'Salvar';
      }
    });
  } catch(e) {
    toast('Erro ao carregar usuário: ' + e.message, 'bad');
  }
};

// ── RESET DE SENHA ────────────────────────────
window.resetSenha = async function(email) {
  var ok = await confirm2(
    'Enviar reset de senha?',
    'Um link para redefinir a senha será enviado para <strong>' + esc(email) + '</strong>.',
    '🔑'
  );
  if (!ok) return;

  try {
    var { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://alanjader.github.io/ja-agro/reset-senha.html',
    });
    if (error) throw error;
    toast('E-mail de reset enviado para ' + email, 'ok');
  } catch(e) {
    toast('Erro: ' + e.message, 'bad');
  }
};

// ── ATIVAR / DESATIVAR ────────────────────────
window.toggleUsuario = async function(id, ativar, nome) {
  var msg = ativar
    ? 'O usuário <strong>' + esc(nome) + '</strong> poderá voltar a acessar o sistema.'
    : 'O usuário <strong>' + esc(nome) + '</strong> não conseguirá mais fazer login.';

  var ok = await confirm2(
    (ativar ? 'Ativar' : 'Desativar') + ' usuário?', msg, ativar ? '✅' : '⚠️'
  );
  if (!ok) return;

  try {
    var { error } = await sb.from('usuarios').update({ ativo: ativar }).eq('id', id);
    if (error) throw error;
    toast('Usuário ' + (ativar ? 'ativado' : 'desativado') + '!', 'ok');
    await renderUsuarios();
  } catch(e) {
    toast('Erro: ' + e.message, 'bad');
  }
};

// ── UTILITÁRIO ────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
