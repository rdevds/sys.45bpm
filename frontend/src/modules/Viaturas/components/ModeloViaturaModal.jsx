import {
  useEffect,
  useState,
} from "react";

import {
  Check,
  LoaderCircle,
  X,
} from "lucide-react";

import {
  atualizarModeloViatura,
  salvarModeloViatura,
} from "../../../services/modelosViaturasService.js";

import {
  atualizarFormulario,
} from "../../../utils/formulario.js";

const FORMULARIO_INICIAL = {
  marca: "",
  modelo: "",
  ano: "",
  combustivel: "",
  tipo: "",
  pneus: "",
  capacidadeCarter: "",
  especificacaoOleo: "",
  capacidadeTanque: "",
  frequenciaTrocaOleo: "",
  observacao: "",
  ativo: true,
};

function ModeloViaturaModal({
  modeloEdicao = null,
  onFechar,
  onSalvo,
}) {
  const [
    formulario,
    setFormulario,
  ] = useState(
    FORMULARIO_INICIAL
  );

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState("");

  const editando =
    Boolean(modeloEdicao?.id);

  useEffect(() => {
    if (!modeloEdicao) {
      setFormulario(
        FORMULARIO_INICIAL
      );
      return;
    }

    setFormulario({
      marca:
        modeloEdicao.marca ?? "",
      modelo:
        modeloEdicao.modelo ?? "",
      ano:
        modeloEdicao.ano ?? "",
      combustivel:
        modeloEdicao.combustivel ??
        "",
      tipo:
        modeloEdicao.tipo ?? "",
      pneus:
        modeloEdicao.pneus ?? "",
      capacidadeCarter:
        modeloEdicao.capacidade_carter ??
        "",
      especificacaoOleo:
        modeloEdicao.especificacao_oleo ??
        "",
      capacidadeTanque:
        modeloEdicao.capacidade_tanque ??
        "",
      frequenciaTrocaOleo:
        modeloEdicao.frequencia_troca_oleo ??
        "",
      observacao:
        modeloEdicao.observacao ??
        "",
      ativo:
        modeloEdicao.ativo !== false,
    });
  }, [modeloEdicao]);

  function atualizar(
    campo,
    valor
  ) {
    atualizarFormulario(
      setFormulario,
      campo,
      valor
    );
  }

  async function salvar(event) {
    event.preventDefault();

    try {
      setSalvando(true);
      setErro("");

      const salvo = editando
        ? await atualizarModeloViatura(
            modeloEdicao.id,
            formulario
          )
        : await salvarModeloViatura(
            formulario
          );

      await onSalvo?.(salvo);
    } catch (error) {
      console.error(
        "Erro ao salvar modelo:",
        error
      );

      setErro(
        error?.message ||
          "NÃO FOI POSSÍVEL SALVAR O MODELO."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="modelo-vtr-overlay">
      <section
        className="modelo-vtr-modal"
        role="dialog"
        aria-modal="true"
      >
        <header className="modelo-vtr-modal-header">
          <div>
            <span>
              {editando
                ? "EDIÇÃO"
                : "CADASTRO"}
            </span>

            <h2>
              {editando
                ? "Editar modelo"
                : "Novo modelo"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onFechar}
            disabled={salvando}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </header>

        <form
          onSubmit={salvar}
          className="modelo-vtr-form"
        >
          <div className="modelo-vtr-grid">
            <label>
              Marca *
              <input
                value={
                  formulario.marca
                }
                onChange={(event) =>
                  atualizar(
                    "marca",
                    event.target.value
                  )
                }
                placeholder="FIAT"
              />
            </label>

            <label>
              Modelo *
              <input
                value={
                  formulario.modelo
                }
                onChange={(event) =>
                  atualizar(
                    "modelo",
                    event.target.value
                  )
                }
                placeholder="DUCATO"
              />
            </label>

            <label>
              Ano *
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={
                  formulario.ano
                }
                onChange={(event) =>
                  atualizar(
                    "ano",
                    event.target.value
                  )
                }
                placeholder="2008"
              />
            </label>

            <label>
              Combustível *
              <select
                value={
                  formulario.combustivel
                }
                onChange={(event) =>
                  atualizar(
                    "combustivel",
                    event.target.value
                  )
                }
              >
                <option value="">
                  SELECIONE
                </option>

                <option value="FLEX">
                  FLEX
                </option>

                <option value="GASOLINA">
                  GASOLINA
                </option>

                <option value="ETANOL">
                  ETANOL
                </option>

                <option value="DIESEL">
                  DIESEL
                </option>

                <option value="DIESEL S10">
                  DIESEL S10
                </option>
              </select>
            </label>

            <label>
              Tipo *
              <select
                value={
                  formulario.tipo
                }
                onChange={(event) =>
                  atualizar(
                    "tipo",
                    event.target.value
                  )
                }
              >
                <option value="">
                  SELECIONE
                </option>

                <option value="4 RODAS">
                  4 RODAS
                </option>

                <option value="2 RODAS">
                  2 RODAS
                </option>
              </select>
            </label>

            <label>
              Pneus *
              <input
                value={
                  formulario.pneus
                }
                onChange={(event) =>
                  atualizar(
                    "pneus",
                    event.target.value
                  )
                }
                placeholder="205/75 R16"
              />
            </label>

            <label>
              Capacidade do cárter *
              <input
                type="text"
                inputMode="decimal"
                value={
                  formulario.capacidadeCarter
                }
                onChange={(event) =>
                  atualizar(
                    "capacidadeCarter",
                    event.target.value
                  )
                }
                placeholder="6.00"
              />
            </label>

            <label>
              Especificação do óleo *
              <input
                value={
                  formulario.especificacaoOleo
                }
                onChange={(e) =>
                  atualizar(
                    "especificacaoOleo",
                    e.target.value
                  )
                }
                placeholder="15W-40 API CI-4/SL"
              />
            </label>

            <label>
              Capacidade do tanque *
              <input
                type="text"
                inputMode="decimal"
                value={
                  formulario.capacidadeTanque
                }
                onChange={(event) =>
                  atualizar(
                    "capacidadeTanque",
                    event.target.value
                  )
                }
                placeholder="74"
              />
            </label>

            <label>
              Troca de óleo (km) *
              <input
                type="text"
                inputMode="numeric"
                value={
                  formulario.frequenciaTrocaOleo
                }
                onChange={(event) =>
                  atualizar(
                    "frequenciaTrocaOleo",
                    event.target.value
                  )
                }
                placeholder="10000"
              />
            </label>

            <label className="modelo-vtr-campo-largo">
              Observações
              <textarea
                value={
                  formulario.observacao
                }
                onChange={(event) =>
                  atualizar(
                    "observacao",
                    event.target.value
                  )
                }
                rows={4}
                placeholder="INFORMAÇÕES ADICIONAIS"
              />
            </label>

            <label className="modelo-vtr-check">
              <input
                type="checkbox"
                checked={
                  formulario.ativo
                }
                onChange={(event) =>
                  atualizar(
                    "ativo",
                    event.target.checked
                  )
                }
              />

              Modelo ativo
            </label>
          </div>

          {erro && (
            <div className="modelo-vtr-erro">
              {erro}
            </div>
          )}

          <footer className="modelo-vtr-modal-footer">
            <button
              type="button"
              className="secundario"
              onClick={onFechar}
              disabled={salvando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="principal"
              disabled={salvando}
            >
              {salvando ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="modelo-vtr-girando"
                  />

                  Salvando...
                </>
              ) : (
                <>
                  <Check size={17} />

                  Salvar modelo
                </>
              )}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default ModeloViaturaModal;