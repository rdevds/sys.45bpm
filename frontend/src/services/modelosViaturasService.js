import { supabase } from "./supabase";

const TABELA = "modelos_viaturas";

export async function buscarModelosViaturas({
  incluirInativos = true,
} = {}) {
  let consulta = supabase
    .from(TABELA)
    .select("*")
    .order("marca", { ascending: true })
    .order("modelo", { ascending: true })
    .order("ano", { ascending: true });

  if (!incluirInativos) {
    consulta = consulta.eq("ativo", true);
  }

  const { data, error } = await consulta;

  if (error) {
    throw new Error(
      `Não foi possível listar os modelos: ${error.message}`
    );
  }

  return data ?? [];
}

export async function salvarModeloViatura(modelo) {
  const registro = prepararModelo(modelo);

  const { data, error } = await supabase
    .from(TABELA)
    .insert(registro)
    .select()
    .single();

  if (error) {
    throw new Error(traduzirErro(error));
  }

  return data;
}

export async function atualizarModeloViatura(id, modelo) {
  const registro = prepararModelo(modelo);

  const { data, error } = await supabase
    .from(TABELA)
    .update(registro)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(traduzirErro(error));
  }

  return data;
}

export async function alterarStatusModeloViatura(
  id,
  ativo
) {
  const { data, error } = await supabase
    .from(TABELA)
    .update({
      ativo,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(
      `Não foi possível alterar o status: ${error.message}`
    );
  }

  return data;
}

function prepararModelo(modelo) {
  return {
    marca: textoMaiusculo(modelo.marca),
    modelo: textoMaiusculo(modelo.modelo),
    ano: Number(modelo.ano),

    combustivel: textoMaiusculo(
      modelo.combustivel
    ),

    tipo: textoMaiusculo(modelo.tipo),

    pneus: textoMaiusculo(modelo.pneus),

    capacidade_carter: Number(
      modelo.capacidadeCarter ??
        modelo.capacidade_carter
    ),

    especificacao_oleo: textoMaiusculo(
      modelo.especificacaoOleo ??
        modelo.especificacao_oleo
    ),

    capacidade_tanque: Number(
      modelo.capacidadeTanque ??
        modelo.capacidade_tanque
    ),

    frequencia_troca_oleo: Number(
      modelo.frequenciaTrocaOleo ??
        modelo.frequencia_troca_oleo
    ),

    observacao:
      modelo.observacao?.trim() || null,

    ativo: modelo.ativo !== false,
  };
}

function textoMaiusculo(valor) {
  return String(valor ?? "")
    .trim()
    .toUpperCase();
}

function traduzirErro(error) {
  const mensagem = String(
    error?.message ?? ""
  ).toLowerCase();

  if (
    mensagem.includes("duplicate") ||
    mensagem.includes("modelos_viaturas_unico")
  ) {
    return "Já existe um modelo cadastrado com essa marca, modelo e ano.";
  }

  return (
    error?.message ??
    "Não foi possível salvar o modelo."
  );
}