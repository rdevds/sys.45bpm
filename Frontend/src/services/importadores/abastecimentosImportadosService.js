import * as XLSX from "xlsx";

import { supabase } from "../supabase.js";

import {
  localizarEstruturaPlanilha,
} from "./identificarArquivo.js";

import {
  converterLinhasPrime,
} from "./importarPrime.js";

import {
  converterLinhasPoc,
} from "./importarPoc.js";

import {
  cruzarComViaturas,
} from "./compararOdometro.js";

const TABELA =
  "abastecimentos_importados";

export async function lerArquivoAbastecimentos(
  arquivo
) {
  if (!arquivo) {
    throw new Error(
      "Selecione um arquivo."
    );
  }

  const nomeArquivo =
    arquivo.name || "arquivo";

  const extensao = nomeArquivo
    .split(".")
    .pop()
    ?.toLowerCase();

  if (!["xls", "xlsx"].includes(extensao)) {
    throw new Error(
      "Selecione um arquivo Excel nos formatos XLS ou XLSX."
    );
  }

  const arrayBuffer =
    await arquivo.arrayBuffer();

  const workbook = XLSX.read(
    arrayBuffer,
    {
      type: "array",
      cellDates: true,
    }
  );

  const nomeAba =
    workbook.SheetNames?.[0];

  if (!nomeAba) {
    throw new Error(
      "O arquivo não possui uma planilha válida."
    );
  }

  const planilha =
    workbook.Sheets[nomeAba];

  const estrutura =
    localizarEstruturaPlanilha(
      planilha
    );

  if (
    estrutura.fonte ===
      "DESCONHECIDA" ||
    estrutura.indiceCabecalho < 0
  ) {
    throw new Error(
      "Não foi possível localizar os cabeçalhos da planilha."
    );
  }

  const linhas =
    XLSX.utils.sheet_to_json(
      planilha,
      {
        defval: null,
        raw: true,
        range:
          estrutura.indiceCabecalho,
      }
    );

  let registros = [];

  if (estrutura.fonte === "PRIME") {
    registros = converterLinhasPrime(
      linhas,
      nomeArquivo,
      estrutura.indiceCabecalho
    );
  }

  if (estrutura.fonte === "POC") {
    registros = converterLinhasPoc(
      linhas,
      nomeArquivo,
      estrutura.indiceCabecalho
    );
  }

  if (!registros.length) {
    throw new Error(
      `O arquivo ${estrutura.fonte} foi reconhecido, mas não possui linhas válidas.`
    );
  }

  return {
    arquivo: nomeArquivo,
    aba: nomeAba,
    fonte: estrutura.fonte,
    linhaCabecalho:
      estrutura.indiceCabecalho + 1,
    totalLinhas: linhas.length,
    registros,
  };
}

export async function cruzarRegistrosComViaturas(
  registros
) {
  const { data: viaturas, error } =
    await supabase
      .from("viaturas")
      .select(`
        id,
        prefixo,
        placa,
        placa_normalizada,
        cidade,
        marca,
        modelo,
        odometro
      `);

  if (error) {
    throw new Error(
      `Não foi possível consultar as viaturas: ${error.message}`
    );
  }

  return cruzarComViaturas(
    registros,
    viaturas ?? []
  );
}

export async function importarAbastecimentos(
  registros
) {
  if (
    !Array.isArray(registros) ||
    registros.length === 0
  ) {
    throw new Error(
      "Não existem registros para importar."
    );
  }

  const tamanhoLote = 200;
  const resultados = [];

  for (
    let inicio = 0;
    inicio < registros.length;
    inicio += tamanhoLote
  ) {
    const lote = registros.slice(
      inicio,
      inicio + tamanhoLote
    );

    const { data, error } =
      await supabase
        .from(TABELA)
        .insert(lote)
        .select();

    if (error) {
      if (error.code === "23505") {
        throw new Error(
          "O arquivo possui registros que já foram importados."
        );
      }

      throw new Error(
        `Não foi possível importar os abastecimentos: ${error.message}`
      );
    }

    resultados.push(
      ...(data ?? [])
    );
  }

  return resultados;
}

export async function listarAbastecimentosImportados() {
  const { data, error } =
    await supabase
      .from(TABELA)
      .select("*")
      .order("data_hora", {
        ascending: false,
        nullsFirst: false,
      });

  if (error) {
    throw new Error(
      `Não foi possível listar os registros importados: ${error.message}`
    );
  }

  return data ?? [];
}

export async function excluirAbastecimentoImportado(
  id
) {
  if (!id) {
    throw new Error(
      "Registro importado não identificado."
    );
  }

  const { error } =
    await supabase
      .from(TABELA)
      .delete()
      .eq("id", id);

  if (error) {
    throw new Error(
      `Não foi possível excluir o registro: ${error.message}`
    );
  }
}