import { supabase } from "./supabase";

const TABELA = "abastecimentos";

const STATUS_SIAD = {
  RECEBIDO: "RECEBIDO",
  LANCADO: "LANÇADO",
  ERRO: "ERRO",
};

/**
 * Buscar todos os abastecimentos.
 */
export async function buscarAbastecimentos() {
  const { data, error } = await supabase
    .from(TABELA)
    .select("*")
    .order("data_hora", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Erro ao buscar abastecimentos:",
      error
    );

    throw new Error(
      error.message ||
        "NÃO FOI POSSÍVEL BUSCAR OS ABASTECIMENTOS."
    );
  }

  return data ?? [];
}

/**
 * Buscar somente os abastecimentos de uma viatura.
 */
export async function buscarAbastecimentosDaViatura(
  viaturaId
) {
  const id = Number(viaturaId);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error(
      "IDENTIFICADOR DA VIATURA INVÁLIDO."
    );
  }

  const { data, error } = await supabase
    .from(TABELA)
    .select("*")
    .eq("viatura_id", id)
    .order("data_hora", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Erro ao buscar abastecimentos da viatura:",
      error
    );

    throw new Error(
      error.message ||
        "NÃO FOI POSSÍVEL BUSCAR OS ABASTECIMENTOS DA VIATURA."
    );
  }

  return data ?? [];
}

/**
 * Salvar um novo abastecimento.
 *
 * Todo abastecimento novo entra na fila do SIAD
 * com o status RECEBIDO.
 */
export async function salvarAbastecimento(
  abastecimento
) {
  const viaturaId = Number(
    abastecimento?.viatura_id ??
      abastecimento?.viaturaId ??
      abastecimento?.viatura?.id
  );

  if (
    !Number.isInteger(viaturaId) ||
    viaturaId <= 0
  ) {
    throw new Error(
      "NÃO FOI POSSÍVEL IDENTIFICAR A VIATURA DO ABASTECIMENTO."
    );
  }

  const prefixo = String(
    abastecimento?.prefixo ??
      abastecimento?.viatura?.prefixo ??
      ""
  )
    .replace(/\D/g, "")
    .slice(0, 5);

  const placa = String(
    abastecimento?.placa ??
      abastecimento?.viatura?.placa ??
      ""
  )
    .trim()
    .toUpperCase();

  const dadosParaSalvar = {
    ...abastecimento,

    viatura_id: viaturaId,
    prefixo,
    placa,

    status_siad: STATUS_SIAD.RECEBIDO,

    status_lancamento:
      abastecimento?.status_lancamento ||
      "RECEBIDO",
  };

  /*
   * Esses campos são utilizados apenas no frontend
   * e não devem ser enviados ao Supabase.
   */
  delete dadosParaSalvar.viaturaId;
  delete dadosParaSalvar.viatura;

  const { data, error } = await supabase
    .from(TABELA)
    .insert([dadosParaSalvar])
    .select()
    .single();

  if (error) {
    console.error(
      "Erro ao salvar abastecimento:",
      error
    );

    throw new Error(
      error.message ||
        "NÃO FOI POSSÍVEL SALVAR O ABASTECIMENTO."
    );
  }

  return data;
}

/**
 * Registrar erro ou pendência no lançamento do SIAD.
 */
export async function atualizarErroAbastecimento(
  id,
  {
    tipoErro,
    descricaoErro,
  }
) {
  if (!id) {
    throw new Error(
      "ABASTECIMENTO NÃO IDENTIFICADO."
    );
  }

  const tipo = String(
    tipoErro || ""
  )
    .trim()
    .toUpperCase();

  const descricao = String(
    descricaoErro || ""
  ).trim();

  if (!tipo) {
    throw new Error(
      "INFORME O TIPO DO ERRO."
    );
  }

  if (!descricao) {
    throw new Error(
      "DESCREVA O ERRO OU A CORREÇÃO NECESSÁRIA."
    );
  }

  const agora =
    new Date().toISOString();

  const { data, error } = await supabase
    .from(TABELA)
    .update({
      status_siad: STATUS_SIAD.ERRO,

      tipo_erro: tipo,
      descricao_erro: descricao,

      erro_siad: descricao,
      observacao_siad: descricao,

      data_erro: agora,
      updated_at: agora,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(
      "Erro ao registrar pendência:",
      error
    );

    throw new Error(
      error.message ||
        "NÃO FOI POSSÍVEL REGISTRAR O ERRO."
    );
  }

  return data;
}

/**
 * Atualizar o status do lançamento no SIAD.
 *
 * Valores aceitos:
 * - RECEBIDO
 * - LANÇADO
 * - ERRO
 */
export async function atualizarStatusSiad(
  id,
  novoStatus,
  observacao = null
) {
  if (!id) {
    throw new Error(
      "ABASTECIMENTO NÃO IDENTIFICADO."
    );
  }

  const status = String(
    novoStatus || ""
  )
    .trim()
    .toUpperCase();

  const statusPermitidos = [
    STATUS_SIAD.RECEBIDO,
    STATUS_SIAD.LANCADO,
    STATUS_SIAD.ERRO,
  ];

  if (
    !statusPermitidos.includes(status)
  ) {
    throw new Error(
      "STATUS DO SIAD INVÁLIDO."
    );
  }

  const agora =
    new Date().toISOString();

  const dadosAtualizacao = {
    status_siad: status,
    updated_at: agora,
  };

  if (
    status === STATUS_SIAD.LANCADO
  ) {
    dadosAtualizacao.data_lancamento_siad =
      agora;

    dadosAtualizacao.erro_siad =
      null;

    dadosAtualizacao.observacao_siad =
      null;

    dadosAtualizacao.descricao_erro =
      null;

    dadosAtualizacao.data_erro =
      null;
  }

  if (
    status === STATUS_SIAD.ERRO
  ) {
    const motivo = String(
      observacao || ""
    ).trim();

    if (!motivo) {
      throw new Error(
        "INFORME O MOTIVO DO ERRO."
      );
    }

    dadosAtualizacao.erro_siad =
      motivo;

    dadosAtualizacao.observacao_siad =
      motivo;

    dadosAtualizacao.descricao_erro =
      motivo;

    dadosAtualizacao.data_erro =
      agora;

    dadosAtualizacao.data_lancamento_siad =
      null;
  }

  if (
    status === STATUS_SIAD.RECEBIDO
  ) {
    dadosAtualizacao.data_lancamento_siad =
      null;

    dadosAtualizacao.erro_siad =
      null;

    dadosAtualizacao.observacao_siad =
      null;

    dadosAtualizacao.descricao_erro =
      null;

    dadosAtualizacao.data_erro =
      null;
  }

  const { data, error } = await supabase
    .from(TABELA)
    .update(dadosAtualizacao)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(
      "Erro ao atualizar status do SIAD:",
      error
    );

    throw new Error(
      error.message ||
        "NÃO FOI POSSÍVEL ATUALIZAR O STATUS DO SIAD."
    );
  }

  return data;
}