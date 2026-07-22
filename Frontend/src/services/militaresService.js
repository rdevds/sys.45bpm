import { supabase } from "./supabase.js";

const TABELA_MILITARES = "militares";
const VIEW_MILITARES = "vw_militares_p1";
const TABELA_POSTOS = "cad_postos_graduacoes";
const TABELA_HABILITACOES =
  "habilitacoes_militares";

/* =========================================================
   FUNÇÕES DE CONSULTA
========================================================= */

/**
 * Lista os militares utilizando a nova view da P1.
 *
 * A função converte os nomes da view para o formato
 * que a interface atual do SIGEF já utiliza.
 */
export async function listarMilitares() {
  const { data, error } = await supabase
    .from(VIEW_MILITARES)
    .select("*")
    .order("nome_completo", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Erro ao listar militares:",
      error
    );

    throw new Error(
      `Não foi possível carregar os militares: ${error.message}`
    );
  }

  return (data ?? []).map(
    normalizarRegistroDaView
  );
}

/**
 * Busca um militar pelo número de polícia.
 */
export async function buscarMilitarPorNumeroPolicia(
  numeroPolicia
) {
  const numeroLimpo =
    somenteNumeros(numeroPolicia);

  if (!numeroLimpo) {
    throw new Error(
      "Informe o número de polícia."
    );
  }

  const { data, error } = await supabase
    .from(VIEW_MILITARES)
    .select("*")
    .eq("numero_policia", numeroLimpo)
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao buscar militar:",
      error
    );

    throw new Error(
      `Não foi possível buscar o militar: ${error.message}`
    );
  }

  return data
    ? normalizarRegistroDaView(data)
    : null;
}

/**
 * Busca diretamente um militar pelo ID.
 */
