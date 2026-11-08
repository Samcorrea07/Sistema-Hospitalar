// CT-22 a CT-27 — Administração hospitalar, auditoria e segurança
const { test, expect } = require('@playwright/test');
const { login } = require('../helpers');

test.describe('Administração e segurança', () => {
  test.beforeEach(async ({ page }) => { await login(page, 'admin'); });

  test('CT-22 interna paciente em leito livre e registra alta', async ({ page }) => {
    await page.goto('/index.html#/admin/leitos');
    const livre = page.locator('.leito-livre').first();
    const id = await livre.getAttribute('data-leito');
    await livre.click();
    await page.getByLabel('Paciente', { exact: true }).selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Confirmar internação' }).click();
    await expect(page.locator(`[data-leito="${id}"]`)).toHaveClass(/leito-ocupado/);
    await page.locator(`[data-leito="${id}"]`).click();
    await page.getByRole('button', { name: 'Registrar alta' }).click();
    await expect(page.locator(`[data-leito="${id}"]`)).toHaveClass(/leito-higienizacao/);
  });

  test('CT-23 cadastra novo profissional', async ({ page }) => {
    await page.goto('/index.html#/admin/cadastros');
    await page.getByRole('button', { name: 'Novo profissional' }).click();
    await page.getByLabel('Nome completo').fill('Dra. Helena Duarte');
    await page.getByLabel('Especialidade').fill('Ortopedia');
    await page.getByLabel('Registro profissional').fill('CRM-MG 70.001');
    await page.getByLabel('E-mail corporativo').fill('helena.duarte@vidaplus.com');
    await page.getByLabel('Clínica VidaPlus Jardim').check();
    await page.getByRole('button', { name: 'Cadastrar' }).click();
    await expect(page.locator('table')).toContainText('Dra. Helena Duarte');
  });

  test('CT-24 filtro por unidade altera os indicadores (multiunidade)', async ({ page }) => {
    await page.goto('/index.html#/admin');
    await page.getByLabel('Unidade').selectOption('u3');
    await expect(page.locator('.sub').first()).toContainText('Laboratório VidaPlus Centro');
    await expect(page.locator('.kpi').first()).toContainText('—');
  });

  test('CT-25 exporta relatório financeiro em CSV', async ({ page }) => {
    await page.goto('/index.html#/admin/relatorios');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Exportar financeiro/ }).click()
    ]);
    expect(download.suggestedFilename()).toBe('relatorio-financeiro-vidaplus.csv');
  });

  test('CT-26 auditoria registra login e ações sensíveis', async ({ page }) => {
    await page.goto('/index.html#/admin/relatorios');
    await page.getByRole('button', { name: /Exportar financeiro/ }).click();
    await page.goto('/index.html#/admin/auditoria');
    await expect(page.locator('tbody')).toContainText('LOGIN');
    await expect(page.locator('tbody')).toContainText('RELATORIO_EXPORTADO');
  });

  test('CT-27 conteúdo malicioso é escapado (proteção contra XSS)', async ({ page }) => {
    await page.evaluate(() => { Store.get().pacientes[0].nome = '<img src=x onerror="window.__xss=1">Ana'; Store.salvar(); });
    await page.goto('/index.html#/admin/cadastros');
    await expect(page.locator('table')).toContainText('<img src=x');
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
  });
});
