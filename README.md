# SGHSS VidaPlus — Protótipo Front-end

Protótipo funcional do **Sistema de Gestão Hospitalar e de Serviços de Saúde (SGHSS)** da instituição fictícia **VidaPlus**, desenvolvido para o Projeto Multidisciplinar (ênfase **Front-end**).

A aplicação é uma SPA (*Single Page Application*) em **HTML5, CSS3 e JavaScript puro (ES2017)**, sem etapa de build. Ela roda em qualquer hospedagem estática, como o GitHub Pages.

> 🔗 **Demonstração publicada:** `https://SEU-USUARIO.github.io/sghss-vidaplus/` *(atualize após publicar)*

## Perfis e credenciais de demonstração

| Perfil | E-mail | Senha |
|---|---|---|
| Paciente | `ana.souza@email.com` | `Vida@2026` |
| Profissional de saúde | `carlos.menezes@vidaplus.com` | `Vida@2026` |
| Administrador | `admin@vidaplus.com` | `Vida@2026` |

Todos os dados são fictícios. O botão **“Restaurar dados de demonstração”**, na tela de login, volta o sistema ao estado inicial.

## Funcionalidades

**Paciente:** autocadastro com validação de CPF e consentimento LGPD; agendamento de consultas presenciais, teleconsultas e exames, com horários livres em tempo real; cancelamento; notificações; histórico clínico; receitas digitais; teleconsulta; exportação dos próprios dados (portabilidade) e revogação de consentimento.

**Profissional de saúde:** agenda diária com indicadores; busca de pacientes; prontuário eletrônico com evolução e CID-10; emissão de receita digital assinada (simulada); condução da teleconsulta com registro no prontuário.

**Administrador:** painel com indicadores por unidade (multiunidade); mapa de leitos com internação, alta e higienização; cadastros de pacientes e profissionais; relatórios financeiros e de atendimentos com exportação CSV; trilha de auditoria filtrável.

**Transversais:** controle de acesso por perfil (RBAC), expiração de sessão por inatividade, registro de auditoria, escape de HTML contra XSS, mascaramento de CPF, layout responsivo (mobile-first), WCAG 2.1 AA, alto contraste, ajuste de tamanho de fonte, navegação completa por teclado.

## Como executar

```bash
# Opção 1 — sem instalar nada (Python 3)
python3 -m http.server 8080
# acesse http://localhost:8080

# Opção 2 — Node.js
npm install
npm start          # http://localhost:8080
```

## Testes automatizados

São 56 testes em Playwright: fluxos E2E, segurança, acessibilidade com axe-core (WCAG 2.1 AA) e responsividade.

```bash
npm install
npx playwright install chromium   # apenas na primeira vez
npm test                          # executa todos os testes
npm run test:report               # abre o relatório HTML
```

## Publicação no GitHub Pages

1. Crie um repositório público e envie todos os arquivos desta pasta (a pasta `node_modules` não precisa ir).
2. No GitHub, vá em **Settings → Pages**.
3. Em *Source*, escolha **Deploy from a branch**, selecione `main` e a pasta `/ (root)`, e salve.
4. Em 1 a 2 minutos o site fica disponível em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

## Estrutura

```
├── index.html               # shell da aplicação (landmarks, regiões aria-live)
├── css/styles.css           # design tokens, responsivo, alto contraste, impressão
├── js/
│   ├── data.js              # dados fictícios (mock da API)
│   ├── store.js             # estado, sessão, auditoria, regras de agendamento
│   ├── ui.js                # utilitários: escape XSS, modal acessível, toasts, gráficos, roteador
│   ├── app.js               # layout, menu por perfil, guarda de rotas (RBAC), foco
│   └── views/               # telas por perfil (auth, paciente, profissional, admin, telemedicina)
├── tests/
│   ├── e2e/                 # casos de teste funcionais e de segurança
│   └── acessibilidade/      # axe-core (WCAG), teclado e responsividade
└── docs/
    ├── documento/           # documento do projeto (PDF + versão HTML editável)
    ├── diagramas/           # UML (casos de uso, sequência, estados, componentes, implantação)
    ├── wireframes/          # wireframes de baixa fidelidade
    └── prints/              # capturas de tela das telas e dos testes
```

## Limitações conhecidas (escopo do protótipo)

Este é um protótipo de front-end. A persistência usa `localStorage` apenas para demonstração; em produção, os dados viriam de uma API REST autenticada (HTTPS, JWT em cookie HttpOnly), com criptografia em repouso no servidor. A videochamada é simulada; a câmera local funciona quando o navegador concede permissão. A integração real usaria WebRTC com DTLS-SRTP.

## Licença

MIT. Projeto acadêmico.
