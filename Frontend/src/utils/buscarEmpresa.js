import { empresas } from "../database/empresas/empresas.js";

export function buscarEmpresaPorNome(nome) {
  const texto = String(nome || "").trim().toUpperCase();

  return empresas.find(
    (empresa) => String(empresa.nome || "").trim().toUpperCase() === texto
  );
}

export function listarEmpresas() {
  return empresas;
}