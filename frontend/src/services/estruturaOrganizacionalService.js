import { supabase } from "./supabase.js";

const TABELA = "estrutura_organizacional";

/**
 * Lista as estruturas ativas que podem receber viaturas.
 */
export async function buscarEstruturasParaViaturas() {
  const { data, error } = await supabase
    .from(TABELA)
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
        aceita_viatura,
        tipos_estrutura (
          id,
          nome
        )
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
      `Não foi possível carregar a estrutura organizacional: ${error.message}`
    );
  }

  return montarCaminhosEstrutura(
    data ?? []
  );
}

/**
 * Busca uma estrutura específica pelo ID.
 */
export async function buscarEstruturaPorId(
  id
) {
  const idTratado = Number(id);

  if (
    !Number.isInteger(idTratado) ||
    idTratado <= 0
  ) {
    throw new Error(
      "Estrutura organizacional inválida."
    );
  }

  const { data, error } = await supabase
    .from(TABELA)
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
        aceita_viatura,
        tipos_estrutura (
          id,
          nome
        )
      `
    )
    .eq("id", idTratado)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Não foi possível localizar a estrutura: ${error.message}`
    );
  }

  return data;
}

/**
 * Monta o caminho hierárquico de cada estrutura.
 *
 * Exemplo:
 * 45º BPM > 88ª CIA > 4º PEL > 2º GP
 */
function montarCaminhosEstrutura(
  estruturas
) {
  const mapa = new Map(
    estruturas.map((estrutura) => [
      Number(estrutura.id),
      estrutura,
    ])
  );

  function montarCaminho(
    estrutura,
    idsVisitados = new Set()
  ) {
    if (!estrutura) {
      return "";
    }

    const id = Number(
      estrutura.id
    );

    if (idsVisitados.has(id)) {
      return estrutura.sigla ||
        estrutura.nome;
    }

    idsVisitados.add(id);

    const nomeAtual =
      estrutura.sigla ||
      estrutura.nome;

    if (!estrutura.parent_id) {
      return nomeAtual;
    }

    const pai = mapa.get(
      Number(estrutura.parent_id)
    );

    if (!pai) {
      return nomeAtual;
    }

    const caminhoPai =
      montarCaminho(
        pai,
        idsVisitados
      );

    return `${caminhoPai} > ${nomeAtual}`;
  }

  return estruturas
    .map((estrutura) => ({
      ...estrutura,

      tipo:
        estrutura
          .tipos_estrutura
          ?.nome ?? null,

      caminho:
        montarCaminho(
          estrutura
        ),
    }))
    .sort((a, b) =>
      a.caminho.localeCompare(
        b.caminho,
        "pt-BR"
      )
    );
}