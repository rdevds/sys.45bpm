import { supabase } from "./supabase.js";

const TABELA = "viaturas";
const VIEW_COMPLETA = "vw_viaturas_completas_v2";

/* =========================================================
   FUNÇÕES PÚBLICAS
========================================================= */

/**
 * Lista todas as viaturas com os dados da lotação
 * e do modelo já combinados pela view.
 */
export async function buscarViaturas() {
  const { data, error } = await supabase
    .from(VIEW_COMPLETA)
    .select("*")
    .order("pasta_numero", {
      ascending: true,
    });

  if (error) {
    throw new Error(
      `Não foi possível listar as viaturas: ${error.message}`
    );
  }

  return data ?? [];
}

/**
 * Busca uma viatura usando:
 * - número da Pasta;
 * - prefixo de 5 dígitos;
 * - placa.
 */
export async function buscarViaturaPorPrefixoOuPlaca(
  valor
) {
  const termo = texto(valor).toUpperCase();

  if (!termo) {
    return null;
  }

  const somenteDigitos =
    somenteNumeros(termo);

  /*
   * Pasta:
   * aceita textos como:
   * 12
   * PASTA 12
   */
  if (
    termo.includes("PASTA") &&
    somenteDigitos
  ) {
    return buscarViaturaPorPasta(
      Number(somenteDigitos)
    );
  }

  /*
   * Prefixo:
   * exatamente 5 dígitos.
   */
  if (/^\d{5}$/.test(somenteDigitos)) {
    return buscarViaturaPorPrefixo(
      somenteDigitos
    );
  }

  /*
   * Número simples diferente de 5 dígitos:
   * é tratado como número da Pasta.
   */
  if (
    /^\d+$/.test(termo) &&
    somenteDigitos.length !== 5
  ) {
    return buscarViaturaPorPasta(
      Number(somenteDigitos)
    );
  }

  return buscarViaturaPorPlaca(termo);
}

/**
 * Busca uma viatura pelo ID interno.
 */
export async function buscarViaturaPorId(id) {
  const idTratado = Number(id);

  if (
    !Number.isInteger(idTratado) ||
    idTratado <= 0
  ) {
    throw new Error(
      "Viatura não identificada."
    );
  }

  const { data, error } = await supabase
    .from(VIEW_COMPLETA)
    .select("*")
    .eq("id", idTratado)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Não foi possível buscar a viatura: ${error.message}`
    );
  }

  return data;
}

/**
 * Busca uma viatura pelo número permanente da Pasta.
 */
export async function buscarViaturaPorPasta(
  pastaNumero
) {
  const pasta = Number(pastaNumero);

  if (
    !Number.isInteger(pasta) ||
    pasta <= 0
  ) {
    throw new Error(
      "Número da Pasta inválido."
    );
  }

  const { data, error } = await supabase
    .from(VIEW_COMPLETA)
    .select("*")
    .eq("pasta_numero", pasta)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Não foi possível buscar a Pasta da viatura: ${error.message}`
    );
  }

  return data;
}

/**
 * Busca uma viatura pelo prefixo.
 */
export async function buscarViaturaPorPrefixo(
  prefixo
) {
  const prefixoTratado =
    somenteNumeros(prefixo).slice(0, 5);

  if (
    !/^\d{5}$/.test(prefixoTratado)
  ) {
    throw new Error(
      "Prefixo inválido."
    );
  }

  const { data, error } = await supabase
    .from(VIEW_COMPLETA)
    .select("*")
    .eq("prefixo", prefixoTratado)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Não foi possível buscar a viatura: ${error.message}`
    );
  }

  return data;
}

/**
 * Busca uma viatura pela placa.
 */
export async function buscarViaturaPorPlaca(
  placa
) {
  const placaTratada =
    formatarPlacaBanco(placa);

  if (placaTratada.length !== 8) {
    throw new Error(
      "Placa inválida."
    );
  }

  const { data, error } = await supabase
    .from(VIEW_COMPLETA)
    .select("*")
    .eq("placa", placaTratada)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Não foi possível buscar a viatura pela placa: ${error.message}`
    );
  }

  return data;
}

/**
 * Cadastra uma viatura.
 *
 * O frontend envia apenas os dados exclusivos.
 * O frontend envia os dados exclusivos e o vínculo com a
 * estrutura organizacional. A trigger do banco pode preencher
 * marca, modelo, ano e dados técnicos a partir do modelo.
 */
