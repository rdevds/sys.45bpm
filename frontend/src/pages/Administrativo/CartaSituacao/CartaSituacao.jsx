import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  LoaderCircle,
  Printer,
  Pencil,
  RefreshCw,
  Search,
  ShieldUserIcon,
  UserRound,
  Users,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { supabase } from "../../../services/supabase.js";

import "./CartaSituacao.css";

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

function formatarNumeroPolicia(valor) {
  const numeros = somenteNumeros(valor).slice(0, 7);

  if (numeros.length !== 7) {
    return texto(valor);
  }

  return (
    `${numeros.slice(0, 3)}.` +
    `${numeros.slice(3, 6)}-` +
    numeros.slice(6)
  );
}

function normalizarPesquisa(valor) {
  return textoMaiusculo(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function obterNomeMilitar(militar) {
  return (
    textoMaiusculo(militar.nome_policia) ||
    textoMaiusculo(militar.nome_guerra) ||
    textoMaiusculo(militar.nome)
  );
}

function obterPostoGraduacao(militar) {
  return textoMaiusculo(
    militar.postos_graduacoes
      ?.posto_graduacao ||
      militar.postos_graduacoes
        ?.nome ||
      militar.graduacao
  ).replace(/\s+PM$/i, "");
}

function obterTipoVinculo(militar) {
  const tipo = textoMaiusculo(
    militar.postos_graduacoes
      ?.tipo_vinculo
  );

  if (
    tipo === "ASPM" ||
    obterPostoGraduacao(militar).startsWith(
      "ASPM"
    )
  ) {
    return "ASPM";
  }

  return "MILITAR";
}

function classificarCirculo(militar) {
  if (obterTipoVinculo(militar) === "ASPM") {
    return "ASPM";
  }

  const posto = obterPostoGraduacao(militar);

  const oficiais = [
    "CEL",
    "TEN CEL",
    "MAJ",
    "CAP",
    "1º TEN",
    "2º TEN",
    "ASP OF",
  ];

  if (
    oficiais.some(
      (item) =>
        posto === item ||
        posto.includes(item)
    )
  ) {
    return "OFICIAL";
  }

  return "PRAÇA";
}

function compararMilitares(a, b) {
  const precedenciaA = Number(
    a.postos_graduacoes
      ?.precedencia ?? 999
  );

  const precedenciaB = Number(
    b.postos_graduacoes
      ?.precedencia ?? 999
  );

  if (precedenciaA !== precedenciaB) {
    return precedenciaA - precedenciaB;
  }

  const antiguidadeA = Number(
    a.ordem_antiguidade ?? 999999
  );

  const antiguidadeB = Number(
    b.ordem_antiguidade ?? 999999
  );

  if (antiguidadeA !== antiguidadeB) {
    return antiguidadeA - antiguidadeB;
  }

  return obterNomeMilitar(a).localeCompare(
    obterNomeMilitar(b),
    "pt-BR"
  );
}

/* =========================================================
   COMPONENTE
========================================================= */

function CartaSituacao() {
  const navigate = useNavigate();

  const [militares, setMilitares] = useState(
    []
  );

  const [lotacoes, setLotacoes] = useState(
    []
  );

  const [unidades, setUnidades] = useState(
    []
  );

  const [
    postosGraduacoes,
    setPostosGraduacoes,
  ] = useState([]);

  const [pesquisa, setPesquisa] = useState(
    ""
  );

  const [unidadeSelecionada, setUnidadeSelecionada] =
    useState("");

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] = useState("");

  /* =======================================================
     CARREGAMENTO
  ======================================================= */

  const carregarCartaSituacao =
    useCallback(async () => {
      try {
        setCarregando(true);
        setErro("");

        const [
          militaresResposta,
          lotacoesResposta,
          unidadesResposta,
          postosResposta,
        ] = await Promise.all([
          supabase
            .from("militares")
            .select(
              `
                id,
                numero_policia,
                nome,
                nome_guerra,
                nome_policia,
                graduacao,
                posto_graduacao_id,
                ordem_antiguidade,
                situacao_funcional,
                cidade,
                fracao,
                funcao,
                ativo
              `
            )
            .eq("ativo", true)
             .eq("situacao_funcional", "ATIVO"),

          supabase
            .from("lotacoes_militares")
            .select(
              `
                id,
                militar_id,
                unidade_organizacional_id,
                funcao,
                ordem_secundaria,
                data_inicio,
                data_fim,
                lotacao_principal,
                ativa
              `
            )
            .eq("ativa", true),

          supabase
            .from("vw_unidades_arvore_p1")
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
                ativa
              `
            )
            .eq("ativa", true)
            .order("caminho_ordem", {
              ascending: true,
            }),

          supabase
            .from("cad_postos_graduacoes")
            .select(
              `
                id,
                posto_graduacao,
                tipo_vinculo,
                precedencia,
                grupo_carta_situacao,
                conta_carta_situacao,
                ativo
              `
            )
            .eq("ativo", true),
        ]);

        if (militaresResposta.error) {
          throw new Error(
            `Não foi possível carregar os militares: ${militaresResposta.error.message}`
          );
        }

        if (lotacoesResposta.error) {
          throw new Error(
            `Não foi possível carregar as lotações: ${lotacoesResposta.error.message}`
          );
        }

        if (unidadesResposta.error) {
          throw new Error(
            `Não foi possível carregar as unidades: ${unidadesResposta.error.message}`
          );
        }

        if (postosResposta.error) {
          throw new Error(
            `Não foi possível carregar os postos e graduações: ${postosResposta.error.message}`
          );
        }

        setMilitares(
          militaresResposta.data ?? []
        );

        setLotacoes(
          lotacoesResposta.data ?? []
        );

        setUnidades(
          unidadesResposta.data ?? []
        );

        setPostosGraduacoes(
          postosResposta.data ?? []
        );
      } catch (error) {
        console.error(
          "Erro ao carregar Carta de Situação:",
          error
        );

        setErro(
          error?.message ||
            "NÃO FOI POSSÍVEL CARREGAR A CARTA DE SITUAÇÃO."
        );
      } finally {
        setCarregando(false);
      }
    }, []);

  useEffect(() => {
    carregarCartaSituacao();
  }, [carregarCartaSituacao]);

  /* =======================================================
     MAPAS AUXILIARES
  ======================================================= */

  const unidadePorId = useMemo(() => {
    return new Map(
      unidades.map((unidade) => [
        Number(unidade.id),
        unidade,
      ])
    );
  }, [unidades]);

  const postoPorId = useMemo(() => {
    return new Map(
      postosGraduacoes.map((posto) => [
        String(posto.id),
        posto,
      ])
    );
  }, [postosGraduacoes]);

  /* =======================================================
     MILITARES NORMALIZADOS
  ======================================================= */

  const militaresComLotacao = useMemo(() => {
    const militarPorId = new Map(
      militares.map((militar) => [
        Number(militar.id),
        militar,
      ])
    );

    const registros = lotacoes
      .map((lotacao) => {
        const militar = militarPorId.get(
          Number(lotacao.militar_id)
        );

        if (!militar) {
          return null;
        }

        const postoGraduacao =
          postoPorId.get(
            String(
              militar.posto_graduacao_id ?? ""
            )
          ) || null;

        const unidade =
          unidadePorId.get(
            Number(
              lotacao.unidade_organizacional_id
            )
          ) || null;

        return {
          ...militar,

          /*
           * Cada lotação precisa de uma chave própria,
           * porque o mesmo militar pode aparecer em duas
           * ou mais seções.
           */
          registro_lotacao_id:
            lotacao.id,

          postos_graduacoes:
            postoGraduacao,

          lotacao_id:
            lotacao.id,

          lotacao_principal:
            Boolean(
              lotacao.lotacao_principal
            ),

          ordem_secundaria:
            lotacao.ordem_secundaria ??
            null,

          unidade_organizacional_id:
            lotacao.unidade_organizacional_id ??
            null,

          lotacao_codigo:
            unidade?.codigo ?? "",

          lotacao_sigla:
            unidade?.sigla ?? "",

          lotacao_nome:
            unidade?.nome ??
            militar.fracao ??
            "SEM LOTAÇÃO",

          lotacao_caminho:
            unidade?.caminho_nome ??
            unidade?.nome ??
            militar.fracao ??
            "SEM LOTAÇÃO",

          cidade_lotacao:
            unidade?.cidade ??
            militar.cidade ??
            "",

          funcao_atual:
            lotacao?.funcao ??
            militar.funcao ??
            "",

          tipo_vinculo_calculado:
            obterTipoVinculo({
              ...militar,
              postos_graduacoes:
                postoGraduacao,
            }),

          circulo:
            classificarCirculo({
              ...militar,
              postos_graduacoes:
                postoGraduacao,
            }),
        };
      })
      .filter(Boolean);

    /*
     * Caso exista militar ativo ainda sem lotação,
     * ele permanece disponível para conferência.
     */
    const militaresComLotacaoIds = new Set(
      registros.map((registro) =>
        Number(registro.id)
      )
    );

    const semLotacao = militares
      .filter(
        (militar) =>
          !militaresComLotacaoIds.has(
            Number(militar.id)
          )
      )
      .map((militar) => {
        const postoGraduacao =
          postoPorId.get(
            String(
              militar.posto_graduacao_id ?? ""
            )
          ) || null;

        return {
          ...militar,
          registro_lotacao_id:
            `SEM-${militar.id}`,
          postos_graduacoes:
            postoGraduacao,
          lotacao_id: null,
          lotacao_principal: true,
          ordem_secundaria: null,
          unidade_organizacional_id: null,
          lotacao_codigo: "",
          lotacao_sigla: "",
          lotacao_nome:
            militar.fracao ||
            "SEM LOTAÇÃO",
          lotacao_caminho:
            militar.fracao ||
            "SEM LOTAÇÃO",
          cidade_lotacao:
            militar.cidade || "",
          funcao_atual:
            militar.funcao || "",
          tipo_vinculo_calculado:
            obterTipoVinculo({
              ...militar,
              postos_graduacoes:
                postoGraduacao,
            }),
          circulo:
            classificarCirculo({
              ...militar,
              postos_graduacoes:
                postoGraduacao,
            }),
        };
      });

    return [
      ...registros,
      ...semLotacao,
    ];
  }, [
    militares,
    lotacoes,
    unidadePorId,
    postoPorId,
  ]);

  /* =======================================================
     FILTROS
  ======================================================= */

  const militaresFiltrados = useMemo(() => {
    const termo =
      normalizarPesquisa(pesquisa);

    return militaresComLotacao.filter(
      (militar) => {
        if (
          unidadeSelecionada &&
          String(
            militar.unidade_organizacional_id
          ) !== String(unidadeSelecionada)
        ) {
          return false;
        }

        if (!termo) {
          return true;
        }

        const conteudo =
          normalizarPesquisa(
            [
              militar.numero_policia,
              militar.nome,
              militar.nome_guerra,
              militar.nome_policia,
              militar.postos_graduacoes
                ?.posto_graduacao,
              militar.graduacao,
              militar.lotacao_nome,
              militar.lotacao_sigla,
              militar.lotacao_codigo,
              militar.funcao_atual,
              militar.cidade_lotacao,
              militar.ordem_secundaria,
            ].join(" ")
          );

        return conteudo.includes(termo);
      }
    );
  }, [
    militaresComLotacao,
    pesquisa,
    unidadeSelecionada,
  ]);

  /* =======================================================
     AGRUPAMENTO POR LOTAÇÃO
  ======================================================= */

  const gruposLotacao = useMemo(() => {
    const mapa = new Map();

    militaresFiltrados.forEach((militar) => {
      const chave =
        militar.unidade_organizacional_id
          ? String(
              militar.unidade_organizacional_id
            )
          : "SEM_LOTACAO";

      if (!mapa.has(chave)) {
        mapa.set(chave, {
          id:
            militar.unidade_organizacional_id ??
            "SEM_LOTACAO",

          codigo:
            militar.lotacao_codigo,

          sigla:
            militar.lotacao_sigla,

          nome:
            militar.lotacao_nome,

          caminho:
            militar.lotacao_caminho,

          cidade:
            militar.cidade_lotacao,

          militares: [],
        });
      }

      mapa.get(chave).militares.push(
        militar
      );
    });

    mapa.forEach((grupo) => {
      grupo.militares = grupo.militares.sort(
        (militarA, militarB) => {
          const ordemA =
            militarA.ordem_secundaria === null ||
            militarA.ordem_secundaria === undefined
              ? Number.POSITIVE_INFINITY
              : Number(
                  militarA.ordem_secundaria
                );

          const ordemB =
            militarB.ordem_secundaria === null ||
            militarB.ordem_secundaria === undefined
              ? Number.POSITIVE_INFINITY
              : Number(
                  militarB.ordem_secundaria
                );

          if (ordemA !== ordemB) {
            return ordemA - ordemB;
          }

          return compararMilitares(
            militarA,
            militarB
          );
        }
      );
    });

    const gruposOrdenados =
      Array.from(mapa.values()).sort(
        (grupoA, grupoB) => {
          const unidadeA =
            unidadePorId.get(
              Number(grupoA.id)
            );

          const unidadeB =
            unidadePorId.get(
              Number(grupoB.id)
            );

          const ordemA =
            unidadeA?.caminho_ordem ??
            "ZZZZZZ";

          const ordemB =
            unidadeB?.caminho_ordem ??
            "ZZZZZZ";

          return String(ordemA).localeCompare(
            String(ordemB),
            "pt-BR",
            {
              numeric: true,
            }
          );
        }
      );

    /*
     * A ordem primária segue a baliza:
     *
     * 1. ordem das lotações na árvore organizacional;
     * 2. ordem secundária dentro da lotação;
     * 3. ASPM e demais civis ficam sem numeração;
     * 4. a contagem é global e contínua.
     */
    let proximaOrdemPrimaria = 1;
    const militaresJaNumerados = new Set();

    gruposOrdenados.forEach((grupo) => {
      grupo.militares =
        grupo.militares.map((militar) => {
          const ehCivil =
            militar.circulo === "ASPM" ||
            militar.tipo_vinculo_calculado ===
              "ASPM";

          if (ehCivil) {
            return {
              ...militar,
              ordem_primaria: null,
              ordem_secundaria: null,
            };
          }

          /*
           * Proteção para o caso de o mesmo militar
           * aparecer em mais de uma função ou lotação
           * secundária. Ele recebe ordem primária apenas
           * na primeira ocorrência da baliza.
           */
          const militarId =
            Number(militar.id);

          /*
           * A ordem primária pertence ao militar, não
           * à função exercida. Portanto:
           *
           * - aparece na lotação principal;
           * - nas chefias adicionais fica vazia;
           * - se não houver principal cadastrada,
           *   usa-se a primeira ocorrência da baliza.
           */
          const deveReceberOrdemPrimaria =
            !militaresJaNumerados.has(
              militarId
            ) &&
            (
              militar.lotacao_principal ||
              !gruposOrdenados.some(
                (outroGrupo) =>
                  outroGrupo.militares.some(
                    (outroRegistro) =>
                      Number(
                        outroRegistro.id
                      ) === militarId &&
                      outroRegistro
                        .lotacao_principal
                  )
              )
            );

          if (!deveReceberOrdemPrimaria) {
            return {
              ...militar,
              ordem_primaria: null,
            };
          }

          militaresJaNumerados.add(
            militarId
          );

          const militarNumerado = {
            ...militar,
            ordem_primaria:
              proximaOrdemPrimaria,
          };

          proximaOrdemPrimaria += 1;

          return militarNumerado;
        });
    });

    return gruposOrdenados;
  }, [
    militaresFiltrados,
    unidadePorId,
  ]);

  /* =======================================================
     INDICADORES
  ======================================================= */

  const indicadores = useMemo(() => {
    return militaresFiltrados.reduce(
      (acumulador, militar) => {
        acumulador.total += 1;

        if (
          militar.circulo === "OFICIAL"
        ) {
          acumulador.oficiais += 1;
        }

        if (
          militar.circulo === "PRAÇA"
        ) {
          acumulador.pracas += 1;
        }

        if (
          militar.circulo === "ASPM"
        ) {
          acumulador.aspm += 1;
        }

        return acumulador;
      },
      {
        total: 0,
        oficiais: 0,
        pracas: 0,
        aspm: 0,
      }
    );
  }, [militaresFiltrados]);

  function imprimirCarta() {
    window.print();
  }

  /* =======================================================
     RENDERIZAÇÃO
  ======================================================= */

  return (
    <main className="carta-situacao-pagina">
      <header className="carta-situacao-cabecalho">
        <div>
          <span className="carta-situacao-etiqueta">
            ÁREA  P1
          </span>

          <h1>Carta de Situação</h1>

          <p>
            Efetivo organizado por lotação,
            precedência e ordem de antiguidade.
          </p>
        </div>

        <div className="carta-situacao-acoes">
          <button
            type="button"
            className="carta-situacao-botao secundario"
            onClick={
              carregarCartaSituacao
            }
            disabled={carregando}
          >
            <RefreshCw
              size={17}
              className={
                carregando
                  ? "carta-situacao-girando"
                  : ""
              }
            />

            Atualizar
          </button>

          <button
            type="button"
            className="carta-situacao-botao principal"
            onClick={imprimirCarta}
          >
            <Printer size={17} />
            Imprimir
          </button>
        </div>
      </header>

      <section className="carta-situacao-indicadores">
        <article>
          <div className="carta-situacao-icone">
            <Users size={22} />
          </div>

          <div>
            <span>Efetivo total</span>
            <strong>
              {indicadores.total}
            </strong>
          </div>
        </article>

        <article>
          <div className="carta-situacao-icone">
            <ShieldUserIcon size={22} 
            />
          </div>

          <div>
            <span>Oficiais</span>
            <strong>
              {indicadores.oficiais}
            </strong>
          </div>
        </article>

        <article>
          <div className="carta-situacao-icone">
            <UserRound size={22} />
          </div>

          <div>
            <span>Praças</span>
            <strong>
              {indicadores.pracas}
            </strong>
          </div>
        </article>

        <article>
          <div className="carta-situacao-icone">
            <Users size={22} />
          </div>

          <div>
            <span>ASPM</span>
            <strong>
              {indicadores.aspm}
            </strong>
          </div>
        </article>
      </section>

      <section className="carta-situacao-filtros">
        <label className="carta-situacao-pesquisa">
          <Search size={18} />

          <input
            type="search"
            value={pesquisa}
            onChange={(event) =>
              setPesquisa(event.target.value)
            }
            placeholder="Pesquisar militar, número, função ou lotação..."
          />
        </label>

        <label className="carta-situacao-seletor">
          <span>Lotação</span>

          <select
            value={unidadeSelecionada}
            onChange={(event) =>
              setUnidadeSelecionada(
                event.target.value
              )
            }
          >
            <option value="">
              TODAS AS LOTAÇÕES
            </option>

            {unidades.map((unidade) => (
              <option
                key={unidade.id}
                value={unidade.id}
              >
                {"— ".repeat(
                  Math.max(
                    Number(unidade.nivel) - 1,
                    0
                  )
                )}

                {unidade.sigla ||
                  unidade.nome}

                {unidade.codigo
                  ? ` — ${unidade.codigo}`
                  : ""}
              </option>
            ))}
          </select>
        </label>
      </section>

      {erro && (
        <div className="carta-situacao-erro">
          {erro}
        </div>
      )}

      {carregando ? (
        <div className="carta-situacao-carregando">
          <LoaderCircle
            size={30}
            className="carta-situacao-girando"
          />

          <span>
            Carregando Carta de Situação...
          </span>
        </div>
      ) : gruposLotacao.length === 0 ? (
        <div className="carta-situacao-vazia">
          <Users size={40} />

          <strong>
            Nenhum integrante encontrado
          </strong>

          <span>
            Verifique os filtros ou cadastre
            integrantes ativos.
          </span>
        </div>
      ) : (
        <section className="carta-situacao-conteudo">
          {gruposLotacao.map((grupo) => (
            <article
              key={grupo.id}
              className="carta-situacao-grupo"
            >
              <header className="carta-situacao-grupo-cabecalho">
                <div>
                  <span>
                    {grupo.sigla ||
                      "LOTAÇÃO"}
                  </span>

                  <h2>{grupo.nome}</h2>

                  
                </div>

                <div className="carta-situacao-grupo-meta">
                  {grupo.codigo && (
                    <span>
                      CÓDIGO {grupo.codigo}
                    </span>
                  )}

                  <strong>
                    {
                      grupo.militares
                        .length
                    }{" "}
                    INTEGRANTE
                    {grupo.militares
                      .length !== 1
                      ? "S"
                      : ""}
                  </strong>
                </div>
              </header>

              <div className="carta-situacao-tabela-wrapper">
                <table className="carta-situacao-tabela">
                  <thead>
                    <tr>
                      <th>Ord. Prim.</th>
                      <th>Ord. Sec.</th>
                      <th>Nº Polícia</th>
                      <th>
                        Posto/Grad.
                      </th>
                      <th>Nome de Polícia</th>
                      <th>Função</th>
                      <th>Situação</th>
                      <th className="nao-imprimir">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {grupo.militares.map(
                      (
                        militar
                      ) => (
                        <tr
                          key={
                            militar
                              .registro_lotacao_id ??
                            `${grupo.id}-${militar.id}`
                          }
                        >
                          <td>
                            {militar
                              .ordem_primaria ??
                              "—"}
                          </td>

                          <td>
                            {militar
                              .ordem_secundaria ??
                              "—"}
                          </td>

                          <td className="carta-situacao-numero">
                            {formatarNumeroPolicia(
                              militar.numero_policia
                            )}
                          </td>

                          <td>
                            <span
                              className={`carta-situacao-posto ${militar.circulo.toLowerCase()}`}
                            >
                              {obterPostoGraduacao(
                                militar
                              )}
                            </span>
                          </td>

                          <td>
                            <strong className="carta-situacao-nome">
                              {obterNomeMilitar(
                                militar
                              )}
                            </strong>

                            <small>
                              {textoMaiusculo(
                                militar.nome
                              )}
                            </small>
                          </td>

                          <td>
                            {textoMaiusculo(
                              militar.funcao_atual
                            ) || "—"}
                          </td>

                          <td>
                            <span className="carta-situacao-status">
                              {textoMaiusculo(
                                militar.situacao_funcional
                              ) || "ATIVO"}
                            </span>
                          </td>

                          <td className="nao-imprimir">
                            <button
                              type="button"
                              className="carta-situacao-editar"
                              onClick={() =>
                                navigate(
                                  `/administrativo/militares?editar=${militar.id}`
                                )
                              }
                              title="Editar cadastro do militar"
                            >
                              <Pencil size={15} />
                              Editar
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default CartaSituacao;