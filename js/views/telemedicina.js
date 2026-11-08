/* =========================================================================
 * Telemedicina — sala de teleconsulta (paciente e profissional)
 * Protótipo: a videochamada é simulada. Em produção, usaria WebRTC com
 * DTLS-SRTP (criptografia ponta a ponta), servidor TURN próprio e link
 * de sala com token de uso único gerado pela API.
 * ========================================================================= */
(function () {
  'use strict';
  const esc = UI.esc;
  let timer = null, stream = null;

  function pararMidia() {
    if (timer) { clearInterval(timer); timer = null; }
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
  }
  window.addEventListener('hashchange', pararMidia);

  Router.rota('/teleconsulta/:id', {
    titulo: 'Teleconsulta', perfis: ['paciente', 'profissional'],
    render: function (p, ctx) {
      const a = Store.get().agendamentos.find(function (x) { return x.id === p.id; });
      const dono = a && (ctx.sessao.perfil === 'paciente' ? a.pacienteId === ctx.sessao.refId : a.profissionalId === ctx.sessao.refId);
      if (!a || a.tipo !== 'tele' || !dono) {
        return '<h1 id="titulo-pagina" tabindex="-1">Acesso negado</h1><p>Esta sala de teleconsulta não está disponível para o seu usuário.</p>';
      }
      const pac = Store.paciente(a.pacienteId), prof = Store.profissional(a.profissionalId);
      const ehProf = ctx.sessao.perfil === 'profissional';
      const outro = ehProf ? pac.nome : prof.nome;
      return '<header class="pagina-cab"><div><h1 id="titulo-pagina" tabindex="-1">Teleconsulta</h1><p class="sub">' + esc(a.especialidade) + ' · ' + UI.dataBR(a.data) + ' às ' + esc(a.hora) + '</p></div>' +
        '<p class="selo-seguro">' + UI.icone('escudo') + ' Conexão criptografada ponta a ponta</p></header>' +
        '<div class="tele ' + (ehProf ? 'tele-prof' : '') + '">' +
        '<section class="tele-palco" aria-label="Vídeo da chamada">' +
        '<div class="tele-remoto" id="remoto"><div class="tele-espera" id="espera"><span class="avatar avatar-g" aria-hidden="true">' + esc(outro.charAt(0)) + '</span>' +
        '<p><strong>' + esc(outro) + '</strong></p><p id="status-chamada" role="status">Sala pronta. Clique em “Entrar na chamada”.</p></div>' +
        '<span class="tele-tempo" id="tempo" aria-label="Duração da chamada" hidden>00:00</span></div>' +
        '<div class="tele-local" id="local"><video id="video-local" autoplay muted playsinline aria-label="Sua câmera"></video><span class="tele-local-rotulo">Você</span></div>' +
        '<div class="tele-controles" role="toolbar" aria-label="Controles da chamada">' +
        '<button type="button" class="btn btn-primario" id="entrar">' + UI.icone('video') + 'Entrar na chamada</button>' +
        '<button type="button" class="btn-redondo" id="mic" aria-pressed="true" aria-label="Microfone ligado" hidden>' + UI.icone('mic') + '</button>' +
        '<button type="button" class="btn-redondo" id="cam" aria-pressed="false" aria-label="Ativar câmera" hidden>' + UI.icone('video') + '</button>' +
        '<button type="button" class="btn-redondo btn-redondo-perigo" id="encerrar" aria-label="Encerrar chamada" hidden>' + UI.icone('telefone') + '</button></div>' +
        '</section>' +
        '<aside class="tele-lateral">' +
        (ehProf ?
          '<section class="painel" aria-labelledby="h-reg"><h2 id="h-reg">Registro do atendimento</h2>' +
          '<p class="ajuda">Paciente: ' + esc(pac.nome) + ' · ' + UI.idade(pac.nascimento) + ' anos · Alergias: ' + esc(pac.alergias) + '</p>' +
          '<div class="campo"><label for="tele-nota">Anamnese e conduta</label><textarea id="tele-nota" rows="6"></textarea></div>' +
          '<a class="link" href="#/profissional/prontuario/' + esc(pac.id) + '">Abrir prontuário completo</a></section>' : '') +
        '<section class="painel tele-chat" aria-labelledby="h-chat"><h2 id="h-chat">Chat</h2><ul id="msgs" class="msgs" aria-live="polite"></ul>' +
        '<form id="form-chat" class="chat-form"><label for="msg" class="sr-only">Mensagem</label><input id="msg" autocomplete="off" placeholder="Digite uma mensagem" maxlength="300" /><button class="btn btn-primario btn-p" type="submit">Enviar</button></form></section>' +
        '</aside></div>';
    },
    montar: function (el, p, ctx) {
      const a = Store.get().agendamentos.find(function (x) { return x.id === p.id; });
      if (!el.querySelector('#entrar')) return;
      const ehProf = ctx.sessao.perfil === 'profissional';
      const $ = function (s) { return el.querySelector(s); };
      let seg = 0;

      function msg(autor, texto, minha) {
        $('#msgs').insertAdjacentHTML('beforeend', '<li class="' + (minha ? 'minha' : '') + '"><strong>' + esc(autor) + ':</strong> ' + esc(texto) + '</li>');
        $('#msgs').scrollTop = 1e6;
      }

      $('#entrar').addEventListener('click', function () {
        $('#entrar').hidden = true;
        ['#mic', '#cam', '#encerrar'].forEach(function (s) { $(s).hidden = false; });
        $('#status-chamada').textContent = 'Conectando…';
        Store.auditar('TELECONSULTA_ENTRADA', a.id);
        setTimeout(function () {
          if (!$('#status-chamada')) return;
          $('#status-chamada').textContent = 'Conectado';
          $('#espera').classList.add('conectado');
          $('#tempo').hidden = false;
          timer = setInterval(function () {
            seg++; const t = $('#tempo'); if (!t) return pararMidia();
            t.textContent = String(Math.floor(seg / 60)).padStart(2, '0') + ':' + String(seg % 60).padStart(2, '0');
          }, 1000);
          msg(ehProf ? Store.paciente(a.pacienteId).nome.split(' ')[0] : Store.profissional(a.profissionalId).nome, ehProf ? 'Boa tarde, doutor! Estou ouvindo bem.' : 'Olá! Consegue me ouvir bem?', false);
        }, 1200);
      });

      $('#mic').addEventListener('click', function () {
        const on = $('#mic').getAttribute('aria-pressed') !== 'true';
        $('#mic').setAttribute('aria-pressed', String(on));
        $('#mic').setAttribute('aria-label', on ? 'Microfone ligado' : 'Microfone desligado');
        $('#mic').classList.toggle('desligado', !on);
        if (stream) stream.getAudioTracks().forEach(function (t) { t.enabled = on; });
        UI.toast(on ? 'Microfone ligado' : 'Microfone desligado', 'info');
      });

      $('#cam').addEventListener('click', function () {
        const on = $('#cam').getAttribute('aria-pressed') !== 'true';
        $('#cam').setAttribute('aria-pressed', String(on));
        $('#cam').setAttribute('aria-label', on ? 'Desativar câmera' : 'Ativar câmera');
        if (on && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(function (s) {
            stream = s; $('#video-local').srcObject = s; $('#local').classList.add('ativo');
          }).catch(function () {
            UI.toast('Não foi possível acessar a câmera. Verifique as permissões do navegador.', 'erro');
            $('#cam').setAttribute('aria-pressed', 'false'); $('#cam').setAttribute('aria-label', 'Ativar câmera');
          });
        } else {
          if (stream) { stream.getVideoTracks().forEach(function (t) { t.stop(); }); }
          $('#local').classList.remove('ativo');
        }
      });

      $('#encerrar').addEventListener('click', function () {
        UI.confirmar('Encerrar teleconsulta', ehProf ? 'A anotação será salva no prontuário e o atendimento marcado como realizado.' : 'Deseja sair da chamada?', 'Encerrar', function () {
          pararMidia();
          Store.auditar('TELECONSULTA_FIM', a.id + ' duração ' + seg + 's');
          if (ehProf) {
            const nota = $('#tele-nota').value.trim();
            if (nota) {
              Store.get().prontuarios.push({ id: Store.novoId('h'), pacienteId: a.pacienteId, profissionalId: a.profissionalId, data: UI.hoje(), tipo: 'Teleconsulta', titulo: a.motivo || 'Teleconsulta', descricao: nota, cid: '' });
              Store.auditar('PRONTUARIO_ATUALIZADO', 'paciente ' + a.pacienteId + ' (teleconsulta)');
            }
            a.status = 'realizada'; Store.salvar();
            UI.toast('Teleconsulta encerrada e registrada.');
            location.hash = '#/profissional';
          } else {
            UI.toast('Você saiu da teleconsulta.');
            location.hash = '#/paciente';
          }
        });
      });

      $('#form-chat').addEventListener('submit', function (e) {
        e.preventDefault();
        const v = $('#msg').value.trim(); if (!v) return;
        msg('Você', v, true); $('#msg').value = '';
      });
    }
  });
})();
