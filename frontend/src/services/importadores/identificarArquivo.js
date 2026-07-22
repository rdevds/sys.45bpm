import * as XLSX from "xlsx";

import {
  normalizarCabecalho,
} from "./normalizarRegistro.js";

const CABECALHOS_PRIME = [
  "CODIGO ABASTECIMENTO",
  "DATA ABASTECIMENTO",
  "HORA ABASTECIMENTO",
  "KM/HODOMETRO",
  "COMBUSTIVEL ABASTECIDO",
  "PLACA",
  "SUBUNIDADE",
];

const CABECALHOS_POC = [
  "DATA INICIAL",
  "DATA FINAL",
  "POSTO",
  "UNIDADE",
  "VEICULO",
  "HODOMETRO",
  "PRODUTO",
  "VOLUME",
  "CONDUTOR",
];

function contarCabecalhosReconhecidos(
  linha,
  cabecalhosEsperados
) {
  const campos = (linha ?? [])
    .filter(
      (valor) =>
        valor !== null &&
        valor !== undefined &&
        String(valor).trim() !== ""
    )
    .map(normalizarCabecalho);

  return cabecalhosEsperados.filter(
    (cabecalho) =>
      campos.includes(
        normalizarCabecalho(cabecalho)
      )
  ).length;
}

export function localizarEstruturaPlanilha(
  planilha
) {
  const matriz = XLSX.utils.sheet_to_json(
    planilha,
    {
      header: 1,
      defval: null,
      raw: true,
    }
  );

  const limite = Math.min(matriz.length, 40);

  for (let indice = 0; indice < limite; indice += 1) {
    const linha = matriz[indice] ?? [];

    const pontosPrime =
      contarCabecalhosReconhecidos(
        linha,
        CABECALHOS_PRIME
      );

    const pontosPoc =
      contarCabecalhosReconhecidos(
        linha,
        CABECALHOS_POC
      );

    if (pontosPrime >= 4) {
      return {
        fonte: "PRIME",
        indiceCabecalho: indice,
      };
    }

    if (pontosPoc >= 4) {
      return {
        fonte: "POC",
        indiceCabecalho: indice,
      };
    }
  }

  return {
    fonte: "DESCONHECIDA",
    indiceCabecalho: -1,
  };
}