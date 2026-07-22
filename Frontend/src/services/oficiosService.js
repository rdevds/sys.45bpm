import { supabase } from "./supabase.js";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001";

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function normalizarTexto(valor) {
  return String(valor ?? "")
    .trim()
    .toUpperCase();
}

function somenteNumeros(valor) {
  return String(valor ?? "").replace(
    /\D/g,
    ""
  );
}

function normalizarPlaca(valor) {
  return normalizarTexto(valor).replace(
    /[^A-Z0-9]/g,
    ""
  );
}

async function lerRespostaJson(
  resposta,
  mensagemErro
) {
  try {
    return await resposta.json();
  } catch (error) {
    console.error(
      "Resposta inválida recebida do backend:",
      error
    );

    throw new Error(mensagemErro);
  }
}

/* =========================================================
   BUSCAR VIATURA PELO PREFIXO
========================================================= */

export async function buscarViaturaPorPrefixo(
  prefixo
) {
  const prefixoNormalizado =
    somenteNumeros(prefixo);

  if (!prefixoNormalizado) {
    throw new Error(
      "Informe o prefixo da viatura."
    );
  }

  const { data, error } = await supabase
    .from("viaturas")
    .select(
      `
        id,
        prefixo,
        placa,
        marca,
        modelo,
        cidade,
        lotacao,
        situacao
      `
    )
    .eq(
      "prefixo",
      prefixoNormalizado
    )
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao buscar viatura pelo prefixo:",
      error
    );

    throw new Error(
      "Não foi possível consultar a viatura."
    );
  }

  if (!data) {
    throw new Error(
      `Nenhuma viatura encontrada com o prefixo ${prefixoNormalizado}.`
    );
  }

  return data;
}

/* =========================================================
   BUSCAR VIATURA PELA PLACA
========================================================= */

export async function buscarViaturaPorPlaca(
  placa
) {
  const placaNormalizada =
    normalizarPlaca(placa);

  if (placaNormalizada.length !== 7) {
    throw new Error(
      "Informe uma placa válida."
    );
  }

  const placaComHifen =
    `${placaNormalizada.slice(
      0,
      3
    )}-${placaNormalizada.slice(3)}`;

  const { data, error } = await supabase
    .from("viaturas")
    .select(
      `
        id,
        prefixo,
        placa,
        marca,
        modelo,
        cidade,
        lotacao,
        situacao
      `
    )
    .or(
      `placa.eq.${placaNormalizada},placa.eq.${placaComHifen}`
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao buscar viatura pela placa:",
      error
    );

    throw new Error(
      "Não foi possível consultar a viatura."
    );
  }

  if (!data) {
    throw new Error(
      `Nenhuma viatura encontrada com a placa ${placaComHifen}.`
    );
  }

  return data;
}

/* =========================================================
   BUSCAR VIATURA PARA O OFÍCIO
========================================================= */

export async function buscarViaturaParaOficio({
  prefixo,
  placa,
}) {
  if (somenteNumeros(prefixo)) {
    return buscarViaturaPorPrefixo(
      prefixo
    );
  }

  if (normalizarPlaca(placa)) {
    return buscarViaturaPorPlaca(
      placa
    );
  }

  throw new Error(
    "Informe o prefixo ou a placa da viatura."
  );
}

/* =========================================================
   CONSULTAR PRÓXIMO NÚMERO
========================================================= */

export async function buscarProximoNumeroOficio(
  ano = new Date().getFullYear()
) {
  const anoNumerico = Number(ano);

  if (!Number.isInteger(anoNumerico)) {
    throw new Error("Ano inválido.");
  }

  const { data, error } =
    await supabase.rpc(
      "proximo_numero_oficio_centralseg",
      {
        p_ano: anoNumerico,
      }
    );

  if (error) {
    console.error(
      "Erro ao consultar próximo número do ofício:",
      error
    );

    throw new Error(
      "Não foi possível consultar o próximo número do ofício."
    );
  }

  const numero = Number(data);

  if (
    !Number.isInteger(numero) ||
    numero <= 0
  ) {
    throw new Error(
      "O Supabase retornou um número de ofício inválido."
    );
  }

  return numero;
}

