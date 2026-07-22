import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Building2,
  Car,
  LoaderCircle,
  Shield,
  UserRound,
  X,
} from "lucide-react";

import { supabase } from "../../../services/supabase.js";

import {
  atualizarMilitar,
  cadastrarMilitar,
  listarPostosGraduacoes,
} from "../../../services/militaresService.js";

import LotacoesFuncoesEditor, {
  criarVinculoVazio,
} from "./LotacoesFuncoesEditor.jsx";

import {
  listarVinculosMilitar,
  salvarVinculosMilitar,
} from "../../../services/lotacoesMilitaresService.js";

import "./Militares.css";

/* =========================================================
   CONSTANTES
========================================================= */

const PERFIS = [
  "ADMIN",
  "GESTOR",
  "COMANDANTE",
  "CONSULTA",
];

const CATEGORIAS_CNH = [
  "A",
  "B",
  "AB",
  "C",
  "AC",
  "D",
  "AD",
  "E",
  "AE",
];

const FORMULARIO_INICIAL = {
  numeroPolicia: "",
  postoGraduacaoId: "",
  postoGraduacao: "",
  tipoVinculo: "MILITAR",

  nome: "",
  nomeGuerra: "",
  nomePolicia: "",

  cpf: "",
  email: "",
  telefone: "",

  unidadeOrganizacionalId: "",
  cidade: "",
  fracao: "",
  funcao: "",
  ajusteOrdem: "",

  numeroCnh: "",
  categoriaCnh: "",
  validadeCnh: "",
  habilitadoDirigir: false,

  ordemAntiguidade: "",
  dataPromocao: "",
  dataInclusao: "",
  situacaoFuncional: "ATIVO",

  perfilSistema: "CONSULTA",
  acessoSistema: false,
  ativo: true,
};

/* =========================================================
   FUNÇÕES DE FORMATAÇÃO
========================================================= */

function somenteNumeros(valor = "") {
  return String(valor ?? "").replace(
    /\D/g,
    ""
  );
}

function textoMaiusculo(valor = "") {
  return String(valor ?? "")
    .trimStart()
    .toUpperCase();
}

function formatarNumeroPolicia(valor = "") {
  const numeros = somenteNumeros(valor).slice(
    0,
    7
  );

  if (numeros.length <= 3) {
    return numeros;
  }

  if (numeros.length <= 6) {
    return (
      `${numeros.slice(0, 3)}.` +
      numeros.slice(3)
    );
  }

  return (
    `${numeros.slice(0, 3)}.` +
    `${numeros.slice(3, 6)}-` +
    numeros.slice(6)
  );
}

function formatarCpf(valor = "") {
  const numeros = somenteNumeros(valor).slice(
    0,
    11
  );

  if (numeros.length <= 3) {
    return numeros;
  }

  if (numeros.length <= 6) {
    return (
      `${numeros.slice(0, 3)}.` +
      numeros.slice(3)
    );
  }

  if (numeros.length <= 9) {
    return (
      `${numeros.slice(0, 3)}.` +
      `${numeros.slice(3, 6)}.` +
      numeros.slice(6)
    );
  }

  return (
    `${numeros.slice(0, 3)}.` +
    `${numeros.slice(3, 6)}.` +
    `${numeros.slice(6, 9)}-` +
    numeros.slice(9)
  );
}

function formatarTelefone(valor = "") {
  const numeros = somenteNumeros(valor).slice(
    0,
    11
  );

  if (numeros.length <= 2) {
    return numeros;
  }

  if (numeros.length <= 6) {
    return (
      `(${numeros.slice(0, 2)}) ` +
      numeros.slice(2)
    );
  }

  if (numeros.length <= 10) {
    return (
      `(${numeros.slice(0, 2)}) ` +
      `${numeros.slice(2, 6)}-` +
      numeros.slice(6)
    );
  }

  return (
    `(${numeros.slice(0, 2)}) ` +
    `${numeros.slice(2, 7)}-` +
    numeros.slice(7)
  );
}

function validarEmail(email = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(email).trim()
  );
}

function validarCpf(valor = "") {
  const cpf = somenteNumeros(valor);

  if (cpf.length !== 11) {
    return false;
  }

  if (/^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  let soma = 0;

  for (
    let indice = 0;
    indice < 9;
    indice += 1
  ) {
    soma +=
      Number(cpf[indice]) *
      (10 - indice);
  }

  let primeiroDigito =
    11 - (soma % 11);

  if (primeiroDigito >= 10) {
    primeiroDigito = 0;
  }

  if (
    primeiroDigito !==
    Number(cpf[9])
  ) {
    return false;
  }

  soma = 0;

  for (
    let indice = 0;
    indice < 10;
    indice += 1
  ) {
    soma +=
      Number(cpf[indice]) *
      (11 - indice);
  }

  let segundoDigito =
    11 - (soma % 11);

  if (segundoDigito >= 10) {
    segundoDigito = 0;
  }

  return (
    segundoDigito ===
    Number(cpf[10])
  );
}

/**
 * A coluna antiga graduacao da tabela militares
 * ainda utiliza valores com "PM".
 *
 * Exemplo:
 * 3º SGT -> 3º SGT PM
 *
 * ASPM permanece sem PM, pois é servidor civil.
 */
function montarGraduacaoLegada(
  postoGraduacao,
  tipoVinculo
) {
  const posto = String(
    postoGraduacao ?? ""
  )
    .trim()
    .toUpperCase();

  if (!posto) {
    return "";
  }

  if (
    tipoVinculo === "ASPM" ||
    posto.startsWith("ASPM")
  ) {
    return posto;
  }

  if (posto.endsWith(" PM")) {
    return posto;
  }

  if (posto === "SUB TEN") {
    return "ST PM";
  }

  return `${posto} PM`;
}

function montarNomePolicia(
  postoGraduacao,
  nomeGuerra
) {
  const posto = String(
    postoGraduacao ?? ""
  ).trim();

  const guerra = String(
    nomeGuerra ?? ""
  )
    .trim()
    .toUpperCase();

  if (!posto || !guerra) {
    return "";
  }

  return `${posto} ${guerra}`;
}

function obterNomeGuerraInicial(
  militar
) {
  if (militar?.nome_guerra) {
    return String(
      militar.nome_guerra
    ).toUpperCase();
  }

  const nomePolicia = String(
    militar?.nome_policia ?? ""
  )
    .trim()
    .toUpperCase();

  const posto = String(
    militar?.posto_graduacao ??
      militar?.graduacao ??
      ""
  )
    .replace(/\s+PM$/i, "")
    .trim()
    .toUpperCase();

  if (
    nomePolicia &&
    posto &&
    nomePolicia.startsWith(posto)
  ) {
    return nomePolicia
      .slice(posto.length)
      .replace(/^\s+PM\s+/i, "")
      .trim();
  }

  const partes = String(
    militar?.nome ??
      militar?.nome_completo ??
      ""
  )
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean);

  return partes.at(-1) ?? "";
}

