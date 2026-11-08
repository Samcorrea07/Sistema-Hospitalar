/* =========================================================================
 * Views públicas: login, cadastro de paciente e política de privacidade
 * ========================================================================= */
(function () {
  'use strict';
  const esc = UI.esc;

  /** Validação de CPF pelos dígitos verificadores (módulo 11). */
  function cpfValido(cpf) {
    const n = String(cpf).replace(/\D/g, '');
    if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;
    for (let t = 9; t < 11; t++) {
      let s = 0;
      for (let i = 0; i < t; i++) s += Number(n[i]) * (t + 1 - i);
      const d = ((10 * s) % 11) % 10;
      if (Number(n[t]) !== d) return false;
    }
    return true;
  }
  window.cpfValido = cpfValido;

  function formatarCPF(v) {
    const n = v.replace(/\D/g, '').slice(0, 11);
    return n.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  function formatarTelefone(v) {
    const n = v.replace(/\D/g, '').slice(0, 11);
    if (n.length <= 10) return n.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
    return n.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
  }
  window.Mascaras = { cpf: formatarCPF, telefone: formatarTelefone };

  const POLITICA =
    '<p>A VidaPlus trata dados pessoais e <strong>dados pessoais sensíveis de saúde</strong> conforme a Lei nº 13.709/2018 (LGPD).</p>' +
    '<ul class="lista-simples">' +
    '<li><strong>Finalidade:</strong> prestação de serviços de saúde, agendamento, prontuário e faturamento.</li>' +
    '<li><strong>Base legal:</strong> tutela da saúde (art. 11, II, f) e consentimento do titular quando aplicável.</li>' +
    '<li><strong>Segurança:</strong> tráfego criptografado (TLS 1.3), dados sensíveis cifrados em repouso (AES-256), acesso por perfil e registro de auditoria.</li>' +
    '<li><strong>Seus direitos (art. 18):</strong> confirmar o tratamento, acessar, corrigir, solicitar portabilidade e revogar consentimento — disponíveis em “Meus dados”.</li>' +
    '<li><strong>Encarregado (DPO):</strong> dpo@vidaplus.com.br</li></ul>';
  window.POLITICA_PRIVACIDADE = POLITICA;

  // ------------------------------- LOGIN -------------------------------
  Router.rota('/login', {
    titulo: 'Entrar',
    publico: true,
    render: function () {
      return '' +
        '<div class="auth">' +
        '<section class="auth-marca" aria-hidden="true">' +
        '<div class="logo-grande">' + UI.icone('escudo') + '</div>' +
        '<p class="auth-slogan">Cuidado integrado em hospitais, clínicas, laboratórios e home care.</p>' +
        '<ul class="auth-pontos"><li>Agende consultas e exames</li><li>Teleconsulta segura</li><li>Prontuário e receitas digitais</li></ul>' +
        '</section>' +
        '<section class="auth-card" aria-labelledby="titulo-pagina">' +
        '<div class="marca-texto"><span class="marca-cruz">' + UI.icone('mais') + '</span> VidaPlus <small>SGHSS</small></div>' +
        '<h1 id="titulo-pagina" tabindex="-1">Acesse sua conta</h1>' +
        '<form id="form-login" novalidate>' +
        '<fieldset class="perfis"><legend>Entrar como</legend>' +
        perfil('paciente', 'Paciente', 'usuario', true) +
        perfil('profissional', 'Profissional de saúde', 'prontuario') +
        perfil('admin', 'Administrador', 'grafico') +
        '</fieldset>' +
        '<div class="campo"><label for="email">E-mail</label>' +
        '<input id="email" name="email" type="email" autocomplete="username" required aria-describedby="email-erro" />' +
        '<p class="erro" id="email-erro"></p></div>' +
        '<div class="campo"><label for="senha">Senha</label>' +
        '<div class="input-com-botao"><input id="senha" name="senha" type="password" autocomplete="current-password" required minlength="8" aria-describedby="senha-erro" />' +
        '<button type="button" class="btn-icone" id="ver-senha" aria-label="Mostrar senha" aria-pressed="false">' + UI.icone('olho') + '</button></div>' +
        '<p class="erro" id="senha-erro"></p></div>' +
        '<p class="erro erro-geral" id="login-erro" role="alert"></p>' +
        '<button class="btn btn-primario btn-bloco" type="submit">Entrar</button>' +
        '</form>' +
        '<p class="auth-links">Novo paciente? <a href="#/cadastro">Crie seu cadastro</a></p>' +
        '<details class="demo"><summary>Credenciais de demonstração</summary>' +
        '<p>Senha para todos: <code>Vida@2026</code></p>' +
        '<ul><li><button type="button" class="link" data-demo="paciente|ana.souza@email.com">Paciente — ana.souza@email.com</button></li>' +
        '<li><button type="button" class="link" data-demo="profissional|carlos.menezes@vidaplus.com">Profissional — carlos.menezes@vidaplus.com</button></li>' +
        '<li><button type="button" class="link" data-demo="admin|admin@vidaplus.com">Administrador — admin@vidaplus.com</button></li></ul>' +
        '<button type="button" class="link" id="reset-demo">Restaurar dados de demonstração</button></details>' +
        '<p class="auth-lgpd">' + UI.icone('escudo') + ' Seus dados são protegidos conforme a LGPD. <button type="button" class="link" id="ver-politica">Política de privacidade</button></p>' +
        '</section></div>';

      function perfil(v, rotulo, ic, marcado) {
        return '<label class="perfil-opcao"><input type="radio" name="perfil" value="' + v + '"' + (marcado ? ' checked' : '') + ' />' +
          '<span>' + UI.icone(ic) + esc(rotulo) + '</span></label>';
      }
    },
    montar: function (el) {
      const form = el.querySelector('#form-login');
      const verSenha = el.querySelector('#ver-senha');
      verSenha.addEventListener('click', function () {
        const s = el.querySelector('#senha');
        const mostrar = s.type === 'password';
        s.type = mostrar ? 'text' : 'password';
        verSenha.setAttribute('aria-pressed', String(mostrar));
        verSenha.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
      });
      el.querySelectorAll('[data-demo]').forEach(function (b) {
        b.addEventListener('click', function () {
          const p = b.getAttribute('data-demo').split('|');
          form.perfil.value = p[0];
          form.email.value = p[1];
          form.senha.value = 'Vida@2026';
          form.senha.focus();
        });
      });
      el.querySelector('#ver-politica').addEventListener('click', function () {
        UI.modal('Política de privacidade', POLITICA);
      });
      el.querySelector('#reset-demo').addEventListener('click', function () {
        Store.resetarDemo();
        UI.toast('Dados de demonstração restaurados.');
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        let ok = true;
        const email = form.email.value.trim();
        const senha = form.senha.value;
        ok = campoErro(form.email, el.querySelector('#email-erro'), !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Informe um e-mail válido.' : '') && ok;
        ok = campoErro(form.senha, el.querySelector('#senha-erro'), senha.length < 8 ? 'A senha deve ter pelo menos 8 caracteres.' : '') && ok;
        const geral = el.querySelector('#login-erro');
        geral.textContent = '';
        if (!ok) { form.querySelector('[aria-invalid="true"]').focus(); return; }
        const r = Store.login(email, senha, form.perfil.value);
        if (!r.ok) { geral.textContent = r.erro; return; }
        UI.toast('Bem-vindo(a), ' + r.sessao.nome.split(' ')[0] + '!');
        location.hash = App.inicio(r.sessao.perfil);
      });
    }
  });

  function campoErro(input, saida, msg) {
    saida.textContent = msg;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }
  window.campoErro = campoErro;

  // ------------------------ CADASTRO DE PACIENTE ------------------------
  Router.rota('/cadastro', {
    titulo: 'Cadastro de paciente',
    publico: true,
    render: function () {
      return '<div class="auth auth-unica"><section class="auth-card auth-card-largo" aria-labelledby="titulo-pagina">' +
        '<a href="#/login" class="voltar">← Voltar ao login</a>' +
        '<h1 id="titulo-pagina" tabindex="-1">Cadastro de paciente</h1>' +
        '<p class="ajuda">Campos marcados com <span aria-hidden="true">*</span><span class="sr-only">asterisco</span> são obrigatórios.</p>' +
        '<form id="form-cad" novalidate class="grade-form">' +
        campo('nome', 'Nome completo *', 'text', 'name', 'col-2') +
        campo('cpf', 'CPF *', 'text', 'off', '', 'inputmode="numeric" placeholder="000.000.000-00"') +
        campo('nascimento', 'Data de nascimento *', 'date', 'bday') +
        campo('telefone', 'Celular *', 'tel', 'tel', '', 'placeholder="(00) 00000-0000"') +
        campo('email', 'E-mail *', 'email', 'email') +
        campo('senha', 'Senha *', 'password', 'new-password', '', 'aria-describedby="senha-dica senha-erro"', '<p class="ajuda" id="senha-dica">Mínimo de 8 caracteres, com letra maiúscula, número e símbolo.</p>') +
        campo('senha2', 'Confirme a senha *', 'password', 'new-password') +
        '<div class="campo col-2 consentimento"><label class="check"><input type="checkbox" id="lgpd" name="lgpd" aria-describedby="lgpd-erro" /> ' +
        '<span>Li e concordo com a <button type="button" class="link" id="ver-politica">Política de privacidade</button> e autorizo o tratamento dos meus dados de saúde para fins de atendimento. *</span></label>' +
        '<p class="erro" id="lgpd-erro"></p></div>' +
        '<div class="col-2"><button type="submit" class="btn btn-primario">Criar cadastro</button></div>' +
        '</form></section></div>';

      function campo(id, rotulo, tipo, ac, cls, extra, depois) {
        return '<div class="campo ' + (cls || '') + '"><label for="' + id + '">' + esc(rotulo) + '</label>' +
          '<input id="' + id + '" name="' + id + '" type="' + tipo + '" autocomplete="' + ac + '" ' + (extra && extra.indexOf('aria-describedby') !== -1 ? '' : 'aria-describedby="' + id + '-erro" ') + (extra || '') + ' />' +
          (depois || '') + '<p class="erro" id="' + id + '-erro"></p></div>';
      }
    },
    montar: function (el) {
      const f = el.querySelector('#form-cad');
      f.cpf.addEventListener('input', function () { f.cpf.value = formatarCPF(f.cpf.value); });
      f.telefone.addEventListener('input', function () { f.telefone.value = formatarTelefone(f.telefone.value); });
      el.querySelector('#ver-politica').addEventListener('click', function () { UI.modal('Política de privacidade', POLITICA); });

      f.addEventListener('submit', function (e) {
        e.preventDefault();
        const st = Store.get();
        const v = function (n) { return f[n].value.trim(); };
        const regras = {
          nome: v('nome').split(/\s+/).length < 2 ? 'Informe nome e sobrenome.' : '',
          cpf: !cpfValido(v('cpf')) ? 'CPF inválido.' : (st.pacientes.some(function (p) { return p.cpf === v('cpf'); }) ? 'CPF já cadastrado.' : ''),
          nascimento: !v('nascimento') || v('nascimento') > UI.hoje() ? 'Informe uma data válida.' : '',
          telefone: v('telefone').replace(/\D/g, '').length < 10 ? 'Telefone incompleto.' : '',
          email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email')) ? 'E-mail inválido.' : (st.usuarios.some(function (u) { return u.email === v('email').toLowerCase(); }) ? 'E-mail já cadastrado.' : ''),
          senha: !/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(f.senha.value) ? 'A senha não atende aos requisitos.' : '',
          senha2: f.senha2.value !== f.senha.value ? 'As senhas não coincidem.' : ''
        };
        let ok = true;
        Object.keys(regras).forEach(function (k) { ok = campoErro(f[k], el.querySelector('#' + k + '-erro'), regras[k]) && ok; });
        ok = campoErro(f.lgpd, el.querySelector('#lgpd-erro'), f.lgpd.checked ? '' : 'É necessário aceitar a política para continuar.') && ok;
        if (!ok) { f.querySelector('[aria-invalid="true"]').focus(); return; }

        const id = Store.novoId('p');
        st.pacientes.push({
          id: id, nome: v('nome'), cpf: v('cpf'), nascimento: v('nascimento'), telefone: v('telefone'),
          email: v('email').toLowerCase(), convenio: 'Particular', sangue: '-', alergias: 'Não informado', endereco: '', consentimentoLGPD: true
        });
        st.usuarios.push({ email: v('email').toLowerCase(), senha: f.senha.value, perfil: 'paciente', refId: id, nome: v('nome') });
        Store.auditar('PACIENTE_CADASTRADO', id + ' (autocadastro, consentimento LGPD registrado)');
        UI.toast('Cadastro criado! Faça login para continuar.');
        location.hash = '#/login';
      });
    }
  });
})();
