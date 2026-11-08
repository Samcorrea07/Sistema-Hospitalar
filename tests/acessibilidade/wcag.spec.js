// CT-28 a CT-32 — Acessibilidade (WCAG 2.1 nível AA) com axe-core e navegação por teclado
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { login } = require('../helpers');

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
async function auditar(page, nome) {
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const resumo = r.violations.map(v => `${v.id} (${v.impact}): ${v.nodes.length} ocorrência(s)`);
  test.info().annotations.push({ type: 'axe', description: `${nome}: ${r.passes.length} regras aprovadas, ${r.violations.length} violações` });
  expect(resumo, `Violações WCAG em ${nome}`).toEqual([]);
}

const PAGINAS = {
  publico: ['#/login', '#/cadastro'],
  paciente: ['#/paciente', '#/paciente/agendar', '#/paciente/consultas', '#/paciente/historico', '#/paciente/dados', '#/teleconsulta/a1'],
  profissional: ['#/profissional', '#/profissional/pacientes', '#/profissional/prontuario/p3'],
  admin: ['#/admin', '#/admin/leitos', '#/admin/cadastros', '#/admin/relatorios', '#/admin/auditoria']
};

test.describe('CT-28 Auditoria automática WCAG 2.1 AA (axe-core)', () => {
  for (const rota of PAGINAS.publico) {
    test(`público ${rota}`, async ({ page }) => {
      await page.goto('/index.html' + rota); await page.waitForSelector('h1');
      await auditar(page, rota);
    });
  }
  for (const perfil of ['paciente', 'profissional', 'admin']) {
    for (const rota of PAGINAS[perfil]) {
      test(`${perfil} ${rota}`, async ({ page }) => {
        await login(page, perfil);
        await page.goto('/index.html' + rota); await page.waitForSelector('h1');
        await auditar(page, rota);
      });
    }
  }
  test('modo alto contraste', async ({ page }) => {
    await login(page, 'admin');
    await page.getByRole('button', { name: 'Alto contraste' }).click();
    await auditar(page, 'alto contraste');
  });
  test('diálogo modal aberto', async ({ page }) => {
    await login(page, 'paciente');
    await page.goto('/index.html#/paciente/consultas');
    await page.locator('[data-cancelar]').first().click();
    await auditar(page, 'modal de cancelamento');
  });
});

test.describe('Navegação por teclado', () => {
  test('CT-29 link "Pular para o conteúdo" é o primeiro foco da página', async ({ page }) => {
    await page.goto('/index.html#/login');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Pular para o conteúdo principal' })).toBeFocused();
  });

  test('CT-30 login completo apenas com teclado', async ({ page }) => {
    await page.goto('/index.html#/login');
    await page.locator('input[name=perfil][value=paciente]').focus();
    await page.keyboard.press('ArrowRight'); // seleciona "Profissional de saúde"
    await page.keyboard.press('Tab');
    await page.keyboard.type('carlos.menezes@vidaplus.com');
    await page.keyboard.press('Tab');
    await page.keyboard.type('Vida@2026');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#\/profissional$/);
  });

  test('CT-31 modal prende o foco, fecha com Esc e devolve o foco ao botão de origem', async ({ page }) => {
    await login(page, 'paciente');
    await page.goto('/index.html#/paciente/consultas');
    const botao = page.locator('[data-cancelar]').first();
    await botao.focus(); await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    for (let i = 0; i < 6; i++) await page.keyboard.press('Tab');
    const dentro = await page.evaluate(() => !!document.activeElement.closest('[role=dialog]'));
    expect(dentro).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(botao).toBeFocused();
  });

  test('CT-32 ao navegar, o foco vai para o título da nova página', async ({ page }) => {
    await login(page, 'paciente');
    await page.getByRole('link', { name: 'Histórico clínico' }).first().click();
    await expect(page.getByRole('heading', { level: 1, name: 'Histórico clínico' })).toBeFocused();
  });
});
