import { supabase } from "../../../services/supabase.js";
import {
  nomeCompletoMilitar,
} from "../../../utils/militares.js";

const TABELA_BAIXAS = "baixas_manutencao";
const TABELA_MILITARES = "militares";
const TABELA_VIATURAS = "viaturas";

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function texto(valor) {
  return String(valor ?? "").trim();
}

function textoMaiusculo(valor) {
  return texto(valor).toUpperCase();
}

function somenteNumeros(valor) {
  return texto(valor).replace(/\D/g, "");
}

function normalizarPrefixo(valor) {
  return somenteNumeros(valor).slice(0, 5);
}

function normalizarPlaca(valor) {
  const placa = textoMaiusculo(valor).replace(
    /[^A-Z0-9]/g,
    ""
  );

  if (placa.length !== 7) {
    return placa;
  }

  return `${placa.slice(0, 3)}-${placa.slice(3)}`;
}



/* =========================================================
   BUSCAR E VALIDAR MILITAR
========================================================= */

export async function validarResponsavelBaixa({
  numeroPolicia,
  cpf4,
}) {
  const numeroNormalizado =
    somenteNumeros(numeroPolicia);

  const cpfFinal = somenteNumeros(cpf4).slice(
    -4
  );

  if (!numeroNormalizado) {
    throw new Error(
      "INFORME O NÚMERO DE POLÍCIA."
    );
  }

  if (cpfFinal.length !== 4) {
    throw new Error(
      "INFORME OS 4 ÚLTIMOS DÍGITOS DO CPF."
    );
  }

  const { data, error } = await supabase
    .from(TABELA_MILITARES)
    .select(`
      id,
      numero_policia,
      nome,
      nome_policia,
      graduacao,
      cpf
    `)
    .eq(
      "numero_policia",
      numeroNormalizado
    )
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao buscar militar:",
      error
    );

    throw new Error(
      "NÃO FOI POSSÍVEL VALIDAR O RESPONSÁVEL."
    );
  }

  if (!data) {
    throw new Error(
      "MILITAR NÃO LOCALIZADO."
    );
  }

  const cpfMilitar = somenteNumeros(
    data.cpf
  );

  if (!cpfMilitar.endsWith(cpfFinal)) {
    throw new Error(
      "OS DÍGITOS DO CPF NÃO CONFEREM."
    );
  }

  return {
    id: data.id,

    numero_policia:
      data.numero_policia,

    nome:
      textoMaiusculo(data.nome),

    nome_policia:
      textoMaiusculo(data.nome_policia),

    graduacao:
      textoMaiusculo(data.graduacao),

    responsavel:
      nomeCompletoMilitar(data),
  };
}

/* =========================================================
   BUSCAR VIATURA PELO PREFIXO
========================================================= */

export async function buscarViaturaParaBaixa(
  prefixo
) {
  const prefixoNormalizado =
    normalizarPrefixo(prefixo);

  if (
    !/^\d{5}$/.test(
      prefixoNormalizado
    )
  ) {
    throw new Error(
      "INFORME UM PREFIXO COM 5 DÍGITOS."
    );
  }

  const { data, error } = await supabase
    .from(TABELA_VIATURAS)
    .select(`
      id,
      prefixo,
      placa,
      marca,
      modelo,
      odometro,
      situacao
    `)
    .eq(
      "prefixo",
      prefixoNormalizado
    )
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao buscar viatura:",
      error
    );

    throw new Error(
      "NÃO FOI POSSÍVEL LOCALIZAR A VIATURA."
    );
  }

  if (!data) {
    throw new Error(
      "VIATURA NÃO LOCALIZADA."
    );
  }

  return {
    id: data.id,

    prefixo:
      normalizarPrefixo(data.prefixo),

    placa:
      normalizarPlaca(data.placa),

    marca:
      textoMaiusculo(data.marca),

    modelo:
      textoMaiusculo(data.modelo),

    odometro:
      Number(data.odometro) || 0,

    situacao:
      textoMaiusculo(data.situacao),
  };
}

/* =========================================================
   VERIFICAR BAIXA ATIVA
========================================================= */

export async function buscarBaixaAtivaDaViatura(
  viaturaId
) {
  const id = Number(viaturaId);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  const { data, error } = await supabase
    .from(TABELA_BAIXAS)
    .select(`
      id,
      numero_baixa,
      data_hora,
      situacao,
      problema
    `)
    .eq("viatura_id", id)
    .in("situacao", [
      "ABERTA",
      "EM MANUTENÇÃO",
    ])
    .order("data_hora", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao verificar baixa ativa:",
      error
    );

    throw new Error(
      "NÃO FOI POSSÍVEL VERIFICAR A SITUAÇÃO DA VIATURA."
    );
  }

  return data;
}

