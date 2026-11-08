// Configuração dos testes automatizados (Playwright)
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: true,
  reporter: [['list'], ['html', { outputFolder: 'docs/relatorio-testes', open: 'never' }], ['json', { outputFile: 'docs/resultados-testes.json' }]],
  use: {
    baseURL: 'http://localhost:8081',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /responsivo/ },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] }, testMatch: /acessibilidade\/.*responsivo.*\.spec\.js/ }
  ],
  webServer: {
    command: 'npx http-server . -p 8081 -c-1 -s',
    url: 'http://localhost:8081/index.html',
    reuseExistingServer: true
  }
});
