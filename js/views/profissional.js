/* =========================================================================
 * Views do perfil PROFISSIONAL DE SAÚDE
 * ========================================================================= */
(function () {
  'use strict';
  const esc = UI.esc;
  const P = ['profissional'];
  let dataAgenda = null; // data selecionada na agenda (mantida entre renders)

  // ------------------------------- AGENDA -------------------------------
  Router.rota('/profissional', {
    titulo: 'Agenda', perfis: P,
    render: function (p, ctx) {
      const data = dataAgenda || UI.hoje();
      const prof = Store.profissional(ctx.sessao.refId);
      const itens = Store.get().agendamentos
        .filter(function (a) { return a.profissionalId === prof.id && a.data === data; })
        .sort(function (a, b) { return a.hora.localeCompare(b.hora); });
      const cont = { total: itens.length, tele: 0, real: 0, pend: 0 };
      itens.forEach(function (a) { if (a.tipo === 'tele') cont.tele++; if (a.status === 'realizada') cont.real++; if (a.status === 'agendada') cont.pend++; });

      return '<header class="pagina-cab"><div><h1 id="titulo-pagina" tabindex="-1">Minha agenda</h1><p class="sub">' + esc(prof.nome) + ' · ' + esc(prof.especialidade) + ' · ' + esc(prof.registro) + '</p></div>' +
        '<div class="campo campo-inline"><label for="dia">Dia</label><input type="date" id="dia" value="' + data + '" /></div></header>' +
        '<section class="kpis" aria-label="Resumo do dia">' +
        kpi('Atendimentos', cont.total) + kpi('Pendentes', cont.pend) + kpi('Teleconsultas', cont.tele) + kpi('Concluídos', cont.real) + '</section>' +
        '<section class="painel" aria-labelledby="h-ag"><h2 id="h-ag">' + esc(UI.dataExtenso(data)) + '</h2>' +
        (itens.length ? '<div class="tabela-wrap"><table class="tabela"><caption class="sr-only">Agenda do dia</caption><thead><tr><th scope="col">Hora</th><th scope="col">Paciente</th><th scope="col">Tipo</th><th scope="col">Motivo</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Ações</span></th></tr></thead><tbody>' +
          itens.map(function (a) {
            const pac = Store.paciente(a.pacienteId);
            return '<tr><td data-rotulo="Hora"><strong>' + esc(a.hora) + '</strong></td><td data-rotulo="Paciente">' + esc(pac.nome) + '<br><span class="ag-meta">' + UI.idade(pac.nascimento) + ' anos · ' + esc(pac.convenio) + '</span></td>' +
              '<td data-rotulo="Tipo">' + esc(UI.tipoLabel(a.tipo)) + '</td><td data-rotulo="Motivo">' + esc(a.motivo || '-') + '</td><td data-rotulo="Status">' + UI.badge(a.status) + '</td>' +
              '<td class="acoes-celula"><a class="btn btn-secundario btn-p" href="#/profissional/prontuario/' + esc(pac.id) + '">Prontuário</a>' +
              (a.tipo === 'tele' && a.status === 'agendada' ? '<a class="btn btn-primario btn-p" href="#/teleconsulta/' + esc(a.id) + '">' + UI.icone('video') + 'Iniciar</a>' : '') +
              (a.tipo !== 'tele' && a.status === 'agendada' ? '<button type="button" class="btn btn-primario btn-p" data-concluir="' + esc(a.id) + '">Concluir</button>' : '') + '</td></tr>';
          }).join('') + '</tbody></table></div>' : UI.vazio('Nenhum atendimento nesta data.')) + '</section>';
      function kpi(r, v) { return '<div class="kpi"><span class="kpi-valor">' + v + '</span><span class="kpi-rotulo">' + esc(r) + '</span></div>'; }
    },
    montar: function (el, p, ctx, rerender) {
      el.querySelector('#dia').addEventListener('change', function (e) { dataAgenda = e.target.value || null; rerender(); });
      el.querySelectorAll('[data-concluir]').forEach(function (b) {
        b.addEventListener('click', function () {
          const a = Store.get().agendamentos.find(function (x) { return x.id === b.getAttribute('data-concluir'); });
          a.status = 'realizada'; Store.auditar('ATENDIMENTO_CONCLUIDO', a.id + ' paciente ' + a.pacienteId);
          UI.toast('Atendimento marcado como concluído.'); rerender();
        });
      });
    }
  });

  // ------------------------------- PACIENTES -------------------------------
  Router.rota('/profissional/pacientes', {
    titulo: 'Pacientes', perfis: P,
    render: function () {
      return '<header class="pagina-cab"><div><h1 id="titulo-pagina" tabindex="-1">Pacientes</h1><p class="sub">Busque por nome ou pelos 4 últimos dígitos do CPF.</p></div></header>' +
        '<section class="painel"><div class="campo"><label for="busca">Buscar paciente</label><input id="busca" type="search" autocomplete="off" aria-controls="res-busca" /></div>' +
        '<p class="sr-only" id="res-status" role="status"></p><ul id="res-busca" class="lista-pac"></ul></section>';
    },
    montar: function (el) {
      const inp = el.querySelector('#busca');
      function filtrar() {
        const q = inp.value.trim().toLowerCase();
        const lista = Store.get().pacientes.filter(function (p) { return !q || p.nome.toLowerCase().indexOf(q) !== -1 || p.cpf.replace(/\D/g, '').slice(-4) === q.replace(/\D/g, ''); });
        el.querySelector('#res-busca').innerHTML = lista.map(function (p) {
          return '<li><a href="#/profissional/prontuario/' + esc(p.id) + '"><span class="avatar" aria-hidden="true">' + esc(p.nome.charAt(0)) + '</span><span><strong>' + esc(p.nome) + '</strong><br><span class="ag-meta">' +
            UI.idade(p.nascimento) + ' anos · CPF ' + esc(UI.mascararCPF(p.cpf)) + ' · ' + esc(p.convenio) + '</span></span></a></li>';
        }).join('') || '<li>' + UI.vazio('Nenhum paciente encontrado.') + '</li>';
        el.querySelector('#res-status').textContent = lista.length + ' paciente(s) encontrado(s).';
      }
      inp.addEventListener('input', filtrar);
      filtrar();
    }
  });

  // ------------------------------- PRONTUÁRIO -------------------------------
  Router.rota('/profissional/prontuario/:id', {
    titulo: 'Prontuário', perfis: P,
    render: function (p) {
      const st = Store.get();
      const pac = Store.paciente(p.id);
      if (!pac) return '<h1 id="titulo-pagina" tabindex="-1">Paciente não encontrado</h1>';
      const hist = st.prontuarios.filter(function (h) { return h.pacienteId === pac.id; }).sort(function (a, b) { return b.data.localeCompare(a.data); });
      const recs = st.receitas.filter(function (r) { return r.pacienteId === pac.id; });
      const alergia = pac.alergias && !/nenhuma|não informado/i.test(pac.alergias);
      return '<a href="#/profissional" class="voltar">← Voltar à agenda</a>' +
        '<header class="pagina-cab"><div><h1 id="titulo-pagina" tabindex="-1">Prontuário — ' + esc(pac.nome) + '</h1>' +
        '<p class="sub">' + UI.idade(pac.nascimento) + ' anos · CPF ' + esc(UI.mascararCPF(pac.cpf)) + ' · ' + esc(pac.convenio) + ' · Sangue ' + esc(pac.sangue) + '</p></div>' +
        '<button type="button" class="btn btn-primario" id="nova-rx">' + UI.icone('receita') + 'Emitir receita digital</button></header>' +
        (alergia ? '<div class="alerta alerta-perigo" role="alert"><strong>Alergia registrada:</strong> ' + esc(pac.alergias) + '</div>' : '') +
        '<div class="grade-2 grade-2-larga">' +
        '<section class="painel" aria-labelledby="h-ev"><h2 id="h-ev">Registrar evolução</h2>' +
        '<form id="form-ev" novalidate><div class="grade-form">' +
        '<div class="campo"><label for="ev-tipo">Tipo</label><select id="ev-tipo" name="tipo"><option>Consulta</option><option>Teleconsulta</option><option>Exame</option><option>Internação</option><option>Home care</option></select></div>' +
        '<div class="campo"><label for="ev-cid">CID-10 (opcional)</label><input id="ev-cid" name="cid" maxlength="6" placeholder="Ex.: J06.9" aria-describedby="ev-cid-erro" /><p class="erro" id="ev-cid-erro"></p></div>' +
        '<div class="campo col-2"><label for="ev-titulo">Título / hipótese diagnóstica</label><input id="ev-titulo" name="titulo" maxlength="80" aria-describedby="ev-titulo-erro" /><p class="erro" id="ev-titulo-erro"></p></div>' +
        '<div class="campo col-2"><label for="ev-desc">Anamnese, exame físico e conduta</label><textarea id="ev-desc" name="descricao" rows="5" maxlength="2000" aria-describedby="ev-desc-erro"></textarea><p class="erro" id="ev-desc-erro"></p></div>' +
        '</div><div class="form-rodape"><button type="submit" class="btn btn-primario">Salvar no prontuário</button></div></form></section>' +
        '<section class="painel" aria-labelledby="h-hist"><h2 id="h-hist">Histórico (' + hist.length + ')</h2>' +
        (hist.length ? '<ol class="timeline">' + hist.map(function (h) {
          const pr = Store.profissional(h.profissionalId);
          return '<li><p class="tl-data">' + UI.dataBR(h.data) + ' · ' + esc(h.tipo) + '</p><h3>' + esc(h.titulo) + '</h3><p>' + esc(h.descricao) + '</p><p class="ag-meta">' + esc(pr ? pr.nome : '') + (h.cid ? ' · CID-10 ' + esc(h.cid) : '') + '</p></li>';
        }).join('') + '</ol>' : UI.vazio('Sem registros anteriores.')) +
        '<h2>Receitas</h2>' + (recs.length ? '<ul class="lista-rx">' + recs.map(function (r) {
          return '<li><div>' + UI.icone('receita') + '<div><p class="ag-titulo">' + esc(r.itens.map(function (i) { return i.medicamento; }).join(', ')) + '</p><p class="ag-meta">' + UI.dataBR(r.data) + ' · ' + esc(r.codigo) + '</p></div></div>' +
            '<button type="button" class="btn btn-secundario btn-p" data-rx="' + esc(r.id) + '">Ver</button></li>';
        }).join('') + '</ul>' : UI.vazio('Nenhuma receita emitida.')) + '</section></div>';
    },
    montar: function (el, p, ctx, rerender) {
      const pac = Store.paciente(p.id);
      if (!pac) return;
      Store.auditar('PRONTUARIO_ACESSO', 'paciente ' + pac.id);
      el.querySelectorAll('[data-rx]').forEach(function (b) { b.addEventListener('click', function () { window.verReceita(b.getAttribute('data-rx')); }); });

      const f = el.querySelector('#form-ev');
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        let ok = campoErro(f.titulo, el.querySelector('#ev-titulo-erro'), f.titulo.value.trim().length < 3 ? 'Informe o título do registro.' : '');
        ok = campoErro(f.descricao, el.querySelector('#ev-desc-erro'), f.descricao.value.trim().length < 10 ? 'Descreva o atendimento (mínimo 10 caracteres).' : '') && ok;
        ok = campoErro(f.cid, el.querySelector('#ev-cid-erro'), f.cid.value && !/^[A-Z]\d{2}(\.\d)?$/i.test(f.cid.value.trim()) ? 'Formato CID-10 inválido (ex.: J06.9).' : '') && ok;
        if (!ok) { f.querySelector('[aria-invalid="true"]').focus(); return; }
        Store.get().prontuarios.push({
          id: Store.novoId('h'), pacienteId: pac.id, profissionalId: ctx.sessao.refId, data: UI.hoje(), tipo: f.tipo.value,
          titulo: f.titulo.value.trim(), descricao: f.descricao.value.trim(), cid: f.cid.value.trim().toUpperCase()
        });
        Store.auditar('PRONTUARIO_ATUALIZADO', 'paciente ' + pac.id);
        UI.toast('Registro salvo no prontuário.');
        rerender();
      });

      el.querySelector('#nova-rx').addEventListener('click', function () {
        const linha = function (n) {
          return '<fieldset class="rx-item"><legend>Medicamento ' + n + '</legend><div class="campo"><label for="rx-med-' + n + '">Medicamento e concentração</label><input id="rx-med-' + n + '" class="rx-med" /></div>' +
            '<div class="campo"><label for="rx-pos-' + n + '">Posologia</label><input id="rx-pos-' + n + '" class="rx-pos" placeholder="Ex.: 1 comprimido de 12/12h por 7 dias" /></div></fieldset>';
        };
        let n = 1;
        const dlg = UI.modal('Emitir receita digital',
          '<p class="ajuda">Paciente: <strong>' + esc(pac.nome) + '</strong>' + (/nenhuma|não informado/i.test(pac.alergias) ? '' : ' — <span class="texto-perigo">alergia: ' + esc(pac.alergias) + '</span>') + '</p>' +
          '<div id="rx-itens">' + linha(1) + '</div><button type="button" class="link" id="rx-add">+ Adicionar medicamento</button>' +
          '<p class="erro" id="rx-erro" role="alert"></p>' +
          '<label class="check"><input type="checkbox" id="rx-assinar" /> <span>Assinar digitalmente com certificado ICP-Brasil (simulado)</span></label>',
          [{ rotulo: 'Cancelar', classe: 'btn-secundario' },
            { rotulo: 'Emitir e enviar ao paciente', classe: 'btn-primario', onClick: function (d) {
              const itens = [];
              d.querySelectorAll('.rx-item').forEach(function (fs) {
                const m = fs.querySelector('.rx-med').value.trim(); const ps = fs.querySelector('.rx-pos').value.trim();
                if (m && ps) itens.push({ medicamento: m, posologia: ps });
              });
              const erro = d.querySelector('#rx-erro');
              if (!itens.length) { erro.textContent = 'Informe ao menos um medicamento com posologia.'; return false; }
              if (!d.querySelector('#rx-assinar').checked) { erro.textContent = 'A receita precisa ser assinada digitalmente.'; return false; }
              const st = Store.get();
              const codigo = 'VP-RX-' + new Date().getFullYear() + '-' + String(st.receitas.length + 185).padStart(6, '0');
              st.receitas.push({ id: Store.novoId('r'), pacienteId: pac.id, profissionalId: ctx.sessao.refId, data: UI.hoje(), itens: itens, codigo: codigo, assinada: true });
              st.notificacoes.unshift({ id: Store.novoId('n'), pacienteId: pac.id, data: UI.hoje(), texto: 'Nova receita digital disponível (' + codigo + ').', lida: false });
              Store.auditar('RECEITA_EMITIDA', codigo + ' paciente ' + pac.id);
              UI.toast('Receita ' + codigo + ' emitida e enviada ao paciente.');
              rerender();
            } }], { largo: true });
        dlg.querySelector('#rx-add').addEventListener('click', function () {
          n++; dlg.querySelector('#rx-itens').insertAdjacentHTML('beforeend', linha(n));
          dlg.querySelector('#rx-med-' + n).focus();
        });
      });
    }
  });
})();
