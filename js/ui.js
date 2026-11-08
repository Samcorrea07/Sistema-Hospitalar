/* =========================================================================
 * SGHSS VidaPlus — Utilitários de interface
 * ========================================================================= */
(function (global) {
  'use strict';

  /** Escapa HTML para prevenir XSS ao renderizar dados (OWASP A03). */
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function dataBR(iso) {
    if (!iso) return '-';
    const p = iso.slice(0, 10).split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }
  function dataExtenso(iso) {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  }
  function hoje() { return global.SEED_HELPERS.dia(0); }
  function idade(iso) {
    const n = new Date(iso + 'T12:00:00'); const h = new Date();
    let i = h.getFullYear() - n.getFullYear();
    if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) i--;
    return i;
  }
  /** Minimização de dados (LGPD art. 6º, III): CPF exibido mascarado. */
  function mascararCPF(cpf) { return '***.***.' + String(cpf).slice(8); }
  function moeda(milhares) {
    return (milhares * 1000).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  }

  const ICONES = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    lista: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    historico: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 3"/>',
    usuario: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    video: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="M16 10l6-3v10l-6-3z"/>',
    prontuario: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M9 13h6M9 17h6"/>',
    grupo: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14a5 5 0 0 1 6 6"/>',
    leito: '<path d="M3 18V7M3 13h18v5M21 18v-5a3 3 0 0 0-3-3h-7v3"/><circle cx="7" cy="10" r="2"/>',
    grafico: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    escudo: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    caixa: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    sino: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/>',
    sair: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    mais: '<path d="M12 5v14M5 12h14"/>',
    receita: '<path d="M6 3h9l3 3v15H6z"/><path d="M9 9h3a2 2 0 0 1 0 4H9V8M11 13l4 5"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    telefone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    contraste: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
    olho: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'
  };
  function icone(nome, classe) {
    return '<svg class="ico ' + (classe || '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (ICONES[nome] || '') + '</svg>';
  }

  const ROTULOS_STATUS = {
    agendada: ['Agendada', 'info'], realizada: ['Realizada', 'ok'], cancelada: ['Cancelada', 'neutro'],
    livre: ['Livre', 'ok'], ocupado: ['Ocupado', 'perigo'], higienizacao: ['Higienização', 'alerta'], manutencao: ['Manutenção', 'neutro']
  };
  function badge(status) {
    const r = ROTULOS_STATUS[status] || [status, 'neutro'];
    return '<span class="badge badge-' + r[1] + '">' + esc(r[0]) + '</span>';
  }
  const TIPOS = { presencial: 'Consulta presencial', tele: 'Teleconsulta', exame: 'Exame' };
  function tipoLabel(t) { return TIPOS[t] || t; }

  // ---------------- Toasts (anunciados por leitor de tela) ----------------
  function toast(msg, tipo) {
    const root = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = 'toast toast-' + (tipo || 'ok');
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(function () { el.classList.add('saindo'); }, 4200);
    setTimeout(function () { el.remove(); }, 4700);
  }

  // ---------------- Modal acessível (focus trap + Esc) ----------------
  let ultimoFoco = null;
  function fecharModal() {
    const root = document.getElementById('modal-root');
    root.innerHTML = '';
    document.body.classList.remove('modal-aberto');
    document.getElementById('app').inert = false;
    if (ultimoFoco && document.contains(ultimoFoco)) ultimoFoco.focus();
  }
  /**
   * Abre um diálogo. `corpo` é HTML; `acoes` é uma lista de
   * { rotulo, classe, onClick(dialog) -> boolean|void } (retornar false mantém aberto).
   */
  function modal(titulo, corpo, acoes, opcoes) {
    ultimoFoco = document.activeElement;
    const root = document.getElementById('modal-root');
    const largo = opcoes && opcoes.largo ? ' modal-largo' : '';
    root.innerHTML =
      '<div class="modal-fundo" data-fechar></div>' +
      '<div class="modal' + largo + '" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">' +
      '<div class="modal-cab"><h2 id="modal-titulo">' + esc(titulo) + '</h2>' +
      '<button type="button" class="btn-icone" data-fechar aria-label="Fechar diálogo">✕</button></div>' +
      '<div class="modal-corpo">' + corpo + '</div>' +
      '<div class="modal-acoes"></div></div>';
    document.body.classList.add('modal-aberto');
    document.getElementById('app').inert = true; // conteúdo de fundo inacessível enquanto o diálogo está aberto
    const dlg = root.querySelector('.modal');
    const zonaAcoes = root.querySelector('.modal-acoes');
    (acoes || [{ rotulo: 'Fechar', classe: 'btn-secundario' }]).forEach(function (a) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn ' + (a.classe || 'btn-primario');
      b.textContent = a.rotulo;
      b.addEventListener('click', function () {
        const r = a.onClick ? a.onClick(dlg) : undefined;
        if (r !== false) fecharModal();
      });
      zonaAcoes.appendChild(b);
    });
    root.querySelectorAll('[data-fechar]').forEach(function (el) { el.addEventListener('click', fecharModal); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); fecharModal(); }
      if (e.key === 'Tab') {
        const f = dlg.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const primeiro = f[0], ultimo = f[f.length - 1];
        if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
      }
    });
    const alvo = dlg.querySelector('input, select, textarea') || dlg.querySelector('.modal-acoes .btn');
    if (alvo) alvo.focus();
    return dlg;
  }
  function confirmar(titulo, texto, rotulo, onSim) {
    modal(titulo, '<p>' + esc(texto) + '</p>', [
      { rotulo: 'Voltar', classe: 'btn-secundario' },
      { rotulo: rotulo || 'Confirmar', classe: 'btn-perigo', onClick: onSim }
    ]);
  }

  /** Gráfico de barras acessível em SVG (com tabela equivalente para leitores de tela). */
  function graficoBarras(dados, series, opcoes) {
    const L = 560, A = 220, mE = 44, mB = 28, mT = 10;
    const max = Math.max.apply(null, dados.map(function (d) { return Math.max.apply(null, series.map(function (s) { return d[s.chave]; })); })) * 1.1;
    const grupo = (L - mE) / dados.length;
    const bw = Math.min(22, (grupo - 14) / series.length);
    let barras = '', rotulos = '', grade = '';
    for (let g = 0; g <= 4; g++) {
      const v = (max / 4) * g; const y = A - mB - (v / max) * (A - mB - mT);
      grade += '<line x1="' + mE + '" x2="' + L + '" y1="' + y + '" y2="' + y + '" class="grade"/>' +
        '<text x="' + (mE - 6) + '" y="' + (y + 4) + '" text-anchor="end" class="eixo">' + Math.round(v / 100) / 10 + 'M</text>';
    }
    dados.forEach(function (d, i) {
      const x0 = mE + i * grupo + (grupo - bw * series.length - 4 * (series.length - 1)) / 2;
      series.forEach(function (s, j) {
        const h = (d[s.chave] / max) * (A - mB - mT);
        barras += '<rect x="' + (x0 + j * (bw + 4)) + '" y="' + (A - mB - h) + '" width="' + bw + '" height="' + h + '" rx="3" class="' + s.classe + '"><title>' + esc(s.nome + ' ' + d.rotulo + ': ' + moeda(d[s.chave])) + '</title></rect>';
      });
      rotulos += '<text x="' + (mE + i * grupo + grupo / 2) + '" y="' + (A - 8) + '" text-anchor="middle" class="eixo">' + esc(d.rotulo) + '</text>';
    });
    const leg = series.map(function (s) { return '<span class="leg"><i class="' + s.classe + '"></i>' + esc(s.nome) + '</span>'; }).join('');
    return '<figure class="grafico"><svg viewBox="0 0 ' + L + ' ' + A + '" role="img" aria-label="' + esc(opcoes.titulo) + '">' + grade + barras + rotulos + '</svg>' +
      '<figcaption class="legenda">' + leg + '</figcaption></figure>';
  }

  function baixarArquivo(nome, conteudo, mime) {
    const blob = new Blob([conteudo], { type: mime || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nome; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 500);
  }
  function csv(linhas) {
    return '﻿' + linhas.map(function (l) {
      return l.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(';');
    }).join('\n');
  }

  function vazio(msg) { return '<p class="vazio">' + esc(msg) + '</p>'; }

  // ---------------- Registro de rotas (preenchido pelos arquivos de views) ----------------
  const rotas = [];
  /** padrao ex.: '/paciente/consultas' ou '/profissional/prontuario/:id' */
  function rota(padrao, def) {
    const chaves = [];
    const re = new RegExp('^' + padrao.replace(/:[a-zA-Z]+/g, function (m) { chaves.push(m.slice(1)); return '([^/]+)'; }) + '$');
    rotas.push({ padrao: padrao, re: re, chaves: chaves, def: def });
  }
  function resolver(caminho) {
    for (let i = 0; i < rotas.length; i++) {
      const m = caminho.match(rotas[i].re);
      if (m) {
        const params = {};
        rotas[i].chaves.forEach(function (k, j) { params[k] = decodeURIComponent(m[j + 1]); });
        return { def: rotas[i].def, params: params };
      }
    }
    return null;
  }
  global.Router = { rota: rota, resolver: resolver };

  global.UI = {
    esc: esc, dataBR: dataBR, dataExtenso: dataExtenso, hoje: hoje, idade: idade, mascararCPF: mascararCPF,
    moeda: moeda, icone: icone, badge: badge, tipoLabel: tipoLabel, toast: toast, modal: modal,
    fecharModal: fecharModal, confirmar: confirmar, graficoBarras: graficoBarras, baixarArquivo: baixarArquivo,
    csv: csv, vazio: vazio
  };
})(window);
