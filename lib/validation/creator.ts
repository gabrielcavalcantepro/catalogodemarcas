// Normalização compartilhada entre o cadastro no admin (allowlist, §5.1) e
// o registro/login público (§3/§6.3) — precisa ser idêntica nos dois
// lugares, senão o match email+@ nunca bate.
export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeTiktokHandle(value: string) {
  return value.trim().replace(/^@/, "").toLowerCase();
}
