import * as XLSX from "xlsx";

import { supabase } from "./supabase.js";

const TABELA = "abastecimentos_importados";

/* ============================================================
   FUNÇÕES GERAIS DE NORMALIZAÇÃO
   ============================================================ */

export function normalizarPlaca(valor) {
  return String(valor || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function normalizarCpf(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function normalizarTexto(valor) {
  return String(valor || "").trim();
}

function normalizarCabecalho(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function obterValorLinha(linha, nomesPossiveis) {
  const entradas = Object.entries(linha || {});

  for (const nomePossivel of nomesPossiveis) {
    const nomeNormalizado = normalizarCabecalho(nomePossivel);

    const encontrado = entradas.find(([cabecalho]) => {
      return normalizarCabecalho(cabecalho) === nomeNormalizado;
    });

    if (encontrado) {
      return encontrado[1];
    }
  }

  return null;
}

function converterNumero(valor) {
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

  /*
    Exemplos aceitos:
    1.234,56
    1234,56
    1234.56
  */
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

function formatarDataIso(data) {
  if (!data) {
    return null;
  }

  if (data instanceof Date) {
    const ano = data.getFullYear();
    const mes = String(
      data.getMonth() + 1
    ).padStart(2, "0");
    const dia = String(
      data.getDate()
    ).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  if (typeof data === "number") {
    const resultado = XLSX.SSF.parse_date_code(data);

    if (!resultado) {
      return null;
    }

    const ano = resultado.y;
    const mes = String(resultado.m).padStart(2, "0");
    const dia = String(resultado.d).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  const texto = String(data).trim();

  if (!texto) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
    return texto.slice(0, 10);
  }

  const partes = texto.split(/[\/.-]/);

  if (partes.length === 3) {
    const [primeira, segunda, terceira] = partes;

    if (primeira.length === 4) {
      return `${primeira}-${segunda.padStart(
        2,
        "0"
      )}-${terceira.padStart(2, "0")}`;
    }

    return `${terceira.padStart(
      4,
      "0"
    )}-${segunda.padStart(
      2,
      "0"
    )}-${primeira.padStart(2, "0")}`;
  }

  return null;
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
      valor * 24 * 60 * 60
    );

    const horas = Math.floor(
      totalSegundos / 3600
    );

    const minutos = Math.floor(
      (totalSegundos % 3600) / 60
    );

    const segundos = totalSegundos % 60;

    return [
      String(horas).padStart(2, "0"),
      String(minutos).padStart(2, "0"),
      String(segundos).padStart(2, "0"),
    ].join(":");
  }

  const texto = String(valor).trim();

  const correspondencia = texto.match(
    /(\d{1,2}):(\d{2})(?::(\d{2}))?/
  );

  if (!correspondencia) {
    return null;
  }

  const horas = correspondencia[1].padStart(2, "0");
  const minutos = correspondencia[2];
  const segundos = correspondencia[3] || "00";

  return `${horas}:${minutos}:${segundos}`;
}

function criarChaveImportacao(registro) {
  return [
    registro.fonte || "",
    registro.codigo_origem || "",
    registro.placa_original || "",
    registro.data_abastecimento || "",
    registro.hora_abastecimento || "",
    registro.odometro_importado || "",
    registro.quantidade_litros || "",
    registro.valor_total || "",
  ].join("|");
}

/* ============================================================
   IDENTIFICAÇÃO DA FONTE
   ============================================================ */

export function identificarFontePlanilha(
  linhas,
  nomeArquivo = ""
) {
  const nomeNormalizado = normalizarCabecalho(
    nomeArquivo
  );

  // O nome do arquivo funciona como primeira referência.
  if (
    nomeNormalizado.includes("PRIME") ||
    nomeNormalizado.includes(
      "ABASTECIMENTOS15072026"
    )
  ) {
    return "PRIME";
  }

  if (
    nomeNormalizado.includes("POC") ||
    nomeNormalizado === "ABASTECIMENTOS11XLS"
  ) {
    return "POC";
  }

  const primeiraLinha = linhas?.[0] || {};

  const cabecalhos = Object.keys(
    primeiraLinha
  ).map(normalizarCabecalho);

  const possui = (...nomes) =>
    nomes.some((nome) =>
      cabecalhos.includes(
        normalizarCabecalho(nome)
      )
    );

  if (
    possui("CODIGO ABASTECIMENTO") &&
    possui("KM/HODOMETRO") &&
    possui("SUBUNIDADE") &&
    possui("PLACA")
  ) {
    return "PRIME";
  }

  if (
    possui("CPF") ||
    possui("CPF CONDUTOR") ||
    possui("CPF MOTORISTA")
  ) {
    return "POC";
  }

  return "DESCONHECIDA";
}
/* ============================================================
   CONVERSOR PRIME
   ============================================================ */

function converterLinhaPrime(
  linha,
  indice,
  arquivoOrigem
) {
  const codigoOrigem = normalizarTexto(
    obterValorLinha(linha, [
      "Código Abastecimento",
      "Codigo Abastecimento",
      "Código",
      "Codigo",
    ])
  );

  const dataAbastecimento = formatarDataIso(
    obterValorLinha(linha, [
      "Data Abastecimento",
      "Data",
    ])
  );

  const horaAbastecimento = formatarHora(
    obterValorLinha(linha, [
      "Hora Abastecimento",
      "Hora",
    ])
  );

  const placaOriginal = normalizarTexto(
    obterValorLinha(linha, [
      "Placa",
      "Placa Veículo",
      "Placa Veiculo",
    ])
  );

  const quantidadeLitros = converterNumero(
    obterValorLinha(linha, [
      "Quantidade de Combustível Abastecido",
      "Quantidade de Combustivel Abastecido",
      "Quantidade",
      "Litros",
    ])
  );

  const valorTotal = converterNumero(
    obterValorLinha(linha, [
      "Valor Abastecimento",
      "Valor Total",
      "Valor",
    ])
  );

  const valorUnitario = converterNumero(
    obterValorLinha(linha, [
      "Valor Unitário",
      "Valor Unitario",
      "Preço Unitário",
      "Preco Unitario",
    ])
  );

  const registro = {
    fonte: "PRIME",
    codigo_origem: codigoOrigem || null,
    arquivo_origem: arquivoOrigem,
    linha_arquivo: indice + 2,

    data_abastecimento: dataAbastecimento,
    hora_abastecimento: horaAbastecimento,

    placa_original: placaOriginal || null,

    nome_condutor:
      normalizarTexto(
        obterValorLinha(linha, [
          "Nome Condutor",
          "Condutor",
        ])
      ) || null,

    combustivel:
      normalizarTexto(
        obterValorLinha(linha, [
          "Combustível Abastecido",
          "Combustivel Abastecido",
          "Combustível",
          "Combustivel",
        ])
      ) || null,

    quantidade_litros: quantidadeLitros,
    valor_unitario: valorUnitario,
    valor_total: valorTotal,

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

    cnpj_posto:
      normalizarTexto(
        obterValorLinha(linha, [
          "CNPJ Posto",
          "CNPJ",
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
    chave_importacao: criarChaveImportacao(
      registro
    ),
  };
}

/* ============================================================
   CONVERSOR DA FONTE COM CPF
   ============================================================ */

function converterLinhaFonteCpf(
  linha,
  indice,
  arquivoOrigem
) {
  const codigoOrigem = normalizarTexto(
    obterValorLinha(linha, [
      "Código",
      "Codigo",
      "Código Abastecimento",
      "Codigo Abastecimento",
      "Número",
      "Numero",
    ])
  );

  const registro = {
    fonte: "FONTE_CPF",
    codigo_origem: codigoOrigem || null,
    arquivo_origem: arquivoOrigem,
    linha_arquivo: indice + 2,

    data_abastecimento: formatarDataIso(
      obterValorLinha(linha, [
        "Data",
        "Data Abastecimento",
      ])
    ),

    hora_abastecimento: formatarHora(
      obterValorLinha(linha, [
        "Hora",
        "Hora Abastecimento",
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

    cpf_condutor:
      normalizarCpf(
        obterValorLinha(linha, [
          "CPF",
          "CPF Condutor",
          "CPF Motorista",
        ])
      ) || null,

    nome_condutor:
      normalizarTexto(
        obterValorLinha(linha, [
          "Nome",
          "Condutor",
          "Motorista",
          "Nome Condutor",
        ])
      ) || null,

    combustivel:
      normalizarTexto(
        obterValorLinha(linha, [
          "Combustível",
          "Combustivel",
          "Tipo de Combustível",
          "Tipo de Combustivel",
        ])
      ) || null,

    quantidade_litros: converterNumero(
      obterValorLinha(linha, [
        "Litros",
        "Quantidade",
        "Quantidade Litros",
        "Qtd Litros",
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
        "Valor",
        "Valor Total",
        "Valor Abastecimento",
      ])
    ),

    odometro_importado: converterNumero(
      obterValorLinha(linha, [
        "Odômetro",
        "Odometro",
        "Hodômetro",
        "Hodometro",
        "KM",
        "Quilometragem",
      ])
    ),

    nome_posto:
      normalizarTexto(
        obterValorLinha(linha, [
          "Posto",
          "Nome Posto",
          "Estabelecimento",
        ])
      ) || null,

    cidade_posto:
      normalizarTexto(
        obterValorLinha(linha, [
          "Cidade Posto",
          "Cidade Abastecimento",
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
          "Tipo Venda",
          "Tipo de Venda",
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
  };

  return {
    ...registro,
    chave_importacao: criarChaveImportacao(
      registro
    ),
  };
}
function localizarLinhaCabecalho(planilha) {
  const matriz = XLSX.utils.sheet_to_json(
    planilha,
    {
      header: 1,
      defval: null,
      raw: true,
    }
  );

  const camposReconhecidos = [
    "PLACA",
    "DATA",
    "DATA ABASTECIMENTO",
    "CODIGO ABASTECIMENTO",
    "KM/HODOMETRO",
    "ODOMETRO",
    "CPF",
    "CPF CONDUTOR",
    "COMBUSTIVEL ABASTECIDO",
    "LITROS",
  ].map(normalizarCabecalho);

  for (
    let indice = 0;
    indice < Math.min(matriz.length, 30);
    indice += 1
  ) {
    const linha = matriz[indice] || [];

    const camposDaLinha = linha
      .filter(
        (valor) =>
          valor !== null &&
          valor !== undefined &&
          String(valor).trim() !== ""
      )
      .map(normalizarCabecalho);

    const quantidadeReconhecida =
      camposDaLinha.filter((campo) =>
        camposReconhecidos.includes(campo)
      ).length;

    const possuiPlaca =
      camposDaLinha.includes("PLACA");

    if (
      possuiPlaca &&
      quantidadeReconhecida >= 2
    ) {
      return indice;
    }
  }

  return -1;
}
/* ============================================================
   LEITURA DO ARQUIVO
   ============================================================ */

export async function lerArquivoAbastecimentos(
  arquivo
) {
  if (!arquivo) {
    throw new Error("Selecione um arquivo.");
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

  const workbook = XLSX.read(arrayBuffer, {
    type: "array",
    cellDates: true,
  });

  const nomePrimeiraAba =
    workbook.SheetNames?.[0];

  if (!nomePrimeiraAba) {
    throw new Error(
      "O arquivo não possui uma planilha válida."
    );
  }

  const planilha =
    workbook.Sheets[nomePrimeiraAba];

  const indiceCabecalho =
    localizarLinhaCabecalho(planilha);

  if (indiceCabecalho < 0) {
    throw new Error(
      "Não foi possível localizar os cabeçalhos da planilha."
    );
  }

  /*
    range é baseado em zero:
    0 = primeira linha
    4 = quinta linha

    No PRIME, por exemplo, o cabeçalho está na linha 5,
    portanto indiceCabecalho será 4.
  */
  const linhas = XLSX.utils.sheet_to_json(
    planilha,
    {
      defval: null,
      raw: true,
      range: indiceCabecalho,
    }
  );

  if (!linhas.length) {
    throw new Error(
      "O arquivo não possui registros para importação."
    );
  }

  const fonte = identificarFontePlanilha(
    linhas,
    nomeArquivo
  );

  if (fonte === "DESCONHECIDA") {
    throw new Error(
      "Não foi possível identificar se o arquivo é PRIME ou POC."
    );
  }

  const registros = linhas
    .map((linha, indice) => {
      /*
        A linha real do arquivo considera as linhas anteriores
        ao cabeçalho e a própria linha do cabeçalho.
      */
      const linhaArquivo =
        indiceCabecalho + indice + 2;

      if (fonte === "PRIME") {
        return converterLinhaPrime(
          linha,
          linhaArquivo - 2,
          nomeArquivo
        );
      }

      return converterLinhaFonteCpf(
        linha,
        linhaArquivo - 2,
        nomeArquivo
      );
    })
    .filter((registro) => {
      return Boolean(
        registro.placa_original ||
          registro.codigo_origem ||
          registro.data_abastecimento
      );
    });

  if (!registros.length) {
    throw new Error(
      `O arquivo ${fonte} foi reconhecido, mas nenhuma linha válida foi encontrada.`
    );
  }

  return {
    arquivo: nomeArquivo,
    aba: nomePrimeiraAba,
    fonte,
    linhaCabecalho: indiceCabecalho + 1,
    totalLinhas: linhas.length,
    registros,
  };
}
/*======================importar abastecimentos*/

export async function cruzarRegistrosComViaturas(
  registros
) {
  if (!Array.isArray(registros)) {
    return {
      registrosValidos: [],
      registrosNaoLocalizados: [],
    };
  }

  const { data: viaturas, error } = await supabase
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

  const mapaViaturas = new Map();

  for (const viatura of viaturas ?? []) {
    const placaNormalizada =
      viatura.placa_normalizada ||
      normalizarPlaca(viatura.placa);

    if (placaNormalizada) {
      mapaViaturas.set(
        placaNormalizada,
        viatura
      );
    }
  }

  const registrosValidos = [];
  const registrosNaoLocalizados = [];

  for (const registro of registros) {
    const placaNormalizada = normalizarPlaca(
      registro.placa_original
    );

    const viatura = mapaViaturas.get(
      placaNormalizada
    );

    if (!viatura) {
      registrosNaoLocalizados.push({
        ...registro,
        placa_normalizada: placaNormalizada,
        situacao_previa:
          "VIATURA_NAO_LOCALIZADA",
      });

      continue;
    }

    const odometroImportado = Number(
      registro.odometro_importado
    );

    const odometroAtual = Number(
      viatura.odometro || 0
    );

    const diferenca =
      Number.isFinite(odometroImportado)
        ? odometroImportado - odometroAtual
        : null;

    let situacaoPrevia = "COERENTE";

    if (!Number.isFinite(odometroImportado)) {
      situacaoPrevia = "NAO_INFORMADO";
    } else if (diferenca < 0) {
      situacaoPrevia = "MENOR_QUE_ATUAL";
    } else if (diferenca > 5000) {
      situacaoPrevia = "AUMENTO_ELEVADO";
    }

    registrosValidos.push({
      ...registro,

      placa_normalizada: placaNormalizada,

      viatura_id: viatura.id,
      prefixo_viatura: viatura.prefixo,
      placa_cadastrada: viatura.placa,
      cidade_viatura: viatura.cidade,
      marca_viatura: viatura.marca,
      modelo_viatura: viatura.modelo,

      odometro_atual_viatura: odometroAtual,
      diferenca_odometro: diferenca,

      situacao_previa: situacaoPrevia,
    });
  }

  return {
    registrosValidos,
    registrosNaoLocalizados,
  };
}

/*============================================================
   GRAVAÇÃO NO SUPABASE
   ============================================================ */

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

    const { data, error } = await supabase
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

    resultados.push(...(data ?? []));
  }

  return resultados;
}

/* ============================================================
   CONSULTAS
   ============================================================ */

export async function listarAbastecimentosImportados() {
  const { data, error } = await supabase
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

  const { error } = await supabase
    .from(TABELA)
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(
      `Não foi possível excluir o registro: ${error.message}`
    );
  }
}