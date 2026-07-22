export function normalizarTexto(valor) {
  return String(valor ?? "").trim();
}

export function normalizarCabecalho(valor) {
  return normalizarTexto(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function normalizarPlaca(valor) {
  return normalizarTexto(valor)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function normalizarCpf(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

export function normalizarCombustivel(valor) {
  const texto = normalizarTexto(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (!texto) {
    return null;
  }

  if (
    texto.includes("ETANOL") ||
    texto.includes("ALCOOL")
  ) {
    return "ETANOL";
  }

  if (texto.includes("GASOLINA")) {
    return "GASOLINA";
  }

  if (texto.includes("S10")) {
    return "DIESEL S10";
  }

  if (texto.includes("S500")) {
    return "DIESEL S500";
  }

  if (texto.includes("DIESEL")) {
    return "DIESEL";
  }

  return texto;
}

export function converterNumero(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : null;
  }

  let texto = String(valor)
    .trim()
    .replace(/\s/g, "")
    .replace(/R\$/gi, "");

  if (!texto) {
    return null;
  }

  if (
    texto.includes(".") &&
    texto.includes(",")
  ) {
    texto = texto
      .replace(/\./g, "")
      .replace(",", ".");
  } else if (texto.includes(",")) {
    texto = texto.replace(",", ".");
  }

  const numero = Number(texto);

  return Number.isFinite(numero)
    ? numero
    : null;
}

export function obterValorLinha(
  linha,
  nomesPossiveis
) {
  const entradas = Object.entries(linha ?? {});

  for (const nome of nomesPossiveis) {
    const nomeNormalizado =
      normalizarCabecalho(nome);

    const encontrado = entradas.find(
      ([cabecalho]) =>
        normalizarCabecalho(cabecalho) ===
        nomeNormalizado
    );

    if (encontrado) {
      return encontrado[1];
    }
  }

  return null;
}

export function criarChaveImportacao(registro) {
  return [
    registro.fonte ?? "",
    registro.codigo_origem ?? "",
    registro.placa_original ?? "",
    registro.data_abastecimento ?? "",
    registro.hora_abastecimento ?? "",
    registro.odometro_importado ?? "",
    registro.quantidade_litros ?? "",
    registro.valor_total ?? "",
  ].join("|");
}