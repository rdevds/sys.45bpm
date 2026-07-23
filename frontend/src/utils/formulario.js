/**
 * Padrões gerais de formulário do SYS45BPM.
 *
 * Regras:
 * - textos administrativos ficam em MAIÚSCULO;
 * - espaços internos são preservados durante a digitação;
 * - e-mail permanece minúsculo;
 * - senhas não são alteradas;
 * - documentos recebem formatação própria;
 * - campos numéricos aceitam somente caracteres válidos.
 */

const CAMPOS_MINUSCULOS = new Set([
  "email",
  "login",
  "usuario",
  "url",
]);

const CAMPOS_SEM_FORMATACAO = new Set([
  "senha",
  "password",
]);

const CAMPOS_SOMENTE_NUMEROS = new Set([
  "cnpj",
  "renavam",
  "prefixo",
  "numeroPolicia",
  "numero_policia",
]);

const CAMPOS_NUMERICOS_DECIMAIS = new Set([
  "capacidadeCarter",
  "capacidade_carter",
  "capacidadeTanque",
  "capacidade_tanque",
  "valorVenal",
  "valor_venal",
]);

const CAMPOS_NUMERICOS_INTEIROS = new Set([
  "ano",
  "odometro",
  "frequenciaTrocaOleo",
  "frequencia_troca_oleo",
  "valorVenalAno",
  "valor_venal_ano",
]);

/**
 * Converte qualquer valor em texto sem retirar
 * espaços enquanto o usuário estiver digitando.
 */
export function texto(valor) {
  return String(valor ?? "");
}

/**
 * Remove espaços apenas no início e no final.
 * Use esta função ao preparar os dados para salvar.
 */
export function textoLimpo(valor) {
  return texto(valor).trim();
}

/**
 * Converte para maiúsculo preservando os espaços.
 */
export function textoMaiusculo(valor) {
  return texto(valor).toUpperCase();
}

/**
 * Converte para minúsculo preservando os espaços.
 */
export function textoMinusculo(valor) {
  return texto(valor).toLowerCase();
}

/**
 * Remove tudo que não for número.
 */
export function somenteNumeros(valor) {
  return texto(valor).replace(/\D/g, "");
}

/**
 * Normaliza o e-mail para gravação.
 */
export function normalizarEmail(valor) {
  return textoLimpo(valor).toLowerCase();
}

/**
 * Formata placas antigas e Mercosul.
 *
 * Exemplos:
 * QNJ1890  -> QNJ-1890
 * ABC1D23  -> ABC-1D23
 */
export function formatarPlaca(valor) {
  const placa = textoMaiusculo(valor)
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);

  if (placa.length <= 3) {
    return placa;
  }

  return `${placa.slice(0, 3)}-${placa.slice(3)}`;
}

/**
 * Formata CPF durante a digitação.
 */
export function formatarCpf(valor) {
  const cpf = somenteNumeros(valor).slice(0, 11);

  if (cpf.length <= 3) {
    return cpf;
  }

  if (cpf.length <= 6) {
    return `${cpf.slice(0, 3)}.${cpf.slice(3)}`;
  }

  if (cpf.length <= 9) {
    return `${cpf.slice(0, 3)}.${cpf.slice(
      3,
      6
    )}.${cpf.slice(6)}`;
  }

  return `${cpf.slice(0, 3)}.${cpf.slice(
    3,
    6
  )}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

/**
 * Formata telefone durante a digitação.
 *
 * Exemplo:
 * 38999621014 -> 38 9 9962-1014
 */
export function formatarTelefone(valor) {
  const telefone = somenteNumeros(valor).slice(
    0,
    11
  );

  if (telefone.length <= 2) {
    return telefone;
  }

  if (telefone.length <= 7) {
    return `${telefone.slice(0, 2)} ${telefone.slice(
      2
    )}`;
  }

  if (telefone.length <= 10) {
    return `${telefone.slice(0, 2)} ${telefone.slice(
      2,
      6
    )}-${telefone.slice(6)}`;
  }

  return `${telefone.slice(0, 2)} ${telefone.slice(
    2,
    3
  )} ${telefone.slice(3, 7)}-${telefone.slice(7)}`;
}

/**
 * Permite números decimais durante a digitação.
 *
 * Aceita:
 * 6
 * 6.5
 * 6,5
 */
export function normalizarNumeroDecimal(valor) {
  let resultado = texto(valor)
    .replace(/[^\d,.-]/g, "")
    .replace(",", ".");

  const negativo = resultado.startsWith("-");

  resultado = resultado.replace(/-/g, "");

  const partes = resultado.split(".");

  if (partes.length > 1) {
    resultado = `${partes.shift()}.${partes.join("")}`;
  }

  return negativo
    ? `-${resultado}`
    : resultado;
}

/**
 * Aplica a regra correta conforme o campo.
 */
export function normalizarCampoFormulario(
  campo,
  valor
) {
  if (typeof valor === "boolean") {
    return valor;
  }

  if (CAMPOS_SEM_FORMATACAO.has(campo)) {
    return valor;
  }

  if (CAMPOS_MINUSCULOS.has(campo)) {
    return textoMinusculo(valor);
  }

  if (campo === "placa") {
    return formatarPlaca(valor);
  }

  if (campo === "cpf") {
    return formatarCpf(valor);
  }

  if (
    campo === "telefone" ||
    campo === "celular"
  ) {
    return formatarTelefone(valor);
  }

  if (CAMPOS_SOMENTE_NUMEROS.has(campo)) {
    return somenteNumeros(valor);
  }

  if (CAMPOS_NUMERICOS_DECIMAIS.has(campo)) {
    return normalizarNumeroDecimal(valor);
  }

  if (CAMPOS_NUMERICOS_INTEIROS.has(campo)) {
    return somenteNumeros(valor);
  }

  /*
   * Campos administrativos:
   * converte para maiúsculo sem retirar os espaços.
   */
  return textoMaiusculo(valor);
}

/**
 * Atualiza qualquer formulário seguindo o padrão SYS45BPM.
 */
export function atualizarFormulario(
  setFormulario,
  campo,
  valor
) {
  const valorNormalizado =
    normalizarCampoFormulario(
      campo,
      valor
    );

  setFormulario((atual) => ({
    ...atual,
    [campo]: valorNormalizado,
  }));
}