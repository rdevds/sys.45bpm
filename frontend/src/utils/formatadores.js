export function somenteMaiusculo(valor) {
  return String(valor || "").toUpperCase();
}

export function normalizarTexto(valor) {
  return somenteMaiusculo(valor).replace(/\s+/g, " ").trimStart();
}

export function formatarPlaca(valor) {
  const limpa = somenteMaiusculo(valor).replace(/[^A-Z0-9]/g, "");

  if (limpa.length <= 3) return limpa;

  return `${limpa.slice(0, 3)}-${limpa.slice(3, 7)}`;
}