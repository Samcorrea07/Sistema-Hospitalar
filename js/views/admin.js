/* =========================================================================
 * Views do perfil ADMINISTRADOR
 * ========================================================================= */
(function () {
  'use strict';
  const esc = UI.esc;
  const P = ['admin'];

  function daUnidade(ctx) {
    const u = ctx.sessao.unidadeId;
    return function (x) { return u === 'todas' || x.unidadeId === u; };
  }
  function nomeUnidade(ctx) {
    return ctx.sessao.unidadeId === 'todas' ? 'Todas as unidades' : Store.unidade(ctx.sessao.unidadeId).nome;
  }
  function kpi(rotulo, valor, extra, tom) {
    return '<div class="kpi ' + (tom ? 'kpi-' + tom : '') + '"><span class="kpi-valor">' + valor + '</span><span class="kpi-rotulo">' + esc(rotulo) + '</span>' + (extra ? '<span class="kpi-extra">' + esc(extra) + '</span>' : '') + '</div>';
  }

  // ------------------------------- PAINEL -------------------------------
  Router.rota('/admin', {
    titulo: 'Painel', perfis: P,
    render: function (p, ctx) {
      const st = Store.get();
      const f = daUnidade(ctx);
      const leitos = st.leitos.filter(f);
      const ocup = leitos.filter(function (l) { return l.status === 'ocupado'; }).length;
      const taxa = leitos.length ? Math.round((ocup / leitos.length) * 100) : 0;
      const hoje = st.agendamentos.filter(function (a) { return f(a) && a.data === UI.hoje() && a.status !== 'cancelada'; });
      const criticos = st.suprimentos.filter(function (s) { return f(s) && s.qtd < s.minimo; });
      const fin = st.financeiro[st.financeiro.length - 1];
      return '<header class="pagina-cab"><div><h1 id="titulo-pagina" tabindex="-1">Painel administrativo</h1><p class="sub">' + esc(nomeUnidade(ctx)) + ' · ' + esc(UI.dataExtenso(UI.hoje())) + '</p></div></header>' +
        '<section class="kpis" aria-label="Indicadores">' +
        kpi('Ocupação de leitos', leitos.length ? taxa + '%' : '—', ocup + ' de ' + leitos.length + ' leitos', taxa >= 85 ? 'perigo' : '') +
        kpi('Atendimentos hoje', hoje.length, hoje.filter(function (a) { return a.tipo === 'tele'; }).length + ' por telemedicina') +
        kpi('Pacientes cadastrados', st.pacientes.length, 'rede VidaPlus') +
        kpi('Itens em estoque crítico', criticos.length, 'abaixo do mínimo', criticos.length ? 'alerta' : '') + '</section>' +
        '<div class="grade-2 grade-2-larga">' +
        '<section class="painel" aria-labelledby="h-fin"><h2 id="h-fin">Receitas × despesas (últimos 6 meses)</h2>' +
        UI.graficoBarras(st.financeiro.map(function (m) { return { rotulo: m.mes, receita: m.receita, despesa: m.despesa }; }),
          [{ chave: 'receita', nome: 'Receita', classe: 'serie-1' }, { chave: 'despesa', nome: 'Despesa', classe: 'serie-2' }], { titulo: 'Gráfico de receitas e despesas mensais. Dados detalhados em Relatórios.' }) +
        '<p class="ajuda">Resultado do mês atual: <strong>' + UI.moeda(fin.receita - fin.despesa) + '</strong>. <a href="#/admin/relatorios">Ver relatório completo</a></p></section>' +
        '<section class="painel" aria-labelledby="h-sup"><h2 id="h-sup">Suprimentos críticos</h2>' +
        (criticos.length ? '<ul class="lista-sup">' + criticos.map(function (s) {
          const pct = Math.round((s.qtd / s.minimo) * 100);
          return '<li><div class="sup-topo"><span>' + esc(s.item) + '</span><span class="ag-meta">' + s.qtd + ' / mín. ' + s.minimo + '</span></div>' +
            '<div class="barra" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '" aria-label="Estoque de ' + esc(s.item) + ': ' + pct + '% do mínimo"><span style="width:' + Math.min(100, pct) + '%"></span></div>' +
            '<p class="ag-meta">' + esc(Store.unidade(s.unidadeId).nome) + '</p></li>';
        }).join('') + '</ul><button type="button" class="btn btn-secundario" id="pedido">Gerar pedido de reposição</button>' : UI.vazio('Nenhum item abaixo do mínimo.')) + '</section></div>';
    },
    montar: function (el) {
      const b = el.querySelector('#pedido');
      if (b) b.addEventListener('click', function () { Store.auditar('PEDIDO_SUPRIMENTOS', 'reposição de itens críticos'); UI.toast('Pedido de reposição enviado ao setor de compras.'); });
    }
  });

  // ------------------------------- LEITOS -------------------------------
  Router.rota('/admin/leitos', {
    titulo: 'Leitos', perfis: P,
    render: function (p, ctx) {
      const st = Store.get();
      const leitos = st.leitos.filter(daUnidade(ctx));
      const alas = {};
      leitos.forEach(function (l) { (alas[l.unidadeId + '|' + l.ala] = alas[l.unidadeId + '|' + l.ala] || []).push(l); });
      const resumo = { livre: 0, ocupado: 0, higienizacao: 0, manutencao: 0 };
      leitos.forEach(function (l) { resumo[l.status]++; });
      return '<header class="pagina-cab"><div><h1 id="titulo-pagina" tabindex="-1">Gestão de leitos e internações</h1><p class="sub">' + esc(nomeUnidade(ctx)) + '</p></div></header>' +
        '<section class="kpis" aria-label="Situação dos leitos">' + kpi('Livres', resumo.livre, '', 'ok') + kpi('Ocupados', resumo.ocupado, '', 'perigo') + kpi('Higienização', resumo.higienizacao, '', 'alerta') + kpi('Manutenção', resumo.manutencao) + '</section>' +
        (Object.keys(alas).length ? Object.keys(alas).map(function (k) {
          const [uid, ala] = k.split('|');
          return '<section class="painel" aria-labelledby="ala-' + esc(alas[k][0].id) + '"><h2 id="ala-' + esc(alas[k][0].id) + '">' + esc(ala) + ' <small>— ' + esc(Store.unidade(uid).nome) + '</small></h2><ul class="mapa-leitos">' +
            alas[k].map(function (l) {
              const pac = l.pacienteId ? Store.paciente(l.pacienteId) : null;
              return '<li><button type="button" class="leito leito-' + l.status + '" data-leito="' + esc(l.id) + '">' +
                '<span class="sr-only">Leito </span><span class="leito-id">' + esc(l.id) + '</span><span class="sr-only">, </span><span class="leito-st">' + UI.badge(l.status).replace(/<[^>]+>/g, '') + '</span>' + (pac ? '<span class="leito-pac"><span class="sr-only">paciente </span>' + esc(pac.nome.split(' ')[0]) + '</span>' : '') + '</button></li>';
            }).join('') + '</ul></section>';
        }).join('') : '<section class="painel">' + UI.vazio('Esta unidade não possui leitos de internação.') + '</section>');
    },
    montar: function (el, p, ctx, rerender) {
      el.querySelectorAll('[data-leito]').forEach(function (b) {
        b.addEventListener('click', function () {
          const st = Store.get();
          const l = st.leitos.find(function (x) { return x.id === b.getAttribute('data-leito'); });
          const pac = l.pacienteId ? Store.paciente(l.pacienteId) : null;
          if (l.status === 'ocupado') {
            UI.modal('Leito ' + l.id, '<dl class="resumo"><dt>Paciente</dt><dd>' + esc(pac.nome) + '</dd><dt>Internado desde</dt><dd>' + UI.dataBR(l.desde) + '</dd><dt>Ala</dt><dd>' + esc(l.ala) + '</dd></dl>',
              [{ rotulo: 'Fechar', classe: 'btn-secundario' }, { rotulo: 'Registrar alta', classe: 'btn-primario', onClick: function () {
                Store.auditar('ALTA', 'leito ' + l.id + ' paciente ' + l.pacienteId);
                l.status = 'higienizacao'; l.pacienteId = null; l.desde = null; Store.salvar();
                UI.toast('Alta registrada. Leito ' + l.id + ' enviado para higienização.'); rerender();
              } }]);
          } else if (l.status === 'livre') {
            const internados = st.leitos.filter(function (x) { return x.pacienteId; }).map(function (x) { return x.pacienteId; });
            const disp = st.pacientes.filter(function (pp) { return internados.indexOf(pp.id) === -1; });
            UI.modal('Internar no leito ' + l.id, '<div class="campo"><label for="int-pac">Paciente</label><select id="int-pac"><option value="">Selecione</option>' +
              disp.map(function (pp) { return '<option value="' + pp.id + '">' + esc(pp.nome) + ' — CPF ' + esc(UI.mascararCPF(pp.cpf)) + '</option>'; }).join('') + '</select></div><p class="erro" id="int-erro" role="alert"></p>',
              [{ rotulo: 'Cancelar', classe: 'btn-secundario' }, { rotulo: 'Confirmar internação', classe: 'btn-primario', onClick: function (d) {
                const v = d.querySelector('#int-pac').value;
                if (!v) { d.querySelector('#int-erro').textContent = 'Selecione o paciente.'; return false; }
                l.status = 'ocupado'; l.pacienteId = v; l.desde = UI.hoje();
                Store.auditar('INTERNACAO', 'leito ' + l.id + ' paciente ' + v);
                UI.toast('Internação registrada no leito ' + l.id + '.'); rerender();
              } }]);
          } else {
            UI.modal('Leito ' + l.id, '<p>Leito em ' + (l.status === 'higienizacao' ? 'higienização' : 'manutenção') + '. Deseja liberá-lo para uso?</p>',
              [{ rotulo: 'Fechar', classe: 'btn-secundario' }, { rotulo: 'Liberar leito', classe: 'btn-primario', onClick: function () {
                l.status = 'livre'; Store.auditar('LEITO_LIBERADO', l.id); UI.toast('Leito ' + l.id + ' liberado.'); rerender();
              } }]);
          }
        });
      });
    }
  });

  // ------------------------------- CADASTROS -------------------------------
  let abaCad = 'pacientes';
  Router.rota('/admin/cadastros', {
    titulo: 'Cadastros', perfis: P,
    render: function () {
      const st = Store.get();
      const tab = function (id, r) { return '<button type="button" role="tab" id="tab-' + id + '" aria-controls="painel-cad" aria-selected="' + (abaCad === id) + '" tabindex="' + (abaCad === id ? 0 : -1) + '" data-aba="' + id + '">' + r + '</button>'; };
      let tabela;
      if (abaCad === 'pacientes') {
        tabela = '<table class="tabela"><caption class="sr-only">Pacientes</caption><thead><tr><th scope="col">Nome</th><th scope="col">CPF</th><th scope="col">Idade</th><th scope="col">Convênio</th><th scope="col">Contato</th><th scope="col">LGPD</th></tr></thead><tbody>' +
          st.pacientes.map(function (p) {
            return '<tr data-busca="' + esc(p.nome.toLowerCase()) + '"><td data-rotulo="Nome">' + esc(p.nome) + '</td><td data-rotulo="CPF">' + esc(UI.mascararCPF(p.cpf)) + '</td><td data-rotulo="Idade">' + UI.idade(p.nascimento) + '</td><td data-rotulo="Convênio">' + esc(p.convenio) + '</td><td data-rotulo="Contato">' + esc(p.telefone) + '</td><td data-rotulo="LGPD">' + (p.consentimentoLGPD ? '<span class="badge badge-ok">Consentido</span>' : '<span class="badge badge-alerta">Revogado</span>') + '</td></tr>';
          }).join('') + '</tbody></table>';
      } else {
        tabela = '<table class="tabela"><caption class="sr-only">Profissionais</caption><thead><tr><th scope="col">Nome</th><th scope="col">Cargo</th><th scope="col">Especialidade</th><th scope="col">Registro</th><th scope="col">Unidades</th><th scope="col">Situação</th></tr></thead><tbody>' +
          st.profissionais.map(function (p) {
            return '<tr data-busca="' + esc(p.nome.toLowerCase()) + '"><td data-rotulo="Nome">' + esc(p.nome) + '</td><td data-rotulo="Cargo">' + esc(p.cargo) + '</td><td data-rotulo="Especialidade">' + esc(p.especialidade) + '</td><td data-rotulo="Registro">' + esc(p.registro) + '</td><td data-rotulo="Unidades">' +
              p.unidades.map(function (u) { return esc(Store.unidade(u).nome.replace('VidaPlus ', '')); }).join(', ') + '</td><td data-rotulo="Situação"><button type="button" class="link" data-ativo="' + esc(p.id) + '" aria-label="' + (p.ativo ? 'Desativar ' : 'Ativar ') + esc(p.nome) + '">' + (p.ativo ? '<span class="badge badge-ok">Ativo</span>' : '<span class="badge badge-neutro">Inativo</span>') + '</button></td></tr>';
          }).join('') + '</tbody></table>';
      }
      return '<header class="pagina-cab"><div><h1 id="titulo-pagina" tabindex="-1">Cadastros</h1><p class="sub">Pacientes e profissionais de todas as unidades.</p></div>' +
        '<button type="button" class="btn btn-primario" id="novo-prof">' + UI.icone('mais') + 'Novo profissional</button></header>' +
        '<section class="painel"><div class="abas" role="tablist" aria-label="Tipo de cadastro">' + tab('pacientes', 'Pacientes (' + st.pacientes.length + ')') + tab('profissionais', 'Profissionais (' + st.profissionais.length + ')') + '</div>' +
        '<div id="painel-cad" role="tabpanel" aria-labelledby="tab-' + abaCad + '"><div class="campo"><label for="filtro">Filtrar por nome</label><input id="filtro" type="search" /></div>' +
        '<div class="tabela-wrap">' + tabela + '</div></div></section>';
    },
    montar: function (el, p, ctx, rerender) {
      const tabs = el.querySelectorAll('[data-aba]');
      tabs.forEach(function (t, i) {
        t.addEventListener('click', function () { abaCad = t.getAttribute('data-aba'); rerender(); el.querySelector('#tab-' + abaCad).focus(); });
        t.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); tabs[(i + 1) % tabs.length].click(); }
        });
      });
      el.querySelector('#filtro').addEventListener('input', function (e) {
        const q = e.target.value.trim().toLowerCase();
        el.querySelectorAll('tbody tr').forEach(function (tr) { tr.hidden = q && tr.getAttribute('data-busca').indexOf(q) === -1; });
      });
      el.querySelectorAll('[data-ativo]').forEach(function (b) {
        b.addEventListener('click', function () {
          const pr = Store.profissional(b.getAttribute('data-ativo'));
          pr.ativo = !pr.ativo; Store.auditar('PROFISSIONAL_' + (pr.ativo ? 'ATIVADO' : 'DESATIVADO'), pr.id);
          UI.toast(pr.nome + (pr.ativo ? ' ativado.' : ' desativado.')); rerender();
        });
      });
      el.querySelector('#novo-prof').addEventListener('click', function () {
        const st = Store.get();
        UI.modal('Novo profissional', '<div class="grade-form">' +
          '<div class="campo col-2"><label for="np-nome">Nome completo</label><input id="np-nome" /></div>' +
          '<div class="campo"><label for="np-cargo">Cargo</label><select id="np-cargo"><option>Médico(a)</option><option>Enfermeiro(a)</option><option>Técnico(a) de enfermagem</option><option>Técnico(a) de laboratório</option></select></div>' +
          '<div class="campo"><label for="np-esp">Especialidade</label><input id="np-esp" /></div>' +
          '<div class="campo"><label for="np-reg">Registro profissional</label><input id="np-reg" placeholder="CRM-MG 00.000" /></div>' +
          '<div class="campo"><label for="np-email">E-mail corporativo</label><input id="np-email" type="email" /></div>' +
          '<fieldset class="campo col-2"><legend>Unidades de atuação</legend>' + st.unidades.map(function (u) { return '<label class="check"><input type="checkbox" class="np-un" value="' + u.id + '" /> <span>' + esc(u.nome) + '</span></label>'; }).join('') + '</fieldset>' +
          '</div><p class="erro" id="np-erro" role="alert"></p>',
          [{ rotulo: 'Cancelar', classe: 'btn-secundario' }, { rotulo: 'Cadastrar', classe: 'btn-primario', onClick: function (d) {
            const g = function (id) { return d.querySelector('#' + id).value.trim(); };
            const uns = Array.from(d.querySelectorAll('.np-un:checked')).map(function (c) { return c.value; });
            if (!g('np-nome') || !g('np-esp') || !g('np-reg') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g('np-email')) || !uns.length) {
              d.querySelector('#np-erro').textContent = 'Preencha todos os campos e selecione ao menos uma unidade.'; return false;
            }
            const id = Store.novoId('pr');
            st.profissionais.push({ id: id, nome: g('np-nome'), cargo: g('np-cargo'), especialidade: g('np-esp'), registro: g('np-reg'), unidades: uns, email: g('np-email'), ativo: true });
            Store.auditar('PROFISSIONAL_CADASTRADO', id);
            abaCad = 'profissionais'; UI.toast('Profissional cadastrado.'); rerender();
          } }], { largo: true });
      });
    }
  });

  // ------------------------------- RELATÓRIOS -------------------------------
  Router.rota('/admin/relatorios', {
    titulo: 'Relatórios', perfis: P,
    render: function (p, ctx) {
      const st = Store.get();
      const f = daUnidade(ctx);
      const ag = st.agendamentos.filter(f);
      const porTipo = { presencial: 0, tele: 0, exame: 0 };
      const porStatus = { agendada: 0, realizada: 0, cancelada: 0 };
      ag.forEach(function (a) { porTipo[a.tipo]++; porStatus[a.status]++; });
      const totR = st.financeiro.reduce(function (s, m) { return s + m.receita; }, 0);
      const totD = st.financeiro.reduce(function (s, m) { return s + m.despesa; }, 0);
      return '<header class="pagina-cab"><div><h1 id="titulo-pagina" tabindex="-1">Relatórios gerenciais</h1><p class="sub">' + esc(nomeUnidade(ctx)) + '</p></div>' +
        '<button type="button" class="btn btn-secundario" id="csv-fin">' + UI.icone('download') + 'Exportar financeiro (CSV)</button></header>' +
        '<section class="painel" aria-labelledby="h-f"><h2 id="h-f">Demonstrativo financeiro consolidado</h2><div class="tabela-wrap"><table class="tabela tabela-num"><caption class="sr-only">Receitas, despesas e resultado por mês</caption>' +
        '<thead><tr><th scope="col">Mês</th><th scope="col">Receita</th><th scope="col">Despesa</th><th scope="col">Resultado</th><th scope="col">Margem</th></tr></thead><tbody>' +
        st.financeiro.map(function (m) {
          return '<tr><th scope="row" data-rotulo="Mês">' + esc(m.mes) + '</th><td data-rotulo="Receita">' + UI.moeda(m.receita) + '</td><td data-rotulo="Despesa">' + UI.moeda(m.despesa) + '</td><td data-rotulo="Resultado">' + UI.moeda(m.receita - m.despesa) + '</td><td data-rotulo="Margem">' + (((m.receita - m.despesa) / m.receita) * 100).toFixed(1).replace('.', ',') + '%</td></tr>';
        }).join('') + '</tbody><tfoot><tr><th scope="row">Total</th><td>' + UI.moeda(totR) + '</td><td>' + UI.moeda(totD) + '</td><td>' + UI.moeda(totR - totD) + '</td><td>' + (((totR - totD) / totR) * 100).toFixed(1).replace('.', ',') + '%</td></tr></tfoot></table></div></section>' +
        '<div class="grade-2"><section class="painel" aria-labelledby="h-t"><h2 id="h-t">Atendimentos por tipo</h2><ul class="lista-barras">' +
        Object.keys(porTipo).map(function (k) { return barra(UI.tipoLabel(k), porTipo[k], ag.length); }).join('') + '</ul></section>' +
        '<section class="painel" aria-labelledby="h-s"><h2 id="h-s">Atendimentos por situação</h2><ul class="lista-barras">' +
        Object.keys(porStatus).map(function (k) { return barra(UI.badge(k).replace(/<[^>]+>/g, ''), porStatus[k], ag.length); }).join('') + '</ul></section></div>';
      function barra(r, v, t) {
        const pct = t ? Math.round((v / t) * 100) : 0;
        return '<li><div class="sup-topo"><span>' + esc(r) + '</span><span>' + v + ' (' + pct + '%)</span></div><div class="barra barra-info" aria-hidden="true"><span style="width:' + pct + '%"></span></div></li>';
      }
    },
    montar: function (el) {
      el.querySelector('#csv-fin').addEventListener('click', function () {
        const linhas = [['Mês', 'Receita (R$)', 'Despesa (R$)', 'Resultado (R$)']].concat(Store.get().financeiro.map(function (m) { return [m.mes, m.receita * 1000, m.despesa * 1000, (m.receita - m.despesa) * 1000]; }));
        UI.baixarArquivo('relatorio-financeiro-vidaplus.csv', UI.csv(linhas), 'text/csv;charset=utf-8');
        Store.auditar('RELATORIO_EXPORTADO', 'financeiro CSV');
        UI.toast('Relatório exportado.');
      });
    }
  });

  // ------------------------------- AUDITORIA -------------------------------
  Router.rota('/admin/auditoria', {
    titulo: 'Auditoria', perfis: P,
    render: function () {
      const logs = Store.get().auditoria;
      const acoes = Array.from(new Set(logs.map(function (l) { return l.acao; }))).sort();
      return '<header class="pagina-cab"><div><h1 id="titulo-pagina" tabindex="-1">Registros de auditoria</h1><p class="sub">Trilha imutável de acessos e operações (LGPD art. 37 e 46).</p></div>' +
        '<button type="button" class="btn btn-secundario" id="csv-log">' + UI.icone('download') + 'Exportar (CSV)</button></header>' +
        '<section class="painel"><div class="grade-form"><div class="campo"><label for="f-acao">Ação</label><select id="f-acao"><option value="">Todas</option>' + acoes.map(function (a) { return '<option>' + esc(a) + '</option>'; }).join('') + '</select></div>' +
        '<div class="campo"><label for="f-user">Usuário</label><input id="f-user" type="search" /></div></div>' +
        '<p class="sr-only" role="status" id="log-status"></p>' +
        '<div class="tabela-wrap"><table class="tabela tabela-log"><caption class="sr-only">Registros de auditoria</caption><thead><tr><th scope="col">Data/hora</th><th scope="col">Usuário</th><th scope="col">Perfil</th><th scope="col">Ação</th><th scope="col">Detalhe</th><th scope="col">IP</th></tr></thead><tbody>' +
        (logs.length ? logs.map(function (l) {
          return '<tr data-acao="' + esc(l.acao) + '" data-user="' + esc(l.usuario.toLowerCase()) + '"><td data-rotulo="Data/hora">' + new Date(l.quando).toLocaleString('pt-BR') + '</td><td data-rotulo="Usuário">' + esc(l.usuario) + '</td><td data-rotulo="Perfil">' + esc(l.perfil) + '</td><td data-rotulo="Ação"><code>' + esc(l.acao) + '</code></td><td data-rotulo="Detalhe">' + esc(l.detalhe) + '</td><td data-rotulo="IP">' + esc(l.ip) + '</td></tr>';
        }).join('') : '<tr><td colspan="6">' + UI.vazio('Nenhum registro.') + '</td></tr>') + '</tbody></table></div></section>';
    },
    montar: function (el) {
      const fa = el.querySelector('#f-acao'), fu = el.querySelector('#f-user');
      function filtrar() {
        let n = 0;
        el.querySelectorAll('tbody tr[data-acao]').forEach(function (tr) {
          const vis = (!fa.value || tr.getAttribute('data-acao') === fa.value) && (!fu.value || tr.getAttribute('data-user').indexOf(fu.value.toLowerCase()) !== -1);
          tr.hidden = !vis; if (vis) n++;
        });
        el.querySelector('#log-status').textContent = n + ' registro(s) exibido(s).';
      }
      fa.addEventListener('change', filtrar); fu.addEventListener('input', filtrar);
      el.querySelector('#csv-log').addEventListener('click', function () {
        const linhas = [['Data/hora', 'Usuário', 'Perfil', 'Ação', 'Detalhe', 'IP']].concat(Store.get().auditoria.map(function (l) { return [l.quando, l.usuario, l.perfil, l.acao, l.detalhe, l.ip]; }));
        UI.baixarArquivo('auditoria-vidaplus.csv', UI.csv(linhas), 'text/csv;charset=utf-8');
        UI.toast('Registros exportados.');
      });
    }
  });
})();
