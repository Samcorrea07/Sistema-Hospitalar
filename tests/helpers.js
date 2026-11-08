// Funções auxiliares compartilhadas pelos testes
const SENHA = 'Vida@2026';
const USUARIOS = {
  paciente: 'ana.souza@email.com',
  profissional: 'carlos.menezes@vidaplus.com',
  admin: 'admin@vidaplus.com'
};

async function login(page, perfil, email = USUARIOS[perfil], senha = SENHA) {
  await page.goto('/index.html#/login');
  await page.getByLabel(perfilRotulo(perfil)).check();
  await page.getByLabel('E-mail').fill(email);
  await page.locator('#senha').fill(senha);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}
function perfilRotulo(p) {
  return { paciente: 'Paciente', profissional: 'Profissional de saúde', admin: 'Administrador' }[p];
}
function diaISO(offset) {
  const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}
/** Próximo dia útil (seg–sáb) a partir de N dias. */
function proximoDiaUtil(offset) {
  let o = offset;
  while (new Date(diaISO(o) + 'T12:00:00').getDay() === 0) o++;
  return diaISO(o);
}
module.exports = { login, SENHA, USUARIOS, diaISO, proximoDiaUtil };