export async function salvarViatura(
  viatura
) {
  const registro =
    prepararDadosViatura(viatura, {
      modoEdicao: false,
    });

  const { data, error } = await supabase
    .from(TABELA)
    .insert(registro)
    .select(
      `
        id,
        pasta_numero
      `
    )
    .single();

  if (error) {
    throw new Error(
      traduzirErroViatura(error)
    );
  }

  /*
   * Após o insert, buscamos a view completa.
   * Dessa forma o frontend já recebe estrutura, lotação,
   * modelo e dados técnicos preenchidos.
   */
  const viaturaCompleta =
    await buscarViaturaPorId(data.id);

  return viaturaCompleta ?? data;
}

/**
 * Atualiza os dados cadastrais da viatura.
 *
 * A Pasta nunca é enviada nem alterada.
 */
export async function atualizarViatura(
  id,
  viatura
) {
  const idTratado = Number(id);

  if (
    !Number.isInteger(idTratado) ||
    idTratado <= 0
  ) {
    throw new Error(
      "Viatura não identificada."
    );
  }

  const registro =
    prepararDadosViatura(viatura, {
      modoEdicao: true,
    });

  const { data, error } = await supabase
    .from(TABELA)
    .update(registro)
    .eq("id", idTratado)
    .select("id")
    .single();

  if (error) {
    throw new Error(
      traduzirErroViatura(error)
    );
  }

  const viaturaCompleta =
    await buscarViaturaPorId(data.id);

  return viaturaCompleta ?? data;
}

/**
 * Atualiza somente a situação.
 */
export async function atualizarStatusViatura(
  id,
  situacao
) {
  const idTratado = Number(id);
  const situacaoTratada =
    texto(situacao).toUpperCase();

  if (
    !Number.isInteger(idTratado) ||
    idTratado <= 0
  ) {
    throw new Error(
      "Viatura não identificada."
    );
  }

  if (
    ![
      "DISPONÍVEL",
      "DESCARREGADA",
    ].includes(situacaoTratada)
  ) {
    throw new Error(
      "Situação inválida. Use DISPONÍVEL ou DESCARREGADA."
    );
  }

  const { data, error } = await supabase
    .from(TABELA)
    .update({
      situacao: situacaoTratada,
    })
    .eq("id", idTratado)
    .select("id")
    .single();

  if (error) {
    throw new Error(
      `Não foi possível atualizar a situação da viatura: ${error.message}`
    );
  }

  return buscarViaturaPorId(data.id);
}

/**
 * Atualiza somente o odômetro atual.
 */
export async function atualizarOdometroViatura(
  id,
  novoOdometro
) {
  const idTratado = Number(id);
  const odometro = Number(
    novoOdometro
  );

  if (
    !Number.isInteger(idTratado) ||
    idTratado <= 0
  ) {
    throw new Error(
      "Viatura não identificada."
    );
  }

  if (
    !Number.isFinite(odometro) ||
    odometro < 0
  ) {
    throw new Error(
      "Odômetro inválido."
    );
  }

  const { data, error } = await supabase
    .from(TABELA)
    .update({
      odometro,
    })
    .eq("id", idTratado)
    .select("id")
    .single();

  if (error) {
    throw new Error(
      `Não foi possível atualizar o odômetro: ${error.message}`
    );
  }

  return buscarViaturaPorId(data.id);
}

/**
 * Compatibilidade com telas antigas.
 *
 * As lotações agora são obtidas da estrutura organizacional.
 * Novos componentes devem usar estrutura_id.
 */
export async function buscarLotacoesViaturas() {
  const { data, error } = await supabase
    .from("estrutura_organizacional")
    .select(
      `
        id,
        parent_id,
        chave,
        codigo,
        sigla,
        nome,
        cidade,
        ordem_exibicao,
        ativa,
        aceita_viatura
      `
    )
    .eq("ativa", true)
    .eq("aceita_viatura", true)
    .order("ordem_exibicao", {
      ascending: true,
    })
    .order("nome", {
      ascending: true,
    });

  if (error) {
    throw new Error(
      `Não foi possível listar as lotações: ${error.message}`
    );
  }

  return data ?? [];
}

/**
 * Lista os modelos ativos disponíveis para o cadastro.
 */
export async function buscarModelosViaturas() {
  const { data, error } = await supabase
    .from("modelos_viaturas")
    .select(
      `
        id,
        marca,
        modelo,
        ano,
        combustivel,
        tipo,
        pneus,
        capacidade_carter,
        especificacao_oleo,
        capacidade_tanque,
        frequencia_troca_oleo,
        observacao,
        ativo
      `
    )
    .eq("ativo", true)
    .order("marca", {
      ascending: true,
    })
    .order("modelo", {
      ascending: true,
    })
    .order("ano", {
      ascending: false,
    });

  if (error) {
    throw new Error(
      `Não foi possível listar os modelos: ${error.message}`
    );
  }

  return data ?? [];
}

