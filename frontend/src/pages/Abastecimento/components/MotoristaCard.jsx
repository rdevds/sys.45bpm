import { useState } from "react";
import {
  Pencil,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";

import Button from "../../../components/ui/Button.jsx";

import {
  atualizarContatoMotorista,
  atualizarDadosCnh,
  buscarMilitarPorNumeroPolicia,
} from "../../../services/militaresService.js";

import { validarCnh } from "../../../utils/validarCnh.js";

function MotoristaCard({ onMotoristaChange }) {
  const [numeroPolicia, setNumeroPolicia] = useState("");
  const [militar, setMilitar] = useState(null);

  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cnhVencimento, setCnhVencimento] = useState("");
  const [categoriaCnh, setCategoriaCnh] = useState("");

  const [modoEdicao, setModoEdicao] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [erro, setErro] = useState("");

  

  function prepararMotoristaComCnh(dadosMilitar) {
    const resultadoCnh = validarCnh(
      dadosMilitar?.validade_cnh
    );

    return {
      ...dadosMilitar,
      cnhStatus: resultadoCnh.status,
      cnhValida: resultadoCnh.valida,
      cnhMensagem: resultadoCnh.mensagem,
      cnhDiasRestantes: resultadoCnh.diasRestantes,
    };
  }

  function preencherContato(dadosMilitar) {
    setEmail(dadosMilitar?.email || "");
    formatarTelefone(dadosMilitar?.telefone || "")
  }

  function preencherCnh(dadosMilitar) {
    setCnhVencimento(
      dadosMilitar?.validade_cnh || ""
    );

    setCategoriaCnh(
      dadosMilitar?.categoria_cnh || ""
    );
  }

  async function buscarMotorista(valor) {
    const numero = String(valor || "")
      .replace(/\D/g, "")
      .slice(0, 7);

    setNumeroPolicia(numero);
    setErro("");

    if (numero.length < 7) {
      setMilitar(null);
      setModoEdicao(null);
      onMotoristaChange?.(null);
      return;
    }

    try {
      setBuscando(true);

      const encontrado =
        await buscarMilitarPorNumeroPolicia(numero);

      if (!encontrado) {
        setMilitar(null);
        setModoEdicao(null);
        setErro("Militar não localizado.");
        onMotoristaChange?.(null);
        return;
      }

      if (encontrado.ativo === false) {
        setMilitar(null);
        setModoEdicao(null);

        setErro(
          "O militar localizado está inativo no sistema."
        );

        onMotoristaChange?.(null);
        return;
      }

      const motoristaCompleto =
        prepararMotoristaComCnh(encontrado);

      setMilitar(motoristaCompleto);

      preencherContato(motoristaCompleto);
      preencherCnh(motoristaCompleto);

      setModoEdicao(null);
      setErro("");

      onMotoristaChange?.(motoristaCompleto);
    } catch (error) {
      console.error(
        "Erro ao buscar motorista:",
        error
      );

      setMilitar(null);
      setModoEdicao(null);

      setErro(
        error?.message ||
          "Não foi possível consultar o cadastro do militar."
      );

      onMotoristaChange?.(null);
    } finally {
      setBuscando(false);
    }
  }

  function formatarTelefone(valor) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);

  if (numeros.length <= 2) {
    return numeros;
  }

  if (numeros.length <= 3) {
    return `${numeros.slice(0, 2)} ${numeros.slice(2)}`;
  }

  if (numeros.length <= 7) {
    return `${numeros.slice(0, 2)} ${numeros.slice(2, 3)} ${numeros.slice(3)}`;
  }

  return `${numeros.slice(0, 2)} ${numeros.slice(2, 3)} ${numeros.slice(
    3,
    7
  )}-${numeros.slice(7)}`;
}

  function abrirEdicaoContato() {
    if (!militar) {
      return;
    }

    preencherContato(militar);
    setErro("");
    setModoEdicao("CONTATO");
  }

  function abrirEdicaoCnh() {
    if (!militar) {
      return;
    }

    preencherCnh(militar);
    setErro("");
    setModoEdicao("CNH");
  }

  function cancelarEdicao() {
    preencherContato(militar);
    preencherCnh(militar);

    setErro("");
    setModoEdicao(null);
  }

  async function salvarContatoMotorista() {
    if (!militar?.id) {
      setErro("Militar não identificado.");
      return;
    }

    const emailTratado = email
      .trim()
      .toLowerCase();

    const telefoneTratado = telefone.trim();

    if (!emailTratado) {
      setErro("Informe o e-mail.");
      return;
    }

    try {
      setSalvando(true);
      setErro("");

      const dadosSalvos =
        await atualizarContatoMotorista(
          militar.id,
          {
            email: emailTratado,
            telefone: telefoneTratado,
          }
        );

      const motoristaAtualizado = {
        ...militar,
        ...dadosSalvos,
      };

      setMilitar(motoristaAtualizado);
      preencherContato(motoristaAtualizado);
      setModoEdicao(null);

      onMotoristaChange?.(motoristaAtualizado);
    } catch (error) {
      console.error(
        "Erro ao atualizar contato:",
        error
      );

      setErro(
        error?.message ||
          "Não foi possível atualizar o contato."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function salvarCnhMotorista() {
    if (!militar?.id) {
      setErro("Militar não identificado.");
      return;
    }

    const categoriaTratada = categoriaCnh
      .trim()
      .toUpperCase();

    if (!categoriaTratada) {
      setErro("Informe a categoria da CNH.");
      return;
    }

    if (!cnhVencimento) {
      setErro(
        "Informe a data de validade da CNH."
      );
      return;
    }

    const resultadoNovaCnh =
      validarCnh(cnhVencimento);

    if (!resultadoNovaCnh.valida) {
      setErro(
        "A data informada está vencida. Informe uma validade atual."
      );
      return;
    }

    try {
      setSalvando(true);
      setErro("");

      const dadosSalvos =
        await atualizarDadosCnh(
          militar.id,
          {
            categoriaCnh: categoriaTratada,
            validadeCnh: cnhVencimento,
          }
        );

      const motoristaAtualizado =
        prepararMotoristaComCnh({
          ...militar,
          ...dadosSalvos,
        });

      setMilitar(motoristaAtualizado);
      preencherCnh(motoristaAtualizado);
      setModoEdicao(null);

      onMotoristaChange?.(motoristaAtualizado);
    } catch (error) {
      console.error(
        "Erro ao atualizar CNH:",
        error
      );

      setErro(
        error?.message ||
          "Não foi possível atualizar a CNH."
      );
    } finally {
      setSalvando(false);
    }
  }

  function limparMotorista() {
    setNumeroPolicia("");
    setMilitar(null);

    setEmail("");
    setTelefone("");
    setCnhVencimento("");
    setCategoriaCnh("");

    setModoEdicao(null);
    setBuscando(false);
    setSalvando(false);

    setErro("");

    onMotoristaChange?.(null);
  }

  function formatarData(data) {
    if (!data) {
      return "NÃO CADASTRADA";
    }

    const [ano, mes, dia] =
      String(data).split("-");

    if (!ano || !mes || !dia) {
      return data;
    }

    return `${dia}/${mes}/${ano}`;
  }

  function deveMostrarAlertaCnh() {
    return (
      militar?.cnhStatus === "VENCIDA" ||
      militar?.cnhStatus === "VENCE_HOJE" ||
      militar?.cnhStatus ===
        "PROXIMA_VENCIMENTO" ||
      militar?.cnhStatus === "SEM_CNH"
    );
  }

  function obterClasseAlertaCnh() {
    if (
      militar?.cnhStatus === "VENCIDA" ||
      militar?.cnhStatus === "SEM_CNH"
    ) {
      return "alerta-cnh alerta-cnh-erro";
    }

    return "alerta-cnh alerta-cnh-aviso";
  }

  function obterTituloAlertaCnh() {
    if (militar?.cnhStatus === "VENCIDA") {
      return "CNH vencida";
    }

    if (militar?.cnhStatus === "VENCE_HOJE") {
      return "CNH vence hoje";
    }

    

    if (militar?.cnhStatus === "SEM_CNH") {
      return "Validade da CNH não cadastrada";
    }

    return "";
  }

  return (
    <section className="form-card motorista-card">
      <div className="form-card-cabecalho">
        <div>
          <span className="form-card-icone">
            <UserRound size={20} />
          </span>

          <div>
            <h2>Motorista</h2>

            <p>
              Informe o número de polícia do
              condutor.
            </p>
          </div>
        </div>
      </div>

      {!militar && (
        <label className="campo campo-compacto">
          Número de Polícia *
          <div className="campo-com-icone">
            <Search size={18} />

            <input
              value={numeroPolicia}
              maxLength={7}
              inputMode="numeric"
              disabled={buscando}
              onChange={(event) =>
                buscarMotorista(
                  event.target.value
                )
              }
              placeholder="Ex.: 1564574"
            />
          </div>

          {buscando && (
            <small className="campo-ajuda">
              Consultando cadastro...
            </small>
          )}
        </label>
      )}

      {erro && (
        <div className="aviso-erro">
          ⚠ {erro}
        </div>
      )}

      {militar &&
        !modoEdicao &&
        deveMostrarAlertaCnh() && (
          <div
            className={obterClasseAlertaCnh()}
          >
            <div className="alerta-cnh-conteudo">
              <strong>
                {obterTituloAlertaCnh()}
              </strong>

              {militar.cnhStatus ===
                "PROXIMA_VENCIMENTO" && (
                <span>
                  {militar.cnhMensagem}
                </span>
              )}

              {militar.cnhStatus ===
                "VENCE_HOJE" && (
                <span>
                  A validade da CNH termina hoje.
                </span>
              )}

              {(militar.cnhStatus ===
                "VENCIDA" ||
                militar.cnhStatus ===
                  "VENCE_HOJE" ||
                militar.cnhStatus ===
                  "PROXIMA_VENCIMENTO") && (
                <div className="alerta-cnh-detalhes">
                  <span>
                    <strong>Categoria:</strong>{" "}
                    {militar.categoria_cnh ||
                      "NÃO INFORMADA"}
                  </span>

                  <span>
                    <strong>  Validade:</strong>{" "}
                    {formatarData(
                      militar.validade_cnh
                    )}
                  </span>
                </div>
              )}
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={abrirEdicaoCnh}
            >
              <RefreshCw size={16} />
              Atualizar CNH
            </Button>
          </div>
        )}

      {militar && !modoEdicao && (
        <div className="motorista-info">
          <div className="motorista-dados">
            <strong className="motorista-nome">
              {militar.nome ||
                "NOME NÃO INFORMADO"}
            </strong>

            <span>
              <strong>E-mail:</strong>{" "}
              {militar.email ||
                "NÃO INFORMADO"}
            </span>

            <span>
              <strong>Telefone:</strong>{" "}
              {militar.telefone ||
                "NÃO INFORMADO"}
            </span>
          </div>

          <div className="acoes-contato">
            <Button
              type="button"
              variant="secondary"
              onClick={limparMotorista}
            >
              Voltar
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={abrirEdicaoContato}
            >
              <Pencil size={16} />
              Atualizar dados
            </Button>
          </div>
        </div>
      )}

      {militar &&
        modoEdicao === "CONTATO" && (
          <div className="motorista-edicao">
            <div className="motorista-edicao-titulo">
              <strong>
                {militar.nome ||
                  "NOME NÃO INFORMADO"}
              </strong>

              
            </div>

            <div className="motorista-edicao-grid">
              <label className="campo campo-compacto">
                E-mail *
                <input
                  type="email"
                  value={email}
                  disabled={salvando}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="email@exemplo.com"
                />
              </label>

              <label className="campo campo-compacto">
                Telefone
                <input
                  value={telefone}
                  disabled={salvando}
                  onChange={(event) =>
                    setTelefone(
                       formatarTelefone(event.target.value)
                    )
                  }
                  placeholder="(00) 00000-0000"
                />
              </label>
            </div>

            <div className="acoes-contato">
              <Button
                type="button"
                variant="secondary"
                onClick={cancelarEdicao}
                disabled={salvando}
              >
                Cancelar
              </Button>

              <Button
                type="button"
                variant="primary"
                onClick={
                  salvarContatoMotorista
                }
                disabled={salvando}
              >
                {salvando
                  ? "Salvando..."
                  : "Salvar contato"}
              </Button>
            </div>
          </div>
        )}

      {militar && modoEdicao === "CNH" && (
        <div className="motorista-edicao">
          <div className="motorista-edicao-titulo">
            <strong>
              {militar.nome ||
                "NOME NÃO INFORMADO"}
            </strong>

            <span>
              Atualize somente os dados da CNH.
            </span>
          </div>

          <div className="motorista-edicao-grid">
            <label className="campo campo-compacto">
              Categoria da CNH *
              <select
                value={categoriaCnh}
                disabled={salvando}
                onChange={(event) =>
                  setCategoriaCnh(
                    event.target.value
                  )
                }
              >
                <option value="">
                  SELECIONE
                </option>

                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="C">C</option>
                <option value="AC">AC</option>
                <option value="D">D</option>
                <option value="AD">AD</option>
                <option value="E">E</option>
                <option value="AE">AE</option>
              </select>
            </label>

            <label className="campo campo-compacto">
              Validade da CNH *
              <input
                type="date"
                value={cnhVencimento}
                disabled={salvando}
                onChange={(event) =>
                  setCnhVencimento(
                    event.target.value
                  )
                }
              />
            </label>
          </div>

          <div className="acoes-contato">
            <Button
              type="button"
              variant="secondary"
              onClick={cancelarEdicao}
              disabled={salvando}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={salvarCnhMotorista}
              disabled={salvando}
            >
              {salvando
                ? "Salvando..."
                : "Salvar CNH"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

export default MotoristaCard;