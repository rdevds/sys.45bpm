import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  LoaderCircle,
  Network,
  RefreshCw,
} from "lucide-react";

import ArvoreOrganizacional from "./components/ArvoreOrganizacional.jsx";
import BarraFerramentas from "./components/BarraFerramentas.jsx";
import Indicadores from "./components/Indicadores.jsx";
import PainelDetalhes from "./components/PainelDetalhes.jsx";
import PainelEdicao from "./components/PainelEdicao.jsx";

import {
  atualizarUnidadeOrganizacional,
  buscarEstruturaOrganizacional,
} from "./services/estruturaService.js";

import {
  texto,
  textoMaiusculo,
} from "./utils/icones.jsx";

import "./EstruturaOrganizacional.css";

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function normalizarPesquisa(valor) {
  return textoMaiusculo(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function montarArvore(unidades = []) {
  const mapa = new Map();
  const raizes = [];

  unidades.forEach((unidade) => {
    mapa.set(Number(unidade.id), {
      ...unidade,
      filhos: [],
    });
  });

  mapa.forEach((unidade) => {
    const paiId = unidade.unidade_pai_id
      ? Number(unidade.unidade_pai_id)
      : null;

    if (paiId && mapa.has(paiId)) {
      mapa.get(paiId).filhos.push(unidade);
    } else {
      raizes.push(unidade);
    }
  });

  function ordenar(lista) {
    lista.sort((a, b) => {
      const ordemA =
        Number(a.ordem_exibicao) || 999999;

      const ordemB =
        Number(b.ordem_exibicao) || 999999;

      if (ordemA !== ordemB) {
        return ordemA - ordemB;
      }

      return texto(a.nome).localeCompare(
        texto(b.nome),
        "pt-BR"
      );
    });

    lista.forEach((item) => {
      ordenar(item.filhos);
    });
  }

  ordenar(raizes);

  return raizes;
}

function obterTodosIds(unidades = []) {
  const ids = [];

  function percorrer(lista) {
    lista.forEach((unidade) => {
      ids.push(Number(unidade.id));

      if (unidade.filhos?.length) {
        percorrer(unidade.filhos);
      }
    });
  }

  percorrer(unidades);

  return ids;
}

function obterIdsIniciaisAbertos(arvore = []) {
  const ids = new Set();

  arvore.forEach((raiz) => {
    ids.add(Number(raiz.id));

    raiz.filhos?.forEach((filho) => {
      ids.add(Number(filho.id));
    });
  });

  return ids;
}

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

function EstruturaOrganizacional() {
  const [
    unidades,
    setUnidades,
  ] = useState([]);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    pesquisa,
    setPesquisa,
  ] = useState("");

  const [
    unidadesAbertas,
    setUnidadesAbertas,
  ] = useState(new Set());

  const [
    unidadeSelecionada,
    setUnidadeSelecionada,
  ] = useState(null);

  const [
    modoEdicao,
    setModoEdicao,
  ] = useState(false);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    erroEdicao,
    setErroEdicao,
  ] = useState("");

  /* =======================================================
     CARREGAMENTO
  ======================================================= */

  const carregarEstrutura =
    useCallback(async () => {
      try {
        setCarregando(true);
        setErro("");

        const lista =
          await buscarEstruturaOrganizacional();

        setUnidades(lista);

        const arvoreCarregada =
          montarArvore(lista);

        setUnidadesAbertas(
          obterIdsIniciaisAbertos(
            arvoreCarregada
          )
        );

        setUnidadeSelecionada(
          (selecionadaAtual) => {
            if (!selecionadaAtual?.id) {
              return (
                arvoreCarregada[0] ??
                null
              );
            }

            return (
              lista.find(
                (unidade) =>
                  Number(unidade.id) ===
                  Number(
                    selecionadaAtual.id
                  )
              ) ??
              arvoreCarregada[0] ??
              null
            );
          }
        );
      } catch (error) {
        console.error(
          "Erro ao carregar estrutura organizacional:",
          error
        );

        setErro(
          error?.message ||
            "NÃO FOI POSSÍVEL CARREGAR A ESTRUTURA ORGANIZACIONAL."
        );
      } finally {
        setCarregando(false);
      }
    }, []);

  useEffect(() => {
    carregarEstrutura();
  }, [carregarEstrutura]);

  /* =======================================================
     FILTRO E ÁRVORE
  ======================================================= */

  const unidadesFiltradas =
    useMemo(() => {
      const termo =
        normalizarPesquisa(
          pesquisa
        );

      if (!termo) {
        return unidades;
      }

      const idsEncontrados =
        new Set();

      const mapaPorId =
        new Map(
          unidades.map((unidade) => [
            Number(unidade.id),
            unidade,
          ])
        );

      unidades.forEach((unidade) => {
        const conteudo =
          normalizarPesquisa(
            [
              unidade.codigo,
              unidade.nome,
              unidade.sigla,
              unidade.tipo,
              unidade.cidade,
              unidade.caminho_nome,
            ].join(" ")
          );

        if (!conteudo.includes(termo)) {
          return;
        }

        idsEncontrados.add(
          Number(unidade.id)
        );

        let paiId =
          unidade.unidade_pai_id
            ? Number(
                unidade.unidade_pai_id
              )
            : null;

        while (
          paiId &&
          mapaPorId.has(paiId)
        ) {
          idsEncontrados.add(paiId);

          const pai =
            mapaPorId.get(paiId);

          paiId =
            pai?.unidade_pai_id
              ? Number(
                  pai.unidade_pai_id
                )
              : null;
        }
      });

      return unidades.filter(
        (unidade) =>
          idsEncontrados.has(
            Number(unidade.id)
          )
      );
    }, [
      unidades,
      pesquisa,
    ]);

  const arvore =
    useMemo(
      () =>
        montarArvore(
          unidadesFiltradas
        ),
      [unidadesFiltradas]
    );

  /* =======================================================
     DADOS DA UNIDADE SELECIONADA
  ======================================================= */

  const unidadePaiSelecionada =
    useMemo(() => {
      if (
        !unidadeSelecionada?.unidade_pai_id
      ) {
        return null;
      }

      return (
        unidades.find(
          (unidade) =>
            Number(unidade.id) ===
            Number(
              unidadeSelecionada.unidade_pai_id
            )
        ) ?? null
      );
    }, [
      unidades,
      unidadeSelecionada,
    ]);

  const quantidadeSubunidades =
    useMemo(() => {
      if (!unidadeSelecionada?.id) {
        return 0;
      }

      return unidades.filter(
        (unidade) =>
          Number(
            unidade.unidade_pai_id
          ) ===
          Number(
            unidadeSelecionada.id
          )
      ).length;
    }, [
      unidades,
      unidadeSelecionada,
    ]);

  /* =======================================================
     INDICADORES
  ======================================================= */

  const totalAtivas =
    useMemo(
      () =>
        unidades.filter(
          (unidade) =>
            unidade.ativa !== false
        ).length,
      [unidades]
    );

  const totalBaliza =
    useMemo(
      () =>
        unidades.filter(
          (unidade) =>
            unidade.exibe_baliza === true
        ).length,
      [unidades]
    );

  /* =======================================================
     AÇÕES DA ÁRVORE
  ======================================================= */

  function alternarUnidade(id) {
    const idNumerico =
      Number(id);

    setUnidadesAbertas(
      (estadoAtual) => {
        const novosIds =
          new Set(estadoAtual);

        if (
          novosIds.has(idNumerico)
        ) {
          novosIds.delete(
            idNumerico
          );
        } else {
          novosIds.add(
            idNumerico
          );
        }

        return novosIds;
      }
    );
  }

  function expandirTudo() {
    setUnidadesAbertas(
      new Set(
        obterTodosIds(arvore)
      )
    );
  }

  function recolherTudo() {
    setUnidadesAbertas(
      new Set()
    );
  }

  function selecionarUnidade(unidade) {
    if (salvando) {
      return;
    }

    setUnidadeSelecionada(unidade);
    setModoEdicao(false);
    setErroEdicao("");
  }

  function fecharPainelDetalhes() {
    if (salvando) {
      return;
    }

    setUnidadeSelecionada(null);
    setModoEdicao(false);
    setErroEdicao("");
  }

  /* =======================================================
     EDIÇÃO
  ======================================================= */

  function editarUnidade() {
    if (!unidadeSelecionada?.id) {
      return;
    }

    setErroEdicao("");
    setModoEdicao(true);
  }

  function cancelarEdicao() {
    if (salvando) {
      return;
    }

    setModoEdicao(false);
    setErroEdicao("");
  }

  async function salvarEdicao(
    formulario
  ) {
    try {
      setSalvando(true);
      setErroEdicao("");

      const unidadeAtualizada =
        await atualizarUnidadeOrganizacional(
          formulario
        );

      const listaAtualizada =
        await buscarEstruturaOrganizacional();

      setUnidades(listaAtualizada);

      const selecionadaAtualizada =
        listaAtualizada.find(
          (unidade) =>
            Number(unidade.id) ===
            Number(
              unidadeAtualizada.id
            )
        ) ?? unidadeAtualizada;

      setUnidadeSelecionada(
        selecionadaAtualizada
      );

      setModoEdicao(false);
    } catch (error) {
      console.error(
        "Erro ao salvar unidade:",
        error
      );

      setErroEdicao(
        error?.message ||
          "NÃO FOI POSSÍVEL SALVAR AS ALTERAÇÕES."
      );
    } finally {
      setSalvando(false);
    }
  }

  /* =======================================================
     AÇÕES A IMPLEMENTAR
  ======================================================= */

  function criarSubunidade() {
    console.log(
      "Nova subunidade de:",
      unidadeSelecionada
    );
  }

  function moverUnidade() {
    console.log(
      "Mover unidade:",
      unidadeSelecionada
    );
  }

  function alternarSituacaoUnidade() {
    console.log(
      "Alterar situação:",
      unidadeSelecionada
    );
  }

  /* =======================================================
     RENDERIZAÇÃO
  ======================================================= */

  return (
    <main className="estrutura-organizacional-pagina">
      <header className="estrutura-organizacional-cabecalho">
        <div>
          <span className="estrutura-organizacional-etiqueta">
            SYS45 • P1
          </span>

          <h1>
            Estrutura Organizacional
          </h1>

          <p>
            Navegue pela hierarquia do 45º BPM
            e consulte os dados de cada unidade.
          </p>
        </div>

        <button
          type="button"
          className="estrutura-botao-atualizar"
          onClick={
            carregarEstrutura
          }
          disabled={
            carregando ||
            salvando
          }
        >
          <RefreshCw
            size={18}
            className={
              carregando
                ? "estrutura-girando"
                : ""
            }
          />

          Atualizar
        </button>
      </header>

      <Indicadores
        totalUnidades={
          unidades.length
        }
        totalAtivas={
          totalAtivas
        }
        totalBaliza={
          totalBaliza
        }
      />

      <BarraFerramentas
        pesquisa={pesquisa}
        setPesquisa={setPesquisa}
        expandirTudo={expandirTudo}
        recolherTudo={recolherTudo}
        carregarEstrutura={
          carregarEstrutura
        }
        carregando={
          carregando ||
          salvando
        }
      />

      {erro && (
        <div className="estrutura-mensagem estrutura-mensagem-erro">
          {erro}
        </div>
      )}

      {carregando ? (
        <div className="estrutura-carregando">
          <LoaderCircle
            size={30}
            className="estrutura-girando"
          />

          <span>
            Carregando estrutura
            organizacional...
          </span>
        </div>
      ) : !erro &&
        arvore.length === 0 ? (
        <div className="estrutura-vazia">
          <Network size={42} />

          <strong>
            Nenhuma unidade encontrada
          </strong>

          <span>
            Verifique o cadastro ou altere
            os termos da pesquisa.
          </span>
        </div>
      ) : (
        <section className="estrutura-explorer">
          <ArvoreOrganizacional
            arvore={arvore}
            unidadesAbertas={
              unidadesAbertas
            }
            aoAlternar={
              alternarUnidade
            }
            aoSelecionar={
              selecionarUnidade
            }
            unidadeSelecionadaId={
              unidadeSelecionada?.id
            }
            pesquisaAtiva={Boolean(
              texto(pesquisa)
            )}
          />

          {modoEdicao &&
          unidadeSelecionada ? (
            <PainelEdicao
              unidade={
                unidadeSelecionada
              }
              unidades={unidades}
              salvando={salvando}
              erro={erroEdicao}
              aoCancelar={
                cancelarEdicao
              }
              aoSalvar={
                salvarEdicao
              }
            />
          ) : (
            <PainelDetalhes
              unidadeSelecionada={
                unidadeSelecionada
              }
              unidadePaiSelecionada={
                unidadePaiSelecionada
              }
              quantidadeSubunidades={
                quantidadeSubunidades
              }
              aoFechar={
                fecharPainelDetalhes
              }
              aoEditar={
                editarUnidade
              }
              aoNovaSubunidade={
                criarSubunidade
              }
              aoMover={
                moverUnidade
              }
              aoAlternarSituacao={
                alternarSituacaoUnidade
              }
            />
          )}
        </section>
      )}
    </main>
  );
}

export default EstruturaOrganizacional;