/* =========================================================
   SALVAR BAIXA PARA MANUTENÇÃO
========================================================= */

export async function salvarBaixaManutencao({
  militar,
  viatura,
  dataHora,
  kmBaixa,
  problema,
}) {
  if (!militar?.id) {
    throw new Error(
      "RESPONSÁVEL NÃO VALIDADO."
    );
  }

  if (!viatura?.id) {
    throw new Error(
      "VIATURA NÃO IDENTIFICADA."
    );
  }

  const dataHoraNormalizada =
    texto(dataHora);

  if (!dataHoraNormalizada) {
    throw new Error(
      "INFORME A DATA E HORA DA BAIXA."
    );
  }

  const quilometragem = Number(
    somenteNumeros(kmBaixa)
  );

  if (
    !Number.isInteger(quilometragem) ||
    quilometragem <= 0
  ) {
    throw new Error(
      "INFORME UM KM DE BAIXA VÁLIDO."
    );
  }

  const ultimoKmRegistrado = Number(
    viatura?.odometro
  );

  if (
    Number.isFinite(ultimoKmRegistrado) &&
    quilometragem <= ultimoKmRegistrado
  ) {
    throw new Error(
      "O KM DE BAIXA DEVE SER SUPERIOR AO ÚLTIMO REGISTRADO."
    );
  }

  const descricao =
    textoMaiusculo(problema);

  if (descricao.length < 5) {
    throw new Error(
      "DESCREVA O PROBLEMA APRESENTADO."
    );
  }

  const baixaAtiva =
    await buscarBaixaAtivaDaViatura(
      viatura.id
    );

  if (baixaAtiva) {
    throw new Error(
      `A VIATURA JÁ POSSUI A BAIXA Nº ${baixaAtiva.numero_baixa} EM ANDAMENTO.`
    );
  }

  const registro = {
    data_hora:
      dataHoraNormalizada,

    militar_id:
      militar.id,

    numero_policia:
      somenteNumeros(
        militar.numero_policia
      ),

    responsavel:
      textoMaiusculo(
        militar.responsavel ||
          nomeCompletoMilitar(militar)
      ),

    graduacao:
      textoMaiusculo(
        militar.graduacao
      ) || null,

    viatura_id:
      viatura.id,

    prefixo:
      normalizarPrefixo(
        viatura.prefixo
      ),

    placa:
      normalizarPlaca(
        viatura.placa
      ),

    marca:
      textoMaiusculo(
        viatura.marca
      ) || null,

    modelo:
      textoMaiusculo(
        viatura.modelo
      ) || null,

    km_baixa:
      quilometragem,

    problema:
      descricao,

    situacao:
      "ABERTA",
  };

  const { data, error } = await supabase
    .from(TABELA_BAIXAS)
    .insert([registro])
    .select()
    .single();

  if (error) {
    console.error(
      "Erro ao salvar baixa:",
      error
    );

    throw new Error(
      error.message ||
        "NÃO FOI POSSÍVEL REGISTRAR A BAIXA."
    );
  }

  /*
   * A baixa permanece como ABERTA.
   *
   * A viatura não será alterada para
   * EM MANUTENÇÃO neste momento.
   *
   * Essa mudança acontecerá somente quando
   * for gerada uma Ordem de Serviço vinculada
   * à baixa.
   *
   * O odômetro também não é atualizado aqui.
   * Ele continuará sendo controlado pelo fluxo
   * próprio de abastecimentos e odômetros.
   */

  return data;
}

/* =========================================================
   LISTAR BAIXAS
========================================================= */

export async function buscarBaixasManutencao() {
  const { data, error } = await supabase
    .from(TABELA_BAIXAS)
    .select("*")
    .order("data_hora", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Erro ao buscar baixas:",
      error
    );

    throw new Error(
      "NÃO FOI POSSÍVEL BUSCAR AS BAIXAS."
    );
  }

  return data ?? [];
}

/* =========================================================
   BUSCAR BAIXAS DE UMA VIATURA
========================================================= */

export async function buscarBaixasDaViatura(
  viaturaId
) {
  const id = Number(viaturaId);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(
      "IDENTIFICADOR DA VIATURA INVÁLIDO."
    );
  }

  const { data, error } = await supabase
    .from(TABELA_BAIXAS)
    .select("*")
    .eq("viatura_id", id)
    .order("data_hora", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Erro ao buscar baixas da viatura:",
      error
    );

    throw new Error(
      "NÃO FOI POSSÍVEL BUSCAR AS BAIXAS DA VIATURA."
    );
  }

  return data ?? [];
}