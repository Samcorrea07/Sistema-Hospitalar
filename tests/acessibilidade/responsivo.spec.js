// CT-33 e CT-34 — Responsividade (WCAG 1.4.10 Reflow e 1.4.4 Redimensionar texto)
const { test, expect } = require('@playwright/test');
const { login } = require('../helpers');

const ROTAS = [['paciente', '#/paciente'], ['paciente', '#/paciente/agendar'], ['profissional', '#/profissional'], ['admin', '#/admin/leitos'], ['admin', '#/admin/relatorios']];

test.describe('Responsividade em dispositivo móvel', () => {
  for (const [perfil, rota] of ROTAS) {
    test(`CT-33 sem rolagem horizontal em ${rota}`, async ({ page }) => {
      await login(page, perfil);
      await page.goto('/index.html' + rota); await page.waitForSelector('h1');
      const excede = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      expect(excede).toBe(false);
    });
  }

  test('CT-34 menu lateral abre pelo botão e fecha com Esc', async ({ page }) => {
    await login(page, 'paciente');
    const botao = page.getByRole('button', { name: 'Abrir menu' });
    await botao.click();
    await expect(page.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute('aria-expanded', 'false');
  });

  test('CT-35 texto ampliado em 150% continua sem rolagem horizontal', async ({ page }) => {
    await login(page, 'paciente');
    for (let i = 0; i < 5; i++) await page.evaluate(() => { Store.setPref('fonte', Math.min(150, Store.prefs().fonte + 10)); });
    await page.goto('/index.html#/paciente/historico'); await page.reload(); await page.waitForSelector('h1');
    const excede = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(excede).toBe(false);
  });
});