export async function buscarMilitarPorId(id) {
  if (!id) {
    throw new Error(
      "Militar não identificado."
    );
  }

  const { data, error } = await supabase
    .from(VIEW_MILITARES)
    .select("*")
    .eq("militar_id", id)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Não foi possível buscar o militar: ${error.message}`
    );
  }

  return data
    ? normalizarRegistroDaView(data)
    : null;
}

/* =========================================================
   CADASTRAR MILITAR
========================================================= */

export async function cadastrarMilitar(
  militar
) {
  const posto =
    await localizarPostoGraduacao(
      militar.graduacao ??
        militar.postoGraduacao ??
        militar.posto_graduacao
    );

  const registro =
    prepararDadosMilitar(
      militar,
      posto
    );

  const { data, error } = await supabase
    .from(TABELA_MILITARES)
    .insert(registro)
    .select()
    .single();

  if (error) {
    console.error(
      "Erro ao cadastrar militar:",
      error
    );

    throw new Error(
      traduzirErroMilitar(error)
    );
  }

  try {
    await sincronizarHabilitacao(
      data.id,
      {
        categoriaCnh:
          registro.categoria_cnh,

        validadeCnh:
          registro.validade_cnh,

        numeroCnh:
          militar.numeroCnh ??
          militar.numero_cnh ??
          null,
      }
    );
  } catch (errorHabilitacao) {
    console.error(
      "O militar foi cadastrado, mas ocorreu erro na CNH:",
      errorHabilitacao
    );

    /*
     * Não excluímos o militar, porque o cadastro
     * principal já foi concluído.
     */
    throw new Error(
      `O militar foi cadastrado, mas os dados da CNH não foram salvos: ${errorHabilitacao.message}`
    );
  }

  return buscarMilitarPorId(
    data.id
  );
}

/* =========================================================
   ATUALIZAR MILITAR
========================================================= */

export async function atualizarMilitar(
  id,
  militar
) {
  if (!id) {
    throw new Error(
      "Militar não identificado."
    );
  }

  const posto =
    await localizarPostoGraduacao(
      militar.graduacao ??
        militar.postoGraduacao ??
        militar.posto_graduacao
    );

  const registro =
    prepararDadosMilitar(
      militar,
      posto
    );

  const { data, error } = await supabase
    .from(TABELA_MILITARES)
    .update(registro)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(
      "Erro ao atualizar militar:",
      error
    );

    throw new Error(
      traduzirErroMilitar(error)
    );
  }

  await sincronizarHabilitacao(
    id,
    {
      categoriaCnh:
        registro.categoria_cnh,

      validadeCnh:
        registro.validade_cnh,

      numeroCnh:
        militar.numeroCnh ??
        militar.numero_cnh ??
        null,
    }
  );

  return buscarMilitarPorId(
    data.id
  );
}

/* =========================================================
   ATUALIZAR CONTATO
========================================================= */

export async function atualizarContatoMotorista(
  militarId,
  {
    email,
    telefone,
  }
) {
  if (!militarId) {
    throw new Error(
      "Militar não identificado."
    );
  }

  const emailTratado =
    String(email ?? "")
      .trim()
      .toLowerCase();

  const telefoneTratado =
    somenteNumeros(telefone) ||
    null;

  if (!emailTratado) {
    throw new Error(
      "Informe o e-mail."
    );
  }

  const emailDuplicado =
    await verificarEmailDuplicado(
      emailTratado,
      militarId
    );

  if (emailDuplicado) {
    throw new Error(
      "JÁ EXISTE UM MILITAR CADASTRADO COM ESSE E-MAIL."
    );
  }

  if (telefoneTratado) {
    const telefoneDuplicado =
      await verificarTelefoneDuplicado(
        telefoneTratado,
        militarId
      );

    if (telefoneDuplicado) {
      throw new Error(
        "JÁ EXISTE UM MILITAR CADASTRADO COM ESSE TELEFONE."
      );
    }
  }

  const { error } = await supabase
    .from(TABELA_MILITARES)
    .update({
      email: emailTratado,
      telefone: telefoneTratado,
    })
    .eq("id", militarId);

  if (error) {
    throw new Error(
      traduzirErroMilitar(error)
    );
  }

  return buscarMilitarPorId(
    militarId
  );
}

/* =========================================================
   ATUALIZAR CNH
========================================================= */

export async function atualizarDadosCnh(
  militarId,
  {
    categoriaCnh,
    validadeCnh,
    numeroCnh = null,
  }
) {
  if (!militarId) {
    throw new Error(
      "Militar não identificado."
    );
  }

  const categoriaTratada =
    normalizarTexto(
      categoriaCnh
    ) || null;

  if (!validadeCnh) {
    throw new Error(
      "Informe a validade da CNH."
    );
  }

  /*
   * Mantemos os campos antigos atualizados
   * enquanto a Frota ainda os utiliza.
   */
  const { error } = await supabase
    .from(TABELA_MILITARES)
    .update({
      categoria_cnh:
        categoriaTratada,

      validade_cnh:
        validadeCnh,

      habilitado_dirigir:
        Boolean(
          categoriaTratada &&
            validadeCnh
        ),
    })
    .eq("id", militarId);

  if (error) {
    throw new Error(
      traduzirErroMilitar(error)
    );
  }

  await sincronizarHabilitacao(
    militarId,
    {
      categoriaCnh:
        categoriaTratada,

      validadeCnh,

      numeroCnh,
    }
  );

  return buscarMilitarPorId(
    militarId
  );
}

export async function atualizarValidadeCnh(
  militarId,
  novaValidade
) {
  if (!militarId) {
    throw new Error(
      "Militar não identificado."
    );
  }

  if (!novaValidade) {
    throw new Error(
      "Informe a nova validade da CNH."
    );
  }

  const militarAtual =
    await buscarMilitarPorId(
      militarId
    );

  return atualizarDadosCnh(
    militarId,
    {
      categoriaCnh:
        militarAtual?.categoria_cnh,

      validadeCnh:
        novaValidade,

      numeroCnh:
        militarAtual?.numero_cnh,
    }
  );
}

/* =========================================================
   ALTERAR STATUS
========================================================= */

export async function alterarStatusMilitar(
  id,
  ativo
) {
  if (!id) {
    throw new Error(
      "Militar não identificado."
    );
  }

  const novoStatus =
    Boolean(ativo);

  const { error } = await supabase
    .from(TABELA_MILITARES)
    .update({
      ativo: novoStatus,

      situacao_funcional:
        novoStatus
          ? "ATIVO"
          : "INATIVO",
    })
    .eq("id", id);

  if (error) {
    throw new Error(
      traduzirErroMilitar(error)
    );
  }

  return buscarMilitarPorId(id);
}

/* =========================================================
   POSTOS E GRADUAÇÕES
========================================================= */

/**
 * Lista os postos e graduações para preencher
 * os selects do formulário.
 */
export async function listarPostosGraduacoes() {
  const { data, error } = await supabase
    .from(TABELA_POSTOS)
    .select(
      `
        id,
        posto_graduacao,
        precedencia,
        grupo_carta_situacao,
        tipo_vinculo,
        conta_baliza,
        conta_carta_situacao,
        ativo
      `
    )
    .eq("ativo", true)
    .order("ordem_exibicao", {
      ascending: true,
    });

  if (error) {
    throw new Error(
      `Não foi possível carregar os postos e graduações: ${error.message}`
    );
  }

  return data ?? [];
}

/**
 * Localiza o posto da nova arquitetura.
 *
 * A coluna antiga pode conter:
 * 3º SGT PM
 *
 * A tabela de postos contém:
 * 3º SGT
 */
async function localizarPostoGraduacao(
  graduacao
) {
  const valorNormalizado =
    normalizarPostoGraduacao(
      graduacao
    );

  if (!valorNormalizado) {
    return null;
  }

  const { data, error } = await supabase
    .from(TABELA_POSTOS)
    .select(
      `
        id,
        posto_graduacao,
        tipo_vinculo
      `
    )
    .eq("ativo", true);

  if (error) {
    throw new Error(
      `Não foi possível consultar o posto ou graduação: ${error.message}`
    );
  }

  const postoEncontrado =
    (data ?? []).find(
      (posto) =>
        normalizarPostoGraduacao(
          posto.posto_graduacao
        ) === valorNormalizado
    );

  if (!postoEncontrado) {
    throw new Error(
      `O posto ou graduação "${graduacao}" não está cadastrado em cad_postos_graduacoes.`
    );
  }

  return postoEncontrado;
}

/* =========================================================
   HABILITAÇÃO
========================================================= */

async function sincronizarHabilitacao(
  militarId,
  {
    numeroCnh,
    categoriaCnh,
    validadeCnh,
  }
) {
  const numeroTratado =
    somenteNumeros(numeroCnh) ||
    null;

  const categoriaTratada =
    normalizarTexto(
      categoriaCnh
    ) || null;

  const validadeTratada =
    validadeCnh || null;

  /*
   * Sem qualquer dado de CNH, não criamos
   * um registro vazio.
   */
  if (
    !numeroTratado &&
    !categoriaTratada &&
    !validadeTratada
  ) {
    return null;
  }

  const {
    data: habilitacaoAtual,
    error: erroConsulta,
  } = await supabase
    .from(TABELA_HABILITACOES)
    .select("id")
    .eq("militar_id", militarId)
    .eq("ativa", true)
    .maybeSingle();

  if (erroConsulta) {
    throw new Error(
      `Não foi possível consultar a CNH: ${erroConsulta.message}`
    );
  }

  const dadosHabilitacao = {
    numero_cnh: numeroTratado,
    categoria: categoriaTratada,
    validade: validadeTratada,
    ativa: true,
  };

  if (habilitacaoAtual?.id) {
    const { data, error } =
      await supabase
        .from(
          TABELA_HABILITACOES
        )
        .update(
          dadosHabilitacao
        )
        .eq(
          "id",
          habilitacaoAtual.id
        )
        .select()
        .single();

    if (error) {
      throw new Error(
        `Não foi possível atualizar a CNH: ${error.message}`
      );
    }

    return data;
  }

  const { data, error } =
    await supabase
      .from(
        TABELA_HABILITACOES
      )
      .insert({
        militar_id: militarId,
        ...dadosHabilitacao,
      })
      .select()
      .single();

  if (error) {
    throw new Error(
      `Não foi possível cadastrar a CNH: ${error.message}`
    );
  }

  return data;
}

/* =========================================================
   VERIFICAÇÃO DE DUPLICIDADE
========================================================= */

async function verificarEmailDuplicado(
  email,
  militarIdAtual
) {
  let consulta = supabase
    .from(TABELA_MILITARES)
    .select("id")
    .ilike("email", email)
    .limit(1);

  if (militarIdAtual) {
    consulta = consulta.neq(
      "id",
      militarIdAtual
    );
  }

  const { data, error } =
    await consulta;

  if (error) {
    throw new Error(
      `Não foi possível verificar o e-mail: ${error.message}`
    );
  }

  return (
    Array.isArray(data) &&
    data.length > 0
  );
}

async function verificarTelefoneDuplicado(
  telefone,
  militarIdAtual
) {
  const telefoneLimpo =
    somenteNumeros(telefone);

  let consulta = supabase
    .from(TABELA_MILITARES)
    .select("id")
    .eq(
      "telefone",
      telefoneLimpo
    )
    .limit(1);

  if (militarIdAtual) {
    consulta = consulta.neq(
      "id",
      militarIdAtual
    );
  }

  const { data, error } =
    await consulta;

  if (error) {
    throw new Error(
      `Não foi possível verificar o telefone: ${error.message}`
    );
  }

  return (
    Array.isArray(data) &&
    data.length > 0
  );
}

/* =========================================================
   PREPARAÇÃO DOS DADOS
========================================================= */

function prepararDadosMilitar(
  militar,
  posto
) {
  const nomeCompleto =
    normalizarTexto(
      militar.nome ??
        militar.nomeCompleto ??
        militar.nome_completo
    );

  const graduacaoLegada =
    normalizarTexto(
      militar.graduacao ??
        militar.postoGraduacao ??
        militar.posto_graduacao
    );

  const nomePoliciaInformado =
    normalizarTexto(
      militar.nomePolicia ??
        militar.nome_policia
    );

  const nomeGuerraInformado =
    normalizarTexto(
      militar.nomeGuerra ??
        militar.nome_guerra
    );

  const nomeGuerra =
    extrairNomeGuerra({
      nomeGuerra:
        nomeGuerraInformado,

      nomePolicia:
        nomePoliciaInformado,

      nomeCompleto,

      postoGraduacao:
        posto?.posto_graduacao,
    });

  const nomePolicia =
    posto?.posto_graduacao &&
    nomeGuerra
      ? `${posto.posto_graduacao} ${nomeGuerra}`
      : nomePoliciaInformado;

  const categoriaCnh =
    normalizarTexto(
      militar.categoriaCnh ??
        militar.categoria_cnh
    ) || null;

  const validadeCnh =
    militar.validadeCnh ??
    militar.validade_cnh ??
    null;

  return {
    numero_policia:
      somenteNumeros(
        militar.numeroPolicia ??
          militar.numero_policia
      ),

    /*
     * Mantemos o valor antigo, inclusive
     * com PM, para respeitar a constraint
     * existente da tabela militares.
     */
    graduacao:
      graduacaoLegada,

    posto_graduacao_id:
      posto?.id ?? null,

    tipo_vinculo:
      posto?.tipo_vinculo ??
      "MILITAR",

    nome:
      nomeCompleto,

    nome_guerra:
      nomeGuerra,

    nome_policia:
      nomePolicia,

    cpf:
      somenteNumeros(
        militar.cpf
      ),

    email:
      String(
        militar.email ?? ""
      )
        .trim()
        .toLowerCase(),

    telefone:
      somenteNumeros(
        militar.telefone
      ) || null,

    cidade:
      normalizarTexto(
        militar.cidade
      ),

    fracao:
      normalizarTexto(
        militar.fracao
      ),

    funcao:
      normalizarTexto(
        militar.funcao
      ) || null,

    categoria_cnh:
      categoriaCnh,

    validade_cnh:
      validadeCnh,

    habilitado_dirigir:
      Boolean(
        militar.habilitadoDirigir ??
          militar.habilitado_dirigir ??
          (
            categoriaCnh &&
            validadeCnh
          )
      ),

    perfil_sistema:
      normalizarTexto(
        militar.perfilSistema ??
          militar.perfil_sistema ??
          "CONSULTA"
      ) || "CONSULTA",

    acesso_sistema:
      Boolean(
        militar.acessoSistema ??
          militar.acesso_sistema
      ),

    ordem_antiguidade:
      converterInteiroOuNull(
        militar.ordemAntiguidade ??
          militar.ordem_antiguidade
      ),

    data_promocao:
      militar.dataPromocao ??
      militar.data_promocao ??
      null,

    data_inclusao:
      militar.dataInclusao ??
      militar.data_inclusao ??
      null,

    situacao_funcional:
      normalizarTexto(
        militar.situacaoFuncional ??
          militar.situacao_funcional ??
          "ATIVO"
      ) || "ATIVO",

    ativo:
      militar.ativo ?? true,
  };
}

/* =========================================================
   NORMALIZAÇÃO DA VIEW PARA O FRONTEND ANTIGO
========================================================= */

function normalizarRegistroDaView(
  registro
) {
  return {
    ...registro,

    id:
      registro.militar_id,

    nome:
      registro.nome_completo,

    graduacao:
      registro.graduacao_legada ||
      registro.posto_graduacao,

    nome_policia:
      registro.nome_policia,

    nomePolicia:
      registro.nome_policia,

    nome_guerra:
      registro.nome_guerra,

    nomeGuerra:
      registro.nome_guerra,

    posto_graduacao:
      registro.posto_graduacao,

    postoGraduacao:
      registro.posto_graduacao,

    cidade:
      registro.cidade_unidade ||
      registro.cidade_legada,

    fracao:
      registro.unidade_sigla ||
      registro.fracao_legada,

    funcao:
      registro.funcao ||
      registro.funcao_legada,

    categoria_cnh:
      registro.categoria_cnh,

    categoriaCnh:
      registro.categoria_cnh,

    validade_cnh:
      registro.validade_cnh,

    validadeCnh:
      registro.validade_cnh,

    numero_cnh:
      registro.numero_cnh,

    numeroCnh:
      registro.numero_cnh,

    status_cnh:
      registro.status_cnh,

    unidade_organizacional_id:
      registro.unidade_organizacional_id,

    unidade_nome:
      registro.unidade_nome,

    unidade_sigla:
      registro.unidade_sigla,

    ordem_secundaria:
      registro.ordem_secundaria ??
      registro.ajuste_ordem ??
      null,

    ajuste_ordem:
      registro.ordem_secundaria ??
      registro.ajuste_ordem ??
      null,
  };
}

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function normalizarTexto(valor) {
  return String(valor ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function somenteNumeros(valor) {
  return String(valor ?? "")
    .replace(/\D/g, "");
}

function normalizarPostoGraduacao(
  valor
) {
  return normalizarTexto(valor)
    .replace(/°/g, "º")
    .replace(/\s+PM$/, "")
    .trim();
}

function extrairNomeGuerra({
  nomeGuerra,
  nomePolicia,
  nomeCompleto,
  postoGraduacao,
}) {
  if (nomeGuerra) {
    return removerPostoDoNome(
      nomeGuerra,
      postoGraduacao
    );
  }

  if (nomePolicia) {
    const nomeExtraido =
      removerPostoDoNome(
        nomePolicia,
        postoGraduacao
      );

    if (
      nomeExtraido &&
      !ehSomentePosto(
        nomeExtraido
      )
    ) {
      return nomeExtraido;
    }
  }

  const partes =
    normalizarTexto(
      nomeCompleto
    )
      .split(" ")
      .filter(Boolean);

  return partes.at(-1) ?? "";
}

function removerPostoDoNome(
  valor,
  postoGraduacao
) {
  let resultado =
    normalizarTexto(valor);

  const posto =
    normalizarTexto(
      postoGraduacao
    );

  if (posto) {
    resultado = resultado.replace(
      new RegExp(
        `^${escaparExpressaoRegular(
          posto
        )}(\\s+PM)?\\s*`,
        "i"
      ),
      ""
    );
  }

  resultado = resultado.replace(
    /^(CEL|TEN CEL|MAJ|CAP|1[º°] TEN|2[º°] TEN|ASP OF|SUB TEN|1[º°] SGT|2[º°] SGT|3[º°] SGT|CB|SD|ASPM 2E|ASPM 4A|ASPM 4C)(\s+PM)?\s*/i,
    ""
  );

  return resultado.trim();
}

function ehSomentePosto(valor) {
  const valorNormalizado =
    normalizarPostoGraduacao(
      valor
    );

  const postos = [
    "CEL",
    "TEN CEL",
    "MAJ",
    "CAP",
    "1º TEN",
    "2º TEN",
    "ASP OF",
    "SUB TEN",
    "1º SGT",
    "2º SGT",
    "3º SGT",
    "CB",
    "SD",
    "ASPM 2E",
    "ASPM 4A",
    "ASPM 4C",
    "SGT",
    "TEN",
  ];

  return postos.includes(
    valorNormalizado
  );
}

function escaparExpressaoRegular(
  valor
) {
  return valor.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function converterInteiroOuNull(
  valor
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero = Number(valor);

  return Number.isInteger(numero)
    ? numero
    : null;
}

/* =========================================================
   TRADUÇÃO DE ERROS
========================================================= */

function traduzirErroMilitar(
  error
) {
  const mensagem =
    String(
      error?.message ?? ""
    ).toLowerCase();

  if (
    mensagem.includes(
      "militares_numero_policia_unico"
    ) ||
    mensagem.includes(
      "numero_policia"
    )
  ) {
    return "JÁ EXISTE UM MILITAR CADASTRADO COM ESSE NÚMERO DE POLÍCIA.";
  }

  if (
    mensagem.includes(
      "militares_cpf_unico"
    ) ||
    mensagem.includes("cpf")
  ) {
    return "JÁ EXISTE UM MILITAR CADASTRADO COM ESSE CPF.";
  }

  if (
    mensagem.includes(
      "militares_email_unico"
    ) ||
    mensagem.includes(
      "militares_email_normalizado_unico"
    ) ||
    mensagem.includes("email")
  ) {
    return "JÁ EXISTE UM MILITAR CADASTRADO COM ESSE E-MAIL.";
  }

  if (
    mensagem.includes(
      "militares_telefone_unico"
    ) ||
    mensagem.includes(
      "telefone"
    )
  ) {
    return "JÁ EXISTE UM MILITAR CADASTRADO COM ESSE TELEFONE.";
  }

  if (
    mensagem.includes(
      "militares_graduacao_valida"
    )
  ) {
    return "O POSTO OU GRADUAÇÃO INFORMADO NÃO É ACEITO PELA TABELA MILITARES.";
  }

  if (
    mensagem.includes(
      "habilitacoes_categoria_valida"
    )
  ) {
    return "A CATEGORIA DA CNH INFORMADA NÃO É VÁLIDA.";
  }

  return (
    error?.message ||
    "NÃO FOI POSSÍVEL SALVAR O MILITAR."
  );
}