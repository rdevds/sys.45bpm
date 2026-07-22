import * as XLSX from "xlsx";

import {
  converterNumero,
  criarChaveImportacao,
  normalizarCombustivel,
  normalizarCpf,
  normalizarTexto,
  obterValorLinha,
} from "./normalizarRegistro.js";

function separarDataHora(valor) {
  if (!valor) {
    return {
      data: null,
      hora: null,
    };
  }

  if (valor instanceof Date) {
    const ano = valor.getFullYear();
    const mes = String(
      valor.getMonth() + 1
    ).padStart(2, "0");
    const dia = String(
      valor.getDate()
    ).padStart(2, "0");

    const hora = String(
      valor.getHours()
    ).padStart(2, "0");

    const minuto = String(
      valor.getMinutes()
    ).padStart(2, "0");

    const segundo = String(
      valor.getSeconds()
    ).padStart(2, "0");

    return {
      data: `${ano}-${mes}-${dia}`,
      hora: `${hora}:${minuto}:${segundo}`,
    };
  }

  if (typeof valor === "number") {
    const dataExcel =
      XLSX.SSF.parse_date_code(valor);

    if (!dataExcel) {
      return {
        data: null,
        hora: null,
      };
    }

    return {
      data: `${dataExcel.y}-${String(
        dataExcel.m
      ).padStart(2, "0")}-${String(
        dataExcel.d
      ).padStart(2, "0")}`,

      hora: `${String(
        dataExcel.H ?? 0
      ).padStart(2, "0")}:${String(
        dataExcel.M ?? 0
      ).padStart(2, "0")}:${String(
        dataExcel.S ?? 0
      ).padStart(2, "0")}`,
    };
  }

  const texto = String(valor).trim();

  const encontrado = texto.match(
    /(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/
  );

  if (!encontrado) {
    return {
      data: null,
      hora: null,
    };
  }

  return {
    data: `${encontrado[3]}-${encontrado[2].padStart(
      2,
      "0"
    )}-${encontrado[1].padStart(2, "0")}`,

    hora: encontrado[4]
      ? `${encontrado[4].padStart(
          2,
          "0"
        )}:${encontrado[5]}:${
          encontrado[6] ?? "00"
        }`
      : null,
  };
}

export function converterLinhasPoc(
  linhas,
  arquivoOrigem,
  indiceCabecalho
) {
  return linhas
    .map((linha, indice) => {
      const dataInicial = separarDataHora(
        obterValorLinha(linha, [
          "Data Inicial",
          "Data",
        ])
      );

      const registro = {
        fonte: "POC",
        codigo_origem: null,
        arquivo_origem: arquivoOrigem,
        linha_arquivo:
          indiceCabecalho + indice + 2,

        data_abastecimento:
          dataInicial.data,

        hora_abastecimento:
          dataInicial.hora,

        placa_original:
          normalizarTexto(
            obterValorLinha(linha, [
              "Veículo",
              "Veiculo",
              "Placa",
            ])
          ) || null,

        cpf_condutor:
          normalizarCpf(
            obterValorLinha(linha, [
              "Condutor",
              "CPF",
              "CPF Condutor",
            ])
          ) || null,

        nome_condutor: null,

        combustivel: normalizarCombustivel(
          obterValorLinha(linha, [
            "Produto",
            "Combustível",
            "Combustivel",
          ])
        ),

        quantidade_litros: converterNumero(
          obterValorLinha(linha, [
            "Volume",
            "Litros",
            "Quantidade",
          ])
        ),

        valor_unitario: null,
        valor_total: null,

        odometro_importado: converterNumero(
          obterValorLinha(linha, [
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
              "Posto",
            ])
          ) || null,

        cidade_posto: null,
        estado_posto: null,

        tipo_venda:
          normalizarTexto(
            obterValorLinha(linha, [
              "Bico",
            ])
          ) || null,

        status_origem:
          normalizarTexto(
            obterValorLinha(linha, [
              "Status",
            ])
          ) || null,

        unidade_origem:
          normalizarTexto(
            obterValorLinha(linha, [
              "Órgão/Entidade",
              "Orgao/Entidade",
              "Órgão Entidade",
              "Orgao Entidade",
            ])
          ) || null,

        subunidade_origem:
          normalizarTexto(
            obterValorLinha(linha, [
              "Unidade",
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
        registro.data_abastecimento
    );
}