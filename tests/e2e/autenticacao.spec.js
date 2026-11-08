// CT-01 a CT-09 — Autenticação, controle de acesso (RBAC) e cadastro com consentimento LGPD
const { test, expect } = require('@playwright/test');
const { login } = require('../helpers');

test.describe('Autenticação e controle de acesso', () => {
  test('CT-01 login válido do paciente redireciona para o painel', async ({ page }) => {
    await login(page, 'paciente');
    await expect(page).toHaveURL(/#\/paciente$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Olá, Ana');
  });

  test('CT-02 senha incorreta exibe mensagem de erro e não autentica', async ({ page }) => {
    await login(page, 'paciente', undefined, 'SenhaErrada1!');
    await expect(page.getByRole('alert')).toHaveText('E-mail ou senha inválidos.');
    await expect(page).toHaveURL(/#\/login$/);
  });

  test('CT-03 usuário não pode entrar com perfil diferente do seu', async ({ page }) => {
    await login(page, 'admin', 'ana.souza@email.com');
    await expect(page.getByRole('alert')).toHaveText('Este usuário não possui o perfil selecionado.');
  });

  test('CT-04 validação de campos obrigatórios no login', async ({ page }) => {
    await page.goto('/index.html#/login');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page.locator('#email-erro')).toHaveText('Informe um e-mail válido.');
    await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#email')).toBeFocused();
  });

  test('CT-05 rota protegida sem sessão redireciona ao login', async ({ page }) => {
    await page.goto('/index.html#/admin/auditoria');
    await expect(page).toHaveURL(/#\/login$/);
  });

  test('CT-06 paciente não acessa área administrativa (RBAC)', async ({ page }) => {
    await login(page, 'paciente');
    await page.goto('/index.html#/admin/relatorios');
    await expect(page).toHaveURL(/#\/paciente$/);
    await expect(page.locator('#toasts')).toContainText('não tem permissão');
  });

  test('CT-07 cadastro rejeita CPF inválido', async ({ page }) => {
    await page.goto('/index.html#/cadastro');
    await page.getByLabel('CPF *').fill('111.111.111-11');
    await page.getByRole('button', { name: 'Criar cadastro' }).click();
    await expect(page.locator('#cpf-erro')).toHaveText('CPF inválido.');
  });

  test('CT-08 cadastro exige consentimento LGPD', async ({ page }) => {
    await page.goto('/index.html#/cadastro');
    await page.getByRole('button', { name: 'Criar cadastro' }).click();
    await expect(page.locator('#lgpd-erro')).toHaveText('É necessário aceitar a política para continuar.');
  });

  test('CT-09 cadastro válido permite login do novo paciente', async ({ page }) => {
    await page.goto('/index.html#/cadastro');
    await page.getByLabel('Nome completo *').fill('Teste Automatizado Silva');
    await page.getByLabel('CPF *').fill('52998224725');
    await page.getByLabel('Data de nascimento *').fill('1995-05-10');
    await page.getByLabel('Celular *').fill('31991234567');
    await page.getByLabel('E-mail *').fill('teste.auto@email.com');
    await page.getByLabel('Senha *', { exact: true }).fill('Teste@123');
    await page.getByLabel('Confirme a senha *').fill('Teste@123');
    await page.locator('#lgpd').check();
    await page.getByRole('button', { name: 'Criar cadastro' }).click();
    await expect(page).toHaveURL(/#\/login$/);
    await login(page, 'paciente', 'teste.auto@email.com', 'Teste@123');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Olá, Teste');
  });

  test('CT-10 logout encerra a sessão', async ({ page }) => {
    await login(page, 'profissional');
    await page.getByRole('button', { name: 'Sair' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Sair' }).click();
    await expect(page).toHaveURL(/#\/login$/);
    await page.goto('/index.html#/profissional');
    await expect(page).toHaveURL(/#\/login$/);
  });
});
