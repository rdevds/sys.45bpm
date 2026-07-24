import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Car,
  CheckCircle2,
  ClipboardList,
  Gauge,
  Save,
  UserRound,
  Wrench,
} from "lucide-react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  buscarBaixaParaOsv,
  buscarOsvPorBaixa,
  criarOrdemServico,
} from "../services/ordensServicoService.js";

import "../OrdemServico.css";

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function texto(valor) {
  return String(valor ?? "").trim();
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
    return "NÃO INFORMADO";
  }

  return `${numero.toLocaleString("pt-BR")} KM`;
}

/* =========================================================
   COMPONENTE
========================================================= */

function OrdemServico() {
  const { baixaId } = useParams();
  const navigate = useNavigate();

  const [baixa, setBaixa] =
    useState(null);

  const [osvExistente, setOsvExistente] =
    useState(null);

  const [oficina, setOficina] =
    useState("");

  const [
    responsavelOficina,
    setResponsavelOficina,
  ] = useState("");

  const [
    previsaoConclusao,
    setPrevisaoConclusao,
  ] = useState("");

  const [
    servicosSolicitados,
    setServicosSolicitados,
  ] = useState("");

  const [observacoes, setObservacoes] =
    useState("");

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const [ordemCriada, setOrdemCriada] =
    useState(null);

  /* =======================================================
     CARREGAR BAIXA
  ======================================================= */

  useEffect(() => {
    let ativo = true;

    async function carregarDados() {
      try {
        setCarregando(true);
        setErro("");

        const registroBaixa =
          await buscarBaixaParaOsv(
            baixaId
          );

        if (!ativo) {
          return;
        }

        setBaixa(registroBaixa);

        const ordem =
          await buscarOsvPorBaixa(
            registroBaixa.id
          );

        if (!ativo) {
          return;
        }

        setOsvExistente(ordem);

        if (
          !ordem &&
          registroBaixa.problema
        ) {
          setServicosSolicitados(
            registroBaixa.problema
          );
        }
      } catch (error) {
        console.error(
          "Erro ao carregar dados da OSV:",
          error
        );

        if (ativo) {
          setErro(
            error?.message ||
              "NÃO FOI POSSÍVEL CARREGAR A BAIXA."
          );
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarDados();

    return () => {
      ativo = false;
    };
  }, [baixaId]);

  /* =======================================================
     SALVAR ORDEM DE SERVIÇO
  ======================================================= */

  async function salvarOrdem(event) {
    event.preventDefault();

    try {
      setSalvando(true);
      setErro("");

      if (!baixa?.id) {
        throw new Error(
          "BAIXA NÃO IDENTIFICADA."
        );
      }

      if (
        servicosSolicitados
          .trim()
          .length < 5
      ) {
        throw new Error(
          "INFORME OS SERVIÇOS SOLICITADOS."
        );
      }

      const ordem =
        await criarOrdemServico({
          baixa,
          oficina,
          responsavelOficina,
          servicosSolicitados,
          previsaoConclusao,
          observacoes,
        });

      setOrdemCriada(ordem);
    } catch (error) {
      console.error(
        "Erro ao criar OSV:",
        error
      );

      setErro(
        error?.message ||
          "NÃO FOI POSSÍVEL CRIAR A ORDEM DE SERVIÇO."
      );
    } finally {
      setSalvando(false);
    }
  }

  function voltarManutencoes() {
    navigate(
      "/administrativo/manutencoes"
    );
  }

  /* =======================================================
     ESTADOS DA PÁGINA
  ======================================================= */

  if (carregando) {
    return (
      <section className="osv-pagina">
        <div className="osv-mensagem">
          Carregando dados da baixa...
        </div>
      </section>
    );
  }

  if (!baixa) {
    return (
      <section className="osv-pagina">
        <button
          type="button"
          className="osv-botao-voltar"
          onClick={voltarManutencoes}
        >
          <ArrowLeft size={17} />
          Voltar
        </button>

        <div className="osv-mensagem osv-mensagem-erro">
          {erro ||
            "BAIXA NÃO LOCALIZADA."}
        </div>
      </section>
    );
  }

  if (osvExistente) {
    return (
      <section className="osv-pagina">
        <button
          type="button"
          className="osv-botao-voltar"
          onClick={voltarManutencoes}
        >
          <ArrowLeft size={17} />
          Voltar para Manutenções
        </button>

        <div className="osv-ja-existente">
          <CheckCircle2 size={36} />

          <span>
            Ordem de Serviço existente
          </span>

          <h1>
            OSV Nº{" "}
            {osvExistente.numero_baixa}
          </h1>

          <p>
            A baixa nº{" "}
            <strong>
              {baixa.numero_baixa}
            </strong>{" "}
            já possui uma Ordem de Serviço
            vinculada.
          </p>

          <div className="osv-existente-dados">
            <div>
              <span>Situação</span>
              <strong>
                {osvExistente.situacao}
              </strong>
            </div>

            <div>
              <span>Prefixo</span>
              <strong>
                {osvExistente.prefixo}
              </strong>
            </div>

            <div>
              <span>Placa</span>
              <strong>
                {osvExistente.placa}
              </strong>
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* =======================================================
     TELA PRINCIPAL
  ======================================================= */

  return (
    <section className="osv-pagina">
      <button
        type="button"
        className="osv-botao-voltar"
        onClick={voltarManutencoes}
      >
        <ArrowLeft size={17} />
        Voltar para Manutenções
      </button>

      <header className="osv-cabecalho">
        <div>
          <span className="osv-etiqueta">
            SIGE • FROTA
          </span>

          <h1>
            Ordem de Serviço Nº{" "}
            {baixa.numero_baixa}
          </h1>

          <p>
            Ordem vinculada à baixa nº{" "}
            {baixa.numero_baixa}.
          </p>
        </div>

        <div className="osv-status">
          <span>Situação inicial</span>
          <strong>EM EXECUÇÃO</strong>
        </div>
      </header>

      {erro && (
        <div className="osv-mensagem osv-mensagem-erro">
          {erro}
        </div>
      )}

      <form
        className="osv-formulario"
        onSubmit={salvarOrdem}
      >
        {/* DADOS DA BAIXA */}

        <section className="osv-card">
          <header className="osv-card-cabecalho">
            <ClipboardList size={21} />

            <div>
              <span>Dados de origem</span>
              <h2>Baixa vinculada</h2>
            </div>
          </header>

          <div className="osv-dados-grid">
            <div>
              <span>Nº da baixa</span>
              <strong>
                {baixa.numero_baixa}
              </strong>
            </div>

            <div>
              <span>
                <CalendarDays size={14} />
                Data/hora
              </span>

              <strong>
                {formatarDataHora(
                  baixa.data_hora
                )}
              </strong>
            </div>

            <div>
              <span>
                <UserRound size={14} />
                Responsável
              </span>

              <strong>
                {baixa.responsavel}
              </strong>
            </div>

            <div>
              <span>Nº de Polícia</span>
              <strong>
                {baixa.numero_policia}
              </strong>
            </div>
          </div>
        </section>

        {/* VIATURA */}

        <section className="osv-card">
          <header className="osv-card-cabecalho">
            <Car size={21} />

            <div>
              <span>Identificação</span>
              <h2>Viatura</h2>
            </div>
          </header>

          <div className="osv-dados-grid osv-dados-viatura">
            <div>
              <span>Prefixo</span>
              <strong>
                {baixa.prefixo}
              </strong>
            </div>

            <div>
              <span>Placa</span>
              <strong>
                {baixa.placa}
              </strong>
            </div>

            <div>
              <span>Marca / Modelo</span>
              <strong>
                {baixa.marca}{" "}
                {baixa.modelo}
              </strong>
            </div>

            <div>
              <span>
                <Gauge size={14} />
                KM da baixa
              </span>

              <strong>
                {formatarKm(
                  baixa.km_baixa
                )}
              </strong>
            </div>
          </div>

          <div className="osv-problema">
            <span>
              Problema informado
            </span>

            <strong>
              {baixa.problema}
            </strong>
          </div>
        </section>

        {/* DADOS DA ORDEM */}

        <section className="osv-card">
          <header className="osv-card-cabecalho">
            <Wrench size={21} />

            <div>
              <span>Execução</span>
              <h2>
                Dados da Ordem de Serviço
              </h2>
            </div>
          </header>

          <div className="osv-campos-grid">
            <label className="osv-campo">
              <span>
                Oficina ou local do serviço
              </span>

              <input
                type="text"
                value={oficina}
                onChange={(event) =>
                  setOficina(
                    event.target.value
                      .toUpperCase()
                  )
                }
                placeholder="EX.: OFICINA CONVENIADA"
              />
            </label>

            <label className="osv-campo">
              <span>
                Responsável pelo serviço
              </span>

              <input
                type="text"
                value={responsavelOficina}
                onChange={(event) =>
                  setResponsavelOficina(
                    event.target.value
                      .toUpperCase()
                  )
                }
                placeholder="NOME DO RESPONSÁVEL"
              />
            </label>

            <label className="osv-campo">
              <span>
                Previsão de conclusão
              </span>

              <input
                type="date"
                value={previsaoConclusao}
                onChange={(event) =>
                  setPrevisaoConclusao(
                    event.target.value
                  )
                }
              />
            </label>

            <label className="osv-campo osv-campo-largo">
              <span>
                Serviços solicitados
              </span>

              <textarea
                rows={5}
                value={servicosSolicitados}
                onChange={(event) =>
                  setServicosSolicitados(
                    event.target.value
                      .toUpperCase()
                  )
                }
                placeholder="DESCREVA OS SERVIÇOS QUE DEVERÃO SER EXECUTADOS..."
              />

              <small>
                {servicosSolicitados.length} caracteres
              </small>
            </label>

            <label className="osv-campo osv-campo-largo">
              <span>Observações</span>

              <textarea
                rows={4}
                value={observacoes}
                onChange={(event) =>
                  setObservacoes(
                    event.target.value
                      .toUpperCase()
                  )
                }
                placeholder="OBSERVAÇÕES ADICIONAIS..."
              />
            </label>
          </div>
        </section>

        <footer className="osv-rodape">
          <div>
            <span>
              Ao salvar esta ordem
            </span>

            <strong>
              A BAIXA E A VIATURA PASSARÃO PARA EM MANUTENÇÃO
            </strong>
          </div>

          <button
            type="submit"
            className="osv-botao-salvar"
            disabled={salvando}
          >
            <Save size={18} />

            {salvando
              ? "Salvando..."
              : `Gerar OSV Nº ${baixa.numero_baixa}`}
          </button>
        </footer>
      </form>

      {/* SUCESSO */}

      {ordemCriada && (
        <div className="osv-modal-overlay">
          <section className="osv-modal-sucesso">
            <div>
              <CheckCircle2 size={40} />
            </div>

            <span>
              Ordem de Serviço criada
            </span>

            <h2>
              OSV Nº{" "}
              {ordemCriada.numero_baixa}
            </h2>

            <p>
              A Ordem de Serviço foi vinculada
              à baixa e a manutenção passou para
              a situação{" "}
              <strong>EM MANUTENÇÃO</strong>.
            </p>

            <button
              type="button"
              className="osv-botao-salvar"
              onClick={voltarManutencoes}
            >
              Concluir
            </button>
          </section>
        </div>
      )}
    </section>
  );
}

export default OrdemServico;