import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Pencil,
  Plus,
  Search,
  Sheet,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  listarMilitares,
} from "../../../services/militaresService.js";

import NovoMilitarModal from "./NovoMilitarModal.jsx";

import "./Militares.css";

/* =========================================================
   FORMATAÇÃO
========================================================= */

/**
 * Formata o número de polícia para exibição.
 *
 * Exemplo:
 * 1564574 -> 156.457-4
 */
function formatarNumeroPolicia(
  valor = ""
) {
  const numeros = String(valor)
    .replace(/\D/g, "")
    .slice(0, 7);

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

/**
 * Remove acentos e converte para caixa alta,
 * facilitando as pesquisas.
 */
function normalizarPesquisa(
  valor = ""
) {
  return String(valor)
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toUpperCase();
}

/* =========================================================
   COMPONENTE
========================================================= */

function Militares() {
  const navigate = useNavigate();
  const [parametros, setParametros] = useSearchParams();

  const [
    militares,
    setMilitares,
  ] = useState([]);

  const [
    pesquisa,
    setPesquisa,
  ] = useState("");

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    modalAberto,
    setModalAberto,
  ] = useState(false);

  const [
    militarEmEdicao,
    setMilitarEmEdicao,
  ] = useState(null);

  /* =======================================================
     CARREGAMENTO
  ======================================================= */

  const carregarMilitares =
    useCallback(async () => {
      try {
        setCarregando(true);
        setErro("");

        const dados =
          await listarMilitares();

        setMilitares(
          Array.isArray(dados)
            ? dados
            : []
        );
      } catch (error) {
        console.error(
          "Erro ao carregar militares:",
          error
        );

        setErro(
          error?.message ||
            "NÃO FOI POSSÍVEL CARREGAR OS MILITARES."
        );
      } finally {
        setCarregando(false);
      }
    }, []);

  useEffect(() => {
    carregarMilitares();
  }, [carregarMilitares]);

  useEffect(() => {
    const militarId = Number(
      parametros.get("editar")
    );

    if (!militarId || militares.length === 0) {
      return;
    }

    const militarEncontrado = militares.find(
      (militar) => Number(militar.id) === militarId
    );

    if (militarEncontrado) {
      setMilitarEmEdicao({
        ...militarEncontrado,
      });
      setModalAberto(true);
    }
  }, [militares, parametros]);

  /* =======================================================
     MODAL
  ======================================================= */

  function abrirNovoMilitar() {
    setMilitarEmEdicao(null);
    setModalAberto(true);
  }

  function abrirEdicao(
    militar
  ) {
    /*
     * Cria uma cópia do registro para evitar
     * alterações diretas no card antes de salvar.
     */
    setMilitarEmEdicao({
      ...militar,
    });

    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setMilitarEmEdicao(null);

    if (parametros.has("editar")) {
      const novosParametros = new URLSearchParams(
        parametros
      );
      novosParametros.delete("editar");
      setParametros(novosParametros, {
        replace: true,
      });
    }
  }

  async function concluirSalvamento() {
    fecharModal();
    await carregarMilitares();
  }

  /* =======================================================
     FILTRO
  ======================================================= */

  const militaresFiltrados =
    useMemo(() => {
      const termo =
        normalizarPesquisa(
          pesquisa
        );

      const termoNumerico =
        String(pesquisa)
          .replace(/\D/g, "");

      if (!termo) {
        return militares;
      }

      return militares.filter(
        (militar) => {
          const numeroPolicia =
            String(
              militar.numero_policia ||
                ""
            );

          const textoPesquisa =
            [
              militar.nome,
              militar.nome_completo,
              militar.nome_policia,
              militar.nome_guerra,
              militar.graduacao,
              militar.posto_graduacao,
              militar.cidade,
              militar.cidade_unidade,
              militar.fracao,
              militar.unidade_sigla,
              militar.unidade_nome,
              militar.funcao,
              militar.email,
              militar.cpf,
              formatarNumeroPolicia(
                numeroPolicia
              ),
            ]
              .filter(Boolean)
              .map(
                normalizarPesquisa
              )
              .join(" ");

          return (
            textoPesquisa.includes(
              termo
            ) ||
            Boolean(
              termoNumerico &&
                numeroPolicia.includes(
                  termoNumerico
                )
            )
          );
        }
      );
    }, [
      militares,
      pesquisa,
    ]);

  /* =======================================================
     INDICADORES
  ======================================================= */

  const indicadores =
    useMemo(() => {
      return {
        total:
          militares.length,

        ativos:
          militares.filter(
            (militar) =>
              Boolean(
                militar.ativo
              )
          ).length,

        habilitados:
          militares.filter(
            (militar) =>
              Boolean(
                militar.habilitado_dirigir
              )
          ).length,

        acesso:
          militares.filter(
            (militar) =>
              Boolean(
                militar.acesso_sistema
              )
          ).length,
      };
    }, [militares]);

  /* =======================================================
     RENDERIZAÇÃO
  ======================================================= */

  return (
    <main className="militares-page">
      <header className="militares-cabecalho">
        <div>
          <span className="militares-etiqueta">
            ADMINISTRATIVO
          </span>

          <h1>Militares</h1>

          <p>
            Cadastro, consulta e gerenciamento
            dos militares.
          </p>
        </div>

        <div className="militares-acoes-topo">
          <button
            type="button"
            className="militares-botao-lista"
            onClick={() =>
              navigate(
                "/administrativo/militares/lista"
              )
            }
          >
            <Sheet size={18} />

            Ver planilha
          </button>

          <button
            type="button"
            className="militares-botao-novo"
            onClick={abrirNovoMilitar}
          >
            <Plus size={19} />

            Novo militar
          </button>
        </div>
      </header>

      <section className="militares-indicadores">
        <article className="militares-indicador">
          <div className="militares-indicador-icone">
            <UsersRound size={22} />
          </div>

          <div>
            <span>Total</span>

            <strong>
              {indicadores.total}
            </strong>
          </div>
        </article>

        <article className="militares-indicador">
          <div className="militares-indicador-icone">
            <UserRound size={22} />
          </div>

          <div>
            <span>Ativos</span>

            <strong>
              {indicadores.ativos}
            </strong>
          </div>
        </article>

        <article className="militares-indicador">
          <div className="militares-indicador-icone">
            <UserRound size={22} />
          </div>

          <div>
            <span>Habilitados</span>

            <strong>
              {indicadores.habilitados}
            </strong>
          </div>
        </article>

        <article className="militares-indicador">
          <div className="militares-indicador-icone">
            <UserRound size={22} />
          </div>

          <div>
            <span>Com acesso</span>

            <strong>
              {indicadores.acesso}
            </strong>
          </div>
        </article>
      </section>

      <section className="militares-ferramentas">
        <label className="militares-pesquisa">
          <Search size={20} />

          <input
            type="text"
            value={pesquisa}
            onChange={(event) =>
              setPesquisa(
                event.target.value
              )
            }
            placeholder="Pesquisar por nome, número de polícia, CPF, cidade ou fração..."
          />
        </label>
      </section>

      {erro && (
        <div className="militares-mensagem militares-mensagem-erro">
          {erro}
        </div>
      )}

      {carregando && (
        <div className="militares-mensagem">
          Carregando militares...
        </div>
      )}

      {!carregando &&
        !erro &&
        militaresFiltrados.length ===
          0 && (
          <div className="militares-vazio">
            <UserRound size={42} />

            <h2>
              Nenhum militar encontrado
            </h2>

            <p>
              Cadastre um militar ou altere
              os termos da pesquisa.
            </p>
          </div>
        )}

      {!carregando &&
        !erro &&
        militaresFiltrados.length >
          0 && (
          <section className="militares-lista">
            {militaresFiltrados.map(
              (militar) => {
                const nomeCompleto =
                  militar.nome ||
                  militar.nome_completo ||
                  "NOME NÃO INFORMADO";

                const nomePolicia =
                  militar.nome_policia ||
                  nomeCompleto;

                const graduacao =
                  militar.posto_graduacao ||
                  militar.graduacao ||
                  "NÃO INFORMADA";

                const cidade =
                  militar.cidade ||
                  militar.cidade_unidade ||
                  "NÃO INFORMADA";

                const fracao =
                  militar.fracao ||
                  militar.unidade_sigla ||
                  militar.unidade_nome ||
                  "NÃO INFORMADA";

                const funcao =
                  militar.funcao ||
                  militar.funcao_legada ||
                  "NÃO INFORMADA";

                const categoriaCnh =
                  militar.categoria_cnh ||
                  "NÃO INFORMADA";

                const perfil =
                  militar.perfil_sistema ||
                  "CONSULTA";

                /*
                 * Algumas versões da view não retornam
                 * habilitado_dirigir corretamente.
                 *
                 * Por isso, consideramos habilitado quando:
                 * - o campo booleano estiver true; ou
                 * - houver categoria e validade de CNH.
                 */
                const habilitadoParaDirigir =
                  Boolean(
                    militar.habilitado_dirigir
                  ) ||
                  Boolean(
                    militar.categoria_cnh &&
                    militar.validade_cnh
                  );

                return (
                  <article
                    className="militar-card"
                    key={militar.id}
                  >
                    <div className="militar-card-topo">
                      <div>
                        <span
                          className={
                            militar.ativo
                              ? "militar-status militar-status-ativo"
                              : "militar-status militar-status-inativo"
                          }
                        >
                          {militar.ativo
                            ? "ATIVO"
                            : "INATIVO"}
                        </span>

                        <h2>
                          {nomePolicia}
                        </h2>

                        <p>
                          {nomeCompleto}
                        </p>
                      </div>

                      <div className="militar-numero">
                        <span>
                          Nº DE POLÍCIA
                        </span>

                        <strong>
                          {formatarNumeroPolicia(
                            militar.numero_policia
                          )}
                        </strong>
                      </div>
                    </div>

                    <div className="militar-card-dados">
                      <div>
                        <span>
                          Graduação
                        </span>

                        <strong>
                          {graduacao}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Cidade
                        </span>

                        <strong>
                          {cidade}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Lotação
                        </span>

                        <strong>
                          {fracao}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Função
                        </span>

                        <strong>
                          {funcao}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Ordem secundária
                        </span>

                        <strong>
                          {militar.ordem_secundaria ??
                            "NÃO INFORMADA"}
                        </strong>
                      </div>

                      <div>
                        <span>CNH</span>

                        <strong>
                          {categoriaCnh}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Perfil
                        </span>

                        <strong>
                          {perfil}
                        </strong>
                      </div>
                    </div>

                    <footer className="militar-card-rodape">
                      <span>
                        {habilitadoParaDirigir
                          ? "HABILITADO PARA DIRIGIR"
                          : "NÃO HABILITADO PARA DIRIGIR"}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          abrirEdicao(
                            militar
                          )
                        }
                      >
                        <Pencil size={15} />

                        Editar
                      </button>
                    </footer>
                  </article>
                );
              }
            )}
          </section>
        )}

      <NovoMilitarModal
        aberto={modalAberto}
        militarEmEdicao={
          militarEmEdicao
        }
        aoFechar={fecharModal}
        aoSalvar={
          concluirSalvamento
        }
      />
    </main>
  );
}

export default Militares;