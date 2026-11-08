/* =========================================================================
 * SGHSS VidaPlus — Dados de demonstração (mock)
 * Todos os dados abaixo são FICTÍCIOS e servem apenas para o protótipo.
 * Em produção, estes dados viriam de uma API REST autenticada (HTTPS/TLS).
 * ========================================================================= */
(function (global) {
  'use strict';

  /** Retorna uma data ISO (AAAA-MM-DD) deslocada N dias a partir de hoje. */
  function dia(offset) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  }

  const unidades = [
    { id: 'u1', nome: 'Hospital VidaPlus Central', tipo: 'Hospital', cidade: 'Belo Horizonte/MG' },
    { id: 'u2', nome: 'Clínica VidaPlus Jardim', tipo: 'Clínica de bairro', cidade: 'Contagem/MG' },
    { id: 'u3', nome: 'Laboratório VidaPlus Centro', tipo: 'Laboratório', cidade: 'Belo Horizonte/MG' },
    { id: 'u4', nome: 'VidaPlus Home Care', tipo: 'Home care', cidade: 'Região metropolitana' }
  ];

  const profissionais = [
    { id: 'pr1', nome: 'Dr. Carlos Menezes', cargo: 'Médico', especialidade: 'Clínica Geral', registro: 'CRM-MG 45.812', unidades: ['u1', 'u2'], email: 'carlos.menezes@vidaplus.com', ativo: true },
    { id: 'pr2', nome: 'Dra. Juliana Prado', cargo: 'Médica', especialidade: 'Cardiologia', registro: 'CRM-MG 51.307', unidades: ['u1'], email: 'juliana.prado@vidaplus.com', ativo: true },
    { id: 'pr3', nome: 'Dr. Rafael Teixeira', cargo: 'Médico', especialidade: 'Pediatria', registro: 'CRM-MG 39.954', unidades: ['u2'], email: 'rafael.teixeira@vidaplus.com', ativo: true },
    { id: 'pr4', nome: 'Dra. Beatriz Lima', cargo: 'Médica', especialidade: 'Dermatologia', registro: 'CRM-MG 60.118', unidades: ['u1', 'u2'], email: 'beatriz.lima@vidaplus.com', ativo: true },
    { id: 'pr5', nome: 'Enf. Marcos Alves', cargo: 'Enfermeiro', especialidade: 'Enfermagem', registro: 'COREN-MG 228.410', unidades: ['u1', 'u4'], email: 'marcos.alves@vidaplus.com', ativo: true },
    { id: 'pr6', nome: 'Téc. Fernanda Rocha', cargo: 'Técnica de laboratório', especialidade: 'Análises clínicas', registro: 'CRBM-3 7.702', unidades: ['u3'], email: 'fernanda.rocha@vidaplus.com', ativo: true }
  ];

  const pacientes = [
    { id: 'p1', nome: 'Ana Clara Souza', cpf: '123.456.789-09', nascimento: '1990-04-12', telefone: '(31) 98888-1020', email: 'ana.souza@email.com', convenio: 'VidaPlus Essencial', sangue: 'O+', alergias: 'Dipirona', endereco: 'Rua das Acácias, 120 — Belo Horizonte/MG', consentimentoLGPD: true },
    { id: 'p2', nome: 'João Pedro Martins', cpf: '987.654.321-00', nascimento: '1978-09-30', telefone: '(31) 97777-3344', email: 'joao.martins@email.com', convenio: 'Particular', sangue: 'A+', alergias: 'Nenhuma conhecida', endereco: 'Av. Brasil, 845 — Contagem/MG', consentimentoLGPD: true },
    { id: 'p3', nome: 'Maria Helena Costa', cpf: '321.654.987-11', nascimento: '1952-01-08', telefone: '(31) 96666-5566', email: 'mhelena.costa@email.com', convenio: 'VidaPlus Sênior', sangue: 'B-', alergias: 'Penicilina', endereco: 'Rua Ouro Preto, 33 — Belo Horizonte/MG', consentimentoLGPD: true },
    { id: 'p4', nome: 'Lucas Ferreira', cpf: '741.852.963-22', nascimento: '2016-06-21', telefone: '(31) 95555-7788', email: 'resp.lucas@email.com', convenio: 'VidaPlus Família', sangue: 'O-', alergias: 'Lactose', endereco: 'Rua Itabira, 410 — Contagem/MG', consentimentoLGPD: true },
    { id: 'p5', nome: 'Patrícia Gomes', cpf: '159.357.258-33', nascimento: '1985-12-03', telefone: '(31) 94444-9900', email: 'patricia.gomes@email.com', convenio: 'Particular', sangue: 'AB+', alergias: 'Nenhuma conhecida', endereco: 'Rua Pará, 77 — Belo Horizonte/MG', consentimentoLGPD: true },
    { id: 'p6', nome: 'Roberto Nunes', cpf: '852.741.963-44', nascimento: '1969-03-17', telefone: '(31) 93333-1122', email: 'roberto.nunes@email.com', convenio: 'VidaPlus Essencial', sangue: 'A-', alergias: 'Iodo', endereco: 'Rua Goiás, 1500 — Belo Horizonte/MG', consentimentoLGPD: true }
  ];

  // tipo: 'presencial' | 'tele' | 'exame'   status: 'agendada' | 'realizada' | 'cancelada'
  const agendamentos = [
    { id: 'a1', pacienteId: 'p1', profissionalId: 'pr1', unidadeId: 'u1', tipo: 'tele', especialidade: 'Clínica Geral', data: dia(0), hora: '10:00', status: 'agendada', motivo: 'Retorno — resultado de exames' },
    { id: 'a2', pacienteId: 'p1', profissionalId: 'pr2', unidadeId: 'u1', tipo: 'presencial', especialidade: 'Cardiologia', data: dia(6), hora: '14:30', status: 'agendada', motivo: 'Check-up cardiológico anual' },
    { id: 'a3', pacienteId: 'p1', profissionalId: 'pr6', unidadeId: 'u3', tipo: 'exame', especialidade: 'Análises clínicas', data: dia(-20), hora: '07:30', status: 'realizada', motivo: 'Hemograma completo e glicemia' },
    { id: 'a4', pacienteId: 'p2', profissionalId: 'pr1', unidadeId: 'u1', tipo: 'presencial', especialidade: 'Clínica Geral', data: dia(0), hora: '08:30', status: 'agendada', motivo: 'Dor lombar há 2 semanas' },
    { id: 'a5', pacienteId: 'p3', profissionalId: 'pr1', unidadeId: 'u1', tipo: 'presencial', especialidade: 'Clínica Geral', data: dia(0), hora: '09:15', status: 'agendada', motivo: 'Controle de hipertensão' },
    { id: 'a6', pacienteId: 'p5', profissionalId: 'pr1', unidadeId: 'u2', tipo: 'tele', especialidade: 'Clínica Geral', data: dia(0), hora: '11:00', status: 'agendada', motivo: 'Sintomas gripais' },
    { id: 'a7', pacienteId: 'p6', profissionalId: 'pr1', unidadeId: 'u1', tipo: 'presencial', especialidade: 'Clínica Geral', data: dia(0), hora: '15:00', status: 'agendada', motivo: 'Avaliação pré-operatória' },
    { id: 'a8', pacienteId: 'p4', profissionalId: 'pr3', unidadeId: 'u2', tipo: 'presencial', especialidade: 'Pediatria', data: dia(2), hora: '09:00', status: 'agendada', motivo: 'Consulta de rotina' },
    { id: 'a9', pacienteId: 'p1', profissionalId: 'pr1', unidadeId: 'u2', tipo: 'presencial', especialidade: 'Clínica Geral', data: dia(-60), hora: '16:00', status: 'realizada', motivo: 'Cefaleia recorrente' }
  ];

  const prontuarios = [
    { id: 'h1', pacienteId: 'p1', profissionalId: 'pr1', data: dia(-60), tipo: 'Consulta', titulo: 'Cefaleia recorrente', descricao: 'Paciente relata cefaleia tensional 3x/semana. PA 120/80. Orientada higiene do sono e hidratação. Solicitados exames laboratoriais.', cid: 'G44.2' },
    { id: 'h2', pacienteId: 'p1', profissionalId: 'pr6', data: dia(-20), tipo: 'Exame', titulo: 'Hemograma completo e glicemia', descricao: 'Hemograma sem alterações. Glicemia de jejum: 92 mg/dL (referência 70–99).', cid: '' },
    { id: 'h3', pacienteId: 'p3', profissionalId: 'pr2', data: dia(-45), tipo: 'Consulta', titulo: 'Hipertensão arterial', descricao: 'PA 150/95. Ajustada dose de losartana. Retorno em 30 dias com MAPA.', cid: 'I10' },
    { id: 'h4', pacienteId: 'p2', profissionalId: 'pr1', data: dia(-120), tipo: 'Consulta', titulo: 'Check-up', descricao: 'Sem queixas. Exames de rotina normais.', cid: 'Z00.0' },
    { id: 'h5', pacienteId: 'p6', profissionalId: 'pr5', data: dia(-10), tipo: 'Home care', titulo: 'Curativo pós-procedimento', descricao: 'Ferida limpa, sem sinais flogísticos. Curativo trocado.', cid: '' }
  ];

  const receitas = [
    { id: 'r1', pacienteId: 'p1', profissionalId: 'pr1', data: dia(-60), itens: [{ medicamento: 'Paracetamol 750 mg', posologia: '1 comprimido de 8/8h se dor, por até 5 dias' }], codigo: 'VP-RX-2026-000184', assinada: true },
    { id: 'r2', pacienteId: 'p3', profissionalId: 'pr2', data: dia(-45), itens: [{ medicamento: 'Losartana 50 mg', posologia: '1 comprimido ao dia, uso contínuo' }], codigo: 'VP-RX-2026-000151', assinada: true }
  ];

  const notificacoes = [
    { id: 'n1', pacienteId: 'p1', data: dia(0), texto: 'Sua teleconsulta com Dr. Carlos Menezes é hoje às 10:00.', lida: false },
    { id: 'n2', pacienteId: 'p1', data: dia(-19), texto: 'Resultado do exame "Hemograma completo e glicemia" disponível.', lida: false },
    { id: 'n3', pacienteId: 'p1', data: dia(-30), texto: 'Lembrete: atualize seus dados cadastrais.', lida: true }
  ];

  // Leitos — status: 'livre' | 'ocupado' | 'higienizacao' | 'manutencao'
  const leitos = [];
  const alas = [
    { unidadeId: 'u1', ala: 'Clínica Médica', prefixo: 'CM', total: 12 },
    { unidadeId: 'u1', ala: 'UTI Adulto', prefixo: 'UTI', total: 8 },
    { unidadeId: 'u1', ala: 'Pediatria', prefixo: 'PED', total: 6 },
    { unidadeId: 'u2', ala: 'Observação', prefixo: 'OBS', total: 6 }
  ];
  const padrao = ['ocupado', 'ocupado', 'livre', 'ocupado', 'higienizacao', 'livre', 'ocupado', 'ocupado', 'livre', 'manutencao', 'ocupado', 'livre'];
  const ocupantes = ['p3', 'p6', 'p2', 'p5'];
  let k = 0;
  alas.forEach(function (a) {
    for (let i = 1; i <= a.total; i++) {
      const status = padrao[(i + a.prefixo.length) % padrao.length];
      leitos.push({
        id: a.prefixo + '-' + String(i).padStart(2, '0'),
        unidadeId: a.unidadeId,
        ala: a.ala,
        status: status,
        pacienteId: status === 'ocupado' ? ocupantes[k++ % ocupantes.length] : null,
        desde: status === 'ocupado' ? dia(-((i % 5) + 1)) : null
      });
    }
  });

  const suprimentos = [
    { id: 's1', item: 'Luvas de procedimento (cx 100)', unidadeId: 'u1', qtd: 42, minimo: 60 },
    { id: 's2', item: 'Seringa 5 mL', unidadeId: 'u1', qtd: 1200, minimo: 500 },
    { id: 's3', item: 'Soro fisiológico 0,9% 500 mL', unidadeId: 'u1', qtd: 85, minimo: 120 },
    { id: 's4', item: 'Máscara N95', unidadeId: 'u2', qtd: 310, minimo: 200 },
    { id: 's5', item: 'Tubo de coleta EDTA', unidadeId: 'u3', qtd: 150, minimo: 400 },
    { id: 's6', item: 'Gaze estéril (pct)', unidadeId: 'u4', qtd: 260, minimo: 150 }
  ];

  // Financeiro (valores em R$ mil) — últimos 6 meses
  const meses = [];
  for (let m = 5; m >= 0; m--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - m);
    meses.push(d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', ''));
  }
  const receitasMes = [1840, 1925, 1880, 2010, 2085, 2140];
  const despesasMes = [1610, 1655, 1702, 1690, 1748, 1772];
  const financeiro = meses.map(function (mes, i) {
    return { mes: mes, receita: receitasMes[i], despesa: despesasMes[i] };
  });

  const usuarios = [
    { email: 'ana.souza@email.com', senha: 'Vida@2026', perfil: 'paciente', refId: 'p1', nome: 'Ana Clara Souza' },
    { email: 'carlos.menezes@vidaplus.com', senha: 'Vida@2026', perfil: 'profissional', refId: 'pr1', nome: 'Dr. Carlos Menezes' },
    { email: 'admin@vidaplus.com', senha: 'Vida@2026', perfil: 'admin', refId: null, nome: 'Renata Dias (Administração)' }
  ];

  global.SEED = {
    unidades: unidades,
    profissionais: profissionais,
    pacientes: pacientes,
    agendamentos: agendamentos,
    prontuarios: prontuarios,
    receitas: receitas,
    notificacoes: notificacoes,
    leitos: leitos,
    suprimentos: suprimentos,
    financeiro: financeiro,
    usuarios: usuarios,
    auditoria: []
  };
  global.SEED_HELPERS = { dia: dia };
})(window);
