import {
  Building2,
  Factory,
  FolderTree,
  Landmark,
  Shield,
  UsersRound,
} from "lucide-react";

/* =========================================================
   TEXTO
========================================================= */

export function texto(valor) {
  return String(valor ?? "").trim();
}

export function textoMaiusculo(valor) {
  return texto(valor).toUpperCase();
}

/* =========================================================
   TIPO VISUAL DA UNIDADE
========================================================= */

export function obterTipoVisual(unidade) {
  const tipo =
    textoMaiusculo(unidade?.tipo);

  const nome =
    textoMaiusculo(unidade?.nome);

  const sigla =
    textoMaiusculo(unidade?.sigla);

  if (
    tipo.includes("BATALH") ||
    nome.includes("BATALHÃO") ||
    sigla.includes("BPM")
  ) {
    return "batalhao";
  }

  if (
    tipo.includes("COMPANH") ||
    nome.includes("CIA") ||
    sigla.includes("CIA")
  ) {
    return "companhia";
  }

  if (
    tipo.includes("PELOT") ||
    nome.includes("PELOTÃO") ||
    sigla.includes("PEL")
  ) {
    return "pelotao";
  }

  if (
    tipo.includes("GRUPO") ||
    nome.includes("GRUPO") ||
    sigla.includes("GP")
  ) {
    return "grupo";
  }

  if (
    tipo.includes("SECAO") ||
    tipo.includes("SEÇÃO") ||
    tipo.includes("ADMIN") ||
    nome.includes("SEÇÃO") ||
    nome.includes("SECRETARIA") ||
    nome.includes("NÚCLEO") ||
    nome.includes("RECURSOS HUMANOS") ||
    nome.includes("GESTÃO DE FROTA") ||
    nome.includes("LOGÍSTICA") ||
    nome.includes("STIC") ||
    nome.includes("SOU")
  ) {
    return "secao";
  }

  return "unidade";
}

/* =========================================================
   ÍCONE DA UNIDADE
========================================================= */

export function obterIconeUnidade(
  unidade,
  tamanho = 18
) {
  const tipoVisual =
    obterTipoVisual(unidade);

  if (tipoVisual === "batalhao") {
    return <Landmark size={tamanho} />;
  }

  if (tipoVisual === "companhia") {
    return <Shield size={tamanho} />;
  }

  if (tipoVisual === "pelotao") {
    return <Factory size={tamanho} />;
  }

  if (tipoVisual === "grupo") {
    return <UsersRound size={tamanho} />;
  }

  if (tipoVisual === "secao") {
    return <FolderTree size={tamanho} />;
  }

  return <Building2 size={tamanho} />;
}