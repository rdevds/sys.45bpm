import { useEffect, useState } from "react";

function criarFormulario(unidade) {
  return {
    nome: unidade?.nome ?? "",
    sigla: unidade?.sigla ?? "",
    codigo: unidade?.codigo ?? "",
    tipo: unidade?.tipo ?? "",
    cidade: unidade?.cidade ?? "",
    unidade_pai_id:
      unidade?.unidade_pai_id ?? "",
    ordem_exibicao:
      unidade?.ordem_exibicao ?? "",
    exibe_baliza:
      unidade?.exibe_baliza === true,
    ativa:
      unidade?.ativa !== false,
  };
}

function PainelEdicao({
  unidade,
  unidades = [],
  salvando = false,
  erro = "",
  aoCancelar,
  aoSalvar,
}) {
  const [
    formulario,
    setFormulario,
  ] = useState(
    criarFormulario(unidade)
  );

  useEffect(() => {
    setFormulario(
      criarFormulario(unidade)
    );
  }, [unidade]);

  function alterarCampo(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormulario(
      (estadoAtual) => ({
        ...estadoAtual,
        [name]:
          type === "checkbox"
            ? checked
            : value,
      })
    );
  }

  function enviarFormulario(event) {
    event.preventDefault();

    aoSalvar({
      ...formulario,
      id: unidade.id,
      ordem_exibicao:
        formulario.ordem_exibicao === ""
          ? null
          : Number(
              formulario.ordem_exibicao
            ),
      unidade_pai_id:
        formulario.unidade_pai_id === ""
          ? null
          : Number(
              formulario.unidade_pai_id
            ),
    });
  }

  const unidadesDisponiveis =
    unidades.filter(
      (item) =>
        Number(item.id) !==
        Number(unidade?.id)
    );

  return (
    <section className="estrutura-explorer-detalhes">
      <header className="estrutura-detalhes-cabecalho">
        <div>
          <span>
            EDIÇÃO DA UNIDADE
          </span>

          <h2>
            {unidade?.nome ||
              "UNIDADE"}
          </h2>

          <p>
            Altere os dados e clique em
            salvar.
          </p>
        </div>
      </header>

      <form
        className="estrutura-edicao-formulario"
        onSubmit={enviarFormulario}
      >
        <label>
          <span>Nome</span>

          <input
            type="text"
            name="nome"
            value={formulario.nome}
            onChange={alterarCampo}
            required
          />
        </label>

        <label>
          <span>Sigla</span>

          <input
            type="text"
            name="sigla"
            value={formulario.sigla}
            onChange={alterarCampo}
          />
        </label>

        <label>
          <span>Código</span>

          <input
            type="text"
            name="codigo"
            value={formulario.codigo}
            onChange={alterarCampo}
          />
        </label>

        <label>
          <span>Tipo</span>

          <input
            type="text"
            name="tipo"
            value={formulario.tipo}
            onChange={alterarCampo}
          />
        </label>

        <label>
          <span>Cidade</span>

          <input
            type="text"
            name="cidade"
            value={formulario.cidade}
            onChange={alterarCampo}
          />
        </label>

        <label>
          <span>
            Ordem de exibição
          </span>

          <input
            type="number"
            name="ordem_exibicao"
            min="0"
            value={
              formulario.ordem_exibicao
            }
            onChange={alterarCampo}
          />
        </label>

        <label className="estrutura-edicao-campo-largo">
          <span>
            Unidade superior
          </span>

          <select
            name="unidade_pai_id"
            value={
              formulario.unidade_pai_id
            }
            onChange={alterarCampo}
          >
            <option value="">
              UNIDADE RAIZ
            </option>

            {unidadesDisponiveis.map(
              (item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.nome}
                  {item.codigo
                    ? ` — ${item.codigo}`
                    : ""}
                </option>
              )
            )}
          </select>
        </label>

        <label className="estrutura-edicao-checkbox">
          <input
            type="checkbox"
            name="exibe_baliza"
            checked={
              formulario.exibe_baliza
            }
            onChange={alterarCampo}
          />

          <span>
            Exibir na Baliza
          </span>
        </label>

        <label className="estrutura-edicao-checkbox">
          <input
            type="checkbox"
            name="ativa"
            checked={formulario.ativa}
            onChange={alterarCampo}
          />

          <span>
            Unidade ativa
          </span>
        </label>

        {erro && (
          <div className="estrutura-mensagem estrutura-mensagem-erro estrutura-edicao-erro">
            {erro}
          </div>
        )}

        <div className="estrutura-edicao-acoes">
          <button
            type="button"
            className="estrutura-acao"
            onClick={aoCancelar}
            disabled={salvando}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="estrutura-acao estrutura-acao-principal"
            disabled={salvando}
          >
            {salvando
              ? "Salvando..."
              : "Salvar alterações"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default PainelEdicao;