/* =========================================================================
 * Views do perfil PACIENTE
 * ========================================================================= */
(function () {
  'use strict';
  const esc = UI.esc;
  const P = ['paciente'];

  function meusAgendamentos(ctx) {
    return Store.get().agendamentos.filter(function (a) { return a.pacienteId === ctx.sessao.refId; });
  }
  function futuro(a) { return a.status === 'agendada' && a.data >= UI.hoje(); }
  function ordenar(lista, desc) {
    return lista.slice().sort(function (x, y) { const c = (x.data + x.hora).localeCompare(y.data + y.hora); return desc ? -c : c; });
  }

  function cartaoAgendamento(a, comAcoes) {
    const prof = Store.profissional(a.profissionalId);
    const un = Store.unidade(a.unidadeId);
    const hojeTele = a.tipo === 'tele' && a.data === UI.hoje() && a.status === 'agendada';
    return '<li class="cartao-ag">' +
      '<div class="ag-data"><span class="ag-dia">' + a.data.slice(8, 10) + '</span><span class="ag-mes">' +
      new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') + '</span></div>' +
      '<div class="ag-info"><p class="ag-titulo">' + esc(UI.tipoLabel(a.tipo)) + ' — ' + esc(a.especialidade) + '</p>' +
      '<p class="ag-meta">' + esc(a.hora) + ' · ' + esc(prof ? prof.nome : '') + ' · ' + (a.tipo === 'tele' ? 'Online' : esc(un ? un.nome : '')) + '</p>' +
      (a.motivo ? '<p class="ag-meta">Motivo: ' + esc(a.motivo) + '</p>' : '') + '</div>' +
      '<div class="ag-acoes">' + UI.badge(a.status) +
      (comAcoes && hojeTele ? '<a class="btn btn-primario btn-p" href="#/teleconsulta/' + esc(a.id) + '">' + UI.icone('video') + 'Entrar</a>' : '') +
      (comAcoes && a.status === 'agendada' ? '<button type="button" class="btn btn-secundario btn-p" data-cancelar="' + esc(a.id) + '">Cancelar</button>' : '') +
      '</div></li>';
  }

  function ligarCancelar(el, rerender) {
    el.querySelectorAll('[data-cancelar]').forEach(function (b) {
      b.addEventListener('click', function () {
        const id = b.getAttribute('data-cancelar');
        UI.modal('Cancelar agendamento',
          '<p>Deseja realmente cancelar este agendamento? O horário será liberado para outros pacientes.</p>' +
          '<div class="campo"><label for="motivo-canc">Motivo (opcional)</label><select id="motivo-canc"><option value="">Selecione</option><option>Conflito de horário</option><option>Melhora dos sintomas</option><option>Vou remarcar</option><option>Outro</option></select></div>',
          [{ rotulo: 'Manter agendamento', classe: 'btn-secundario' },
            { rotulo: 'Cancelar agendamento', classe: 'btn-perigo', onClick: function (dlg) {
              const r = Store.cancelar(id, dlg.querySelector('#motivo-canc').value);
              UI.toast(r.ok ? 'Agendamento cancelado.' : r.erro, r.ok ? 'ok' : 'erro');
              rerender();
            } }]);
      });
    });
  }

  // ------------------------------- PAINEL -------------------------------
  Router.rota('/paciente', {
    titulo: 'Início', perfis: P,
    render: function (p, ctx) {
      const st = Store.get();
      const pac = Store.paciente(ctx.sessao.refId);
      const proximos = ordenar(meusAgendamentos(ctx).filter(futuro)).slice(0, 3);
      const notifs = st.notificacoes.filter(function (n) { return n.pacienteId === ctx.sessao.refId; });
      const naoLidas = notifs.filter(function (n) { return !n.lida; }).length;
      return '<header class="pagina-cab"><div><h1 id="titulo-pagina" tabindex="-1">Olá, ' + esc(pac.nome.split(' ')[0]) + '</h1>' +
        '<p class="sub">' + esc(UI.dataExtenso(UI.hoje())) + '</p></div>' +
        '<a class="btn btn-primario" href="#/paciente/agendar">' + UI.icone('mais') + 'Novo agendamento</a></header>' +
        '<div class="grade-2">' +
        '<section class="painel" aria-labelledby="h-prox"><h2 id="h-prox">Próximos atendimentos</h2>' +
        (proximos.length ? '<ul class="lista-ag">' + proximos.map(function (a) { return cartaoAgendamento(a, true); }).join('') + '</ul>' : UI.vazio('Você não possui agendamentos futuros.')) +
        '<a href="#/paciente/consultas" class="link-mais">Ver todos os agendamentos →</a></section>' +
        '<section class="painel" aria-labelledby="h-not"><h2 id="h-not">Notificações <span class="contador" aria-label="' + naoLidas + ' não lidas">' + naoLidas + '</span></h2>' +
        (notifs.length ? '<ul class="lista-notif">' + notifs.map(function (n) {
          return '<li class="' + (n.lida ? 'lida' : '') + '">' + UI.icone('sino') + '<div><p>' + esc(n.texto) + '</p><p class="ag-meta">' + UI.dataBR(n.data) + '</p></div>' +
            (n.lida ? '' : '<button type="button" class="link" data-lida="' + esc(n.id) + '">Marcar como lida</button>') + '</li>';
        }).join('') + '</ul>' : UI.vazio('Nenhuma notificação.')) + '</section>' +
        '</div>' +
        '<section class="atalhos" aria-label="Atalhos">' +
        atalho('#/paciente/agendar', 'calendario', 'Agendar consulta ou exame') +
        atalho('#/paciente/historico', 'historico', 'Histórico clínico') +
        atalho('#/paciente/consultas', 'video', 'Teleconsultas') +
        atalho('#/paciente/dados', 'escudo', 'Meus dados e privacidade') + '</section>';
      function atalho(h, ic, t) { return '<a class="atalho" href="' + h + '">' + UI.icone(ic) + '<span>' + esc(t) + '</span></a>'; }
    },
    montar: function (el, p, ctx, rerender) {
      ligarCancelar(el, rerender);
      el.querySelectorAll('[data-lida]').forEach(function (b) {
        b.addEventListener('click', function () {
          const n = Store.get().notificacoes.find(function (x) { return x.id === b.getAttribute('data-lida'); });
          if (n) { n.lida = true; Store.salvar(); rerender(); }
        });
      });
    }
  });

  // ------------------------------- AGENDAR -------------------------------
  const HORARIOS = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

  Router.rota('/paciente/agendar', {
    titulo: 'Agendar', perfis: P,
    render: function () {
      const st = Store.get();
      const especialidades = Array.from(new Set(st.profissionais.map(function (p) { return p.especialidade; })));
      return '<header class="pagina-cab"><div><h1 id="titulo-pagina" tabindex="-1">Novo agendamento</h1>' +
        '<p class="sub">Consultas presenciais, teleconsultas e exames em qualquer unidade VidaPlus.</p></div></header>' +
        '<form id="form-ag" class="painel" novalidate>' +
        '<ol class="passos" aria-label="Etapas do agendamento"><li>Tipo</li><li>Especialidade e profissional</li><li>Data e horário</li><li>Confirmação</li></ol>' +
        '<fieldset class="tipos"><legend>1. Tipo de atendimento</legend>' +
        tipo('presencial', 'Consulta presencial', 'usuario', true) + tipo('tele', 'Teleconsulta', 'video') + tipo('exame', 'Exame', 'caixa') + '</fieldset>' +
        '<fieldset><legend>2. Especialidade e profissional</legend><div class="grade-form">' +
        '<div class="campo"><label for="esp">Especialidade</label><select id="esp" name="esp" aria-describedby="esp-erro"><option value="">Selecione</option>' +
        especialidades.map(function (e) { return '<option>' + esc(e) + '</option>'; }).join('') + '</select><p class="erro" id="esp-erro"></p></div>' +
        '<div class="campo"><label for="prof">Profissional</label><select id="prof" name="prof" disabled aria-describedby="prof-erro"><option value="">Escolha a especialidade primeiro</option></select><p class="erro" id="prof-erro"></p></div>' +
        '<div class="campo" id="campo-unidade"><label for="unid">Unidade</label><select id="unid" name="unid" disabled aria-describedby="unid-erro"><option value="">Escolha o profissional</option></select><p class="erro" id="unid-erro"></p></div>' +
        '<div class="campo"><label for="motivo">Motivo / sintomas (opcional)</label><input id="motivo" name="motivo" maxlength="120" /></div>' +
        '</div></fieldset>' +
        '<fieldset><legend>3. Data e horário</legend><div class="grade-form">' +
        '<div class="campo"><label for="data">Data</label><input type="date" id="data" name="data" min="' + UI.hoje() + '" aria-describedby="data-erro" /><p class="erro" id="data-erro"></p></div>' +
        '</div><div id="slots" class="slots" role="radiogroup" aria-label="Horários disponíveis"><p id="slots-rotulo" class="ajuda">Selecione profissional e data para ver os horários livres.</p></div>' +
        '<p class="erro" id="hora-erro"></p></fieldset>' +
        '<div class="form-rodape"><a class="btn btn-secundario" href="#/paciente">Cancelar</a><button type="submit" class="btn btn-primario">Revisar e confirmar</button></div>' +
        '</form>';
      function tipo(v, r, ic, ch) {
        return '<label class="tipo-opcao"><input type="radio" name="tipo" value="' + v + '"' + (ch ? ' checked' : '') + ' /><span>' + UI.icone(ic) + esc(r) + '</span></label>';
      }
    },
    montar: function (el, p, ctx) {
      const st = Store.get();
      const f = el.querySelector('#form-ag');
      let horaSel = '';

      function atualizarProfissionais() {
        const lista = st.profissionais.filter(function (x) { return x.ativo && x.especialidade === f.esp.value; });
        f.prof.innerHTML = '<option value="">' + (lista.length ? 'Selecione' : 'Escolha a especialidade primeiro') + '</option>' +
          lista.map(function (x) { return '<option value="' + x.id + '">' + esc(x.nome) + ' — ' + esc(x.registro) + '</option>'; }).join('');
        f.prof.disabled = !lista.length;
        atualizarUnidades();
      }
      function atualizarUnidades() {
        const prof = Store.profissional(f.prof.value);
        const tele = f.tipo.value === 'tele';
        el.querySelector('#campo-unidade').hidden = tele;
        f.unid.innerHTML = prof ? prof.unidades.map(function (u) { return '<option value="' + u + '">' + esc(Store.unidade(u).nome) + '</option>'; }).join('') : '<option value="">Escolha o profissional</option>';
        f.unid.disabled = !prof;
        atualizarSlots();
      }
      function atualizarSlots() {
        const box = el.querySelector('#slots');
        horaSel = '';
        if (!f.prof.value || !f.data.value) {
          box.innerHTML = '<p id="slots-rotulo" class="ajuda">Selecione profissional e data para ver os horários livres.</p>';
          return;
        }
        const dow = new Date(f.data.value + 'T12:00:00').getDay();
        if (dow === 0) { box.innerHTML = '<p id="slots-rotulo" class="ajuda">Não há atendimento aos domingos. Escolha outra data.</p>'; return; }
        const ocupados = Store.horariosOcupados(f.prof.value, f.data.value);
        const agora = new Date(); const ehHoje = f.data.value === UI.hoje();
        box.innerHTML = '<p id="slots-rotulo" class="ajuda">Horários disponíveis em ' + UI.dataBR(f.data.value) + ':</p>' +
          HORARIOS.map(function (h) {
            const passou = ehHoje && (Number(h.slice(0, 2)) * 60 + Number(h.slice(3))) <= agora.getHours() * 60 + agora.getMinutes();
            const indisp = ocupados.indexOf(h) !== -1 || passou;
            return '<button type="button" role="radio" aria-checked="false" class="slot" data-hora="' + h + '"' + (indisp ? ' disabled aria-disabled="true" title="Indisponível"' : '') + '>' + h + '</button>';
          }).join('');
        box.querySelectorAll('.slot:not([disabled])').forEach(function (b) {
          b.addEventListener('click', function () {
            box.querySelectorAll('.slot').forEach(function (s) { s.setAttribute('aria-checked', 'false'); });
            b.setAttribute('aria-checked', 'true');
            horaSel = b.getAttribute('data-hora');
            el.querySelector('#hora-erro').textContent = '';
          });
        });
      }

      f.esp.addEventListener('change', atualizarProfissionais);
      f.prof.addEventListener('change', atualizarUnidades);
      f.data.addEventListener('change', atualizarSlots);
      f.querySelectorAll('input[name="tipo"]').forEach(function (r) { r.addEventListener('change', atualizarUnidades); });

      f.addEventListener('submit', function (e) {
        e.preventDefault();
        let ok = true;
        ok = campoErro(f.esp, el.querySelector('#esp-erro'), f.esp.value ? '' : 'Selecione a especialidade.') && ok;
        ok = campoErro(f.prof, el.querySelector('#prof-erro'), f.prof.value ? '' : 'Selecione o profissional.') && ok;
        ok = campoErro(f.data, el.querySelector('#data-erro'), f.data.value && f.data.value >= UI.hoje() ? '' : 'Informe uma data a partir de hoje.') && ok;
        el.querySelector('#hora-erro').textContent = horaSel ? '' : 'Selecione um horário disponível.';
        ok = ok && !!horaSel;
        if (!ok) { const inv = f.querySelector('[aria-invalid="true"]') || el.querySelector('.slot:not([disabled])'); if (inv) inv.focus(); return; }

        const tipo = f.tipo.value;
        const prof = Store.profissional(f.prof.value);
        const unidadeId = tipo === 'tele' ? prof.unidades[0] : f.unid.value;
        const dados = { pacienteId: ctx.sessao.refId, profissionalId: prof.id, unidadeId: unidadeId, tipo: tipo, especialidade: f.esp.value, data: f.data.value, hora: horaSel, motivo: f.motivo.value.trim() };
        UI.modal('Confirmar agendamento',
          '<dl class="resumo"><dt>Tipo</dt><dd>' + esc(UI.tipoLabel(tipo)) + '</dd><dt>Especialidade</dt><dd>' + esc(dados.especialidade) + '</dd>' +
          '<dt>Profissional</dt><dd>' + esc(prof.nome) + '</dd><dt>Local</dt><dd>' + (tipo === 'tele' ? 'Online (link liberado 10 min antes)' : esc(Store.unidade(unidadeId).nome)) + '</dd>' +
          '<dt>Data e hora</dt><dd>' + UI.dataBR(dados.data) + ' às ' + dados.hora + '</dd></dl>',
          [{ rotulo: 'Voltar', classe: 'btn-secundario' },
            { rotulo: 'Confirmar', classe: 'btn-primario', onClick: function () {
              const r = Store.agendar(dados);
              if (!r.ok) { UI.toast(r.erro, 'erro'); atualizarSlots(); return; }
              UI.toast('Agendamento confirmado para ' + UI.dataBR(dados.data) + ' às ' + dados.hora + '.');
              location.hash = '#/paciente/consultas';
            } }]);
      });
    }
  });

  // ------------------------------- CONSULTAS -------------------------------
  Router.rota('/paciente/consultas', {
    titulo: 'Meus agendamentos', perfis: P,
    render: function (p, ctx) {
      const todos = meusAgendamentos(ctx);
      const prox = ordenar(todos.filter(futuro));
      const ant = ordenar(todos.filter(function (a) { return !futuro(a); }), true);
      return '<header class="pagina-cab"><div><h1 id="titulo-pagina" tabindex="-1">Meus agendamentos</h1></div>' +
        '<a class="btn btn-primario" href="#/paciente/agendar">' + UI.icone('mais') + 'Novo agendamento</a></header>' +
        '<section class="painel" aria-labelledby="h1"><h2 id="h1">Próximos (' + prox.length + ')</h2>' +
        (prox.length ? '<ul class="lista-ag">' + prox.map(function (a) { return cartaoAgendamento(a, true); }).join('') + '</ul>' : UI.vazio('Nenhum agendamento futuro.')) + '</section>' +
        '<section class="painel" aria-labelledby="h2"><h2 id="h2">Anteriores e cancelados (' + ant.length + ')</h2>' +
        (ant.length ? '<ul class="lista-ag">' + ant.map(function (a) { return cartaoAgendamento(a, false); }).join('') + '</ul>' : UI.vazio('Nada por aqui ainda.')) + '</section>';
    },
    montar: function (el, p, ctx, rerender) { ligarCancelar(el, rerender); }
  });

  // ------------------------------- HISTÓRICO -------------------------------
  Router.rota('/paciente/historico', {
    titulo: 'Histórico clínico', perfis: P,
    render: function (p, ctx) {
      const st = Store.get();
      const pac = Store.paciente(ctx.sessao.refId);
      const hist = st.prontuarios.filter(function (h) { return h.pacienteId === pac.id; }).sort(function (a, b) { return b.data.localeCompare(a.data); });
      const recs = st.receitas.filter(function (r) { return r.pacienteId === pac.id; }).sort(function (a, b) { return b.data.localeCompare(a.data); });
      return '<header class="pagina-cab"><div><h1 id="titulo-pagina" tabindex="-1">Histórico clínico</h1><p class="sub">Somente leitura. Alterações são feitas pelos profissionais de saúde.</p></div></header>' +
        '<section class="painel ficha" aria-label="Resumo do paciente"><dl class="ficha-dl">' +
        '<div><dt>Tipo sanguíneo</dt><dd>' + esc(pac.sangue) + '</dd></div><div><dt>Alergias</dt><dd>' + esc(pac.alergias) + '</dd></div>' +
        '<div><dt>Idade</dt><dd>' + UI.idade(pac.nascimento) + ' anos</dd></div><div><dt>Convênio</dt><dd>' + esc(pac.convenio) + '</dd></div></dl></section>' +
        '<div class="grade-2"><section class="painel" aria-labelledby="h-tl"><h2 id="h-tl">Atendimentos e exames</h2>' +
        (hist.length ? '<ol class="timeline">' + hist.map(function (h) {
          const pr = Store.profissional(h.profissionalId);
          return '<li><p class="tl-data">' + UI.dataBR(h.data) + ' · ' + esc(h.tipo) + '</p><h3>' + esc(h.titulo) + '</h3><p>' + esc(h.descricao) + '</p>' +
            '<p class="ag-meta">' + esc(pr ? pr.nome : '') + (h.cid ? ' · CID-10 ' + esc(h.cid) : '') + '</p></li>';
        }).join('') + '</ol>' : UI.vazio('Nenhum registro.')) + '</section>' +
        '<section class="painel" aria-labelledby="h-rx"><h2 id="h-rx">Receitas digitais</h2>' +
        (recs.length ? '<ul class="lista-rx">' + recs.map(function (r) {
          return '<li><div>' + UI.icone('receita') + '<div><p class="ag-titulo">' + esc(r.itens.map(function (i) { return i.medicamento; }).join(', ')) + '</p>' +
            '<p class="ag-meta">' + UI.dataBR(r.data) + ' · ' + esc(Store.profissional(r.profissionalId).nome) + '</p></div></div>' +
            '<button type="button" class="btn btn-secundario btn-p" data-rx="' + esc(r.id) + '">Ver receita</button></li>';
        }).join('') + '</ul>' : UI.vazio('Nenhuma receita.')) + '</section></div>';
    },
    montar: function (el) {
      el.querySelectorAll('[data-rx]').forEach(function (b) {
        b.addEventListener('click', function () { window.verReceita(b.getAttribute('data-rx')); });
      });
    }
  });

  /** Visualização de receita digital (compartilhada com o perfil profissional). */
  window.verReceita = function (id) {
    const r = Store.get().receitas.find(function (x) { return x.id === id; });
    const pac = Store.paciente(r.pacienteId); const pr = Store.profissional(r.profissionalId);
    UI.modal('Receita digital', '<article class="receita-doc">' +
      '<header><strong>VidaPlus — Receituário</strong><span>' + esc(r.codigo) + '</span></header>' +
      '<p><strong>Paciente:</strong> ' + esc(pac.nome) + ' · CPF ' + esc(UI.mascararCPF(pac.cpf)) + '</p>' +
      '<ol>' + r.itens.map(function (i) { return '<li><strong>' + esc(i.medicamento) + '</strong><br>' + esc(i.posologia) + '</li>'; }).join('') + '</ol>' +
      '<footer><p>' + esc(pr.nome) + ' — ' + esc(pr.registro) + '</p><p>Emitida em ' + UI.dataBR(r.data) + '</p>' +
      '<p class="assinatura">' + UI.icone('escudo') + ' Assinada digitalmente (ICP-Brasil, padrão simulado). Validação: validar.vidaplus.com.br/' + esc(r.codigo) + '</p></footer></article>',
      [{ rotulo: 'Fechar', classe: 'btn-secundario' }, { rotulo: 'Imprimir', classe: 'btn-primario', onClick: function () { window.print(); return false; } }]);
  };

  // ------------------------------- MEUS DADOS / LGPD -------------------------------
  Router.rota('/paciente/dados', {
    titulo: 'Meus dados', perfis: P,
    render: function (p, ctx) {
      const pac = Store.paciente(ctx.sessao.refId);
      return '<header class="pagina-cab"><div><h1 id="titulo-pagina" tabindex="-1">Meus dados e privacidade</h1></div></header>' +
        '<div class="grade-2">' +
        '<form id="form-dados" class="painel" novalidate aria-labelledby="h-d"><h2 id="h-d">Dados cadastrais</h2><div class="grade-form">' +
        '<div class="campo col-2"><label for="d-nome">Nome</label><input id="d-nome" value="' + esc(pac.nome) + '" readonly aria-describedby="d-nome-ajuda" /><p class="ajuda" id="d-nome-ajuda">Para alterar o nome, procure a recepção com documento.</p></div>' +
        '<div class="campo"><label for="d-cpf">CPF</label><input id="d-cpf" value="' + esc(UI.mascararCPF(pac.cpf)) + '" readonly /></div>' +
        '<div class="campo"><label for="d-nasc">Nascimento</label><input id="d-nasc" value="' + UI.dataBR(pac.nascimento) + '" readonly /></div>' +
        '<div class="campo"><label for="telefone">Celular</label><input id="telefone" name="telefone" type="tel" value="' + esc(pac.telefone) + '" autocomplete="tel" aria-describedby="telefone-erro" /><p class="erro" id="telefone-erro"></p></div>' +
        '<div class="campo"><label for="email">E-mail</label><input id="email" name="email" type="email" value="' + esc(pac.email) + '" autocomplete="email" aria-describedby="email-erro" /><p class="erro" id="email-erro"></p></div>' +
        '<div class="campo col-2"><label for="endereco">Endereço</label><input id="endereco" name="endereco" value="' + esc(pac.endereco) + '" autocomplete="street-address" /></div>' +
        '</div><div class="form-rodape"><button class="btn btn-primario" type="submit">Salvar alterações</button></div></form>' +
        '<section class="painel" aria-labelledby="h-l"><h2 id="h-l">' + UI.icone('escudo') + ' Privacidade (LGPD)</h2>' +
        '<p>Status do consentimento: ' + (pac.consentimentoLGPD ? '<span class="badge badge-ok">Concedido</span>' : '<span class="badge badge-alerta">Revogado</span>') + '</p>' +
        '<ul class="acoes-lgpd">' +
        '<li><button type="button" class="btn btn-secundario" id="exportar">' + UI.icone('download') + 'Baixar meus dados (portabilidade)</button></li>' +
        '<li><button type="button" class="btn btn-secundario" id="ver-politica">Ler política de privacidade</button></li>' +
        '<li><button type="button" class="btn btn-secundario" id="ver-acessos">Ver quem acessou meus dados</button></li>' +
        (pac.consentimentoLGPD ? '<li><button type="button" class="btn btn-perigo-claro" id="revogar">Revogar consentimento opcional</button></li>' : '') +
        '</ul><p class="ajuda">Dados de prontuário são mantidos por no mínimo 20 anos (Lei nº 13.787/2018), mesmo após revogação.</p></section></div>';
    },
    montar: function (el, p, ctx, rerender) {
      const pac = Store.paciente(ctx.sessao.refId);
      const f = el.querySelector('#form-dados');
      f.telefone.addEventListener('input', function () { f.telefone.value = Mascaras.telefone(f.telefone.value); });
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        let ok = campoErro(f.telefone, el.querySelector('#telefone-erro'), f.telefone.value.replace(/\D/g, '').length < 10 ? 'Telefone incompleto.' : '');
        ok = campoErro(f.email, el.querySelector('#email-erro'), /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim()) ? '' : 'E-mail inválido.') && ok;
        if (!ok) return;
        pac.telefone = f.telefone.value; pac.email = f.email.value.trim(); pac.endereco = f.endereco.value.trim();
        Store.auditar('PACIENTE_ATUALIZADO', pac.id + ' (autoatendimento)');
        UI.toast('Dados atualizados com sucesso.');
      });
      el.querySelector('#exportar').addEventListener('click', function () {
        const st = Store.get();
        const pacote = {
          geradoEm: new Date().toISOString(), titular: pac,
          agendamentos: st.agendamentos.filter(function (a) { return a.pacienteId === pac.id; }),
          prontuario: st.prontuarios.filter(function (h) { return h.pacienteId === pac.id; }),
          receitas: st.receitas.filter(function (r) { return r.pacienteId === pac.id; })
        };
        UI.baixarArquivo('meus-dados-vidaplus.json', JSON.stringify(pacote, null, 2), 'application/json');
        Store.auditar('LGPD_PORTABILIDADE', pac.id);
        UI.toast('Arquivo com seus dados gerado.');
      });
      el.querySelector('#ver-politica').addEventListener('click', function () { UI.modal('Política de privacidade', window.POLITICA_PRIVACIDADE); });
      el.querySelector('#ver-acessos').addEventListener('click', function () {
        const logs = Store.get().auditoria.filter(function (l) { return l.detalhe.indexOf(pac.id) !== -1; }).slice(0, 10);
        UI.modal('Acessos aos meus dados', logs.length ? '<ul class="lista-simples">' + logs.map(function (l) {
          return '<li>' + new Date(l.quando).toLocaleString('pt-BR') + ' — ' + esc(l.acao) + ' por ' + esc(l.usuario) + '</li>';
        }).join('') + '</ul>' : '<p>Nenhum acesso registrado nesta demonstração.</p>');
      });
      const rev = el.querySelector('#revogar');
      if (rev) rev.addEventListener('click', function () {
        UI.confirmar('Revogar consentimento', 'Você deixará de receber lembretes e comunicações. Os atendimentos continuam disponíveis. Deseja continuar?', 'Revogar', function () {
          pac.consentimentoLGPD = false; Store.auditar('LGPD_REVOGACAO', pac.id); UI.toast('Consentimento revogado.'); rerender();
        });
      });
    }
  });
})();