/* =========================================================
   PREPARAÇÃO DOS DADOS
========================================================= */

function prepararDadosViatura(
  viatura,
  {
    modoEdicao = false,
  } = {}
) {
  const modeloViaturaId = Number(
    viatura?.modelo_viatura_id ??
      viatura?.modeloViaturaId
  );

  const estruturaId = Number(
    viatura?.estrutura_id ??
      viatura?.estruturaId
  );

  const lotacao = texto(
    viatura?.lotacao
  ).toUpperCase();

  const cidade = texto(
    viatura?.cidade
  ).toUpperCase();

  const unidadeFrota = somenteNumeros(
    viatura?.unidade_frota ??
      viatura?.unidadeFrota
  ).slice(0, 7);

  const prefixo = somenteNumeros(
    viatura?.prefixo
  ).slice(0, 5);

  const placa = formatarPlacaBanco(
    viatura?.placa
  );

  const patrimonio = texto(
    viatura?.patrimonio
  ).toUpperCase();

  const radio = texto(
    viatura?.radio
  ).toUpperCase();

  const chassi = texto(
    viatura?.chassi
  )
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 17);

  const renavam = somenteNumeros(
    viatura?.renavam
  ).slice(0, 11);

  const origem = texto(
    viatura?.origem
  ).toUpperCase();

  const odometro = Number(
    viatura?.odometro
  );

  const valorVenal = Number(
    viatura?.valor_venal ??
      viatura?.valorVenal
  );

  const valorVenalAno = Number(
    viatura?.valor_venal_ano ??
      viatura?.valorVenalAno
  );

  const dataChegada = texto(
    viatura?.data_chegada ??
      viatura?.dataChegada
  );

  const situacao = texto(
    viatura?.situacao ||
      "DISPONÍVEL"
  ).toUpperCase();

  validarDadosViatura({
    modeloViaturaId,
    estruturaId,
    lotacao,
    cidade,
    unidadeFrota,
    prefixo,
    placa,
    patrimonio,
    radio,
    chassi,
    renavam,
    origem,
    odometro,
    valorVenal,
    valorVenalAno,
    dataChegada,
    situacao,
  });

  const registro = {
    modelo_viatura_id:
      modeloViaturaId,

    estrutura_id:
      estruturaId,

    lotacao,

    cidade,

    unidade_frota:
      unidadeFrota,

    prefixo,

    placa,

    patrimonio,

    radio,

    chassi,

    renavam,

    origem,

    odometro,

    valor_venal:
      valorVenal,

    valor_venal_ano:
      valorVenalAno,

    data_chegada:
      dataChegada,

    situacao,
  };

  if (modoEdicao) {
    delete registro.pasta_numero;
  }

  return registro;
}

function validarDadosViatura({
  modeloViaturaId,
  estruturaId,
  lotacao,
  cidade,
  unidadeFrota,
  prefixo,
  placa,
  patrimonio,
  radio,
  chassi,
  renavam,
  origem,
  odometro,
  valorVenal,
  valorVenalAno,
  dataChegada,
  situacao,
}) {
  if (
    !Number.isInteger(
      modeloViaturaId
    ) ||
    modeloViaturaId <= 0
  ) {
    throw new Error(
      "SELECIONE O MODELO DA VIATURA."
    );
  }

  if (
    !Number.isInteger(estruturaId) ||
    estruturaId <= 0
  ) {
    throw new Error(
      "SELECIONE A LOTAÇÃO DA VIATURA."
    );
  }

  if (!lotacao) {
    throw new Error(
      "A LOTAÇÃO DA VIATURA NÃO FOI INFORMADA."
    );
  }

  if (!cidade) {
    throw new Error(
      "A CIDADE DA LOTAÇÃO NÃO FOI INFORMADA."
    );
  }

  if (!/^\d{7}$/.test(unidadeFrota)) {
    throw new Error(
      "A UNIDADE FROTA DEVE POSSUIR EXATAMENTE 7 DÍGITOS."
    );
  }

  if (!/^\d{5}$/.test(prefixo)) {
    throw new Error(
      "O PREFIXO DEVE POSSUIR EXATAMENTE 5 DÍGITOS."
    );
  }

  if (placa.length !== 8) {
    throw new Error(
      "INFORME UMA PLACA VÁLIDA."
    );
  }

  if (!patrimonio) {
    throw new Error(
      "INFORME O PATRIMÔNIO."
    );
  }

  if (!radio) {
    throw new Error(
      "INFORME O RÁDIO."
    );
  }

  if (chassi.length !== 17) {
    throw new Error(
      "O CHASSI DEVE POSSUIR 17 CARACTERES."
    );
  }

  if (
    renavam.length < 9 ||
    renavam.length > 11
  ) {
    throw new Error(
      "INFORME UM RENAVAM VÁLIDO."
    );
  }

  if (
    ![
      "ORGÂNICA",
      "LOCADA",
    ].includes(origem)
  ) {
    throw new Error(
      "SELECIONE A ORIGEM DA VIATURA."
    );
  }

  if (
    !Number.isFinite(odometro) ||
    odometro < 0
  ) {
    throw new Error(
      "INFORME UM ODÔMETRO VÁLIDO."
    );
  }

  if (
    !Number.isFinite(valorVenal) ||
    valorVenal <= 0
  ) {
    throw new Error(
      "INFORME O VALOR VENAL."
    );
  }

  if (
    !Number.isInteger(
      valorVenalAno
    ) ||
    valorVenalAno < 2000 ||
    valorVenalAno > 2100
  ) {
    throw new Error(
      "INFORME O ANO DE REFERÊNCIA DO VALOR VENAL."
    );
  }

  if (!dataChegada) {
    throw new Error(
      "INFORME A DATA DE CHEGADA."
    );
  }

  if (
    ![
      "DISPONÍVEL",
      "DESCARREGADA",
    ].includes(situacao)
  ) {
    throw new Error(
      "SITUAÇÃO INVÁLIDA."
    );
  }
}

