/* =========================================================
   UTILITÁRIOS DE MILITARES
========================================================= */

function texto(valor) {
  return String(valor ?? "").trim();
}

function textoMaiusculo(valor) {
  return texto(valor).toUpperCase();
}

/* =========================================================
   GRADUAÇÃO + NOME COMPLETO
   Exemplo:
   3º SGT PM RIVANIL DUARTE DE SOUZA
========================================================= */

export function nomeCompletoMilitar(
  militar = {}
) {
  const graduacao =
    textoMaiusculo(militar.graduacao);

  const nome =
    textoMaiusculo(militar.nome);

  return [graduacao, nome]
    .filter(Boolean)
    .join(" ");
}

/* =========================================================
   GRADUAÇÃO + NOME DE GUERRA
   Mantido para uso futuro em telas compactas
========================================================= */

export function nomeGuerraMilitar(
  militar = {}
) {
  const graduacao =
    textoMaiusculo(militar.graduacao);

  const nomePolicia =
    textoMaiusculo(
      militar.nome_policia
    );

  return [graduacao, nomePolicia]
    .filter(Boolean)
    .join(" ");
}