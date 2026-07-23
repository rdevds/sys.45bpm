import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  Building2,
  CarFront,
  ChevronRight,
  Fuel,
  Gauge,
  MapPin,
  Search,
} from "lucide-react";

import {
  buscarViaturas,
  salvarViatura,
} from "../../services/viaturasService.js";

import NovaViaturaModalV2 from "./components/NovaViaturaModalV2.jsx";

import "./Viaturas.css";

function texto(valor) {
  return String(valor ?? "").trim();
}

function textoMaiusculo(valor) {
  return texto(valor).toUpperCase();
}

function formatarNumero(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "0";
  }

  return numero.toLocaleString("pt-BR");
}

function Viaturas() {
  const navigate = useNavigate();

  const [
    viaturas,
    setViaturas,
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
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    modalAberto,
    setModalAberto,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState("");

  useEffect(() => {
    carregarViaturas();
  }, []);

  async function carregarViaturas() {
    try {
      setCarregando(true);
      setErro("");

      const dados =
        await buscarViaturas();

      setViaturas(
        Array.isArray(dados)
          ? dados
          : []
      );
    } catch (error) {
      console.error(
        "Erro ao carregar viaturas:",
        error
      );

      setErro(
        error?.message ||
          "NÃO FOI POSSÍVEL CARREGAR AS VIATURAS."
      );
    } finally {
      setCarregando(false);
    }
  }

  function abrirModal() {
    setErro("");
    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) {
      return;
    }

    setModalAberto(false);
  }

  async function cadastrarViatura(
    dadosViatura
  ) {
    try {
      setSalvando(true);
      setErro("");

      const novaViatura =
        await salvarViatura(
          dadosViatura
        );

      setModalAberto(false);

      await carregarViaturas();

      /*
       * Mantemos o prefixo na rota porque o App.jsx atual
       * ainda utiliza /administrativo/viaturas/:prefixo.
       */
      if (novaViatura?.prefixo) {
        navigate(
          `/administrativo/viaturas/${novaViatura.prefixo}`
        );
      }
    } catch (error) {
      console.error(
        "Erro ao salvar viatura:",
        error
      );

      setErro(
        error?.message ||
          "NÃO FOI POSSÍVEL SALVAR A VIATURA."
      );

      /*
       * Relança o erro para o modal exibir a mensagem
       * sem fechar o cadastro.
       */
      throw error;
    } finally {
      setSalvando(false);
    }
  }

  function abrirProntuario(
    viatura
  ) {
    if (!viatura?.prefixo) {
      return;
    }

    navigate(
      `/administrativo/viaturas/${viatura.prefixo}`
    );
  }

  const viaturasFiltradas =
    useMemo(() => {
      const termo =
        textoMaiusculo(
          pesquisa
        );

      if (!termo) {
        return viaturas;
      }

      const termoNumerico =
        termo.replace(/\D/g, "");

      return viaturas.filter(
        (viatura) => {
          const campos = [
            viatura.pasta_numero,
            viatura.prefixo,
            viatura.placa,
            viatura.marca,
            viatura.modelo,
            viatura.ano,
            viatura.combustivel,
            viatura.lotacao_nome,
            viatura.lotacao_sigla,
            viatura.codigo_siad_unidade_frota,
            viatura.lotacao_cidade,
            viatura.patrimonio,
            viatura.radio,
            viatura.chassi,
            viatura.renavam,
            viatura.origem,
            viatura.situacao,
          ]
            .filter(
              (valor) =>
                valor !== null &&
                valor !== undefined
            )
            .join(" ")
            .toUpperCase();

          if (
            campos.includes(termo)
          ) {
            return true;
          }

          if (
            termoNumerico &&
            String(
              viatura.pasta_numero ?? ""
            ) === termoNumerico
          ) {
            return true;
          }

          return false;
        }
      );
    }, [
      viaturas,
      pesquisa,
    ]);

  const indicadores =
    useMemo(() => {
      const disponiveis =
        viaturas.filter(
          (viatura) =>
            textoMaiusculo(
              viatura.situacao
            ) === "DISPONÍVEL"
        ).length;

      const descarregadas =
        viaturas.filter(
          (viatura) =>
            textoMaiusculo(
              viatura.situacao
            ) === "DESCARREGADA"
        ).length;

      const organicas =
        viaturas.filter(
          (viatura) =>
            textoMaiusculo(
              viatura.origem
            ) === "ORGÂNICA"
        ).length;

      return {
        total: viaturas.length,
        disponiveis,
        descarregadas,
        organicas,
      };
    }, [viaturas]);

  return (
    <main className="viaturas-page">
      <section className="viaturas-container">
        <header className="viaturas-header">
          <div>
            <span className="abastecimento-badge">
              SYS45 — 45º BPM
            </span>

            <h1>
              Gestão da Frota
            </h1>

            <p>
              Cadastro, consulta e
              prontuário digital das
              viaturas.
            </p>
          </div>

          <div className="viaturas-header-acoes">
  <button
    type="button"
    className="botao-gerenciar-modelos"
    onClick={() =>
      navigate(
        "/administrativo/viaturas/modelos"
      )
    }
  >
    Gerenciar Modelos
  </button>

  <button
    type="button"
    className="botao-nova-viatura"
    onClick={abrirModal}
  >
    + Nova Viatura
  </button>
</div>




        </header>

        <section className="viaturas-indicadores">
          <article>
            <span>
              Total
            </span>

            <strong>
              {indicadores.total}
            </strong>
          </article>

          <article>
            <span>
              Disponíveis
            </span>

            <strong>
              {indicadores.disponiveis}
            </strong>
          </article>

          <article>
            <span>
              Descarregadas
            </span>

            <strong>
              {indicadores.descarregadas}
            </strong>
          </article>

          <article>
            <span>
              Orgânicas
            </span>

            <strong>
              {indicadores.organicas}
            </strong>
          </article>
        </section>

        <label className="viaturas-pesquisa">
          <Search size={18} />

          <input
            type="text"
            value={pesquisa}
            onChange={(event) =>
              setPesquisa(
                event.target.value
              )
            }
            placeholder="Pesquisar por Pasta, prefixo, placa, patrimônio, chassi, Renavam, cidade ou lotação..."
          />
        </label>

        {erro && !modalAberto && (
          <div
            className="aviso-erro"
            role="alert"
          >
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="viaturas-mensagem">
            Carregando viaturas...
          </div>
        ) : viaturasFiltradas.length ===
          0 ? (
          <div className="viaturas-mensagem">
            {pesquisa
              ? "Nenhuma viatura encontrada para esta pesquisa."
              : "Nenhuma viatura cadastrada."}
          </div>
        ) : (
          <section className="viaturas-lista-simples">
            {viaturasFiltradas.map(
              (viatura) => {
                const lotacao =
                  viatura.lotacao_sigla ||
                  viatura.lotacao_nome ||
                  "-";

                const cidade =
                  viatura.lotacao_cidade ||
                  viatura.cidade ||
                  "-";

                return (
                  <article
                    className="viatura-card-simples"
                    key={viatura.id}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      abrirProntuario(
                        viatura
                      )
                    }
                    onKeyDown={(
                      event
                    ) => {
                      if (
                        event.key ===
                          "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();

                        abrirProntuario(
                          viatura
                        );
                      }
                    }}
                  >
                    <header>
                      <div className="viatura-card-identificacao">
                        <span className="viatura-card-status">
                          {viatura.situacao ||
                            "NÃO INFORMADA"}
                        </span>

                        <span className="viatura-card-pasta">
                          PASTA{" "}
                          {viatura.pasta_numero ??
                            "-"}
                        </span>

                        <div className="viatura-card-prefixo">
                          <CarFront
                            size={20}
                          />

                          <h2>
                            {viatura.prefixo ||
                              "SEM PREFIXO"}
                          </h2>
                        </div>
                      </div>

                      <div className="viatura-card-placa">
                        <strong>
                          {viatura.placa ||
                            "SEM PLACA"}
                        </strong>

                        <ChevronRight
                          size={19}
                        />
                      </div>
                    </header>

                    <div className="viatura-card-dados-simples">
                      <div>
                        <span>
                          <Building2
                            size={14}
                          />
                          Marca
                        </span>

                        <strong>
                          {viatura.marca ||
                            "-"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          <CarFront
                            size={14}
                          />
                          Modelo
                        </span>

                        <strong>
                          {viatura.modelo ||
                            "-"}
                          {viatura.ano
                            ? ` — ${viatura.ano}`
                            : ""}
                        </strong>
                      </div>

                      <div>
                        <span>
                          <Gauge
                            size={14}
                          />
                          Odômetro
                        </span>

                        <strong>
                          {formatarNumero(
                            viatura.odometro
                          )}{" "}
                          KM
                        </strong>
                      </div>

                      <div>
                        <span>
                          <Fuel
                            size={14}
                          />
                          Combustível
                        </span>

                        <strong>
                          {viatura.combustivel ||
                            "-"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          <MapPin
                            size={14}
                          />
                          Cidade
                        </span>

                        <strong>
                          {cidade}
                        </strong>
                      </div>

                      <div>
                        <span>
                          <Building2
                            size={14}
                          />
                          Lotação
                        </span>

                        <strong>
                          {lotacao}
                        </strong>
                      </div>
                    </div>

                    <footer className="viatura-card-rodape">
                      <span>
                        Unidade Frota:{" "}
                        <strong>
                          {viatura.codigo_siad_unidade_frota ||
                            "-"}
                        </strong>
                      </span>

                      <span className="viatura-card-abrir">
                        Ver prontuário
                        <ChevronRight
                          size={15}
                        />
                      </span>
                    </footer>
                  </article>
                );
              }
            )}
          </section>
        )}
      </section>

      {modalAberto && (
        <NovaViaturaModalV2
          viaturas={viaturas}
          onFechar={fecharModal}
          onSalvar={
            cadastrarViatura
          }
        />
      )}
    </main>
  );
}

export default Viaturas;