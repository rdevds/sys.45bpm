import { useState } from "react";
import {
  CalendarClock,
  Car,
  CheckCircle2,
  Gauge,
  Search,
  Send,
  UserRound,
  Wrench,
  X,
} from "lucide-react";

import {
  buscarViaturaParaBaixa,
  salvarBaixaManutencao,
  validarResponsavelBaixa,
} from "../services/baixasManutencaoService.js";

import "../Manutencao.css";

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function obterDataHoraLocal() {
  const agora = new Date();

  const deslocamento =
    agora.getTimezoneOffset() * 60 * 1000;

  return new Date(
    agora.getTime() - deslocamento
  )
    .toISOString()
    .slice(0, 16);
}

function somenteNumeros(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

function formatarKm(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "NÃO INFORMADO";
  }

  return `${numero.toLocaleString("pt-BR")} KM`;
}

function formatarDataHora(valor) {
  if (!valor) {
    return "NÃO INFORMADO";
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return valor;
  }

  return data.toLocaleString("pt-BR");
}

/* =========================================================
   COMPONENTE
========================================================= */

function BaixaManutencao() {
  const [numeroPolicia, setNumeroPolicia] =
    useState("");

  const [cpf4, setCpf4] =
    useState("");

  const [responsavel, setResponsavel] =
    useState(null);

  const [prefixo, setPrefixo] =
    useState("");

  const [viatura, setViatura] =
    useState(null);

  const [dataHora, setDataHora] =
    useState(obterDataHoraLocal());

  const [kmBaixa, setKmBaixa] =
    useState("");

  const [problema, setProblema] =
    useState("");

  const [validandoMilitar, setValidandoMilitar] =
    useState(false);

  const [buscandoViatura, setBuscandoViatura] =
    useState(false);

  const [enviando, setEnviando] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const [mostrarResumo, setMostrarResumo] =
    useState(false);

  const [baixaRegistrada, setBaixaRegistrada] =
    useState(null);

  /* =======================================================
     RESPONSÁVEL
  ======================================================= */

  async function validarResponsavel() {
    try {
      setValidandoMilitar(true);
      setErro("");
      setResponsavel(null);

      const militar =
        await validarResponsavelBaixa({
          numeroPolicia,
          cpf4,
        });

      setResponsavel(militar);
    } catch (error) {
      console.error(
        "Erro ao validar responsável:",
        error
      );

      setErro(
        error?.message ||
          "NÃO FOI POSSÍVEL VALIDAR O RESPONSÁVEL."
      );
    } finally {
      setValidandoMilitar(false);
    }
  }

  function alterarNumeroPolicia(valor) {
    setNumeroPolicia(
      somenteNumeros(valor).slice(0, 7)
    );

    setResponsavel(null);
    setPrefixo("");
    setViatura(null);
    setKmBaixa("");
    setProblema("");
    setErro("");
  }

  function alterarCpf4(valor) {
    setCpf4(
      somenteNumeros(valor).slice(0, 4)
    );

    setResponsavel(null);
    setPrefixo("");
    setViatura(null);
    setKmBaixa("");
    setProblema("");
    setErro("");
  }

  /* =======================================================
     VIATURA
  ======================================================= */

  async function localizarViatura() {
    try {
      setBuscandoViatura(true);
      setErro("");
      setViatura(null);

      const registro =
        await buscarViaturaParaBaixa(
          prefixo
        );

      setViatura(registro);

      /*
       * O último odômetro fica apenas no objeto viatura
       * para comparação interna.
       */
      setKmBaixa("");
    } catch (error) {
      console.error(
        "Erro ao localizar viatura:",
        error
      );

      setErro(
        error?.message ||
          "NÃO FOI POSSÍVEL LOCALIZAR A VIATURA."
      );
    } finally {
      setBuscandoViatura(false);
    }
  }

  function alterarPrefixo(valor) {
    setPrefixo(
      somenteNumeros(valor).slice(0, 5)
    );

    setViatura(null);
    setKmBaixa("");
    setErro("");
  }

  /* =======================================================
     RESUMO E ENVIO
  ======================================================= */

  function revisarBaixa(event) {
    event.preventDefault();

    setErro("");

    if (!responsavel?.id) {
      setErro(
        "VALIDE A IDENTIFICAÇÃO DO RESPONSÁVEL."
      );

      return;
    }

    if (!viatura?.id) {
      setErro(
        "LOCALIZE A VIATURA."
      );

      return;
    }

    if (!dataHora) {
      setErro(
        "INFORME A DATA E HORA DA BAIXA."
      );

      return;
    }

    const km = Number(
      somenteNumeros(kmBaixa)
    );

    const ultimoKmRegistrado = Number(
      viatura?.odometro
    );

    if (
      !Number.isInteger(km) ||
      km <= 0
    ) {
      setErro(
        "INFORME UM KM DE BAIXA VÁLIDO."
      );

      return;
    }

    if (
      Number.isFinite(ultimoKmRegistrado) &&
      km <= ultimoKmRegistrado
    ) {
      setErro(
        "O KM DE BAIXA DEVE SER SUPERIOR AO ÚLTIMO REGISTRADO."
      );

      return;
    }

    if (
      problema.trim().length < 5
    ) {
      setErro(
        "DESCREVA O PROBLEMA APRESENTADO."
      );

      return;
    }

    setMostrarResumo(true);
  }

  async function confirmarEnvio() {
    try {
      setEnviando(true);
      setErro("");

      const baixa =
        await salvarBaixaManutencao({
          militar: responsavel,
          viatura,
          dataHora,
          kmBaixa,
          problema,
        });

      setErro("");
      setMostrarResumo(false);
      setBaixaRegistrada(baixa);
    } catch (error) {
      console.error(
        "Erro ao enviar baixa:",
        error
      );

      /*
       * O modal permanece aberto e o erro aparece
       * dentro dele, acima dos dados do resumo.
       */
      setErro(
        error?.message ||
          "NÃO FOI POSSÍVEL REGISTRAR A BAIXA."
      );
    } finally {
      setEnviando(false);
    }
  }

  function fecharResumo() {
    if (enviando) {
      return;
    }

    setErro("");
    setMostrarResumo(false);
  }

  function limparFormulario() {
    setNumeroPolicia("");
    setCpf4("");
    setResponsavel(null);

    setPrefixo("");
    setViatura(null);

    setDataHora(
      obterDataHoraLocal()
    );

    setKmBaixa("");
    setProblema("");

    setErro("");
    setMostrarResumo(false);
    setBaixaRegistrada(null);
  }

  return (
    <main className="baixa-manutencao-pagina">
      <div className="baixa-manutencao-container">
        <header className="baixa-manutencao-cabecalho">
          <div className="baixa-manutencao-titulo">
            <span className="baixa-manutencao-etiqueta">
              SIGE • FROTA
            </span>

            <h1>
              Baixa para Manutenção
            </h1>

            <p>
              Relate problemas apresentados pela
              viatura para encaminhamento à Frota.
            </p>
          </div>

          <div className="baixa-situacao-inicial">
            <span>Situação inicial</span>
            <strong>ABERTA</strong>
          </div>
        </header>

        {erro && !mostrarResumo && (
          <div className="baixa-mensagem-erro">
            {erro}
          </div>
        )}

        <form
          className="baixa-formulario"
          onSubmit={revisarBaixa}
        >
          {/* RESPONSÁVEL */}

          <section className="baixa-card">
            <header className="baixa-card-cabecalho">
              <div className="baixa-card-icone">
                <UserRound size={20} />
              </div>

              <div>
                <span>Etapa 1</span>

                <h2>
                  Identificação do responsável
                </h2>
              </div>
            </header>

            <div className="baixa-campos-linha">
              <label className="baixa-campo">
                <span>
                  Número de Polícia
                </span>

                <input
                  type="text"
                  inputMode="numeric"
                  value={numeroPolicia}
                  onChange={(event) =>
                    alterarNumeroPolicia(
                      event.target.value
                    )
                  }
                  placeholder="Ex.: 1564574"
                  disabled={validandoMilitar}
                />
              </label>

              <label className="baixa-campo">
                <span>
                  4 últimos dígitos do CPF
                </span>

                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={cpf4}
                  onChange={(event) =>
                    alterarCpf4(
                      event.target.value
                    )
                  }
                  placeholder="0000"
                  disabled={validandoMilitar}
                />
              </label>

              <button
                type="button"
                className="baixa-botao-buscar"
                onClick={validarResponsavel}
                disabled={
                  validandoMilitar ||
                  !numeroPolicia ||
                  cpf4.length !== 4
                }
              >
                <Search size={18} />

                {validandoMilitar
                  ? "Validando..."
                  : "Validar"}
              </button>
            </div>

            {responsavel && (
              <div className="baixa-resultado-validado">
                <CheckCircle2 size={22} />

                <div>
                  <span>
                    Responsável validado
                  </span>

                  <strong>
                    {responsavel.responsavel}
                  </strong>
                </div>
              </div>
            )}
          </section>

          {/* RESTANTE DO FORMULÁRIO SOMENTE APÓS A VALIDAÇÃO */}

          {responsavel && (
            <>
              {/* VIATURA */}

              <section className="baixa-card">
                <header className="baixa-card-cabecalho">
                  <div className="baixa-card-icone">
                    <Car size={20} />
                  </div>

                  <div>
                    <span>Etapa 2</span>

                    <h2>
                      Identificação da viatura
                    </h2>
                  </div>
                </header>

                <div className="baixa-campos-linha baixa-campos-viatura">
                  <label className="baixa-campo">
                    <span>Prefixo</span>

                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      value={prefixo}
                      onChange={(event) =>
                        alterarPrefixo(
                          event.target.value
                        )
                      }
                      placeholder="Ex.: 17771"
                      disabled={buscandoViatura}
                    />
                  </label>

                  <button
                    type="button"
                    className="baixa-botao-buscar"
                    onClick={localizarViatura}
                    disabled={
                      buscandoViatura ||
                      prefixo.length !== 5
                    }
                  >
                    <Search size={18} />

                    {buscandoViatura
                      ? "Buscando..."
                      : "Localizar"}
                  </button>
                </div>

                {viatura && (
                  <div className="baixa-viatura-encontrada">
                    <div>
                      <span>Prefixo</span>

                      <strong>
                        {viatura.prefixo}
                      </strong>
                    </div>

                    <div>
                      <span>Placa</span>

                      <strong>
                        {viatura.placa}
                      </strong>
                    </div>

                    <div>
                      <span>Marca</span>

                      <strong>
                        {viatura.marca ||
                          "NÃO INFORMADA"}
                      </strong>
                    </div>

                    <div>
                      <span>Modelo</span>

                      <strong>
                        {viatura.modelo ||
                          "NÃO INFORMADO"}
                      </strong>
                    </div>
                  </div>
                )}
              </section>

              {/* DADOS DA BAIXA */}

              <section className="baixa-card">
                <header className="baixa-card-cabecalho">
                  <div className="baixa-card-icone">
                    <Wrench size={20} />
                  </div>

                  <div>
                    <span>Etapa 3</span>
                    <h2>Dados da baixa</h2>
                  </div>
                </header>

                <div className="baixa-dados-grid">
                  <label className="baixa-campo">
                    <span>
                      <CalendarClock size={15} />
                      Data/hora
                    </span>

                    <input
                      type="datetime-local"
                      value={dataHora}
                      onChange={(event) =>
                        setDataHora(
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label className="baixa-campo">
                    <span>
                      <Gauge size={15} />
                      Km de baixa
                    </span>

                    <input
                      type="text"
                      inputMode="numeric"
                      value={kmBaixa}
                      onChange={(event) =>
                        setKmBaixa(
                          somenteNumeros(
                            event.target.value
                          )
                        )
                      }
                      placeholder="Informe o KM atual"
                    />
                  </label>

                  <label className="baixa-campo baixa-campo-largo">
                    <span>
                      Problema apresentado
                    </span>

                    <textarea
                      rows={5}
                      value={problema}
                      onChange={(event) =>
                        setProblema(
                          event.target.value
                            .toUpperCase()
                        )
                      }
                      placeholder="DESCREVA O PROBLEMA APRESENTADO PELA VIATURA..."
                    />

                    <small>
                      {problema.length} caracteres
                    </small>
                  </label>
                </div>
              </section>

              <footer className="baixa-formulario-rodape">
                <div>
                  <span>
                    Número da baixa
                  </span>

                  <strong>
                    GERADO AUTOMATICAMENTE AO ENVIAR
                  </strong>
                </div>

                <button
                  type="submit"
                  className="baixa-botao-revisar"
                >
                  Revisar baixa
                  <Send size={18} />
                </button>
              </footer>
            </>
          )}
        </form>
      </div>

      {/* MODAL DE RESUMO */}

      {mostrarResumo && (
        <div className="baixa-modal-overlay">
          <section className="baixa-modal">
            <header className="baixa-modal-cabecalho">
              <div>
                <span>
                  Confira antes de enviar
                </span>

                <h2>
                  Resumo da baixa
                </h2>
              </div>

              <button
                type="button"
                onClick={fecharResumo}
                disabled={enviando}
                aria-label="Fechar resumo"
              >
                <X size={20} />
              </button>
            </header>

            {erro && (
              <div className="baixa-modal-mensagem-erro">
                <strong>
                  Não foi possível concluir o envio
                </strong>

                <span>{erro}</span>
              </div>
            )}

            <div className="baixa-resumo-grid">
              <div>
                <span>Responsável</span>

                <strong>
                  {responsavel.responsavel}
                </strong>
              </div>

              <div>
                <span>Data/hora</span>

                <strong>
                  {formatarDataHora(dataHora)}
                </strong>
              </div>

              <div>
                <span>Prefixo</span>

                <strong>
                  {viatura?.prefixo}
                </strong>
              </div>

              <div>
                <span>Placa</span>

                <strong>
                  {viatura?.placa}
                </strong>
              </div>

              <div>
                <span>Marca / Modelo</span>

                <strong>
                  {viatura?.marca}{" "}
                  {viatura?.modelo}
                </strong>
              </div>

              <div>
                <span>Km de baixa</span>

                <strong>
                  {formatarKm(kmBaixa)}
                </strong>
              </div>

              <div className="baixa-resumo-problema">
                <span>Problema</span>
                <strong>{problema}</strong>
              </div>

              <div>
                <span>Situação</span>

                <strong className="baixa-badge-aberta">
                  ABERTA
                </strong>
              </div>
            </div>

            <footer className="baixa-modal-acoes">
              <button
                type="button"
                className="baixa-botao-cancelar"
                onClick={fecharResumo}
                disabled={enviando}
              >
                Voltar
              </button>

              <button
                type="button"
                className="baixa-botao-enviar"
                onClick={confirmarEnvio}
                disabled={enviando}
              >
                <Send size={18} />

                {enviando
                  ? "Enviando..."
                  : "Enviar baixa"}
              </button>
            </footer>
          </section>
        </div>
      )}

      {/* MENSAGEM DE SUCESSO */}

      {baixaRegistrada && (
        <div className="baixa-modal-overlay">
          <section className="baixa-modal baixa-modal-sucesso">
            <div className="baixa-sucesso-icone">
              <CheckCircle2 size={38} />
            </div>

            <span>
              Registro concluído
            </span>

            <h2>
              Baixa enviada com sucesso
            </h2>

            <p>
              A baixa nº{" "}
              <strong>
                {baixaRegistrada.numero_baixa}
              </strong>{" "}
              foi registrada com a situação{" "}
              <strong>ABERTA</strong>.
            </p>

            <button
              type="button"
              className="baixa-botao-enviar"
              onClick={limparFormulario}
            >
              Concluir
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

export default BaixaManutencao;