/* =========================================================
   COMPONENTE
========================================================= */

function NovoMilitarModal({
  aberto,
  militarEmEdicao = null,
  aoFechar,
  aoSalvar,
}) {
  const [
    formulario,
    setFormulario,
  ] = useState(
    FORMULARIO_INICIAL
  );

  const [
    postosGraduacoes,
    setPostosGraduacoes,
  ] = useState([]);

  const [
    unidades,
    setUnidades,
  ] = useState([]);

  const [
    carregandoReferencias,
    setCarregandoReferencias,
  ] = useState(false);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    vinculosLotacao,
    setVinculosLotacao,
  ] = useState([
    {
      ...criarVinculoVazio(),
      lotacaoPrincipal: true,
      mostrarOrdemPrimaria: true,
    },
  ]);

  const modoEdicao = Boolean(
    militarEmEdicao?.id
  );

  useEffect(() => {
    if (!aberto) {
      return;
    }

    async function carregarVinculos() {
      try {
        if (!militarEmEdicao?.id) {
          setVinculosLotacao([
            {
              ...criarVinculoVazio(),
              lotacaoPrincipal: true,
              mostrarOrdemPrimaria: true,
            },
          ]);
          return;
        }

        const dados =
          await listarVinculosMilitar(
            militarEmEdicao.id
          );

        if (dados.length > 0) {
          setVinculosLotacao(dados);
          return;
        }

        setVinculosLotacao([
          {
            ...criarVinculoVazio(),
            unidadeOrganizacionalId:
              militarEmEdicao
                .unidade_organizacional_id
                ? String(
                    militarEmEdicao
                      .unidade_organizacional_id
                  )
                : "",
            funcao:
              militarEmEdicao.funcao || "",
            ordemSecundaria:
              militarEmEdicao
                .ordem_secundaria ?? "",
            lotacaoPrincipal: true,
            mostrarOrdemPrimaria: true,
          },
        ]);
      } catch (error) {
        setErro(
          error?.message ||
            "NÃO FOI POSSÍVEL CARREGAR AS LOTAÇÕES."
        );
      }
    }

    carregarVinculos();
  }, [
    aberto,
    militarEmEdicao,
  ]);

  /* =======================================================
     CARREGAR POSTOS E UNIDADES
  ======================================================= */

  useEffect(() => {
    if (!aberto) {
      return;
    }

    carregarReferencias();
  }, [aberto]);

  async function carregarReferencias() {
    try {
      setCarregandoReferencias(true);
      setErro("");

      const [
        postos,
        unidadesResposta,
      ] = await Promise.all([
        listarPostosGraduacoes(),

        supabase
          .from(
            "vw_unidades_arvore_p1"
          )
          .select(
            `
              id,
              codigo,
              nome,
              sigla,
              tipo,
              cidade,
              nivel,
              caminho_ordem,
              caminho_nome,
              gera_ordem_secundaria,
              exibe_baliza,
              ativa
            `
          )
          .eq("ativa", true)
          .order("caminho_ordem", {
            ascending: true,
          }),
      ]);

      if (unidadesResposta.error) {
        throw new Error(
          `Não foi possível carregar as unidades: ${unidadesResposta.error.message}`
        );
      }

      setPostosGraduacoes(
        postos ?? []
      );

      setUnidades(
        unidadesResposta.data ?? []
      );
    } catch (error) {
      console.error(
        "Erro ao carregar referências:",
        error
      );

      setErro(
        error?.message ||
          "NÃO FOI POSSÍVEL CARREGAR OS DADOS DO FORMULÁRIO."
      );
    } finally {
      setCarregandoReferencias(false);
    }
  }

  /* =======================================================
     PREENCHER O FORMULÁRIO
  ======================================================= */

  useEffect(() => {
    if (!aberto) {
      return;
    }

    if (!militarEmEdicao) {
      setFormulario({
        ...FORMULARIO_INICIAL,
      });

      setErro("");
      return;
    }

    const postoGraduacao =
      militarEmEdicao.posto_graduacao ||
      String(
        militarEmEdicao.graduacao ?? ""
      )
        .replace(/\s+PM$/i, "")
        .replace(/^ST$/i, "SUB TEN")
        .trim();

    const nomeGuerra =
      obterNomeGuerraInicial(
        militarEmEdicao
      );

    setFormulario({
      numeroPolicia:
        militarEmEdicao.numero_policia ||
        "",

      postoGraduacaoId:
        militarEmEdicao.posto_graduacao_id
          ? String(
              militarEmEdicao.posto_graduacao_id
            )
          : "",

      postoGraduacao,

      tipoVinculo:
        militarEmEdicao.tipo_vinculo ||
        "MILITAR",

      nome:
        militarEmEdicao.nome ||
        militarEmEdicao.nome_completo ||
        "",

      nomeGuerra,

      nomePolicia:
        montarNomePolicia(
          postoGraduacao,
          nomeGuerra
        ) ||
        militarEmEdicao.nome_policia ||
        "",

      cpf:
        militarEmEdicao.cpf ||
        "",

      email:
        militarEmEdicao.email ||
        "",

      telefone:
        militarEmEdicao.telefone ||
        "",

      unidadeOrganizacionalId:
        militarEmEdicao
          .unidade_organizacional_id ||
        "",

      cidade:
        militarEmEdicao.cidade ||
        militarEmEdicao
          .cidade_unidade ||
        "",

      fracao:
        militarEmEdicao.fracao ||
        militarEmEdicao
          .unidade_sigla ||
        militarEmEdicao
          .unidade_nome ||
        "",

      funcao:
        militarEmEdicao.funcao ||
        militarEmEdicao
          .funcao_legada ||
        "",

      ajusteOrdem:
        militarEmEdicao.ajuste_ordem ??
        "",

      numeroCnh:
        militarEmEdicao.numero_cnh ||
        "",

      categoriaCnh:
        militarEmEdicao
          .categoria_cnh ||
        "",

      validadeCnh:
        militarEmEdicao
          .validade_cnh ||
        "",

      habilitadoDirigir:
        Boolean(
          militarEmEdicao
            .habilitado_dirigir ??
            (
              militarEmEdicao
                .categoria_cnh &&
              militarEmEdicao
                .validade_cnh
            )
        ),

      ordemAntiguidade:
        militarEmEdicao
          .ordem_antiguidade ??
        "",

      dataPromocao:
        militarEmEdicao
          .data_promocao ||
        "",

      dataInclusao:
        militarEmEdicao
          .data_inclusao ||
        "",

      situacaoFuncional:
        militarEmEdicao
          .situacao_funcional ||
        "ATIVO",

      perfilSistema:
        militarEmEdicao
          .perfil_sistema ||
        "CONSULTA",

      acessoSistema:
        Boolean(
          militarEmEdicao
            .acesso_sistema
        ),

      ativo:
        militarEmEdicao.ativo !==
        false,
    });

    setErro("");
  }, [
    aberto,
    militarEmEdicao,
  ]);

  /* =======================================================
     NOME DE POLÍCIA AUTOMÁTICO
  ======================================================= */

  useEffect(() => {
    const nomePolicia =
      montarNomePolicia(
        formulario.postoGraduacao,
        formulario.nomeGuerra
      );

    setFormulario(
      (formularioAtual) => {
        if (
          formularioAtual.nomePolicia ===
          nomePolicia
        ) {
          return formularioAtual;
        }

        return {
          ...formularioAtual,
          nomePolicia,
        };
      }
    );
  }, [
    formulario.postoGraduacao,
    formulario.nomeGuerra,
  ]);

  const postoSelecionado =
    useMemo(() => {
      const idSelecionado = String(
        formulario.postoGraduacaoId || ""
      );

      if (!idSelecionado) {
        return null;
      }

      return (
        postosGraduacoes.find(
          (posto) =>
            String(posto.id) ===
            idSelecionado
        ) || null
      );
    }, [
      postosGraduacoes,
      formulario.postoGraduacaoId,
    ]);

  const unidadeSelecionada =
    useMemo(() => {
      return unidades.find(
        (unidade) =>
          Number(unidade.id) ===
          Number(
            formulario
              .unidadeOrganizacionalId
          )
      );
    }, [
      unidades,
      formulario
        .unidadeOrganizacionalId,
    ]);

  if (!aberto) {
    return null;
  }

  /* =======================================================
     ATUALIZAÇÃO DOS CAMPOS
  ======================================================= */

  function atualizarCampo(
  campo,
  valor
) {
  let valorTratado = valor;

  if (
    [
      "nome",
      "nomeGuerra",
      "nomePolicia",
      "funcao",
      "categoriaCnh",
      "situacaoFuncional",
    ].includes(campo)
  ) {
    valorTratado =
      textoMaiusculo(valor);
  }

  if (campo === "email") {
    valorTratado = String(
      valor ?? ""
    ).toLowerCase();
  }

  setFormulario(
    (formularioAtual) => {
      const formularioAtualizado = {
        ...formularioAtual,
        [campo]: valorTratado,
      };

      if (campo === "numeroPolicia") {
        const numeroLimpo =
          somenteNumeros(valorTratado)
            .slice(0, 7);

        formularioAtualizado.numeroPolicia =
          numeroLimpo;

        formularioAtualizado.email =
          numeroLimpo.length === 7
            ? `${numeroLimpo}@pmmg.mg.gov.br`
            : "";
      }

      return formularioAtualizado;
    }
  );

  if (erro) {
    setErro("");
  }
}

  function selecionarPosto(
    postoId
  ) {
    const idSelecionado = String(
      postoId ?? ""
    );

    const posto =
      postosGraduacoes.find(
        (item) =>
          String(item.id) ===
          idSelecionado
      );

    if (!posto) {
      setFormulario(
        (formularioAtual) => ({
          ...formularioAtual,
          postoGraduacaoId: "",
          postoGraduacao: "",
          tipoVinculo: "MILITAR",
          nomePolicia: "",
        })
      );

      setErro("");
      return;
    }

    setFormulario(
      (formularioAtual) => ({
        ...formularioAtual,

        postoGraduacaoId:
          String(posto.id),

        postoGraduacao:
          posto.posto_graduacao,

        tipoVinculo:
          posto.tipo_vinculo ||
          "MILITAR",

        nomePolicia:
          montarNomePolicia(
            posto.posto_graduacao,
            formularioAtual.nomeGuerra
          ),
      })
    );

    setErro("");
  }

  function selecionarUnidade(
    unidadeId
  ) {
    const unidade =
      unidades.find(
        (item) =>
          Number(item.id) ===
          Number(unidadeId)
      );

    setFormulario(
      (formularioAtual) => ({
        ...formularioAtual,

        unidadeOrganizacionalId:
          unidade?.id || "",

        cidade:
          unidade?.cidade || "",

        fracao:
          unidade?.sigla ||
          unidade?.nome ||
          "",
      })
    );

    setErro("");
  }

  function limparFormulario() {
    setFormulario({
      ...FORMULARIO_INICIAL,
    });

    setVinculosLotacao([
      {
        ...criarVinculoVazio(),
        lotacaoPrincipal: true,
        mostrarOrdemPrimaria: true,
      },
    ]);

    setErro("");
  }

  function fecharModal() {
    if (salvando) {
      return;
    }

    limparFormulario();
    aoFechar();
  }

  /* =======================================================
     LOTAÇÃO
  ======================================================= */

  async function sincronizarLotacao({
    militarId,
    unidadeId,
    funcao,
    ajusteOrdem,
    dataInicio,
  }) {
    if (!militarId || !unidadeId) {
      throw new Error(
        "MILITAR OU UNIDADE ORGANIZACIONAL NÃO IDENTIFICADOS."
      );
    }

    const hoje = new Date()
      .toISOString()
      .slice(0, 10);

    const funcaoNormalizada =
      String(funcao ?? "")
        .trim()
        .toUpperCase() || null;

    const ajusteOrdemNormalizado =
      ajusteOrdem === "" ||
      ajusteOrdem === null ||
      ajusteOrdem === undefined
        ? null
        : Number(ajusteOrdem);

    if (
      ajusteOrdemNormalizado !== null &&
      (
        !Number.isInteger(
          ajusteOrdemNormalizado
        ) ||
        ajusteOrdemNormalizado < 1
      )
    ) {
      throw new Error(
        "A POSIÇÃO SECUNDÁRIA DA BALIZA DEVE SER UM NÚMERO INTEIRO MAIOR OU IGUAL A 1."
      );
    }

    const {
      data: lotacaoAtual,
      error: erroConsulta,
    } = await supabase
      .from("lotacoes_militares")
      .select(
        `
          id,
          unidade_organizacional_id,
          funcao,
          ajuste_ordem,
          data_inicio,
          data_fim
        `
      )
      .eq("militar_id", militarId)
      .eq("ativa", true)
      .eq("lotacao_principal", true)
      .maybeSingle();

    if (erroConsulta) {
      throw new Error(
        `NÃO FOI POSSÍVEL CONSULTAR A LOTAÇÃO: ${erroConsulta.message}`
      );
    }

    /*
     * Se o militar permanece na mesma lotação, alteramos
     * somente a função. A data de início original é preservada
     * para não corromper o histórico.
     */
    if (
      lotacaoAtual &&
      Number(
        lotacaoAtual.unidade_organizacional_id
      ) === Number(unidadeId)
    ) {
      const {
        error: erroAtualizacao,
      } = await supabase
        .from("lotacoes_militares")
        .update({
          funcao: funcaoNormalizada,
          ajuste_ordem:
            ajusteOrdemNormalizado,
          data_fim: null,
          lotacao_principal: true,
          ativa: true,
        })
        .eq("id", lotacaoAtual.id);

      if (erroAtualizacao) {
        throw new Error(
          `NÃO FOI POSSÍVEL ATUALIZAR A LOTAÇÃO: ${erroAtualizacao.message}`
        );
      }

      return;
    }

    /*
     * A data da nova lotação não pode ser anterior ao início
     * da lotação atual. Isso evita violar a restrição:
     *
     * data_fim IS NULL OR data_fim >= data_inicio
     */
    let inicioNovaLotacao =
      dataInicio || hoje;

    if (
      lotacaoAtual?.data_inicio &&
      inicioNovaLotacao <
        lotacaoAtual.data_inicio
    ) {
      inicioNovaLotacao =
        lotacaoAtual.data_inicio;
    }

    /*
     * Encerramos explicitamente a lotação anterior antes de
     * inserir a nova. Usamos a mesma data da movimentação como
     * data final, pois a restrição aceita data_fim igual à
     * data_inicio.
     */
    if (lotacaoAtual) {
      const {
        error: erroEncerramento,
      } = await supabase
        .from("lotacoes_militares")
        .update({
          data_fim: inicioNovaLotacao,
          lotacao_principal: false,
          ativa: false,
        })
        .eq("id", lotacaoAtual.id);

      if (erroEncerramento) {
        throw new Error(
          `NÃO FOI POSSÍVEL ENCERRAR A LOTAÇÃO ANTERIOR: ${erroEncerramento.message}`
        );
      }
    }

    const {
      error: erroInclusao,
    } = await supabase
      .from("lotacoes_militares")
      .insert({
        militar_id: militarId,

        unidade_organizacional_id:
          Number(unidadeId),

        funcao: funcaoNormalizada,

        ajuste_ordem:
          ajusteOrdemNormalizado,

        data_inicio:
          inicioNovaLotacao,

        data_fim: null,
        lotacao_principal: true,
        ativa: true,
      });

    if (erroInclusao) {
      /*
       * Caso a inclusão falhe depois do encerramento, tentamos
       * reativar a lotação anterior para não deixar o militar
       * sem lotação principal.
       */
      if (lotacaoAtual) {
        await supabase
          .from("lotacoes_militares")
          .update({
            data_fim: null,
            lotacao_principal: true,
            ativa: true,
          })
          .eq("id", lotacaoAtual.id);
      }

      throw new Error(
        `NÃO FOI POSSÍVEL REGISTRAR A LOTAÇÃO: ${erroInclusao.message}`
      );
    }
  }

  /* =======================================================
     MOVIMENTAÇÃO
  ======================================================= */

  async function registrarMovimentacao({
    militarId,
    unidadeAnteriorId,
    unidadeNovaId,
    postoAnteriorId,
    postoNovoId,
    funcaoAnterior,
    funcaoNova,
    dataMovimentacao,
  }) {
    const alterouUnidade =
      Number(unidadeAnteriorId || 0) !==
      Number(unidadeNovaId || 0);

    const alterouPosto =
      Number(postoAnteriorId || 0) !==
      Number(postoNovoId || 0);

    const alterouFuncao =
      String(
        funcaoAnterior ?? ""
      )
        .trim()
        .toUpperCase() !==
      String(funcaoNova ?? "")
        .trim()
        .toUpperCase();

    let tipoMovimentacao = null;

    if (!modoEdicao) {
      tipoMovimentacao =
        "INCLUSAO";
    } else if (alterouPosto) {
      tipoMovimentacao =
        "PROMOCAO";
    } else if (alterouUnidade) {
      tipoMovimentacao =
        "TRANSFERENCIA";
    } else if (alterouFuncao) {
      tipoMovimentacao =
        "MUDANCA_FUNCAO";
    }

    if (!tipoMovimentacao) {
      return;
    }

    const {
      error: erroMovimentacao,
    } = await supabase
      .from(
        "movimentacoes_militares"
      )
      .insert({
        militar_id: militarId,

        tipo_movimentacao:
          tipoMovimentacao,

        unidade_origem_id:
          unidadeAnteriorId ||
          null,

        unidade_destino_id:
          unidadeNovaId ||
          null,

        posto_graduacao_anterior_id:
          postoAnteriorId ||
          null,

        posto_graduacao_novo_id:
          postoNovoId ||
          null,

        funcao_anterior:
          funcaoAnterior ||
          null,

        funcao_nova:
          funcaoNova ||
          null,

        data_movimentacao:
          dataMovimentacao ||
          new Date()
            .toISOString()
            .slice(0, 10),

        motivo: modoEdicao
          ? "ATUALIZAÇÃO DO CADASTRO DO MILITAR."
          : "INCLUSÃO DO MILITAR NO SYS45.",

        situacao:
          "REGISTRADA",

        responsavel:
          "SYS45",
      });

    if (erroMovimentacao) {
      console.error(
        "Não foi possível registrar a movimentação:",
        erroMovimentacao
      );

      /*
       * A falha no histórico não desfaz o cadastro
       * principal, mas fica registrada no console.
       */
    }
  }

  /* =======================================================
     VALIDAÇÃO
  ======================================================= */

  function validarFormulario() {
    const numeroPolicia =
      somenteNumeros(
        formulario.numeroPolicia
      );

    const cpf =
      somenteNumeros(
        formulario.cpf
      );

    const telefone =
      somenteNumeros(
        formulario.telefone
      );

    if (
      numeroPolicia.length !== 7
    ) {
      throw new Error(
        "O NÚMERO DE POLÍCIA DEVE POSSUIR EXATAMENTE 7 DÍGITOS."
      );
    }

    if (
      !formulario.postoGraduacaoId
    ) {
      throw new Error(
        "SELECIONE O POSTO OU GRADUAÇÃO."
      );
    }

    if (
      !formulario.nome.trim()
    ) {
      throw new Error(
        "INFORME O NOME COMPLETO."
      );
    }

    if (
      !formulario.nomeGuerra.trim()
    ) {
      throw new Error(
        "INFORME O NOME DE GUERRA."
      );
    }

    if (
      !formulario.nomePolicia.trim()
    ) {
      throw new Error(
        "NÃO FOI POSSÍVEL GERAR O NOME DE POLÍCIA."
      );
    }

    if (cpf.length !== 11) {
      throw new Error(
        "O CPF DEVE POSSUIR EXATAMENTE 11 DÍGITOS."
      );
    }

    if (!validarCpf(cpf)) {
      throw new Error(
        "INFORME UM CPF VÁLIDO."
      );
    }

    if (
      !formulario.email.trim()
    ) {
      throw new Error(
        "INFORME O E-MAIL."
      );
    }

    if (
      !validarEmail(
        formulario.email
      )
    ) {
      throw new Error(
        "INFORME UM E-MAIL VÁLIDO."
      );
    }

    if (
      telefone &&
      telefone.length < 10
    ) {
      throw new Error(
        "INFORME UM TELEFONE VÁLIDO."
      );
    }

    if (
      !Array.isArray(vinculosLotacao) ||
      vinculosLotacao.length === 0
    ) {
      throw new Error(
        "INFORME PELO MENOS UMA LOTAÇÃO OU FUNÇÃO."
      );
    }

    vinculosLotacao.forEach(
      (vinculo, indice) => {
        if (
          !vinculo.unidadeOrganizacionalId
        ) {
          throw new Error(
            `SELECIONE A UNIDADE DA FUNÇÃO ${indice + 1}.`
          );
        }

        if (!String(vinculo.funcao).trim()) {
          throw new Error(
            `INFORME A FUNÇÃO ${indice + 1}.`
          );
        }

        if (
          vinculo.ordemSecundaria !== "" &&
          (
            !Number.isInteger(
              Number(
                vinculo.ordemSecundaria
              )
            ) ||
            Number(
              vinculo.ordemSecundaria
            ) < 1
          )
        ) {
          throw new Error(
            `A ORDEM SECUNDÁRIA DA FUNÇÃO ${indice + 1} DEVE SER UM INTEIRO MAIOR OU IGUAL A 1.`
          );
        }
      }
    );

    if (
      vinculosLotacao.filter(
        (item) => item.lotacaoPrincipal
      ).length !== 1
    ) {
      throw new Error(
        "MARQUE EXATAMENTE UMA LOTAÇÃO PRINCIPAL."
      );
    }

    if (
      vinculosLotacao.filter(
        (item) =>
          item.mostrarOrdemPrimaria
      ).length !== 1
    ) {
      throw new Error(
        "ESCOLHA EXATAMENTE UMA SEÇÃO PARA MOSTRAR A ORDEM PRIMÁRIA."
      );
    }

    if (
      formulario.ajusteOrdem !== "" &&
      (
        !Number.isInteger(
          Number(
            formulario.ajusteOrdem
          )
        ) ||
        Number(
          formulario.ajusteOrdem
        ) < 1
      )
    ) {
      throw new Error(
        "A POSIÇÃO SECUNDÁRIA DA BALIZA DEVE SER UM NÚMERO INTEIRO MAIOR OU IGUAL A 1."
      );
    }

    if (
      formulario.habilitadoDirigir &&
      !formulario.categoriaCnh
    ) {
      throw new Error(
        "INFORME A CATEGORIA DA CNH."
      );
    }

    if (
      formulario.habilitadoDirigir &&
      !formulario.validadeCnh
    ) {
      throw new Error(
        "INFORME A VALIDADE DA CNH."
      );
    }

    return {
      numeroPolicia,
      cpf,
      telefone,
    };
  }

  /* =======================================================
     SALVAR
  ======================================================= */

  async function salvar(event) {
    event.preventDefault();

    try {
      setErro("");

      const {
        numeroPolicia,
        cpf,
        telefone,
      } = validarFormulario();

      setSalvando(true);

      const graduacaoLegada =
        montarGraduacaoLegada(
          formulario.postoGraduacao,
          formulario.tipoVinculo
        );

      const vinculoPrincipal =
        vinculosLotacao.find(
          (item) => item.lotacaoPrincipal
        );

      const unidadePrincipal =
        unidades.find(
          (unidade) =>
            Number(unidade.id) ===
            Number(
              vinculoPrincipal
                ?.unidadeOrganizacionalId
            )
        );

      const dadosMilitar = {
        numeroPolicia,

        /*
         * Valor compatível com a coluna antiga.
         */
        graduacao:
          graduacaoLegada,

        postoGraduacao:
          formulario
            .postoGraduacao,

        posto_graduacao:
          formulario
            .postoGraduacao,

        nome:
          formulario.nome
            .trim()
            .toUpperCase(),

        nomeGuerra:
          formulario.nomeGuerra
            .trim()
            .toUpperCase(),

        nomePolicia:
          formulario.nomePolicia
            .trim()
            .toUpperCase(),

        cpf,

        email:
          formulario.email
            .trim()
            .toLowerCase(),

        telefone:
          telefone || null,

        cidade:
          String(
            unidadePrincipal?.cidade || ""
          )
            .trim()
            .toUpperCase(),

        fracao:
          String(
            unidadePrincipal?.sigla ||
            unidadePrincipal?.nome ||
            ""
          )
            .trim()
            .toUpperCase(),

        funcao:
          String(
            vinculoPrincipal?.funcao || ""
          )
            .trim()
            .toUpperCase(),

        numeroCnh:
          somenteNumeros(
            formulario.numeroCnh
          ) || null,

        categoriaCnh:
          formulario.categoriaCnh ||
          null,

        validadeCnh:
          formulario.validadeCnh ||
          null,

        habilitadoDirigir:
          Boolean(
            formulario.habilitadoDirigir
          ),

        perfilSistema:
          formulario.perfilSistema,

        acessoSistema:
          Boolean(
            formulario.acessoSistema
          ),

        ordemAntiguidade:
          formulario.ordemAntiguidade ||
          null,

        dataPromocao:
          formulario.dataPromocao ||
          null,

        dataInclusao:
          formulario.dataInclusao ||
          null,

        situacaoFuncional:
          formulario
            .situacaoFuncional,

        ativo:
          Boolean(
            formulario.ativo
          ),
      };

      const militarSalvo =
        modoEdicao
          ? await atualizarMilitar(
              militarEmEdicao.id,
              dadosMilitar
            )
          : await cadastrarMilitar(
              dadosMilitar
            );

      const militarId =
        militarSalvo?.id ||
        militarSalvo?.militar_id ||
        militarEmEdicao?.id;

      if (!militarId) {
        throw new Error(
          "O MILITAR FOI SALVO, MAS O IDENTIFICADOR NÃO FOI RETORNADO."
        );
      }

      await salvarVinculosMilitar(
        militarId,
        vinculosLotacao
      );

      await registrarMovimentacao({
        militarId,

        unidadeAnteriorId:
          militarEmEdicao
            ?.unidade_organizacional_id,

        unidadeNovaId:
          vinculoPrincipal
            ?.unidadeOrganizacionalId,

        postoAnteriorId:
          militarEmEdicao
            ?.posto_graduacao_id,

        postoNovoId:
          formulario
            .postoGraduacaoId,

        funcaoAnterior:
          militarEmEdicao?.funcao,

        funcaoNova:
          vinculoPrincipal?.funcao,

        dataMovimentacao:
          formulario.dataInclusao ||
          new Date()
            .toISOString()
            .slice(0, 10),
      });

      limparFormulario();

      await aoSalvar(
        militarSalvo
      );
    } catch (error) {
      console.error(
        "Erro ao salvar militar:",
        error
      );

      setErro(
        error?.message ||
          (modoEdicao
            ? "NÃO FOI POSSÍVEL ATUALIZAR O MILITAR."
            : "NÃO FOI POSSÍVEL CADASTRAR O MILITAR.")
      );
    } finally {
      setSalvando(false);
    }
  }

  /* =======================================================
     RENDERIZAÇÃO
  ======================================================= */

  return (
    <div
      className="militar-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          fecharModal();
        }
      }}
    >
      <section
        className="militar-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="novo-militar-titulo"
      >
        <header className="militar-modal-cabecalho">
          <div>
            <span>
              {modoEdicao
                ? "EDIÇÃO"
                : "CADASTRO"}
            </span>

            <h2 id="novo-militar-titulo">
              {modoEdicao
                ? "Editar militar"
                : "Novo militar"}
            </h2>
          </div>

          <button
            type="button"
            className="militar-modal-fechar"
            onClick={fecharModal}
            aria-label="Fechar cadastro"
            disabled={salvando}
          >
            <X size={21} />
          </button>
        </header>

        {carregandoReferencias ? (
          <div className="militares-mensagem">
            <LoaderCircle
              size={24}
              className="oficios-spinner"
            />

            Carregando postos e unidades...
          </div>
        ) : (
          <form
            className="militar-formulario"
            onSubmit={salvar}
            noValidate
          >
            {/* IDENTIFICAÇÃO */}

            <fieldset>
              <legend>
                <UserRound size={18} />
                Identificação
              </legend>

              <div className="militar-form-grid">
                <label>
                  Número de Polícia *
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={formatarNumeroPolicia(
                      formulario.numeroPolicia
                    )}
                    onChange={(event) => {
                      atualizarCampo(
                        "numeroPolicia",
                        somenteNumeros(
                          event.target.value
                        ).slice(0, 7)
                      );
                    }}
                    placeholder="156.457-4"
                  />
                </label>

                <label>
                  CPF *
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={formatarCpf(
                      formulario.cpf
                    )}
                    onChange={(event) => {
                      atualizarCampo(
                        "cpf",
                        somenteNumeros(
                          event.target.value
                        ).slice(0, 11)
                      );
                    }}
                    placeholder="000.000.000-00"
                  />
                </label>

                <label>
                  Posto/Graduação *

                  <select
                    value={String(
                      formulario.postoGraduacaoId ||
                        ""
                    )}
                    onChange={(event) => {
                      selecionarPosto(
                        event.target.value
                      );
                    }}
                  >
                    <option value="">
                      SELECIONE
                    </option>

                    {postosGraduacoes.map(
                      (posto) => (
                        <option
                          key={String(
                            posto.id
                          )}
                          value={String(
                            posto.id
                          )}
                        >
                          {
                            posto.posto_graduacao
                          }

                          {posto.tipo_vinculo ===
                          "ASPM"
                            ? " — SERVIDOR CIVIL"
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Classificação
                  <input
                    type="text"
                    readOnly
                    value={
                      formulario.tipoVinculo ===
                      "ASPM"
                        ? "SERVIDOR CIVIL"
                        : "MILITAR"
                    }
                  />
                </label>

                <label className="militar-campo-largo">
                  Nome completo *
                  <input
                    type="text"
                    value={
                      formulario.nome
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        "nome",
                        event.target.value
                      )
                    }
                    placeholder="RIVANIL DUARTE DE SOUZA"
                  />
                </label>

                <label>
                  Nome de guerra *
                  <input
                    type="text"
                    value={
                      formulario.nomeGuerra
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        "nomeGuerra",
                        event.target.value
                      )
                    }
                    placeholder="DUARTE"
                  />
                </label>

                <label>
                  Nome de Polícia *
                  <input
                    type="text"
                    value={
                      formulario.nomePolicia
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        "nomePolicia",
                        event.target.value
                      )
                    }
                    placeholder="3º SGT DUARTE"
                  />

                  <small>
                    Gerado automaticamente, mas pode
                    ser ajustado pela P1.
                  </small>
                </label>

                <label>
                  Ordem de antiguidade
                  <input
                    type="number"
                    min="1"
                    value={
                      formulario
                        .ordemAntiguidade
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        "ordemAntiguidade",
                        event.target.value
                      )
                    }
                    placeholder="Ex.: 15"
                  />
                </label>

                <label>
                  Data da promoção
                  <input
                    type="date"
                    value={
                      formulario.dataPromocao
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        "dataPromocao",
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Data de inclusão
                  <input
                    type="date"
                    value={
                      formulario.dataInclusao
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        "dataInclusao",
                        event.target.value
                      )
                    }
                  />
                </label>
              </div>
            </fieldset>

            {/* LOTAÇÕES E FUNÇÕES */}

            <fieldset>
              <legend>
                <Building2 size={18} />
                Lotações e funções
              </legend>

              <LotacoesFuncoesEditor
                unidades={unidades}
                vinculos={vinculosLotacao}
                onChange={
                  setVinculosLotacao
                }
                disabled={salvando}
              />
            </fieldset>

            {/* CONTATO */}

            <fieldset>
              <legend>Contato</legend>

              <div className="militar-form-grid">
                <label>
                  Telefone
                  <input
                    type="text"
                    inputMode="tel"
                    autoComplete="tel"
                    value={formatarTelefone(
                      formulario.telefone
                    )}
                    onChange={(event) => {
                      atualizarCampo(
                        "telefone",
                        somenteNumeros(
                          event.target.value
                        ).slice(0, 11)
                      );
                    }}
                    placeholder="(38) 99999-9999"
                  />
                </label>

                <label className="militar-campo-largo">
                  E-mail *
                  <input
                    type="email"
                    autoComplete="email"
                    value={
                      formulario.email
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        "email",
                        event.target.value
                      )
                    }
                    placeholder="militar@pmmg.mg.gov.br"
                  />
                </label>
              </div>
            </fieldset>

            {/* CNH */}

            <fieldset>
              <legend>
                <Car size={18} />
                CNH
              </legend>

              <div className="militar-form-grid">
                <label>
                  Número da CNH
                  <input
                    type="text"
                    inputMode="numeric"
                    value={
                      formulario.numeroCnh
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        "numeroCnh",
                        somenteNumeros(
                          event.target.value
                        )
                      )
                    }
                    placeholder="NÚMERO DA CNH"
                  />
                </label>

                <label>
                  Categoria
                  <select
                    value={
                      formulario
                        .categoriaCnh
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        "categoriaCnh",
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      NÃO INFORMADA
                    </option>

                    {CATEGORIAS_CNH.map(
                      (categoria) => (
                        <option
                          key={categoria}
                          value={categoria}
                        >
                          {categoria}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Validade
                  <input
                    type="date"
                    value={
                      formulario.validadeCnh
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        "validadeCnh",
                        event.target.value
                      )
                    }
                  />
                </label>

                <div className="militar-opcoes">
                  <label className="militar-checkbox">
                    <input
                      type="checkbox"
                      checked={
                        formulario
                          .habilitadoDirigir
                      }
                      onChange={(event) =>
                        atualizarCampo(
                          "habilitadoDirigir",
                          event.target.checked
                        )
                      }
                    />

                    Habilitado para dirigir
                  </label>
                </div>
              </div>
            </fieldset>

            {/* SISTEMA */}

            <fieldset>
              <legend>
                <Shield size={18} />
                Sistema
              </legend>

              <div className="militar-form-grid">
                <label>
                  Situação funcional
                  <select
                    value={
                      formulario
                        .situacaoFuncional
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        "situacaoFuncional",
                        event.target.value
                      )
                    }
                  >
                    <option value="ATIVO">
                      ATIVO
                    </option>

                    <option value="AFASTADO">
                      AFASTADO
                    </option>

                    <option value="AGREGADO">
                      AGREGADO
                    </option>

                    <option value="TRANSFERIDO">
                      TRANSFERIDO
                    </option>

                    <option value="INATIVO">
                      INATIVO
                    </option>
                  </select>
                </label>

                <label>
                  Perfil
                  <select
                    value={
                      formulario
                        .perfilSistema
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        "perfilSistema",
                        event.target.value
                      )
                    }
                  >
                    {PERFIS.map(
                      (perfil) => (
                        <option
                          key={perfil}
                          value={perfil}
                        >
                          {perfil}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <div className="militar-opcoes">
                  <label className="militar-checkbox">
                    <input
                      type="checkbox"
                      checked={
                        formulario
                          .acessoSistema
                      }
                      onChange={(event) =>
                        atualizarCampo(
                          "acessoSistema",
                          event.target.checked
                        )
                      }
                    />

                    Acesso ao sistema
                  </label>

                  <label className="militar-checkbox">
                    <input
                      type="checkbox"
                      checked={
                        formulario.ativo
                      }
                      onChange={(event) =>
                        atualizarCampo(
                          "ativo",
                          event.target.checked
                        )
                      }
                    />

                    Cadastro ativo
                  </label>
                </div>
              </div>
            </fieldset>

            {postoSelecionado && (
              <div className="militares-mensagem">
                <strong>
                  {
                    postoSelecionado
                      .posto_graduacao
                  }
                </strong>

                {" — "}

                {postoSelecionado.tipo_vinculo ===
                "ASPM"
                  ? "Servidor civil. Não entra no cálculo da Baliza nem da Carta de Situação."
                  : "Militar. Entra na Baliza e na Carta de Situação."}
              </div>
            )}

            {erro && (
              <div className="militar-form-erro">
                {erro}
              </div>
            )}

            <footer className="militar-modal-rodape">
              <button
                type="button"
                className="militar-botao-cancelar"
                onClick={fecharModal}
                disabled={salvando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="militar-botao-salvar"
                disabled={
                  salvando ||
                  carregandoReferencias
                }
              >
                {salvando ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="oficios-spinner"
                    />
                    Salvando...
                  </>
                ) : modoEdicao ? (
                  "Salvar alterações"
                ) : (
                  "Salvar militar"
                )}
              </button>
            </footer>
          </form>
        )}
      </section>
    </div>
  );
}

export default NovoMilitarModal;