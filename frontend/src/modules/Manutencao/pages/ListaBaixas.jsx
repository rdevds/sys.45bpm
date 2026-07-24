import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  FileText,
  Search,
  Wrench,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  buscarBaixasManutencao,
} from "../services/baixasManutencaoService.js";

import "../ManutencaoAdmin.css";

function texto(valor) {
  return String(valor ?? "").trim();
}

function textoMaiusculo(valor) {
  return texto(valor).toUpperCase();
}

function formatarDataHora(valor) {
  if (!valor) {
    return "NÃO INFORMADA";
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return texto(valor);
  }

  return data.toLocaleString("pt-BR");
}

function formatarKm(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "0 KM";
  }

  return `${numero.toLocaleString("pt-BR")} KM`;
}

function classeSituacao(situacao) {
  const status = textoMaiusculo(situacao);

  if (status === "ABERTA") {
    return "situacao-aberta";
  }

  if (status === "EM MANUTENÇÃO") {
    return "situacao-manutencao";
  }

  if (status === "FINALIZADA") {
    return "situacao-finalizada";
  }

  return "situacao-padrao";
}

function ListaBaixas() {
  const navigate = useNavigate();

  const [baixas, setBaixas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [pesquisa, setPesquisa] = useState("");
  const [filtroSituacao, setFiltroSituacao] =
    useState("TODAS");

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setCarregando(true);
        setErro("");

        const dados =
          await buscarBaixasManutencao();

        if (ativo) {
          setBaixas(dados);
        }
      } catch (error) {
        console.error(
          "Erro ao carregar baixas:",
          error
        );

        if (ativo) {
          setErro(
            error?.message ||
              "NÃO FOI POSSÍVEL CARREGAR AS BAIXAS."
          );
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, []);

  const indicadores = useMemo(() => {
    const abertas = baixas.filter(
      (item) =>
        textoMaiusculo(item.situacao) ===
        "ABERTA"
    ).length;

    const emManutencao = baixas.filter(
      (item) =>
        textoMaiusculo(item.situacao) ===
        "EM MANUTENÇÃO"
    ).length;

    const finalizadas = baixas.filter(
      (item) =>
        textoMaiusculo(item.situacao) ===
        "FINALIZADA"
    ).length;

    return {
      abertas,
      emManutencao,
      finalizadas,
      total: baixas.length,
    };
  }, [baixas]);

  const baixasFiltradas = useMemo(() => {
    const termo =
      textoMaiusculo(pesquisa);

    return baixas.filter((baixa) => {
      const situacao =
        textoMaiusculo(baixa.situacao);

      const correspondeSituacao =
        filtroSituacao === "TODAS" ||
        situacao === filtroSituacao;

      if (!correspondeSituacao) {
        return false;
      }

      if (!termo) {
        return true;
      }

      const conteudo = [
        baixa.numero_baixa,
        baixa.prefixo,
        baixa.placa,
        baixa.responsavel,
        baixa.graduacao,
        baixa.problema,
        baixa.situacao,
      ]
        .map(textoMaiusculo)
        .join(" ");

      return conteudo.includes(termo);
    });
  }, [
    baixas,
    pesquisa,
    filtroSituacao,
  ]);

  function visualizarBaixa(baixa) {
    window.alert(
      [
        `BAIXA Nº ${baixa.numero_baixa}`,
        `DATA/HORA: ${formatarDataHora(baixa.data_hora)}`,
        `PREFIXO: ${baixa.prefixo}`,
        `PLACA: ${baixa.placa}`,
        `RESPONSÁVEL: ${baixa.responsavel}`,
        `KM: ${formatarKm(baixa.km_baixa)}`,
        `PROBLEMA: ${baixa.problema}`,
        `SITUAÇÃO: ${baixa.situacao}`,
      ].join("\n")
    );
  }

  function gerarPdfBaixa(baixa) {
    window.alert(
      `A GERAÇÃO DO PDF DA BAIXA Nº ${baixa.numero_baixa} SERÁ IMPLEMENTADA APÓS A CONCLUSÃO DO FLUXO DA MANUTENÇÃO.`
    );
  }

  function abrirOrdemServico(baixa) {
    navigate(
      `/administrativo/manutencoes/${baixa.id}/ordem-servico`
    );
  }

  return (
    <section className="manutencoes-pagina">
      <header className="manutencoes-cabecalho">
        <div>
          <span className="manutencoes-etiqueta">
            SIGE • FROTA
          </span>

          <h1>Manutenções</h1>

          <p>
            Controle de baixas e Ordens de Serviço.
          </p>
        </div>
      </header>

      <div className="manutencoes-indicadores">
        <article className="indicador-abertas">
          <span>ABERTAS</span>
          <strong>{indicadores.abertas}</strong>
          <small>Baixas aguardando OSV</small>
        </article>

        <article className="indicador-manutencao">
          <span>EM MANUTENÇÃO</span>
          <strong>
            {indicadores.emManutencao}
          </strong>
          <small>Serviços em andamento</small>
        </article>

        <article className="indicador-finalizadas">
          <span>FINALIZADAS</span>
          <strong>
            {indicadores.finalizadas}
          </strong>
          <small>Manutenções concluídas</small>
        </article>

        <article className="indicador-total">
          <span>TOTAL</span>
          <strong>{indicadores.total}</strong>
          <small>Registros de manutenção</small>
        </article>
      </div>

      <div className="manutencoes-filtros">
        <label className="manutencoes-pesquisa">
          <Search size={17} />

          <input
            type="text"
            value={pesquisa}
            onChange={(event) =>
              setPesquisa(event.target.value)
            }
            placeholder="Nº da baixa, prefixo, placa, responsável..."
          />
        </label>

        <label className="manutencoes-select">
          <span>Situação</span>

          <select
            value={filtroSituacao}
            onChange={(event) =>
              setFiltroSituacao(
                event.target.value
              )
            }
          >
            <option value="TODAS">
              Todas
            </option>

            <option value="ABERTA">
              Aberta
            </option>

            <option value="EM MANUTENÇÃO">
              Em manutenção
            </option>

            <option value="FINALIZADA">
              Finalizada
            </option>
          </select>
        </label>
      </div>

      {erro && (
        <div className="manutencoes-erro">
          {erro}
        </div>
      )}

      <div className="manutencoes-tabela-container">
        {carregando ? (
          <div className="manutencoes-vazio">
            Carregando baixas...
          </div>
        ) : baixasFiltradas.length === 0 ? (
          <div className="manutencoes-vazio">
            Nenhuma baixa encontrada.
          </div>
        ) : (
          <table className="manutencoes-tabela">
            <thead>
              <tr>
                <th>Nº DA BAIXA</th>
                <th>DATA/HORA</th>
                <th>PREFIXO</th>
                <th>PLACA</th>
                <th>RESPONSÁVEL</th>
                <th>KM</th>
                <th>PROBLEMA</th>
                <th>SITUAÇÃO</th>
                <th>AÇÕES</th>
              </tr>
            </thead>

            <tbody>
              {baixasFiltradas.map(
                (baixa) => (
                  <tr key={baixa.id}>
                    <td className="numero-baixa">
                      {baixa.numero_baixa}
                    </td>

                    <td>
                      {formatarDataHora(
                        baixa.data_hora
                      )}
                    </td>

                    <td>{baixa.prefixo}</td>

                    <td>{baixa.placa}</td>

                    <td>
                      {baixa.responsavel}
                    </td>

                    <td>
                      {formatarKm(
                        baixa.km_baixa
                      )}
                    </td>

                    <td className="problema-coluna">
                      {baixa.problema}
                    </td>

                    <td>
                      <span
                        className={`manutencoes-situacao ${classeSituacao(
                          baixa.situacao
                        )}`}
                      >
                        {baixa.situacao}
                      </span>
                    </td>

                    <td>
                      <div className="manutencoes-acoes">
                        <button
                          type="button"
                          title={`Visualizar baixa nº ${baixa.numero_baixa}`}
                          aria-label={`Visualizar baixa nº ${baixa.numero_baixa}`}
                          onClick={() =>
                            visualizarBaixa(baixa)
                          }
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          type="button"
                          title={`Gerar PDF da baixa nº ${baixa.numero_baixa}`}
                          aria-label={`Gerar PDF da baixa nº ${baixa.numero_baixa}`}
                          onClick={() =>
                            gerarPdfBaixa(baixa)
                          }
                        >
                          <FileText size={16} />
                        </button>

                        <button
                          type="button"
                          title={
                            textoMaiusculo(baixa.situacao) ===
                            "ABERTA"
                              ? `Gerar OSV nº ${baixa.numero_baixa}`
                              : `Abrir OSV nº ${baixa.numero_baixa}`
                          }
                          aria-label={
                            textoMaiusculo(baixa.situacao) ===
                            "ABERTA"
                              ? `Gerar OSV nº ${baixa.numero_baixa}`
                              : `Abrir OSV nº ${baixa.numero_baixa}`
                          }
                          className="acao-osv"
                          onClick={() =>
                            abrirOrdemServico(baixa)
                          }
                        >
                          <Wrench size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default ListaBaixas;