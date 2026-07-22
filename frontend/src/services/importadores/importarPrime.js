import * as XLSX from "xlsx";

import {
  converterNumero,
  criarChaveImportacao,
  normalizarCombustivel,
  normalizarTexto,
  obterValorLinha,
} from "./normalizarRegistro.js";

function formatarDataIso(valor) {
  if (!valor) {
    return null;
  }

  if (valor instanceof Date) {
    const ano = valor.getFullYear();
    const mes = String(
      valor.getMonth() + 1
    ).padStart(2, "0");
    const dia = String(
      valor.getDate()
    ).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  if (typeof valor === "number") {
    const dataExcel =
      XLSX.SSF.parse_date_code(valor);

    if (!dataExcel) {
      return null;
    }

    return `${dataExcel.y}-${String(
      dataExcel.m
    ).padStart(2, "0")}-${String(
      dataExcel.d
    ).padStart(2, "0")}`;
  }

  const texto = String(valor).trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
    return texto.slice(0, 10);
  }

  const partes = texto.split(/[\/.-]/);

  if (partes.length !== 3) {
    return null;
  }

  return `${partes[2].padStart(
    4,
    "0"
  )}-${partes[1].padStart(
    2,
    "0"
  )}-${partes[0].padStart(2, "0")}`;
}

function formatarHora(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  if (typeof valor === "number") {
    const totalSegundos = Math.round(
      valor * 86400
    );

    const horas = Math.floor(
      totalSegundos / 3600
    );

    const minutos = Math.floor(
      (totalSegundos % 3600) / 60
    );

    const segundos = totalSegundos % 60;

    return `${String(horas).padStart(
      2,
      "0"
    )}:${String(minutos).padStart(
      2,
      "0"
    )}:${String(segundos).padStart(
      2,
      "0"
    )}`;
  }

  const encontrado = String(valor).match(
    /(\d{1,2}):(\d{2})(?::(\d{2}))?/
  );

  if (!encontrado) {
    return null;
  }

  return `${encontrado[1].padStart(
    2,
    "0"
  )}:${encontrado[2]}:${
    encontrado[3] ?? "00"
  }`;
}

export function converterLinhasPrime(
  linhas,
  arquivoOrigem,
  indiceCabecalho
) {
  return linhas
    .map((linha, indice) => {
      const registro = {
        fonte: "PRIME",

        codigo_origem:
          normalizarTexto(
            obterValorLinha(linha, [
              "Código Abastecimento",
              "Codigo Abastecimento",
              "Código",
              "Codigo",
            ])
          ) || null,

        arquivo_origem: arquivoOrigem,
        linha_arquivo:
          indiceCabecalho + indice + 2,

        data_abastecimento: formatarDataIso(
          obterValorLinha(linha, [
            "Data Abastecimento",
            "Data",
          ])
        ),

        hora_abastecimento: formatarHora(
          obterValorLinha(linha, [
            "Hora Abastecimento",
            "Hora",
          ])
        ),

        placa_original:
          normalizarTexto(
            obterValorLinha(linha, [
              "Placa",
              "Placa Veículo",
              "Placa Veiculo",
            ])
          ) || null,

        nome_condutor:
          normalizarTexto(
            obterValorLinha(linha, [
              "Nome Condutor",
              "Condutor",
            ])
          ) || null,

        combustivel: normalizarCombustivel(
          obterValorLinha(linha, [
            "Combustível Abastecido",
            "Combustivel Abastecido",
            "Combustível",
            "Combustivel",
          ])
        ),

        quantidade_litros: converterNumero(
          obterValorLinha(linha, [
            "Quantidade de Combustível Abastecido",
            "Quantidade de Combustivel Abastecido",
            "Quantidade",
            "Litros",
          ])
        ),

        valor_unitario: converterNumero(
          obterValorLinha(linha, [
            "Valor Unitário",
            "Valor Unitario",
            "Preço Unitário",
            "Preco Unitario",
          ])
        ),

        valor_total: converterNumero(
          obterValorLinha(linha, [
            "Valor Abastecimento",
            "Valor Total",
            "Valor",
          ])
        ),

        odometro_importado: converterNumero(
          obterValorLinha(linha, [
            "KM/Hodômetro",
            "KM/Hodometro",
            "Hodômetro",
            "Hodometro",
            "Odômetro",
            "Odometro",
            "KM",
          ])
        ),

        nome_posto:
          normalizarTexto(
            obterValorLinha(linha, [
              "Nome Posto",
              "Posto",
              "Estabelecimento",
            ])
          ) || null,

        cidade_posto:
          normalizarTexto(
            obterValorLinha(linha, [
              "Cidade Posto",
              "Cidade",
            ])
          ) || null,

        estado_posto:
          normalizarTexto(
            obterValorLinha(linha, [
              "UF",
              "Estado",
            ])
          ) || null,

        tipo_venda:
          normalizarTexto(
            obterValorLinha(linha, [
              "Tipo de Venda",
              "Tipo Venda",
            ])
          ) || null,

        status_origem:
          normalizarTexto(
            obterValorLinha(linha, [
              "Status",
              "Situação",
              "Situacao",
            ])
          ) || null,

        unidade_origem:
          normalizarTexto(
            obterValorLinha(linha, [
              "Unidade",
            ])
          ) || null,

        subunidade_origem:
          normalizarTexto(
            obterValorLinha(linha, [
              "SubUnidade",
              "Sub Unidade",
            ])
          ) || null,
      };

      return {
        ...registro,
        chave_importacao:
          criarChaveImportacao(registro),
      };
    })
    .filter(
      (registro) =>
        registro.placa_original ||
        registro.codigo_origem ||
        registro.data_abastecimento
    );
}