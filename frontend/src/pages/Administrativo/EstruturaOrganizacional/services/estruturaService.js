import { supabase } from "../../../../services/supabase.js";

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function texto(valor) {
  return String(valor ?? "").trim();
}

function textoMaiusculo(valor) {
  return texto(valor).toUpperCase();
}

function numeroOuNull(valor) {
  if (
    valor === "" ||
    valor === null ||
    valor === undefined
  ) {
    return null;
  }

  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero
    : null;
}

/* =========================================================
   BUSCAR ESTRUTURA
========================================================= */

export async function buscarEstruturaOrganizacional() {
  const { data, error } =
    await supabase
      .from("vw_unidades_arvore_p1")
      .select(`
        id,
        codigo,
        nome,
        sigla,
        tipo,
        cidade,
        unidade_pai_id,
        nivel,
        ordem_exibicao,
        caminho_ordem,
        caminho_nome,
        exibe_baliza,
        ativa
      `)
      .order("caminho_ordem", {
        ascending: true,
      });

  if (error) {
    console.error(
      "Erro ao buscar estrutura organizacional:",
      error
    );

    throw new Error(
      error.message ||
        "Não foi possível carregar a estrutura organizacional."
    );
  }

  return Array.isArray(data)
    ? data
    : [];
}

/* =========================================================
   ATUALIZAR UNIDADE
========================================================= */

export async function atualizarUnidadeOrganizacional(
  unidade
) {
  const id = Number(unidade?.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(
      "A unidade informada é inválida."
    );
  }

  const nome =
    textoMaiusculo(unidade.nome);

  if (!nome) {
    throw new Error(
      "Informe o nome da unidade."
    );
  }

  const registro = {
    nome,
    sigla:
      textoMaiusculo(unidade.sigla) ||
      null,

    codigo:
      textoMaiusculo(unidade.codigo) ||
      null,

    tipo:
      textoMaiusculo(unidade.tipo) ||
      null,

    cidade:
      textoMaiusculo(unidade.cidade) ||
      null,

    unidade_pai_id:
      numeroOuNull(
        unidade.unidade_pai_id
      ),

    ordem_exibicao:
      numeroOuNull(
        unidade.ordem_exibicao
      ),

    exibe_baliza:
      unidade.exibe_baliza === true,

    ativa:
      unidade.ativa !== false,
  };

  if (
    Number(registro.unidade_pai_id) ===
    id
  ) {
    throw new Error(
      "Uma unidade não pode ser superior dela mesma."
    );
  }

  const { data, error } =
    await supabase
      .from(
        "unidades_organizacionais"
      )
      .update(registro)
      .eq("id", id)
      .select()
      .single();

  if (error) {
    console.error(
      "Erro ao atualizar unidade organizacional:",
      {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        registro,
      }
    );

    if (error.code === "23505") {
      throw new Error(
        "Já existe uma unidade com este código e nome."
      );
    }

    throw new Error(
      error.message ||
        "Não foi possível atualizar a unidade."
    );
  }

  return data;
}