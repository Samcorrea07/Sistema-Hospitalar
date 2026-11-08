// CT-11 a CT-16 — Fluxos do paciente: agendamento, cancelamento, histórico e LGPD
const { test, expect } = require('@playwright/test');
const { login, proximoDiaUtil } = require('../helpers');

test.describe('Paciente', () => {
  test.beforeEach(async ({ page }) => { await login(page, 'paciente'); });

  test('CT-11 agenda consulta presencial e ela aparece na lista', async ({ page }) => {
    await page.goto('/index.html#/paciente/agendar');
    await page.getByLabel('Especialidade').selectOption('Dermatologia');
    await page.getByLabel('Profissional', { exact: true }).selectOption({ label: 'Dra. Beatriz Lima — CRM-MG 60.118' });
    const data = proximoDiaUtil(3);
    await page.getByLabel('Data').fill(data);
    await page.getByRole('radio', { name: '09:00' }).click();
    await page.getByRole('button', { name: 'Revisar e confirmar' }).click();
    await expect(page.getByRole('dialog')).toContainText('Dra. Beatriz Lima');
    await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
    await expect(page).toHaveURL(/#\/paciente\/consultas$/);
    await expect(page.locator('.lista-ag').first()).toContainText('Dermatologia');
  });

  test('CT-12 horário já ocupado aparece indisponível (sem conflito de agenda)', async ({ page }) => {
    await page.goto('/index.html#/paciente/agendar');
    await page.getByLabel('Especialidade').selectOption('Cardiologia');
    await page.getByLabel('Profissional', { exact: true }).selectOption('pr2');
    const ocupada = await page.evaluate(() => Store.get().agendamentos.find(a => a.id === 'a2').data);
    await page.getByLabel('Data').fill(ocupada);
    await expect(page.getByRole('radio', { name: '14:30' })).toBeDisabled();
  });

  test('CT-13 agendamento sem horário mostra erro de validação', async ({ page }) => {
    await page.goto('/index.html#/paciente/agendar');
    await page.getByRole('button', { name: 'Revisar e confirmar' }).click();
    await expect(page.locator('#esp-erro')).toHaveText('Selecione a especialidade.');
    await expect(page.locator('#hora-erro')).toHaveText('Selecione um horário disponível.');
  });

  test('CT-14 cancela um agendamento futuro', async ({ page }) => {
    await page.goto('/index.html#/paciente/consultas');
    const antes = await page.locator('[data-cancelar]').count();
    await page.locator('[data-cancelar]').first().click();
    await page.getByRole('button', { name: 'Cancelar agendamento' }).click();
    await expect(page.locator('#toasts')).toContainText('Agendamento cancelado.');
    await expect(page.locator('[data-cancelar]')).toHaveCount(antes - 1);
  });

  test('CT-15 visualiza histórico clínico e receita digital', async ({ page }) => {
    await page.goto('/index.html#/paciente/historico');
    await expect(page.locator('.timeline li')).toHaveCount(2);
    await page.getByRole('button', { name: 'Ver receita' }).click();
    await expect(page.getByRole('dialog')).toContainText('VP-RX-2026-000184');
    await expect(page.getByRole('dialog')).toContainText('***.***.789-09'); // CPF mascarado
  });

  test('CT-16 portabilidade de dados (LGPD art. 18) gera arquivo JSON', async ({ page }) => {
    await page.goto('/index.html#/paciente/dados');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Baixar meus dados/ }).click()
    ]);
    expect(download.suggestedFilename()).toBe('meus-dados-vidaplus.json');
  });
});
