// CT-17 a CT-21 — Profissional de saúde: prontuário, receita digital e telemedicina
const { test, expect } = require('@playwright/test');
const { login } = require('../helpers');

test.describe('Profissional de saúde e telemedicina', () => {
  test('CT-17 registra evolução no prontuário', async ({ page }) => {
    await login(page, 'profissional');
    await page.goto('/index.html#/profissional/prontuario/p2');
    await page.getByLabel('Título / hipótese diagnóstica').fill('Lombalgia mecânica');
    await page.getByLabel('CID-10 (opcional)').fill('M54.5');
    await page.getByLabel('Anamnese, exame físico e conduta').fill('Dor lombar sem irradiação. Prescrito repouso relativo e fisioterapia.');
    await page.getByRole('button', { name: 'Salvar no prontuário' }).click();
    await expect(page.locator('.timeline')).toContainText('Lombalgia mecânica');
  });

  test('CT-18 CID-10 em formato inválido é rejeitado', async ({ page }) => {
    await login(page, 'profissional');
    await page.goto('/index.html#/profissional/prontuario/p2');
    await page.getByLabel('CID-10 (opcional)').fill('123');
    await page.getByRole('button', { name: 'Salvar no prontuário' }).click();
    await expect(page.locator('#ev-cid-erro')).toContainText('Formato CID-10 inválido');
  });

  test('CT-19 receita digital exige assinatura e notifica o paciente', async ({ page }) => {
    await login(page, 'profissional');
    await page.goto('/index.html#/profissional/prontuario/p1');
    await page.getByRole('button', { name: 'Emitir receita digital' }).click();
    await page.getByLabel('Medicamento e concentração').fill('Amoxicilina 500 mg');
    await page.getByLabel('Posologia').fill('1 cápsula de 8/8h por 7 dias');
    await page.getByRole('button', { name: 'Emitir e enviar ao paciente' }).click();
    await expect(page.locator('#rx-erro')).toHaveText('A receita precisa ser assinada digitalmente.');
    await page.getByLabel(/Assinar digitalmente/).check();
    await page.getByRole('button', { name: 'Emitir e enviar ao paciente' }).click();
    await expect(page.locator('.lista-rx')).toContainText('Amoxicilina 500 mg');
    const notif = await page.evaluate(() => Store.get().notificacoes.filter(n => n.pacienteId === 'p1' && /Nova receita/.test(n.texto)).length);
    expect(notif).toBe(1);
  });

  test('CT-20 teleconsulta: conectar, registrar e encerrar marca como realizada', async ({ page }) => {
    await login(page, 'profissional');
    await page.goto('/index.html#/teleconsulta/a6');
    await page.getByRole('button', { name: 'Entrar na chamada' }).click();
    await expect(page.locator('#status-chamada')).toHaveText('Conectado', { timeout: 5000 });
    await page.getByLabel('Anamnese e conduta').fill('Síndrome gripal leve. Sintomáticos e hidratação.');
    await page.getByRole('button', { name: 'Encerrar chamada' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Encerrar' }).click();
    await expect(page).toHaveURL(/#\/profissional$/);
    const status = await page.evaluate(() => Store.get().agendamentos.find(a => a.id === 'a6').status);
    expect(status).toBe('realizada');
  });

  test('CT-21 paciente não acessa sala de teleconsulta de outra pessoa', async ({ page }) => {
    await login(page, 'paciente');
    await page.goto('/index.html#/teleconsulta/a6'); // pertence a outra paciente
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Acesso negado');
  });
});
