import { useEffect, useMemo, useState } from "react";
import { Car, RefreshCw, Search } from "lucide-react";

import { buscarViaturas } from "../../services/viaturasService";

import "./Viaturas.css";

function normalizarTexto(valor = "") {
  return String(valor ?? "").trim().toUpperCase();
}

function formatarPlaca(valor = "") {
  const placa = normalizarTexto(valor).replace(/[^A-Z0-9]/g, "");

  if (placa.length <= 3) {
    return placa;
  }

  return `${placa.slice(0, 3)}-${placa.slice(3, 7)}`;
}

function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    maximumFractionDigits: 1,
  });
}

function classeSituacao(situacao = "") {
  const valor = normalizarTexto(situacao);

  if (
    valor === "DISPONÍVEL" ||
    valor === "DISPONIVEL" ||
    valor === "ATIVA"
  ) {
    return "viatura-situacao viatura-situacao-disponivel";
  }

  if (
    valor === "EM MANUTENÇÃO" ||
    valor === "EM MANUTENCAO" ||
    valor === "MANUTENÇÃO" ||
    valor === "MANUTENCAO"
  ) {
    return "viatura-situacao viatura-situacao-manutencao";
  }

  if (valor === "BAIXADA") {
    return "viatura-situacao viatura-situacao-baixada";
  }

  return "viatura-situacao";
}

function Viaturas() {
  const [viaturas, setViaturas] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarViaturas();
  }, []);

  async function carregarViaturas() {
    try {
      setCarregando(true);
      setErro("");

      const dados = await buscarViaturas();

      setViaturas(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error("Erro ao carregar viaturas:", error);

      setErro(
        error?.message ||
          "NÃO FOI POSSÍVEL CARREGAR AS VIATURAS."
      );
    } finally {
      setCarregando(false);
    }
  }

  const viaturasFiltradas = useMemo(() => {
    const termo = normalizarTexto(pesquisa);

    if (!termo) {
      return viaturas;
    }

    return viaturas.filter((viatura) => {
      const conteudo = [
        viatura.prefixo,
        viatura.placa,
        viatura.marca,
        viatura.modelo,
        viatura.ano,
        viatura.combustivel,
        viatura.cidade,
        viatura.lotacao,
        viatura.unidade_frota,
        viatura.situacao,
      ]
        .filter(Boolean)
        .join(" ")
        .toUpperCase();

      return conteudo.includes(termo);
    });
  }, [viaturas, pesquisa]);

  const indicadores = useMemo(() => {
    const total = viaturas.length;

    const disponiveis = viaturas.filter((viatura) =>
      ["DISPONÍVEL", "DISPONIVEL", "ATIVA"].includes(
        normalizarTexto(viatura.situacao)
      )
    ).length;

    const manutencao = viaturas.filter((viatura) =>
      [
        "EM MANUTENÇÃO",
        "EM MANUTENCAO",
        "MANUTENÇÃO",
        "MANUTENCAO",
      ].includes(normalizarTexto(viatura.situacao))
    ).length;

    const baixadas = viaturas.filter(
      (viatura) =>
        normalizarTexto(viatura.situacao) === "BAIXADA"
    ).length;

    return {
      total,
      disponiveis,
      manutencao,
      baixadas,
    };
  }, [viaturas]);

  return (
    <main className="viaturas-page">
      <section className="viaturas-container">
        <header className="viaturas-cabecalho">
          <div>
            <span className="viaturas-etiqueta">
              ADMINISTRATIVO
            </span>

            <h1>Viaturas</h1>

            <p>
              Consulta e gerenciamento das viaturas cadastradas.
            </p>
          </div>

          <button
            type="button"
            className="viaturas-botao-atualizar"
            onClick={carregarViaturas}
            disabled={carregando}
          >
            <RefreshCw
              size={18}
              className={carregando ? "girando" : ""}
            />

            {carregando ? "Atualizando..." : "Atualizar"}
          </button>
        </header>

        <section className="viaturas-indicadores">
          <article>
            <span>Total</span>
            <strong>{indicadores.total}</strong>
          </article>

          <article>
            <span>Disponíveis</span>
            <strong>{indicadores.disponiveis}</strong>
          </article>

          <article>
            <span>Em manutenção</span>
            <strong>{indicadores.manutencao}</strong>
          </article>

          <article>
            <span>Baixadas</span>
            <strong>{indicadores.baixadas}</strong>
          </article>
        </section>

        <section className="viaturas-ferramentas">
          <label className="viaturas-pesquisa">
            <Search size={19} />

            <input
              type="text"
              value={pesquisa}
              onChange={(event) =>
                setPesquisa(event.target.value)
              }
              placeholder="Pesquisar por prefixo, placa, marca, modelo, cidade ou lotação..."
            />
          </label>
        </section>

        {erro && (
          <div className="viaturas-mensagem viaturas-mensagem-erro">
            {erro}
          </div>
        )}

        {carregando && (
          <div className="viaturas-mensagem">
            Carregando viaturas...
          </div>
        )}

        {!carregando &&
          !erro &&
          viaturasFiltradas.length === 0 && (
            <div className="viaturas-vazio">
              <Car size={42} />

              <h2>Nenhuma viatura encontrada</h2>

              <p>
                Cadastre uma viatura ou altere os termos da
                pesquisa.
              </p>
            </div>
          )}

        {!carregando &&
          !erro &&
          viaturasFiltradas.length > 0 && (
            <section className="viaturas-tabela-container">
              <header className="viaturas-tabela-cabecalho">
                <div>
                  <strong>Relação de viaturas</strong>

                  <span>
                    {viaturasFiltradas.length} registro(s)
                  </span>
                </div>
              </header>

              <div className="viaturas-tabela-scroll">
                <table className="viaturas-tabela">
                  <thead>
                    <tr>
                      <th>Prefixo</th>
                      <th>Placa</th>
                      <th>Marca</th>
                      <th>Modelo</th>
                      <th>Ano</th>
                      <th>Odômetro</th>
                      <th>Combustível</th>
                      <th>Cidade</th>
                      <th>Lotação</th>
                      <th>Unidade da frota</th>
                      <th>Situação</th>
                    </tr>
                  </thead>

                  <tbody>
                    {viaturasFiltradas.map((viatura) => (
                      <tr key={viatura.id}>
                        <td className="viatura-prefixo">
                          {viatura.prefixo || "-"}
                        </td>

                        <td className="viatura-placa">
                          {formatarPlaca(viatura.placa) || "-"}
                        </td>

                        <td>{viatura.marca || "-"}</td>

                        <td>{viatura.modelo || "-"}</td>

                        <td>{viatura.ano || "-"}</td>

                        <td>
                          {formatarNumero(viatura.odometro)} KM
                        </td>

                        <td>{viatura.combustivel || "-"}</td>

                        <td>{viatura.cidade || "-"}</td>

                        <td>{viatura.lotacao || "-"}</td>

                        <td>{viatura.unidade_frota || "-"}</td>

                        <td>
                          <span
                            className={classeSituacao(
                              viatura.situacao
                            )}
                          >
                            {viatura.situacao || "NÃO INFORMADA"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
      </section>
    </main>
  );
}

export default Viaturas;