/* =========================================================
   LISTAR OFÍCIOS
========================================================= */

export async function buscarOficios() {
  let resposta;

  try {
    resposta = await fetch(
      `${API_URL}/api/oficios/centralseg`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );
  } catch (error) {
    console.error(
      "Erro de conexão ao buscar ofícios:",
      error
    );

    throw new Error(
      "Não foi possível conectar ao servidor para carregar os ofícios."
    );
  }

  const resultado =
    await lerRespostaJson(
      resposta,
      "O servidor retornou uma resposta inválida ao carregar os ofícios."
    );

  if (!resposta.ok) {
    throw new Error(
      resultado?.mensagem ||
        "Não foi possível carregar os ofícios."
    );
  }

  return Array.isArray(
    resultado?.oficios
  )
    ? resultado.oficios
    : [];
}

/* =========================================================
   GERAR NOVO OFÍCIO
========================================================= */

export async function gerarOficioCentralseg(
  dadosOficio
) {
  if (
    !dadosOficio ||
    typeof dadosOficio !== "object"
  ) {
    throw new Error(
      "Os dados do ofício não foram informados."
    );
  }

  let resposta;

  try {
    resposta = await fetch(
      `${API_URL}/api/oficios/centralseg`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(
          dadosOficio
        ),
      }
    );
  } catch (error) {
    console.error(
      "Erro de conexão com o backend:",
      error
    );

    throw new Error(
      "Não foi possível conectar ao servidor do SIGEF. Verifique se o backend está ligado."
    );
  }

  const resultado =
    await lerRespostaJson(
      resposta,
      "O servidor retornou uma resposta inválida ao gerar o ofício."
    );

  if (!resposta.ok) {
    const erros = Array.isArray(
      resultado?.erros
    )
      ? resultado.erros.join(" ")
      : "";

    throw new Error(
      [
        resultado?.mensagem,
        erros,
      ]
        .filter(Boolean)
        .join(" ") ||
        "Não foi possível gerar o ofício."
    );
  }

  if (!resultado?.oficio) {
    throw new Error(
      "O servidor não retornou os dados do ofício gerado."
    );
  }

  return resultado;
}

/* =========================================================
   ATUALIZAR OFÍCIO EXISTENTE
========================================================= */

export async function atualizarOficioCentralseg(
  id,
  dadosOficio
) {
  const oficioId = Number(id);

  if (
    !oficioId ||
    Number.isNaN(oficioId)
  ) {
    throw new Error(
      "Identificador do ofício inválido."
    );
  }

  if (
    !dadosOficio ||
    typeof dadosOficio !== "object"
  ) {
    throw new Error(
      "Os dados do ofício não foram informados."
    );
  }

  let resposta;

  try {
    resposta = await fetch(
      `${API_URL}/api/oficios/centralseg/${oficioId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(
          dadosOficio
        ),
      }
    );
  } catch (error) {
    console.error(
      "Erro de conexão ao atualizar o ofício:",
      error
    );

    throw new Error(
      "Não foi possível conectar ao servidor para atualizar o ofício."
    );
  }

  const resultado =
    await lerRespostaJson(
      resposta,
      "O servidor retornou uma resposta inválida ao atualizar o ofício."
    );

  if (!resposta.ok) {
    const erros = Array.isArray(
      resultado?.erros
    )
      ? resultado.erros.join(" ")
      : "";

    throw new Error(
      [
        resultado?.mensagem,
        erros,
      ]
        .filter(Boolean)
        .join(" ") ||
        "Não foi possível atualizar o ofício."
    );
  }

  if (!resultado?.oficio) {
    throw new Error(
      "O servidor não retornou os dados do ofício atualizado."
    );
  }

  return resultado;
}