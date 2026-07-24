import { supabase } from "../../../services/supabase.js";

const TABELA_BAIXAS = "baixas_manutencao";
const TABELA_OSV = "ordens_servico";
const TABELA_VIATURAS = "viaturas";

function texto(valor) {
  return String(valor ?? "").trim();
}

function textoMaiusculo(valor) {
  return texto(valor).toUpperCase();
}

function numeroInteiro(valor) {
  const numero = Number(valor);

  return Number.isInteger(numero)
    ? numero
    : null;
}

/* =========================================================
   BUSCAR BAIXA PELO ID
========================================================= */

export async function buscarBaixaParaOsv(
  baixaId
) {
  const id = numeroInteiro(baixaId);

  if (!id || id <= 0) {
    throw new Error(
      "IDENTIFICADOR DA BAIXA INVÁLIDO."
    );
  }

  const { data, error } = await supabase
    .from(TABELA_BAIXAS)
    .select(`
      id,
      numero_baixa,
      data_hora,
      militar_id,
      numero_policia,
      responsavel,
      graduacao,
      viatura_id,
      prefixo,
      placa,
      marca,
      modelo,
      km_baixa,
      problema,
      situacao
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao buscar baixa:",
      error
    );

    throw new Error(
      "NÃO FOI POSSÍVEL LOCALIZAR A BAIXA."
    );
  }

  if (!data) {
    throw new Error(
      "BAIXA NÃO LOCALIZADA."
    );
  }

  return data;
}

/* =========================================================
   VERIFICAR SE JÁ EXISTE OSV
========================================================= */

export async function buscarOsvPorBaixa(
  baixaId
) {
  const id = numeroInteiro(baixaId);

  if (!id || id <= 0) {
    return null;
  }

  const { data, error } = await supabase
    .from(TABELA_OSV)
    .select("*")
    .eq("baixa_id", id)
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao buscar OSV:",
      error
    );

    throw new Error(
      "NÃO FOI POSSÍVEL VERIFICAR A ORDEM DE SERVIÇO."
    );
  }

  return data;
}

/* =========================================================
   CRIAR OSV VINCULADA À BAIXA
========================================================= */

export async function criarOrdemServico({
  baixa,
  oficina,
  responsavelOficina,
  servicosSolicitados,
  previsaoConclusao,
  observacoes,
}) {
  if (!baixa?.id) {
    throw new Error(
      "BAIXA NÃO IDENTIFICADA."
    );
  }

  if (
    textoMaiusculo(baixa.situacao) !==
    "ABERTA"
  ) {
    throw new Error(
      "SOMENTE BAIXAS ABERTAS PODEM GERAR UMA OSV."
    );
  }

  const osvExistente =
    await buscarOsvPorBaixa(baixa.id);

  if (osvExistente) {
    throw new Error(
      `A BAIXA Nº ${baixa.numero_baixa} JÁ POSSUI UMA ORDEM DE SERVIÇO.`
    );
  }

  const servicos =
    textoMaiusculo(servicosSolicitados);

  if (servicos.length < 5) {
    throw new Error(
      "INFORME OS SERVIÇOS SOLICITADOS."
    );
  }

  const registro = {
    baixa_id:
      baixa.id,

    numero_baixa:
      baixa.numero_baixa,

    viatura_id:
      baixa.viatura_id,

    prefixo:
      baixa.prefixo,

    placa:
      baixa.placa,

    marca:
      baixa.marca || null,

    modelo:
      baixa.modelo || null,

    km_baixa:
      Number(baixa.km_baixa) || 0,

    problema:
      textoMaiusculo(baixa.problema),

    oficina:
      textoMaiusculo(oficina) || null,

    responsavel_oficina:
      textoMaiusculo(
        responsavelOficina
      ) || null,

    servicos_solicitados:
      servicos,

    previsao_conclusao:
      previsaoConclusao || null,

    observacoes:
      textoMaiusculo(observacoes) || null,

    situacao:
      "EM EXECUÇÃO",

    status_financeiro:
      "PENDENTE",
  };

  const { data: ordem, error: erroOrdem } =
    await supabase
      .from(TABELA_OSV)
      .insert([registro])
      .select()
      .single();

  if (erroOrdem) {
    console.error(
      "Erro ao criar OSV:",
      erroOrdem
    );

    throw new Error(
      erroOrdem.message ||
        "NÃO FOI POSSÍVEL CRIAR A ORDEM DE SERVIÇO."
    );
  }

  const { error: erroBaixa } =
    await supabase
      .from(TABELA_BAIXAS)
      .update({
        situacao: "EM MANUTENÇÃO",
      })
      .eq("id", baixa.id);

  if (erroBaixa) {
    console.error(
      "OSV criada, mas baixa não atualizada:",
      erroBaixa
    );

    throw new Error(
      `A OSV Nº ${baixa.numero_baixa} FOI CRIADA, MAS A BAIXA NÃO FOI ATUALIZADA.`
    );
  }

  const { error: erroViatura } =
    await supabase
      .from(TABELA_VIATURAS)
      .update({
        situacao: "EM MANUTENÇÃO",
      })
      .eq("id", baixa.viatura_id);

  if (erroViatura) {
    console.error(
      "OSV criada, mas viatura não atualizada:",
      erroViatura
    );

    throw new Error(
      `A OSV Nº ${baixa.numero_baixa} FOI CRIADA, MAS A VIATURA NÃO FOI ATUALIZADA.`
    );
  }

  return ordem;
}