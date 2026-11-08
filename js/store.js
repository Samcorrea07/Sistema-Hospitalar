/* =========================================================================
 * SGHSS VidaPlus — Store (estado da aplicação)
 * Simula a camada de serviços/API. Persiste em localStorage apenas para a
 * demonstração (com try/catch, pois o armazenamento pode estar indisponível).
 * Em produção: dados sensíveis NUNCA ficam no navegador; a sessão usaria
 * token JWT de curta duração em cookie HttpOnly/Secure/SameSite.
 * ========================================================================= */
(function (global) {
  'use strict';

  const CHAVE = 'sghss-vidaplus-v1';
  const CHAVE_SESSAO = 'sghss-vidaplus-sessao';
  const CHAVE_PREFS = 'sghss-vidaplus-prefs';
  const TEMPO_SESSAO_MIN = 15; // expiração por inatividade

  function clonar(o) { return JSON.parse(JSON.stringify(o)); }

  function ler(chave) {
    try { const v = localStorage.getItem(chave); return v ? JSON.parse(v) : null; } catch (e) { return null; }
  }
  function gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { /* modo privado ou bloqueado */ }
  }
  function remover(chave) {
    try { localStorage.removeItem(chave); } catch (e) { /* ignora */ }
  }

  let estado = ler(CHAVE) || clonar(global.SEED);
  let sessao = ler(CHAVE_SESSAO);
  let prefs = ler(CHAVE_PREFS) || { contraste: false, fonte: 100 };
  const ouvintes = [];

  function salvar() { gravar(CHAVE, estado); ouvintes.forEach(function (fn) { fn(); }); }

  function novoId(prefixo) {
    return prefixo + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /** Registro de auditoria (requisito de segurança/compliance — LGPD art. 37). */
  function auditar(acao, detalhe) {
    estado.auditoria.unshift({
      id: novoId('log'),
      quando: new Date().toISOString(),
      usuario: sessao ? sessao.email : 'anônimo',
      perfil: sessao ? sessao.perfil : '-',
      acao: acao,
      detalhe: detalhe || '',
      ip: '10.0.0.' + (12 + (estado.auditoria.length % 40)) // simulado
    });
    if (estado.auditoria.length > 500) estado.auditoria.length = 500;
    salvar();
  }

  const Store = {
    get: function () { return estado; },
    salvar: salvar,
    novoId: novoId,
    auditar: auditar,
    onChange: function (fn) { ouvintes.push(fn); },

    // ---------- Preferências de acessibilidade ----------
    prefs: function () { return prefs; },
    setPref: function (k, v) { prefs[k] = v; gravar(CHAVE_PREFS, prefs); },

    // ---------- Autenticação (simulada) ----------
    sessao: function () {
      if (sessao && Date.now() > sessao.expiraEm) {
        Store.logout('Sessão expirada por inatividade');
        return null;
      }
      return sessao;
    },
    renovarSessao: function () {
      if (sessao) { sessao.expiraEm = Date.now() + TEMPO_SESSAO_MIN * 60000; gravar(CHAVE_SESSAO, sessao); }
    },
    login: function (email, senha, perfil) {
      const u = estado.usuarios.find(function (x) {
        return x.email.toLowerCase() === String(email).trim().toLowerCase();
      });
      if (!u || u.senha !== senha) {
        auditar('LOGIN_FALHA', 'Tentativa para ' + String(email).slice(0, 60));
        return { ok: false, erro: 'E-mail ou senha inválidos.' };
      }
      if (u.perfil !== perfil) {
        auditar('LOGIN_FALHA', 'Perfil incorreto para ' + u.email);
        return { ok: false, erro: 'Este usuário não possui o perfil selecionado.' };
      }
      sessao = {
        email: u.email, perfil: u.perfil, refId: u.refId, nome: u.nome,
        unidadeId: 'u1', expiraEm: Date.now() + TEMPO_SESSAO_MIN * 60000
      };
      gravar(CHAVE_SESSAO, sessao);
      auditar('LOGIN', 'Acesso ao perfil ' + u.perfil);
      return { ok: true, sessao: sessao };
    },
    logout: function (motivo) {
      if (sessao) auditar('LOGOUT', motivo || 'Saída voluntária');
      sessao = null;
      remover(CHAVE_SESSAO);
    },
    setUnidade: function (id) {
      if (sessao) { sessao.unidadeId = id; gravar(CHAVE_SESSAO, sessao); auditar('TROCA_UNIDADE', id); }
    },

    resetarDemo: function () {
      estado = clonar(global.SEED);
      sessao = null;
      remover(CHAVE_SESSAO);
      salvar();
    },

    // ---------- Consultas utilitárias ----------
    paciente: function (id) { return estado.pacientes.find(function (p) { return p.id === id; }); },
    profissional: function (id) { return estado.profissionais.find(function (p) { return p.id === id; }); },
    unidade: function (id) { return estado.unidades.find(function (u) { return u.id === id; }); },

    /** Horários já ocupados de um profissional numa data (evita conflito de agenda). */
    horariosOcupados: function (profissionalId, data) {
      return estado.agendamentos
        .filter(function (a) { return a.profissionalId === profissionalId && a.data === data && a.status === 'agendada'; })
        .map(function (a) { return a.hora; });
    },

    agendar: function (dados) {
      const ocupados = Store.horariosOcupados(dados.profissionalId, dados.data);
      if (ocupados.indexOf(dados.hora) !== -1) return { ok: false, erro: 'Horário indisponível. Escolha outro.' };
      const a = Object.assign({ id: novoId('a'), status: 'agendada' }, dados);
      estado.agendamentos.push(a);
      estado.notificacoes.unshift({
        id: novoId('n'), pacienteId: dados.pacienteId, data: new Date().toISOString().slice(0, 10),
        texto: 'Agendamento confirmado: ' + dados.especialidade + ' em ' + global.UI.dataBR(dados.data) + ' às ' + dados.hora + '.', lida: false
      });
      auditar('AGENDAMENTO_CRIADO', a.id + ' (' + a.tipo + ')');
      return { ok: true, agendamento: a };
    },
    cancelar: function (id, motivo) {
      const a = estado.agendamentos.find(function (x) { return x.id === id; });
      if (!a || a.status !== 'agendada') return { ok: false, erro: 'Agendamento não pode ser cancelado.' };
      a.status = 'cancelada';
      a.motivoCancelamento = motivo || '';
      auditar('AGENDAMENTO_CANCELADO', id);
      return { ok: true };
    }
  };

  global.Store = Store;
})(window);
