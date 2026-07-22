import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  AlertTriangle,
  Eye,
  Fuel,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import "./Abastecimentos.css";

import {
  atualizarErroAbastecimento,
  buscarAbastecimentos,
  atualizarStatusSiad,
} from "../../services/abastecimentosService";





function normalizarStatus(valor) {
  return String(valor || "RECEBIDO").trim().toUpperCase();
}

function Abastecimentos() {
  const navigate = useNavigate();

  const [abastecimentos, setAbastecimentos] = useState([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [visualizado, setVisualizado] = useState(null);
  const [abastecimentoCorrecao, setAbastecimentoCorrecao] =
    useState(null);

  const [tipoErro, setTipoErro] = useState("");
  const [descricaoErro, setDescricaoErro] = useState("");
  const [salvandoCorrecao, setSalvandoCorrecao] =
    useState(false);
  const [erroCorrecao, setErroCorrecao] = useState("");

  const [atualizandoStatusId, setAtualizandoStatusId] =
  useState(null);

const [erroStatus, setErroStatus] = useState("");

  useEffect(() => {
    carregarAbastecimentos();
  }, []);


  async function alterarStatusSiad(
    abastecimento,
    novoStatus
  ) {
    if (!abastecimento?.id) {
      return;
    }

    const statusNormalizado = normalizarStatus(novoStatus);
    let observacao = null;

    if (statusNormalizado === "ERRO") {
      observacao = window.prompt(
        "Informe o motivo do erro no lançamento do SIAD:"
      );

      if (!observacao?.trim()) {
        return;
      }
    }

    try {
      setAtualizandoStatusId(abastecimento.id);
      setErroStatus("");

      const atualizado = await atualizarStatusSiad(
        abastecimento.id,
        statusNormalizado,
        observacao?.trim() || null
      );

      setAbastecimentos((listaAtual) => {
        if (
          normalizarStatus(atualizado.status_siad) ===
          "LANÇADO"
        ) {
          return listaAtual.filter(
            (item) => item.id !== atualizado.id
          );
        }

        return listaAtual.map((item) =>
          item.id === atualizado.id
            ? atualizado
            : item
        );
      });

      if (
        visualizado?.id === atualizado.id &&
        normalizarStatus(atualizado.status_siad) ===
          "LANÇADO"
      ) {
        setVisualizado(null);
      }
    } catch (error) {
      console.error(error);

      setErroStatus(
        error?.message ||
          "NÃO FOI POSSÍVEL ALTERAR O STATUS DO SIAD."
      );
    } finally {
      setAtualizandoStatusId(null);
    }
  }

  async function carregarAbastecimentos() {
    try {
      setCarregando(true);
      setErro("");

      const dados = await buscarAbastecimentos();

      setAbastecimentos(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error("Erro ao carregar abastecimentos:", error);

      setErro(
        error?.message || "Erro ao carregar abastecimentos."
      );
    } finally {
      setCarregando(false);
    }
  }

  const listaFiltrada = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return abastecimentos.filter((item) => {
      const status = normalizarStatus(item.status_siad);

      const permaneceNaFila =
        status === "RECEBIDO" ||
        status === "ERRO";

      if (!permaneceNaFila) {
        return false;
      }

      if (!termo) {
        return true;
      }

      const conteudo = [
        item.numero_abastecimento,
        item.prefixo,
        item.placa,
        item.motorista_nome,
        item.cidade_abastecimento,
        item.convenente_nome,
        item.combustivel,
        item.tipo_erro,
        item.descricao_erro,
        item.erro_siad,
        status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return conteudo.includes(termo);
    });
  }, [abastecimentos, busca]);

  const indicadores = useMemo(() => {
    const total = listaFiltrada.length;

    const valorTotal = listaFiltrada.reduce(
      (soma, item) => soma + Number(item.valor_total || 0),
      0
    );

    const litrosTotal = listaFiltrada.reduce(
      (soma, item) => soma + Number(item.litros || 0),
      0
    );

    const totalPlacas = new Set(
      listaFiltrada.map((item) => item.placa).filter(Boolean)
    ).size;

    return {
      total,
      valorTotal,
      litrosTotal,
      totalPlacas,
    };
  }, [listaFiltrada]);

  function moeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function numero(valor, minimo = 0, maximo = 3) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: minimo,
      maximumFractionDigits: maximo,
    });
  }

  function dataHora(valor) {
    if (!valor) {
      return "-";
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      return "-";
    }

    return data.toLocaleString("pt-BR");
  }

  function obterStatus(item) {
    return normalizarStatus(item.status_siad);
  }

  function abrirCorrecao(item) {
    setAbastecimentoCorrecao(item);
    setTipoErro(item.tipo_erro || "DADOS INCORRETOS");
    setDescricaoErro(item.descricao_erro || "");
    setErroCorrecao("");
  }

  function fecharCorrecao() {
    if (salvandoCorrecao) {
      return;
    }

    setAbastecimentoCorrecao(null);
    setTipoErro("");
    setDescricaoErro("");
    setErroCorrecao("");
  }

  async function salvarCorrecao(event) {
    event.preventDefault();

    try {
      setErroCorrecao("");

      if (!abastecimentoCorrecao?.id) {
        throw new Error("Abastecimento não identificado.");
      }

      if (!tipoErro.trim()) {
        throw new Error("Selecione o tipo da pendência.");
      }

      if (!descricaoErro.trim()) {
        throw new Error(
          "Descreva o erro ou a correção necessária."
        );
      }

      setSalvandoCorrecao(true);

      await atualizarErroAbastecimento(
        abastecimentoCorrecao.id,
        {
          tipoErro: tipoErro.trim(),
          descricaoErro: descricaoErro.trim(),
        }
      );

      setAbastecimentoCorrecao(null);
      setTipoErro("");
      setDescricaoErro("");
      setErroCorrecao("");

      await carregarAbastecimentos();
    } catch (error) {
      console.error("Erro ao registrar correção:", error);

      setErroCorrecao(
        error?.message ||
          "Não foi possível registrar a pendência."
      );
    } finally {
      setSalvandoCorrecao(false);
    }
  }

  function formatarTelefoneWhatsApp(telefone = "") {
    let numeros = String(telefone).replace(/\D/g, "");

    if (!numeros) {
      return "";
    }

    numeros = numeros.replace(/^0+/, "");

    if (!numeros.startsWith("55")) {
      numeros = `55${numeros}`;
    }

    return numeros;
  }

  function criarMensagemWhatsApp(abastecimento) {
    const numeroDocumento =
      abastecimento?.numero_abastecimento || "SEM NÚMERO";

    const prefixo =
      abastecimento?.prefixo || "NÃO INFORMADO";

    const placa =
      abastecimento?.placa || "NÃO INFORMADA";

    const motorista =
      abastecimento?.motorista_nome || "MILITAR";

    const tipoPendencia =
      tipoErro.trim() ||
      abastecimento?.tipo_erro ||
      "NÃO INFORMADA";

    const descricao =
      descricaoErro.trim() ||
      abastecimento?.descricao_erro ||
      "CONSULTE O RESPONSÁVEL PELO CONTROLE DE ABASTECIMENTOS.";

    return [
      `Olá, ${motorista}.`,
      "",
      "Foi identificada uma pendência no abastecimento abaixo:",
      "",
      `Documento: ${numeroDocumento}`,
      `Viatura: ${prefixo} - ${placa}`,
      `Tipo da pendência: ${tipoPendencia}`,
      `Descrição: ${descricao}`,
      "",
      "Solicitamos que verifique os dados e providencie a correção.",
      "",
      "SiGeF - Sistema de Gestão de Frota do 45º BPM",
    ].join("\n");
  }

  function enviarPendenciaWhatsApp(abastecimento) {
    setErroCorrecao("");

    if (!tipoErro.trim()) {
      setErroCorrecao("Selecione o tipo da pendência.");
      return;
    }

    if (!descricaoErro.trim()) {
      setErroCorrecao(
        "Descreva a pendência antes de enviar mensagem pelo WhatsApp."
      );
      return;
    }

    const telefone = formatarTelefoneWhatsApp(
      abastecimento?.motorista_telefone
    );

    if (!telefone) {
      setErroCorrecao(
        "O motorista não possui telefone cadastrado."
      );
      return;
    }

    if (telefone.length < 12 || telefone.length > 13) {
      setErroCorrecao(
        "O telefone cadastrado não possui um formato válido para o WhatsApp."
      );
      return;
    }

    const mensagem = criarMensagemWhatsApp(abastecimento);
    const url = `https://wa.me/${telefone}?text=${encodeURIComponent(
      mensagem
    )}`;

    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="abastecimentos-page">
      <section className="abastecimentos-layout">
        <header className="abastecimentos-header">
          <div className="titulo-area">
            <div className="icone-titulo">
              <Fuel size={34} />
            </div>

            <div>
              <span className="abastecimento-badge">
                SiGeF 45º BPM
              </span>

              <h1>Abastecimentos</h1>

              <p>
                Fila de abastecimentos recebidos ou com erro
                no lançamento do SIAD.
              </p>
            </div>
          </div>

          <button
            className="botao-novo"
            type="button"
            onClick={() => navigate("/abastecimento")}
          >
            <Plus size={28} />
            Novo Abastecimento
          </button>
        </header>

        <section className="painel-filtros">
          <label className="campo-pesquisa">
            <Search size={28} />

            <input
              type="text"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Pesquisar por placa, prefixo, motorista, cidade..."
            />
          </label>

          <button
            type="button"
            className="botao-atualizar"
            onClick={carregarAbastecimentos}
            disabled={carregando}
          >
            <RefreshCw
              size={27}
              className={carregando ? "icone-girando" : ""}
            />

            {carregando ? "Atualizando..." : "Atualizar"}
          </button>
        </section>

        <section className="indicadores-abastecimentos">
          <div className="indicador-abastecimento">
            <span>⛽ Para lançar</span>
            <strong>{indicadores.total}</strong>
            <small>Recebidos / Erro</small>
          </div>

          <div className="indicador-abastecimento">
            <span>💰 Valor Total</span>
            <strong>{moeda(indicadores.valorTotal)}</strong>
            <small>Na fila</small>
          </div>

          <div className="indicador-abastecimento">
            <span>🛢 Litros</span>
            <strong>
              {numero(indicadores.litrosTotal)} L
            </strong>
            <small>Na fila</small>
          </div>

          <div className="indicador-abastecimento">
            <span>🚓 Viaturas</span>
            <strong>{indicadores.totalPlacas}</strong>
            <small>Com pendência</small>
          </div>
        </section>

        {erro && <div className="aviso-erro">{erro}</div>}

        {erroStatus && (
          <div className="aviso-erro">
            {erroStatus}
          </div>
        )}

        {carregando ? (
          <div className="carregando">
            Carregando abastecimentos...
          </div>
        ) : (
          <section className="tabela-card">
            <div className="tabela-scroll">
              <table className="tabela-abastecimentos">
                <thead>
                  <tr>
                    <th>Nº</th>
                    <th>Data</th>
                    <th>Prefixo</th>
                    <th>Placa</th>
                    <th>Combustível</th>
                    <th>Cidade</th>
                    <th>Litros</th>
                    <th>Convenente</th>
                    <th>Valor Unit.</th>
                    <th>Valor Total</th>
                    <th>Status</th>
                    <th>Motorista</th>
                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {listaFiltrada.map((item) => {
                    const status = obterStatus(item);

                    const emErro = status === "ERRO";

                    return (
                      <tr
                        key={item.id}
                        className={
                          emErro ? "linha-com-erro" : ""
                        }
                      >
                        <td>
                          {item.numero_abastecimento || "SEM Nº"}
                        </td>
                        <td>{dataHora(item.data_hora)}</td>
                        <td>{item.prefixo || "-"}</td>
                        <td>{item.placa || "-"}</td>
                        <td>{item.combustivel || "-"}</td>
                        <td>
                          {item.cidade_abastecimento || "-"}
                        </td>
                        <td>{numero(item.litros)} L</td>
                        <td>{item.convenente_nome || "-"}</td>
                        <td>{moeda(item.valor_unitario)}</td>
                        <td>{moeda(item.valor_total)}</td>
                        <td>
                          <div className="status-siad-celula">
                            <select
                              className={`status-siad-select ${
                                status === "ERRO"
                                  ? "status-siad-erro"
                                  : "status-siad-recebido"
                              }`}
                              value={status}
                              disabled={
                                atualizandoStatusId === item.id
                              }
                              onChange={(event) =>
                                alterarStatusSiad(
                                  item,
                                  event.target.value
                                )
                              }
                              aria-label={`Status SIAD do abastecimento ${
                                item.numero_abastecimento || ""
                              }`}
                            >
                              <option value="RECEBIDO">
                                RECEBIDO
                              </option>

                              <option value="LANÇADO">
                                LANÇADO SIAD
                              </option>

                              <option value="ERRO">
                                ERRO
                              </option>
                            </select>

                            {status === "ERRO" && (
                              <small className="status-siad-motivo">
                                {item.erro_siad ||
                                  item.descricao_erro ||
                                  "ERRO NÃO DESCRITO"}
                              </small>
                            )}
                          </div>
                        </td>
                        <td>{item.motorista_nome || "-"}</td>
                        <td>
                          <div className="acoes-tabela">
                            <button
                              type="button"
                              className="acao-visualizar"
                              title="Visualizar abastecimento"
                              aria-label="Visualizar abastecimento"
                              onClick={() => setVisualizado(item)}
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              type="button"
                              className="botao-erro"
                              title="Registrar ou editar pendência"
                              aria-label="Registrar ou editar pendência"
                              onClick={() => abrirCorrecao(item)}
                            >
                              <AlertTriangle size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {listaFiltrada.length === 0 && (
                    <tr>
                      <td
                        colSpan={13}
                        className="sem-registros"
                      >
                        Nenhum abastecimento pendente ou em
                        correção.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </section>

      {visualizado && (
        <div
          className="modal-fundo"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setVisualizado(null);
            }
          }}
        >
          <section
            className="modal-abastecimento"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-resumo-abastecimento"
          >
            <header className="modal-topo">
              <div>
                <span>ABASTECIMENTO</span>
                <h2 id="titulo-resumo-abastecimento">
                  Resumo do Abastecimento
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setVisualizado(null)}
                aria-label="Fechar resumo"
              >
                <X size={20} />
              </button>
            </header>

            <div className="resumo-modal-abastecimento">
              <p>
                <span>Nº:</span>
                <strong>
                  {visualizado.numero_abastecimento ||
                    "SEM Nº"}
                </strong>
              </p>

              <p>
                <span>Data/Hora:</span>
                <strong>
                  {dataHora(visualizado.data_hora)}
                </strong>
              </p>

              <p>
                <span>Motorista:</span>
                <strong>
                  {visualizado.motorista_nome || "-"}
                </strong>
              </p>

              <p>
                <span>Nº de Polícia:</span>
                <strong>
                  {visualizado.numero_policia || "-"}
                </strong>
              </p>

              <p>
                <span>Cidade:</span>
                <strong>
                  {visualizado.cidade_abastecimento || "-"}
                </strong>
              </p>

              <p>
                <span>Viatura:</span>
                <strong>
                  {visualizado.prefixo || "-"} ·{" "}
                  {visualizado.placa || "-"}
                </strong>
              </p>

              <p>
                <span>Marca / Modelo:</span>
                <strong>
                  {visualizado.marca || "-"}{" "}
                  {visualizado.modelo || ""}
                </strong>
              </p>

              <p>
                <span>Convenente:</span>
                <strong>
                  {visualizado.convenente_nome || "-"}
                </strong>
              </p>

              <p>
                <span>Combustível:</span>
                <strong>
                  {visualizado.combustivel || "-"}
                </strong>
              </p>

              <p>
                <span>Odômetro anterior:</span>
                <strong>
                  {numero(visualizado.odometro_anterior)} KM
                </strong>
              </p>

              <p>
                <span>Odômetro atual:</span>
                <strong>
                  {numero(
                    visualizado.odometro_atual ||
                      visualizado.odometro
                  )}{" "}
                  KM
                </strong>
              </p>

              <p>
                <span>KM rodados:</span>
                <strong>
                  {numero(visualizado.km_rodados)} KM
                </strong>
              </p>

              <p>
                <span>Litros:</span>
                <strong>
                  {numero(visualizado.litros, 2, 3)} L
                </strong>
              </p>

              <p>
                <span>Valor unitário:</span>
                <strong>
                  {moeda(visualizado.valor_unitario)}
                </strong>
              </p>

              <p>
                <span>Valor total:</span>
                <strong>
                  {moeda(visualizado.valor_total)}
                </strong>
              </p>

              <p>
                <span>Média:</span>
                <strong>
                  {numero(
                    visualizado.media_km_litro,
                    2,
                    3
                  )}{" "}
                  KM/L
                </strong>
              </p>

              <p>
                <span>Custo por KM:</span>
                <strong>
                  {moeda(visualizado.custo_por_km)}
                </strong>
              </p>

              <p>
                <span>Status:</span>
                <strong>{obterStatus(visualizado)}</strong>
              </p>

              {visualizado.descricao_erro && (
                <p className="resumo-erro">
                  <span>Pendência:</span>
                  <strong>
                    {visualizado.descricao_erro}
                  </strong>
                </p>
              )}
            </div>

            <footer className="modal-acoes">
              <button
                type="button"
                onClick={() => setVisualizado(null)}
              >
                Fechar
              </button>
            </footer>
          </section>
        </div>
      )}

      {abastecimentoCorrecao && (
        <div
          className="modal-fundo"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharCorrecao();
            }
          }}
        >
          <section
            className="modal-abastecimento modal-correcao"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-correcao-abastecimento"
          >
            <header className="modal-topo">
              <div>
                <span>PENDÊNCIA</span>
                <h2 id="titulo-correcao-abastecimento">
                  Registrar correção
                </h2>
              </div>

              <button
                type="button"
                onClick={fecharCorrecao}
                disabled={salvandoCorrecao}
                aria-label="Fechar correção"
              >
                <X size={20} />
              </button>
            </header>

            <form
              className="formulario-correcao"
              onSubmit={salvarCorrecao}
            >
              <div className="correcao-identificacao">
                <div>
                  <span>Nº</span>
                  <strong>
                    {abastecimentoCorrecao
                      .numero_abastecimento || "SEM Nº"}
                  </strong>
                </div>

                <div>
                  <span>Viatura</span>
                  <strong>
                    {abastecimentoCorrecao.prefixo || "-"} ·{" "}
                    {abastecimentoCorrecao.placa || "-"}
                  </strong>
                </div>

                <div>
                  <span>Motorista</span>
                  <strong>
                    {abastecimentoCorrecao.motorista_nome ||
                      "-"}
                  </strong>
                </div>
              </div>

              <label className="campo-correcao">
                Tipo da pendência *

                <select
                  value={tipoErro}
                  onChange={(event) =>
                    setTipoErro(event.target.value)
                  }
                >
                  <option value="">SELECIONE</option>
                  <option value="DADOS INCORRETOS">
                    DADOS INCORRETOS
                  </option>
                  <option value="ODÔMETRO INCORRETO">
                    ODÔMETRO INCORRETO
                  </option>
                  <option value="LITROS INCORRETOS">
                    LITROS INCORRETOS
                  </option>
                  <option value="VALOR INCORRETO">
                    VALOR INCORRETO
                  </option>
                  <option value="COMBUSTÍVEL INCORRETO">
                    COMBUSTÍVEL INCORRETO
                  </option>
                  <option value="CONVENENTE INCORRETO">
                    CONVENENTE INCORRETO
                  </option>
                  <option value="DOCUMENTO PENDENTE">
                    DOCUMENTO PENDENTE
                  </option>
                  <option value="OUTRO">OUTRO</option>
                </select>
              </label>

              <label className="campo-correcao">
                Descrição da pendência *

                <textarea
                  value={descricaoErro}
                  onChange={(event) =>
                    setDescricaoErro(event.target.value)
                  }
                  rows={5}
                  maxLength={500}
                  placeholder="Descreva claramente o que precisa ser corrigido..."
                />

                <small>{descricaoErro.length}/500</small>
              </label>

              {erroCorrecao && (
                <div className="aviso-erro">
                  {erroCorrecao}
                </div>
              )}

              <footer className="modal-acoes modal-acoes-correcao">
                <button
                  type="button"
                  onClick={fecharCorrecao}
                  disabled={salvandoCorrecao}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="botao-whatsapp"
                  onClick={() =>
                    enviarPendenciaWhatsApp(
                      abastecimentoCorrecao
                    )
                  }
                  disabled={salvandoCorrecao}
                >
                  <MessageCircle size={18} />
                  Enviar WhatsApp
                </button>

                <button
                  type="submit"
                  className="botao-salvar-correcao"
                  disabled={salvandoCorrecao}
                >
                  {salvandoCorrecao
                    ? "Salvando..."
                    : "Registrar pendência"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default Abastecimentos;