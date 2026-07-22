import {
  Plus,
  Trash2,
} from "lucide-react";

function criarVinculoVazio() {
  return {
    id: null,
    unidadeOrganizacionalId: "",
    funcao: "",
    ordemSecundaria: "",
    lotacaoPrincipal: false,
    mostrarOrdemPrimaria: false,
    dataInicio: new Date()
      .toISOString()
      .slice(0, 10),
    ativa: true,
  };
}

function LotacoesFuncoesEditor({
  unidades = [],
  vinculos = [],
  onChange,
  disabled = false,
}) {
  function atualizarVinculo(
    indice,
    campo,
    valor
  ) {
    const atualizados = vinculos.map(
      (vinculo, posicao) => {
        if (posicao !== indice) {
          if (
            campo === "lotacaoPrincipal" &&
            valor === true
          ) {
            return {
              ...vinculo,
              lotacaoPrincipal: false,
            };
          }

          if (
            campo ===
              "mostrarOrdemPrimaria" &&
            valor === true
          ) {
            return {
              ...vinculo,
              mostrarOrdemPrimaria: false,
            };
          }

          return vinculo;
        }

        return {
          ...vinculo,
          [campo]: valor,
        };
      }
    );

    onChange(atualizados);
  }

  function adicionarVinculo() {
    onChange([
      ...vinculos,
      criarVinculoVazio(),
    ]);
  }

  function removerVinculo(indice) {
    const atualizados = vinculos.filter(
      (_, posicao) => posicao !== indice
    );

    if (atualizados.length === 0) {
      onChange([
        {
          ...criarVinculoVazio(),
          lotacaoPrincipal: true,
          mostrarOrdemPrimaria: true,
        },
      ]);
      return;
    }

    if (
      !atualizados.some(
        (item) => item.lotacaoPrincipal
      )
    ) {
      atualizados[0] = {
        ...atualizados[0],
        lotacaoPrincipal: true,
      };
    }

    if (
      !atualizados.some(
        (item) =>
          item.mostrarOrdemPrimaria
      )
    ) {
      const principalIndex =
        atualizados.findIndex(
          (item) =>
            item.lotacaoPrincipal
        );

      const indiceOrdem =
        principalIndex >= 0
          ? principalIndex
          : 0;

      atualizados[indiceOrdem] = {
        ...atualizados[indiceOrdem],
        mostrarOrdemPrimaria: true,
      };
    }

    onChange([...atualizados]);
  }

  return (
    <div className="lotacoes-editor">
      <div className="lotacoes-editor-topo">
        <div>
          <strong>
            Lotações e funções
          </strong>

          <p>
            O militar pode exercer funções em
            várias seções ao mesmo tempo.
          </p>
        </div>

        <button
          type="button"
          className="lotacoes-adicionar"
          onClick={adicionarVinculo}
          disabled={disabled}
        >
          <Plus size={17} />
          Adicionar função
        </button>
      </div>

      <div className="lotacoes-editor-lista">
        {vinculos.map(
          (vinculo, indice) => {
            const unidadeSelecionada =
              unidades.find(
                (unidade) =>
                  Number(unidade.id) ===
                  Number(
                    vinculo
                      .unidadeOrganizacionalId
                  )
              );

            return (
              <article
                className="lotacao-editor-card"
                key={
                  vinculo.id ??
                  `novo-${indice}`
                }
              >
                <header>
                  <span>
                    FUNÇÃO {indice + 1}
                  </span>

                  <button
                    type="button"
                    className="lotacao-remover"
                    onClick={() =>
                      removerVinculo(indice)
                    }
                    disabled={
                      disabled ||
                      vinculos.length === 1
                    }
                    title="Remover função"
                  >
                    <Trash2 size={16} />
                  </button>
                </header>

                <div className="militar-form-grid">
                  <label className="militar-campo-largo">
                    Unidade/Fração *
                    <select
                      value={
                        vinculo
                          .unidadeOrganizacionalId
                      }
                      onChange={(event) =>
                        atualizarVinculo(
                          indice,
                          "unidadeOrganizacionalId",
                          event.target.value
                        )
                      }
                      disabled={disabled}
                    >
                      <option value="">
                        SELECIONE
                      </option>

                      {unidades.map(
                        (unidade) => (
                          <option
                            key={unidade.id}
                            value={unidade.id}
                          >
                            {"— ".repeat(
                              Math.max(
                                Number(
                                  unidade.nivel
                                ) - 1,
                                0
                              )
                            )}

                            {unidade.sigla ||
                              unidade.nome}

                            {unidade.codigo
                              ? ` — ${unidade.codigo}`
                              : ""}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label>
                    Cidade
                    <input
                      type="text"
                      readOnly
                      value={
                        unidadeSelecionada
                          ?.cidade || ""
                      }
                    />
                  </label>

                  <label>
                    Função *
                    <input
                      type="text"
                      value={vinculo.funcao}
                      onChange={(event) =>
                        atualizarVinculo(
                          indice,
                          "funcao",
                          event.target.value
                            .toUpperCase()
                        )
                      }
                      placeholder="CHEFE"
                      disabled={disabled}
                    />
                  </label>

                  <label>
                    Ordem secundária
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={
                        vinculo
                          .ordemSecundaria
                      }
                      onChange={(event) =>
                        atualizarVinculo(
                          indice,
                          "ordemSecundaria",
                          event.target.value
                        )
                      }
                      placeholder="Ex.: 1"
                      disabled={disabled}
                    />
                  </label>

                  <label>
                    Data de início
                    <input
                      type="date"
                      value={
                        vinculo.dataInicio
                      }
                      onChange={(event) =>
                        atualizarVinculo(
                          indice,
                          "dataInicio",
                          event.target.value
                        )
                      }
                      disabled={disabled}
                    />
                  </label>

                  <div className="lotacao-opcoes militar-campo-largo">
                    <label className="militar-checkbox">
                      <input
                        type="checkbox"
                        checked={
                          vinculo
                            .lotacaoPrincipal
                        }
                        onChange={(event) =>
                          atualizarVinculo(
                            indice,
                            "lotacaoPrincipal",
                            event.target
                              .checked
                          )
                        }
                        disabled={disabled}
                      />

                      <span>
                        Lotação principal
                      </span>
                    </label>

                    <label className="militar-checkbox">
                      <input
                        type="checkbox"
                        checked={
                          vinculo
                            .mostrarOrdemPrimaria
                        }
                        onChange={(event) =>
                          atualizarVinculo(
                            indice,
                            "mostrarOrdemPrimaria",
                            event.target
                              .checked
                          )
                        }
                        disabled={disabled}
                      />

                      <span>
                        Mostrar ordem primária
                        nesta seção
                      </span>
                    </label>
                  </div>

                  {unidadeSelecionada && (
                    <div className="militar-campo-largo">
                      <small>
                        Estrutura selecionada:{" "}
                        <strong>
                          {
                            unidadeSelecionada
                              .caminho_nome
                          }
                        </strong>
                      </small>
                    </div>
                  )}
                </div>
              </article>
            );
          }
        )}
      </div>
    </div>
  );
}

export {
  criarVinculoVazio,
};

export default LotacoesFuncoesEditor;