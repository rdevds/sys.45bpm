import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Pencil,
  Save,
  X,
} from "lucide-react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import "../Viaturas.css";

import {
  atualizarStatusViatura,
  atualizarViatura,
  buscarViaturaPorPrefixo,
} from "../../../services/viaturasService.js";

import { STATUS_VIATURA } from "../../../config/StatusViaturas.js";

import {
  buscarAbastecimentosDaViatura,
} from "../../../services/abastecimentosService.js";

function ProntuarioViatura() {
  const { prefixo } = useParams();
  const navigate = useNavigate();

  const [abaAtiva, setAbaAtiva] =
    useState("geral");

  const [viatura, setViatura] =
    useState(null);

  const [form, setForm] =
    useState(null);

  const [carregando, setCarregando] =
    useState(true);

  const [alterandoStatus, setAlterandoStatus] =
    useState(false);

  const [editando, setEditando] =
    useState(false);

  const [salvando, setSalvando] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const [abastecimentos, setAbastecimentos] =
    useState([]);

  const [
    carregandoAbastecimentos,
    setCarregandoAbastecimentos,
  ] = useState(false);

  const [
    erroAbastecimentos,
    setErroAbastecimentos,
  ] = useState("");

  const abas = useMemo(
    () => [
      { id: "geral", nome: "Geral" },
      { id: "tecnica", nome: "Técnica" },
      {
        id: "abastecimentos",
        nome: "Abastecimentos",
      },
      {
        id: "manutencoes",
        nome: "Manutenções",
      },
      {
        id: "alertas",
        nome: "Alertas",
      },
      {
        id: "documentos",
        nome: "Documentos",
      },
      {
        id: "historico",
        nome: "Histórico",
      },
      {
        id: "financeiro",
        nome: "Financeiro",
      },
    ],
    []
  );

  useEffect(() => {
    async function carregarViatura() {
      try {
        setCarregando(true);
        setErro("");

        const encontrada =
          await buscarViaturaPorPrefixo(
            prefixo
          );

        if (!encontrada) {
          setViatura(null);
          setForm(null);
          setErro(
            "Viatura não encontrada."
          );
          return;
        }

        setViatura(encontrada);
        setForm(encontrada);
      } catch (error) {
        console.error(
          "Erro ao carregar prontuário:",
          error
        );

        setViatura(null);
        setForm(null);

        setErro(
          error?.message ||
            "Não foi possível carregar o prontuário."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarViatura();
  }, [prefixo]);

  useEffect(() => {
    async function carregarAbastecimentos() {
      if (!viatura?.id) {
        setAbastecimentos([]);
        return;
      }

      try {
        setCarregandoAbastecimentos(true);
        setErroAbastecimentos("");

        const registros =
          await buscarAbastecimentosDaViatura(
            viatura.id
          );

        setAbastecimentos(registros);
      } catch (error) {
        console.error(
          "Erro ao carregar abastecimentos da viatura:",
          error
        );

        setAbastecimentos([]);

        setErroAbastecimentos(
          error?.message ||
            "Não foi possível carregar os abastecimentos da viatura."
        );
      } finally {
        setCarregandoAbastecimentos(false);
      }
    }

    carregarAbastecimentos();
  }, [viatura?.id]);

  function alterarCampo(nome, valor) {
    const camposNumericos = [
      "ano",
      "odometro",
      "capacidade_tanque",
      "capacidade_carter",
      "frequencia_troca_oleo",
      "valor_venal",
    ];

    const camposSemConversao = [
      "data_chegada",
    ];

    let valorTratado = valor;

    if (
      typeof valor === "string" &&
      !camposNumericos.includes(nome) &&
      !camposSemConversao.includes(nome)
    ) {
      valorTratado =
        valor.toUpperCase();
    }

    setForm((dadosAtuais) => ({
      ...dadosAtuais,
      [nome]: valorTratado,
    }));
  }

  function abrirEdicao() {
    setForm({
      ...viatura,
    });

    setErro("");
    setEditando(true);
  }

  function cancelarEdicao() {
    setForm({
      ...viatura,
    });

    setErro("");
    setEditando(false);
  }

  async function salvarAlteracoes() {
    if (!viatura?.id || !form) {
      setErro(
        "Viatura não identificada."
      );
      return;
    }

    const prefixoTratado = String(
      form.prefixo || ""
    ).replace(/\D/g, "");

    if (!/^\d{5}$/.test(prefixoTratado)) {
      setErro(
        "O prefixo deve possuir exatamente 5 dígitos."
      );
      return;
    }

    const placaTratada = String(
      form.placa || ""
    )
      .replace(/[^A-Z0-9]/gi, "")
      .toUpperCase();

    if (placaTratada.length !== 7) {
      setErro(
        "A placa deve possuir 7 caracteres."
      );
      return;
    }

    try {
      setSalvando(true);
      setErro("");

      const atualizada =
        await atualizarViatura(
          viatura.id,
          {
            ...form,
            prefixo: prefixoTratado,
            placa: placaTratada,
          }
        );

      setViatura(atualizada);
      setForm(atualizada);
      setEditando(false);

      if (
        String(atualizada.prefixo) !==
        String(prefixo)
      ) {
        navigate(
          `/administrativo/viaturas/${atualizada.prefixo}`,
          {
            replace: true,
          }
        );
      }
    } catch (error) {
      console.error(
        "Erro ao atualizar viatura:",
        error
      );

      setErro(
        error?.message ||
          "Não foi possível salvar as alterações."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function alterarStatus(
    novoStatus
  ) {
    if (!viatura?.id) {
      return;
    }

    const motivo = window.prompt(
      `Informe o motivo para alterar o status para ${novoStatus}:`
    );

    if (!motivo?.trim()) {
      window.alert(
        "Informe o motivo da alteração."
      );
      return;
    }

    try {
      setAlterandoStatus(true);
      setErro("");

      const atualizada =
        await atualizarStatusViatura(
          viatura.id,
          novoStatus
        );

      setViatura((dadosAtuais) => ({
        ...dadosAtuais,
        ...atualizada,
      }));

      setForm((dadosAtuais) => ({
        ...dadosAtuais,
        ...atualizada,
      }));
    } catch (error) {
      console.error(
        "Erro ao alterar status:",
        error
      );

      setErro(
        error?.message ||
          "Não foi possível alterar o status da viatura."
      );
    } finally {
      setAlterandoStatus(false);
    }
  }

  function voltarParaFrota() {
    navigate(
      "/administrativo/viaturas"
    );
  }

  function valorExibicao(valor) {
    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {
      return "NÃO INFORMADO";
    }

    return valor;
  }

  function formatarOdometro(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
      return "NÃO INFORMADO";
    }

    return `${numero.toLocaleString(
      "pt-BR"
    )} km`;
  }

  function formatarMoeda(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
      return "NÃO INFORMADO";
    }

    return numero.toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    );
  }

  function obterNomeCondutor(abastecimento) {
    const nome =
      abastecimento?.nome_motorista ??
      abastecimento?.motorista_nome ??
      abastecimento?.nome_condutor ??
      abastecimento?.condutor_nome ??
      abastecimento?.condutor ??
      abastecimento?.motorista ??
      abastecimento?.responsavel_nome ??
      abastecimento?.nome_responsavel ??
      abastecimento?.militar_nome ??
      abastecimento?.nome_militar ??
      abastecimento?.militares?.nome ??
      abastecimento?.militares?.nome_policia;

    if (
      nome !== null &&
      nome !== undefined &&
      String(nome).trim() !== ""
    ) {
      return String(nome).trim().toUpperCase();
    }

    const numeroPolicia =
      abastecimento?.numero_policia ??
      abastecimento?.motorista_numero_policia ??
      abastecimento?.condutor_numero_policia;

    if (
      numeroPolicia !== null &&
      numeroPolicia !== undefined &&
      String(numeroPolicia).trim() !== ""
    ) {
      return `Nº ${String(numeroPolicia).trim()}`;
    }

    return "NÃO INFORMADO";
  }

  function formatarLitros(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
      return "NÃO INFORMADO";
    }

    return `${numero.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    })} L`;
  }

  if (carregando) {
    return (
      <main className="viaturas-page">
        <section className="viaturas-container">
          <div className="form-card">
            Carregando prontuário...
          </div>
        </section>
      </main>
    );
  }

  if (!viatura || !form) {
    return (
      <main className="viaturas-page">
        <section className="viaturas-container">
          <button
            type="button"
            className="botao-voltar-prontuario"
            onClick={voltarParaFrota}
          >
            <ArrowLeft size={16} />
            Voltar para frota
          </button>

          <h1>
            Viatura não encontrada
          </h1>

          {erro && (
            <div className="aviso-erro">
              ⚠ {erro}
            </div>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="viaturas-page">
      <section className="viaturas-container">
        <button
          type="button"
          className="botao-voltar-prontuario"
          onClick={voltarParaFrota}
        >
          <ArrowLeft size={16} />
          Voltar para frota
        </button>

        <header className="prontuario-header">
          <div>
            <span className="abastecimento-badge">
              PRONTUÁRIO DA VIATURA
            </span>

            <h1>
              🚓 {viatura.prefixo} ·{" "}
              {viatura.placa}
            </h1>

            <p>
              {valorExibicao(
                viatura.marca
              )}{" "}
              {valorExibicao(
                viatura.modelo
              )}{" "}
              ·{" "}
              {valorExibicao(
                viatura.cidade
              )}
            </p>
          </div>

          <div className="prontuario-acoes-cabecalho">
            <div className="prontuario-status-box">
              <span className="status-viatura">
                {viatura.situacao}
              </span>

              <div className="status-acoes">
                <button
                  type="button"
                  disabled={
                    alterandoStatus
                  }
                  onClick={() =>
                    alterarStatus(
                      STATUS_VIATURA.DISPONIVEL
                    )
                  }
                >
                  Disponível
                </button>

                <button
                  type="button"
                  disabled={
                    alterandoStatus
                  }
                  onClick={() =>
                    alterarStatus(
                      STATUS_VIATURA.MANUTENCAO
                    )
                  }
                >
                  Em manutenção
                </button>

                <button
                  type="button"
                  disabled={
                    alterandoStatus
                  }
                  onClick={() =>
                    alterarStatus(
                      STATUS_VIATURA.BAIXADA
                    )
                  }
                >
                  Baixada
                </button>
              </div>
            </div>
          </div>
        </header>

        {erro && (
          <div className="aviso-erro">
            ⚠ {erro}
          </div>
        )}

        <nav className="prontuario-abas">
          {abas.map((aba) => (
            <button
              key={aba.id}
              type="button"
              className={
                abaAtiva === aba.id
                  ? "ativa"
                  : ""
              }
              onClick={() =>
                setAbaAtiva(aba.id)
              }
            >
              {aba.nome}
            </button>
          ))}
        </nav>

        <section className="prontuario-conteudo">
          {abaAtiva === "geral" && (
            <div className="prontuario-grid">
              <CampoProntuario
                label="Prefixo"
                valor={form.prefixo}
                editando={editando}
                inputMode="numeric"
                maxLength={5}
                onChange={(valor) =>
                  alterarCampo(
                    "prefixo",
                    valor
                      .replace(/\D/g, "")
                      .slice(0, 5)
                  )
                }
              />

              <CampoProntuario
                label="Placa"
                valor={form.placa}
                editando={editando}
                maxLength={8}
                onChange={(valor) =>
                  alterarCampo(
                    "placa",
                    valor
                  )
                }
              />

              <CampoProntuario
                label="Marca"
                valor={form.marca}
                editando={editando}
                onChange={(valor) =>
                  alterarCampo(
                    "marca",
                    valor
                  )
                }
              />

              <CampoProntuario
                label="Modelo"
                valor={form.modelo}
                editando={editando}
                onChange={(valor) =>
                  alterarCampo(
                    "modelo",
                    valor
                  )
                }
              />

              <CampoProntuario
                label="Ano"
                valor={form.ano}
                editando={editando}
                type="number"
                onChange={(valor) =>
                  alterarCampo(
                    "ano",
                    valor
                  )
                }
              />

              <CampoProntuario
                label="Cidade"
                valor={form.cidade}
                editando={editando}
                onChange={(valor) =>
                  alterarCampo(
                    "cidade",
                    valor
                  )
                }
              />

              <CampoProntuario
                label="Lotação"
                valor={form.lotacao}
                editando={editando}
                onChange={(valor) =>
                  alterarCampo(
                    "lotacao",
                    valor
                  )
                }
              />

              <CampoProntuario
                label="Unidade da frota"
                valor={
                  form.unidade_frota
                }
                editando={editando}
                onChange={(valor) =>
                  alterarCampo(
                    "unidade_frota",
                    valor
                  )
                }
              />

              <CampoProntuario
                label="Patrimônio"
                valor={
                  form.patrimonio
                }
                editando={editando}
                onChange={(valor) =>
                  alterarCampo(
                    "patrimonio",
                    valor
                  )
                }
              />

              <CampoProntuario
                label="Odômetro"
                valor={form.odometro}
                valorFormatado={formatarOdometro(
                  form.odometro
                )}
                editando={editando}
                type="number"
                onChange={(valor) =>
                  alterarCampo(
                    "odometro",
                    valor
                  )
                }
              />

              <CampoProntuario
                label="Situação"
                valor={form.situacao}
                editando={editando}
                onChange={(valor) =>
                  alterarCampo(
                    "situacao",
                    valor
                  )
                }
              />

              <CampoProntuario
                label="Data de chegada"
                valor={
                  form.data_chegada
                }
                editando={editando}
                type="date"
                onChange={(valor) =>
                  alterarCampo(
                    "data_chegada",
                    valor
                  )
                }
              />
            </div>
          )}

          {abaAtiva === "tecnica" && (
            <div className="prontuario-grid">
              <CampoProntuario
                label="Combustível"
                valor={
                  form.combustivel
                }
                editando={editando}
                onChange={(valor) =>
                  alterarCampo(
                    "combustivel",
                    valor
                  )
                }
              />

              <CampoProntuario
                label="Tipo"
                valor={form.tipo}
                editando={editando}
                onChange={(valor) =>
                  alterarCampo(
                    "tipo",
                    valor
                  )
                }
              />

              <CampoProntuario
                label="Pneus"
                valor={form.pneus}
                editando={editando}
                onChange={(valor) =>
                  alterarCampo(
                    "pneus",
                    valor
                  )
                }
              />

              <CampoProntuario
                label="Capacidade do tanque"
                valor={
                  form.capacidade_tanque
                }
                editando={editando}
                type="number"
                step="0.01"
                onChange={(valor) =>
                  alterarCampo(
                    "capacidade_tanque",
                    valor
                  )
                }
              />

              <CampoProntuario
                label="Capacidade do cárter"
                valor={
                  form.capacidade_carter
                }
                editando={editando}
                type="number"
                step="0.01"
                onChange={(valor) =>
                  alterarCampo(
                    "capacidade_carter",
                    valor
                  )
                }
              />

              <CampoProntuario
                label="Troca de óleo"
                valor={
                  form.frequencia_troca_oleo
                }
                valorFormatado={
                  form.frequencia_troca_oleo
                    ? `${Number(
                        form.frequencia_troca_oleo
                      ).toLocaleString(
                        "pt-BR"
                      )} km`
                    : "NÃO INFORMADO"
                }
                editando={editando}
                type="number"
                onChange={(valor) =>
                  alterarCampo(
                    "frequencia_troca_oleo",
                    valor
                  )
                }
              />

              <CampoProntuario
                label="Chassi"
                valor={form.chassi}
                editando={editando}
                onChange={(valor) =>
                  alterarCampo(
                    "chassi",
                    valor
                  )
                }
              />

              <CampoProntuario
                label="RENAVAM"
                valor={form.renavam}
                editando={editando}
                onChange={(valor) =>
                  alterarCampo(
                    "renavam",
                    valor
                  )
                }
              />

              <CampoProntuario
                label="Rádio"
                valor={form.radio}
                editando={editando}
                onChange={(valor) =>
                  alterarCampo(
                    "radio",
                    valor
                  )
                }
              />

              <CampoProntuario
                label="Origem"
                valor={form.origem}
                editando={editando}
                onChange={(valor) =>
                  alterarCampo(
                    "origem",
                    valor
                  )
                }
              />

              <CampoProntuario
                label="Patrimônio"
                valor={form.patrimonio}
                editando={editando}
                onChange={(valor) =>
                  alterarCampo(
                    "patrimonio",
                    valor
                  )
                }
              />

              <CampoProntuario
                label="Valor venal"
                valor={
                  form.valor_venal
                }
                valorFormatado={formatarMoeda(
                  form.valor_venal
                )}
                editando={editando}
                type="number"
                step="0.01"
                onChange={(valor) =>
                  alterarCampo(
                    "valor_venal",
                    valor
                  )
                }
              />
            </div>
          )}

          {abaAtiva ===
            "abastecimentos" && (
            <section className="prontuario-abastecimentos">
              {carregandoAbastecimentos && (
                <div className="prontuario-vazio">
                  Carregando abastecimentos...
                </div>
              )}

              {!carregandoAbastecimentos &&
                erroAbastecimentos && (
                  <div className="aviso-erro">
                    ⚠ {erroAbastecimentos}
                  </div>
                )}

              {!carregandoAbastecimentos &&
                !erroAbastecimentos &&
                abastecimentos.length === 0 && (
                  <div className="prontuario-vazio">
                    Nenhum abastecimento encontrado
                    para esta viatura.
                  </div>
                )}

              {!carregandoAbastecimentos &&
                !erroAbastecimentos &&
                abastecimentos.length > 0 && (
                  <div className="tabela-abastecimentos-container">
                    <table className="tabela-abastecimentos-prontuario">
                      <thead>
                        <tr>
                          <th>Data e hora</th>
                          <th>Condutor</th>
                          <th>Combustível</th>
                          <th>Litros</th>
                          <th>Odômetro</th>
                          <th>Valor unitário</th>
                          <th>Valor total</th>
                          <th>Status SIAD</th>
                        </tr>
                      </thead>

                      <tbody>
                        {abastecimentos.map(
                          (abastecimento) => (
                            <tr key={abastecimento.id}>
                              <td>
                                {abastecimento.data_hora
                                  ? new Date(
                                      abastecimento.data_hora
                                    ).toLocaleString(
                                      "pt-BR"
                                    )
                                  : "NÃO INFORMADO"}
                              </td>

                              <td>
                                {obterNomeCondutor(
                                  abastecimento
                                )}
                              </td>

                              <td>
                                {valorExibicao(
                                  abastecimento.combustivel ??
                                    abastecimento.tipo_combustivel
                                )}
                              </td>

                              <td>
                                {formatarLitros(
                                  abastecimento.litros
                                )}
                              </td>

                              <td>
                                {formatarOdometro(
                                  abastecimento.odometro
                                )}
                              </td>

                              <td>
                                {formatarMoeda(
                                  abastecimento.valor_unitario
                                )}
                              </td>

                              <td>
                                {formatarMoeda(
                                  abastecimento.valor_total
                                )}
                              </td>

                              <td>
                                <span
                                  className={`status-siad status-siad--${String(
                                    abastecimento.status_siad ??
                                      abastecimento.status_lancamento ??
                                      "sem-status"
                                  )
                                    .normalize("NFD")
                                    .replace(
                                      /[\u0300-\u036f]/g,
                                      ""
                                    )
                                    .toLowerCase()}`}
                                >
                                  {valorExibicao(
                                    abastecimento.status_siad ??
                                      abastecimento.status_lancamento
                                  )}
                                </span>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
            </section>
          )}

          {abaAtiva ===
            "manutencoes" && (
            <div className="prontuario-vazio">
              Ordens de serviço e
              manutenções serão exibidas
              aqui.
            </div>
          )}

          {abaAtiva === "alertas" && (
            <div className="prontuario-vazio">
              Alertas inteligentes da
              viatura serão exibidos aqui.
            </div>
          )}

          {abaAtiva ===
            "documentos" && (
            <div className="prontuario-vazio">
              Documentos, fotos, garantias
              e notas fiscais serão
              exibidos aqui.
            </div>
          )}

          {abaAtiva ===
            "historico" && (
            <div className="prontuario-vazio">
              Linha do tempo completa da
              viatura será exibida aqui.
            </div>
          )}

          {abaAtiva ===
            "financeiro" && (
            <div className="prontuario-vazio">
              Gastos, valor venal e
              indicadores financeiros serão
              exibidos aqui.
            </div>
          )}

          <div className="prontuario-acoes-rodape">
            {!editando ? (
              <button
                type="button"
                className="botao-editar-viatura"
                onClick={abrirEdicao}
              >
                <Pencil size={16} />
                <span>
                  Editar viatura
                </span>
              </button>
            ) : (
              <div className="prontuario-edicao-acoes">
                <button
                  type="button"
                  className="botao-cancelar-edicao"
                  onClick={cancelarEdicao}
                  disabled={salvando}
                >
                  <X size={16} />
                  <span>Cancelar</span>
                </button>

                <button
                  type="button"
                  className="botao-salvar-edicao"
                  onClick={salvarAlteracoes}
                  disabled={salvando}
                >
                  <Save size={16} />

                  <span>
                    {salvando
                      ? "Salvando..."
                      : "Salvar alterações"}
                  </span>
                </button>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function CampoProntuario({
  label,
  valor,
  valorFormatado,
  editando,
  onChange,
  type = "text",
  inputMode,
  maxLength,
  step,
}) {
  const possuiValor =
    valor !== null &&
    valor !== undefined &&
    valor !== "";

  return (
    <div className="prontuario-campo">
      <span>{label}</span>

      {editando ? (
        <input
          type={type}
          value={valor ?? ""}
          inputMode={inputMode}
          maxLength={maxLength}
          step={step}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
        />
      ) : (
        <strong>
          {valorFormatado ||
            (possuiValor
              ? valor
              : "NÃO INFORMADO")}
        </strong>
      )}
    </div>
  );
}

export default ProntuarioViatura;