/* =========================================================
   FORMATAÇÃO E TRATAMENTO DE ERROS
========================================================= */

function texto(valor) {
  return String(valor ?? "").trim();
}

function somenteNumeros(valor) {
  return texto(valor).replace(
    /\D/g,
    ""
  );
}

function formatarPlacaBanco(placa) {
  const valor = texto(placa)
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 7);

  if (valor.length !== 7) {
    return valor;
  }

  return `${valor.slice(
    0,
    3
  )}-${valor.slice(3)}`;
}

function traduzirErroViatura(error) {
  const mensagem = texto(
    error?.message
  ).toLowerCase();

  const detalhes = texto(
    error?.details
  ).toLowerCase();

  const conteudo =
    `${mensagem} ${detalhes}`;

  if (
    conteudo.includes("prefixo") ||
    conteudo.includes(
      "viaturas_prefixo"
    )
  ) {
    return "JÁ EXISTE UMA VIATURA CADASTRADA COM ESSE PREFIXO.";
  }

  if (
    conteudo.includes("placa") ||
    conteudo.includes(
      "viaturas_placa"
    )
  ) {
    return "JÁ EXISTE UMA VIATURA CADASTRADA COM ESSA PLACA.";
  }

  if (
    conteudo.includes(
      "patrimonio"
    )
  ) {
    return "JÁ EXISTE UMA VIATURA CADASTRADA COM ESSE PATRIMÔNIO.";
  }

  if (
    conteudo.includes("chassi")
  ) {
    return "JÁ EXISTE UMA VIATURA CADASTRADA COM ESSE CHASSI.";
  }

  if (
    conteudo.includes("renavam")
  ) {
    return "JÁ EXISTE UMA VIATURA CADASTRADA COM ESSE RENAVAM.";
  }

  if (
  conteudo.includes(
    "viaturas_estrutura_id_fkey"
  ) ||
  conteudo.includes(
    "foreign key constraint"
  ) &&
  conteudo.includes("estrutura_id")
) {
  return "A LOTAÇÃO SELECIONADA NÃO EXISTE NA ESTRUTURA ORGANIZACIONAL.";
}

if (
  conteudo.includes(
    "could not find the 'estrutura_id' column"
  ) ||
  conteudo.includes(
    "column \"estrutura_id\""
  ) ||
  conteudo.includes(
    "schema cache"
  )
) {
  return "A COLUNA ESTRUTURA_ID AINDA NÃO ESTÁ DISPONÍVEL NA TABELA VIATURAS.";
}

  if (
    conteudo.includes(
      "modelo_viatura_id"
    ) ||
    conteudo.includes(
      "modelo informado"
    )
  ) {
    return "O MODELO INFORMADO NÃO EXISTE OU ESTÁ INATIVO.";
  }

  if (
    conteudo.includes(
      "row-level security"
    ) ||
    conteudo.includes(
      "violates row-level security"
    )
  ) {
    return "O USUÁRIO NÃO POSSUI PERMISSÃO PARA SALVAR VIATURAS.";
  }

  return (
    error?.message ||
    "NÃO FOI POSSÍVEL SALVAR A VIATURA."
  );
}