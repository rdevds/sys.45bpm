import { supabase } from "./supabase.js";

export async function listarVinculosMilitar(
  militarId
) {
  if (!militarId) {
    return [];
  }

  const { data, error } = await supabase
    .from("lotacoes_militares")
    .select(
      `
        id,
        militar_id,
        unidade_organizacional_id,
        funcao,
        ordem_secundaria,
        lotacao_principal,
        mostrar_ordem_primaria,
        data_inicio,
        data_fim,
        ativa
      `
    )
    .eq("militar_id", militarId)
    .eq("ativa", true)
    .order("lotacao_principal", {
      ascending: false,
    })
    .order("id", {
      ascending: true,
    });

  if (error) {
    throw new Error(
      `Não foi possível carregar as lotações: ${error.message}`
    );
  }

  return (data ?? []).map(
    (registro) => ({
      id: registro.id,
      unidadeOrganizacionalId:
        registro.unidade_organizacional_id
          ? String(
              registro
                .unidade_organizacional_id
            )
          : "",
      funcao: registro.funcao ?? "",
      ordemSecundaria:
        registro.ordem_secundaria ?? "",
      lotacaoPrincipal: Boolean(
        registro.lotacao_principal
      ),
      mostrarOrdemPrimaria: Boolean(
        registro.mostrar_ordem_primaria
      ),
      dataInicio:
        registro.data_inicio ||
        new Date()
          .toISOString()
          .slice(0, 10),
      ativa:
        registro.ativa !== false,
    })
  );
}

export async function salvarVinculosMilitar(
  militarId,
  vinculos
) {
  if (!militarId) {
    throw new Error(
      "Militar não identificado."
    );
  }

  const registros = vinculos.map(
    (vinculo) => ({
      id: vinculo.id || null,
      unidade_organizacional_id:
        Number(
          vinculo.unidadeOrganizacionalId
        ),
      funcao:
        String(vinculo.funcao ?? "")
          .trim()
          .toUpperCase(),
      ordem_secundaria:
        vinculo.ordemSecundaria === "" ||
        vinculo.ordemSecundaria === null ||
        vinculo.ordemSecundaria ===
          undefined
          ? null
          : Number(
              vinculo.ordemSecundaria
            ),
      lotacao_principal: Boolean(
        vinculo.lotacaoPrincipal
      ),
      mostrar_ordem_primaria: Boolean(
        vinculo.mostrarOrdemPrimaria
      ),
      data_inicio:
        vinculo.dataInicio ||
        new Date()
          .toISOString()
          .slice(0, 10),
    })
  );

  const { data, error } = await supabase.rpc(
    "salvar_vinculos_militar",
    {
      p_militar_id: Number(militarId),
      p_vinculos: registros,
    }
  );

  if (error) {
    console.error(
      "Erro ao salvar vínculos:",
      error
    );

    throw new Error(
      `Não foi possível salvar as lotações e funções: ${error.message}`
    );
  }

  return data;
}