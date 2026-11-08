/* =========================================================================
 * SGHSS VidaPlus — Aplicação (layout, navegação e roteamento)
 * SPA com roteamento por hash: funciona em hospedagem estática (GitHub Pages).
 * ========================================================================= */
(function () {
  'use strict';
  const esc = UI.esc;

  const MENUS = {
    paciente: [
      ['#/paciente', 'home', 'Início'], ['#/paciente/agendar', 'calendario', 'Agendar'],
      ['#/paciente/consultas', 'lista', 'Meus agendamentos'], ['#/paciente/historico', 'historico', 'Histórico clínico'],
      ['#/paciente/dados', 'escudo', 'Meus dados e LGPD']
    ],
    profissional: [
      ['#/profissional', 'calendario', 'Agenda'], ['#/profissional/pacientes', 'grupo', 'Pacientes']
    ],
    admin: [
      ['#/admin', 'grafico', 'Painel'], ['#/admin/leitos', 'leito', 'Leitos e internações'],
      ['#/admin/cadastros', 'grupo', 'Cadastros'], ['#/admin/relatorios', 'lista', 'Relatórios'],
      ['#/admin/auditoria', 'escudo', 'Auditoria']
    ]
  };
  const ROTULO_PERFIL = { paciente: 'Paciente', profissional: 'Profissional de saúde', admin: 'Administrador' };

  const App = {
    inicio: function (perfil) { return '#/' + (perfil || 'login'); }
  };
  window.App = App;

  function aplicarPrefs() {
    const pr = Store.prefs();
    document.documentElement.classList.toggle('alto-contraste', !!pr.contraste);
    document.documentElement.style.fontSize = pr.fonte + '%';
  }

  function layout(sessao, caminho, conteudo) {
    const menu = MENUS[sessao.perfil].map(function (m) {
      const atual = caminho === m[0].slice(1) || (m[0] !== '#/' + sessao.perfil && caminho.indexOf(m[0].slice(1)) === 0);
      return '<li><a href="' + m[0] + '"' + (atual ? ' aria-current="page"' : '') + '>' + UI.icone(m[1]) + '<span>' + esc(m[2]) + '</span></a></li>';
    }).join('');
    const st = Store.get();
    const seletorUnidade = sessao.perfil === 'admin'
      ? '<div class="seletor-unidade"><label for="unidade-atual">Unidade</label><select id="unidade-atual">' +
        '<option value="todas"' + (sessao.unidadeId === 'todas' ? ' selected' : '') + '>Todas as unidades</option>' +
        st.unidades.map(function (u) { return '<option value="' + u.id + '"' + (u.id === sessao.unidadeId ? ' selected' : '') + '>' + esc(u.nome) + '</option>'; }).join('') +
        '</select></div>' : '';
    const naoLidas = sessao.perfil === 'paciente' ? st.notificacoes.filter(function (n) { return n.pacienteId === sessao.refId && !n.lida; }).length : 0;

    return '' +
      '<header class="topo">' +
      '<button type="button" class="btn-icone menu-toggle" id="menu-toggle" aria-expanded="false" aria-controls="menu-lateral" aria-label="Abrir menu">' + UI.icone('menu') + '</button>' +
      '<a class="marca-texto" href="' + App.inicio(sessao.perfil) + '"><span class="marca-cruz">' + UI.icone('mais') + '</span> VidaPlus <small>SGHSS</small></a>' +
      seletorUnidade +
      '<div class="topo-acoes">' +
      '<div class="a11y" role="group" aria-label="Acessibilidade">' +
      '<button type="button" class="btn-icone" id="fonte-menos" title="Diminuir tamanho do texto">A−<span class="sr-only"> diminuir texto</span></button>' +
      '<button type="button" class="btn-icone" id="fonte-mais" title="Aumentar tamanho do texto">A+<span class="sr-only"> aumentar texto</span></button>' +
      '<button type="button" class="btn-icone" id="contraste" aria-pressed="' + !!Store.prefs().contraste + '" aria-label="Alto contraste">' + UI.icone('contraste') + '</button></div>' +
      (sessao.perfil === 'paciente' ? '<a class="btn-icone sino" href="#/paciente" aria-label="Notificações: ' + naoLidas + ' não lidas">' + UI.icone('sino') + (naoLidas ? '<span class="ponto" aria-hidden="true">' + naoLidas + '</span>' : '') + '</a>' : '') +
      '<div class="usuario"><span class="avatar" aria-hidden="true">' + esc(sessao.nome.replace(/^(Dr\.|Dra\.|Enf\.|Téc\.)\s/, '').charAt(0)) + '</span>' +
      '<span class="usuario-txt"><strong>' + esc(sessao.nome) + '</strong><small>' + esc(ROTULO_PERFIL[sessao.perfil]) + '</small></span></div>' +
      '<button type="button" class="btn btn-secundario btn-p" id="sair">' + UI.icone('sair') + '<span class="so-desktop">Sair</span></button>' +
      '</div></header>' +
      '<div class="corpo">' +
      '<nav id="menu-lateral" class="menu-lateral" aria-label="Menu principal"><ul>' + menu + '</ul>' +
      '<p class="menu-rodape">' + UI.icone('escudo') + ' Sessão expira após 15 min de inatividade</p></nav>' +
      '<main id="conteudo" class="conteudo" tabindex="-1">' + conteudo + '</main></div>';
  }

  function render() {
    const caminho = (location.hash || '#/login').slice(1) || '/login';
    const sessao = Store.sessao();
    const r = Router.resolver(caminho);
    const app = document.getElementById('app');
    UI.fecharModal();

    if (!r) { location.hash = sessao ? App.inicio(sessao.perfil) : '#/login'; return; }
    if (!r.def.publico && !sessao) { location.hash = '#/login'; return; }
    if (r.def.publico && sessao) { location.hash = App.inicio(sessao.perfil); return; }
    // Controle de acesso por perfil (RBAC) — o back-end também validaria cada requisição.
    if (r.def.perfis && r.def.perfis.indexOf(sessao.perfil) === -1) {
      Store.auditar('ACESSO_NEGADO', caminho);
      UI.toast('Você não tem permissão para acessar essa página.', 'erro');
      location.hash = App.inicio(sessao.perfil);
      return;
    }

    const ctx = { sessao: sessao };
    const rerender = function () { render(); };
    const html = r.def.render(r.params, ctx);

    if (r.def.publico) {
      app.innerHTML = '<main id="conteudo" class="conteudo-publico" tabindex="-1">' + html + '</main>';
    } else {
      app.innerHTML = layout(sessao, caminho, html);
      ligarLayout(sessao);
    }
    document.title = r.def.titulo + ' · SGHSS VidaPlus';
    const main = document.getElementById('conteudo');
    r.def.montar && r.def.montar(main, r.params, ctx, rerender);

    // Gerenciamento de foco após navegação (WCAG 2.4.3): leva o foco ao título da página.
    if (window.__navegou) {
      const h1 = document.getElementById('titulo-pagina');
      (h1 || main).focus({ preventScroll: false });
    }
  }

  function ligarLayout(sessao) {
    const tg = document.getElementById('menu-toggle');
    const nav = document.getElementById('menu-lateral');
    tg.addEventListener('click', function () {
      const aberto = nav.classList.toggle('aberto');
      tg.setAttribute('aria-expanded', String(aberto));
      tg.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
      if (aberto) nav.querySelector('a').focus();
    });
    nav.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('aberto')) { nav.classList.remove('aberto'); tg.setAttribute('aria-expanded', 'false'); tg.setAttribute('aria-label', 'Abrir menu'); tg.focus(); }
    });
    document.getElementById('sair').addEventListener('click', function () {
      UI.confirmar('Sair do sistema', 'Deseja encerrar sua sessão?', 'Sair', function () {
        Store.logout(); UI.toast('Sessão encerrada com segurança.'); location.hash = '#/login';
      });
    });
    const sel = document.getElementById('unidade-atual');
    if (sel) sel.addEventListener('change', function () { Store.setUnidade(sel.value); render(); });

    document.getElementById('fonte-mais').addEventListener('click', function () { Store.setPref('fonte', Math.min(150, Store.prefs().fonte + 10)); aplicarPrefs(); });
    document.getElementById('fonte-menos').addEventListener('click', function () { Store.setPref('fonte', Math.max(90, Store.prefs().fonte - 10)); aplicarPrefs(); });
    document.getElementById('contraste').addEventListener('click', function (e) {
      const v = !Store.prefs().contraste; Store.setPref('contraste', v); aplicarPrefs();
      e.currentTarget.setAttribute('aria-pressed', String(v));
    });
  }

  // Renova a sessão a cada interação; verifica expiração periodicamente.
  ['click', 'keydown'].forEach(function (ev) { document.addEventListener(ev, function () { Store.renovarSessao(); }, { passive: true }); });
  setInterval(function () {
    const tinha = !!document.getElementById('sair');
    if (tinha && !Store.sessao()) { UI.toast('Sua sessão expirou. Entre novamente.', 'erro'); location.hash = '#/login'; }
  }, 30000);

  window.addEventListener('hashchange', function () { window.__navegou = true; render(); window.scrollTo(0, 0); });
  aplicarPrefs();
  render();
})();
