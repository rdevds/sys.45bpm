import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Car,
  Check,
  ClipboardCheck,
  Database,
  FileKey,
  Fuel,
  Gauge,
  LoaderCircle,
  MapPin,
  Radio,
  ShieldCheck,
  Tag,
  Wrench,
  X,
} from "lucide-react";

import { supabase } from "../../../services/supabase.js";

import "./NovaViaturaModalV2.css";

const ETAPAS = [
  {
    numero: 1,
    titulo: "Modelo",
    descricao: "Dados técnicos padronizados",
  },
  {
    numero: 2,
    titulo: "Identificação",
    descricao: "Placa, prefixo e lotação",
  },
  {
    numero: 3,
    titulo: "Patrimônio",
    descricao: "Dados exclusivos da viatura",
  },
  {
    numero: 4,
    titulo: "Conferência",
    descricao: "Revisão antes de salvar",
  },
];

const FORMULARIO_INICIAL = {
  modeloViaturaId: "",
  lotacaoViaturaId: "",

  placa: "",
  prefixo: "",

  patrimonio: "",
  radio: "",
  chassi: "",
  renavam: "",

  origem: "",
  odometro: "",
  valorVenal: "",
  valorVenalAno: String(
    new Date().getFullYear()
  ),
  dataChegada: "",
  situacao: "DISPONÍVEL",
};

function texto(valor) {
  return String(valor ?? "").trim();
}

function textoMaiusculo(valor) {
  return texto(valor).toUpperCase();
}

function somenteNumeros(valor) {
  return texto(valor).replace(/\D/g, "");
}

function normalizarPlaca(valor) {
  const placa = textoMaiusculo(valor)
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);

  if (placa.length <= 3) {
    return placa;
  }

  return `${placa.slice(0, 3)}-${placa.slice(3)}`;
}

function normalizarChassi(valor) {
  return textoMaiusculo(valor)
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 17);
}

function formatarNumero(
  valor,
  casas = 0
) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "-";
  }

  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

function formatarMoeda(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "R$ 0,00";
  }

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function converterValorMonetario(valor) {
  const original = texto(valor);

  if (!original) {
    return 0;
  }

  const limpo = original
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const numero = Number(limpo);

  return Number.isFinite(numero)
    ? numero
    : 0;
}

function NovaViaturaModalV2({
  viaturas = [],
  onFechar,
  onSalvar,
}) {
  const [
    etapaAtual,
    setEtapaAtual,
  ] = useState(1);

  const [
    formulario,
    setFormulario,
  ] = useState(FORMULARIO_INICIAL);

  const [
    lotacoes,
    setLotacoes,
  ] = useState([]);

  const [
    modelos,
    setModelos,
  ] = useState([]);

  const [
    carregandoDados,
    setCarregandoDados,
  ] = useState(true);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState("");

  useEffect(() => {
    carregarCadastrosAuxiliares();
  }, []);

  async function carregarCadastrosAuxiliares() {
    try {
      setCarregandoDados(true);
      setErro("");

      const [
        respostaLotacoes,
        respostaModelos,
      ] = await Promise.all([
        supabase
          .from("lotacoes_viaturas")
          .select(
            `
              id,
              nome,
              sigla,
              codigo_siad_unidade_frota,
              cidade,
              ordem_exibicao,
              ativa
            `
          )
          .eq("ativa", true)
          .order("ordem_exibicao", {
            ascending: true,
          })
          .order("nome", {
            ascending: true,
          }),

        supabase
          .from("modelos_viaturas")
          .select(
            `
              id,
              marca,
              modelo,
              ano,
              combustivel,
              tipo,
              pneus,
              capacidade_carter,
              especificacao_oleo,
              capacidade_tanque,
              frequencia_troca_oleo,
              observacao,
              ativo
            `
          )
          .eq("ativo", true)
          .order("marca", {
            ascending: true,
          })
          .order("modelo", {
            ascending: true,
          })
          .order("ano", {
            ascending: false,
          }),
      ]);

      if (respostaLotacoes.error) {
        throw new Error(
          `Não foi possível carregar as lotações: ${respostaLotacoes.error.message}`
        );
      }

      if (respostaModelos.error) {
        throw new Error(
          `Não foi possível carregar os modelos: ${respostaModelos.error.message}`
        );
      }

      setLotacoes(
        Array.isArray(
          respostaLotacoes.data
        )
          ? respostaLotacoes.data
          : []
      );

      setModelos(
        Array.isArray(
          respostaModelos.data
        )
          ? respostaModelos.data
          : []
      );
    } catch (error) {
      console.error(
        "Erro ao carregar cadastros auxiliares:",
        error
      );

      setErro(
        error?.message ||
          "NÃO FOI POSSÍVEL CARREGAR OS DADOS DO CADASTRO."
      );
    } finally {
      setCarregandoDados(false);
    }
  }

  const modeloSelecionado =
    useMemo(
      () =>
        modelos.find(
          (modelo) =>
            Number(modelo.id) ===
            Number(
              formulario.modeloViaturaId
            )
        ) ?? null,
      [
        modelos,
        formulario.modeloViaturaId,
      ]
    );

  const lotacaoSelecionada =
    useMemo(
      () =>
        lotacoes.find(
          (lotacao) =>
            Number(lotacao.id) ===
            Number(
              formulario.lotacaoViaturaId
            )
        ) ?? null,
      [
        lotacoes,
        formulario.lotacaoViaturaId,
      ]
    );

  const marcas =
    useMemo(
      () =>
        [
          ...new Set(
            modelos
              .map((modelo) =>
                textoMaiusculo(
                  modelo.marca
                )
              )
              .filter(Boolean)
          ),
        ].sort(),
      [modelos]
    );

  const [
    marcaFiltro,
    setMarcaFiltro,
  ] = useState("");

  const [
    modeloFiltro,
    setModeloFiltro,
  ] = useState("");

  const [
    anoFiltro,
    setAnoFiltro,
  ] = useState("");

  const nomesModelos =
    useMemo(() => {
      if (!marcaFiltro) {
        return [];
      }

      return [
        ...new Set(
          modelos
            .filter(
              (modelo) =>
                textoMaiusculo(
                  modelo.marca
                ) ===
                textoMaiusculo(
                  marcaFiltro
                )
            )
            .map((modelo) =>
              textoMaiusculo(
                modelo.modelo
              )
            )
            .filter(Boolean)
        ),
      ].sort();
    }, [
      modelos,
      marcaFiltro,
    ]);

  const anos =
    useMemo(() => {
      if (
        !marcaFiltro ||
        !modeloFiltro
      ) {
        return [];
      }

      return [
        ...new Set(
          modelos
            .filter(
              (modelo) =>
                textoMaiusculo(
                  modelo.marca
                ) ===
                  textoMaiusculo(
                    marcaFiltro
                  ) &&
                textoMaiusculo(
                  modelo.modelo
                ) ===
                  textoMaiusculo(
                    modeloFiltro
                  )
            )
            .map((modelo) =>
              Number(modelo.ano)
            )
            .filter(Number.isFinite)
        ),
      ].sort((a, b) => b - a);
    }, [
      modelos,
      marcaFiltro,
      modeloFiltro,
    ]);

  useEffect(() => {
    if (
      !marcaFiltro ||
      !modeloFiltro ||
      !anoFiltro
    ) {
      atualizarCampo(
        "modeloViaturaId",
        ""
      );
      return;
    }

    const encontrado =
      modelos.find(
        (modelo) =>
          textoMaiusculo(
            modelo.marca
          ) ===
            textoMaiusculo(
              marcaFiltro
            ) &&
          textoMaiusculo(
            modelo.modelo
          ) ===
            textoMaiusculo(
              modeloFiltro
            ) &&
          Number(modelo.ano) ===
            Number(anoFiltro)
      );

    atualizarCampo(
      "modeloViaturaId",
      encontrado
        ? String(encontrado.id)
        : ""
    );
  }, [
    marcaFiltro,
    modeloFiltro,
    anoFiltro,
    modelos,
  ]);

  function atualizarCampo(
    campo,
    valor
  ) {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function selecionarMarca(valor) {
    setMarcaFiltro(valor);
    setModeloFiltro("");
    setAnoFiltro("");

    atualizarCampo(
      "modeloViaturaId",
      ""
    );
  }

  function selecionarModelo(valor) {
    setModeloFiltro(valor);
    setAnoFiltro("");

    atualizarCampo(
      "modeloViaturaId",
      ""
    );
  }

  function placaJaExiste() {
    const placaAtual =
      normalizarPlaca(
        formulario.placa
      );

    return viaturas.some(
      (viatura) =>
        normalizarPlaca(
          viatura.placa
        ) === placaAtual
    );
  }

  function prefixoJaExiste() {
    const prefixoAtual =
      somenteNumeros(
        formulario.prefixo
      );

    return viaturas.some(
      (viatura) =>
        somenteNumeros(
          viatura.prefixo
        ) === prefixoAtual
    );
  }

  function validarEtapaModelo() {
    if (!marcaFiltro) {
      throw new Error(
        "SELECIONE A MARCA DA VIATURA."
      );
    }

    if (!modeloFiltro) {
      throw new Error(
        "SELECIONE O MODELO DA VIATURA."
      );
    }

    if (!anoFiltro) {
      throw new Error(
        "SELECIONE O ANO DO MODELO."
      );
    }

    if (
      !formulario.modeloViaturaId ||
      !modeloSelecionado
    ) {
      throw new Error(
        "O MODELO SELECIONADO NÃO FOI LOCALIZADO."
      );
    }
  }

  function validarEtapaIdentificacao() {
    const prefixo =
      somenteNumeros(
        formulario.prefixo
      );

    const placa =
      normalizarPlaca(
        formulario.placa
      );

    if (prefixo.length !== 5) {
      throw new Error(
        "O PREFIXO DEVE POSSUIR EXATAMENTE 5 DÍGITOS."
      );
    }

    if (placa.length !== 8) {
      throw new Error(
        "INFORME UMA PLACA VÁLIDA."
      );
    }

    if (prefixoJaExiste()) {
      throw new Error(
        "JÁ EXISTE UMA VIATURA CADASTRADA COM ESSE PREFIXO."
      );
    }

    if (placaJaExiste()) {
      throw new Error(
        "JÁ EXISTE UMA VIATURA CADASTRADA COM ESSA PLACA."
      );
    }

    if (
      !formulario.lotacaoViaturaId ||
      !lotacaoSelecionada
    ) {
      throw new Error(
        "SELECIONE A LOTAÇÃO DA VIATURA."
      );
    }
  }

  function validarEtapaPatrimonio() {
    if (
      !texto(
        formulario.patrimonio
      )
    ) {
      throw new Error(
        "INFORME O PATRIMÔNIO."
      );
    }

    if (!texto(formulario.radio)) {
      throw new Error(
        "INFORME O RÁDIO."
      );
    }

    if (
      normalizarChassi(
        formulario.chassi
      ).length !== 17
    ) {
      throw new Error(
        "O CHASSI DEVE POSSUIR 17 CARACTERES."
      );
    }

    const renavam =
      somenteNumeros(
        formulario.renavam
      );

    if (
      renavam.length < 9 ||
      renavam.length > 11
    ) {
      throw new Error(
        "INFORME UM RENAVAM VÁLIDO."
      );
    }

    if (!formulario.origem) {
      throw new Error(
        "SELECIONE A ORIGEM DA VIATURA."
      );
    }

    const odometro = Number(
      formulario.odometro
    );

    if (
      !Number.isFinite(odometro) ||
      odometro < 0
    ) {
      throw new Error(
        "INFORME UM ODÔMETRO VÁLIDO."
      );
    }

    const valorVenal =
      converterValorMonetario(
        formulario.valorVenal
      );

    if (valorVenal <= 0) {
      throw new Error(
        "INFORME O VALOR VENAL."
      );
    }

    const anoValorVenal =
      Number(
        formulario.valorVenalAno
      );

    if (
      !Number.isInteger(
        anoValorVenal
      ) ||
      anoValorVenal < 2000 ||
      anoValorVenal > 2100
    ) {
      throw new Error(
        "INFORME O ANO DE REFERÊNCIA DO VALOR VENAL."
      );
    }

    if (
      !formulario.dataChegada
    ) {
      throw new Error(
        "INFORME A DATA DE CHEGADA."
      );
    }

    if (
      ![
        "DISPONÍVEL",
        "DESCARREGADA",
      ].includes(
        formulario.situacao
      )
    ) {
      throw new Error(
        "SELECIONE UMA SITUAÇÃO VÁLIDA."
      );
    }
  }

  function validarEtapa(
    etapa = etapaAtual
  ) {
    if (etapa === 1) {
      validarEtapaModelo();
    }

    if (etapa === 2) {
      validarEtapaIdentificacao();
    }

    if (etapa === 3) {
      validarEtapaPatrimonio();
    }
  }

  function avancarEtapa() {
    try {
      setErro("");
      validarEtapa();

      setEtapaAtual((atual) =>
        Math.min(atual + 1, 4)
      );
    } catch (error) {
      setErro(
        error?.message ||
          "VERIFIQUE OS CAMPOS INFORMADOS."
      );
    }
  }

  function voltarEtapa() {
    setErro("");

    setEtapaAtual((atual) =>
      Math.max(atual - 1, 1)
    );
  }

  async function salvar() {
    try {
      setErro("");

      validarEtapaModelo();
      validarEtapaIdentificacao();
      validarEtapaPatrimonio();

      if (
        typeof onSalvar !==
        "function"
      ) {
        throw new Error(
          "A FUNÇÃO DE SALVAMENTO NÃO FOI INFORMADA."
        );
      }

      setSalvando(true);

      const dados = {
        modelo_viatura_id:
          Number(
            formulario.modeloViaturaId
          ),

        lotacao_viatura_id:
          Number(
            formulario.lotacaoViaturaId
          ),

        placa: normalizarPlaca(
          formulario.placa
        ),

        prefixo: somenteNumeros(
          formulario.prefixo
        ),

        patrimonio:
          textoMaiusculo(
            formulario.patrimonio
          ),

        radio:
          textoMaiusculo(
            formulario.radio
          ),

        chassi:
          normalizarChassi(
            formulario.chassi
          ),

        renavam:
          somenteNumeros(
            formulario.renavam
          ),

        origem:
          formulario.origem,

        odometro:
          Number(
            formulario.odometro
          ),

        valor_venal:
          converterValorMonetario(
            formulario.valorVenal
          ),

        valor_venal_ano:
          Number(
            formulario.valorVenalAno
          ),

        data_chegada:
          formulario.dataChegada,

        situacao:
          formulario.situacao,
      };

      await onSalvar(dados);
    } catch (error) {
      console.error(
        "Erro ao cadastrar viatura:",
        error
      );

      setErro(
        error?.message ||
          "NÃO FOI POSSÍVEL CADASTRAR A VIATURA."
      );
    } finally {
      setSalvando(false);
    }
  }

  function fechar() {
    if (salvando) {
      return;
    }

    onFechar?.();
  }

  const progresso =
    etapaAtual * 25;

  if (carregandoDados) {
    return (
      <div className="nova-vtr-overlay">
        <section className="nova-vtr-modal nova-vtr-carregando">
          <LoaderCircle
            size={36}
            className="nova-vtr-girando"
          />

          <strong>
            Preparando o cadastro...
          </strong>

          <span>
            Carregando lotações e modelos
            de viaturas.
          </span>
        </section>
      </div>
    );
  }

  return (
    <div className="nova-vtr-overlay">
      <section
        className="nova-vtr-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nova-vtr-titulo"
      >
        <header className="nova-vtr-cabecalho">
          <div>
            <span className="nova-vtr-etiqueta">
              CADASTRO DE VIATURA
            </span>

            <h2 id="nova-vtr-titulo">
              Nova Viatura
            </h2>

            <p>
              A Pasta será gerada
              automaticamente após o
              cadastro.
            </p>
          </div>

          <button
            type="button"
            className="nova-vtr-fechar"
            onClick={fechar}
            disabled={salvando}
            aria-label="Fechar cadastro"
          >
            <X size={22} />
          </button>
        </header>

        <div className="nova-vtr-progresso">
          <div className="nova-vtr-etapas">
            {ETAPAS.map((etapa) => {
              const concluida =
                etapa.numero <
                etapaAtual;

              const ativa =
                etapa.numero ===
                etapaAtual;

              return (
                <div
                  key={etapa.numero}
                  className={`nova-vtr-etapa ${
                    ativa
                      ? "ativa"
                      : ""
                  } ${
                    concluida
                      ? "concluida"
                      : ""
                  }`}
                >
                  <span>
                    {concluida ? (
                      <Check size={16} />
                    ) : (
                      etapa.numero
                    )}
                  </span>

                  <div>
                    <strong>
                      {etapa.titulo}
                    </strong>

                    <small>
                      {etapa.descricao}
                    </small>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="nova-vtr-barra">
            <span
              style={{
                width: `${progresso}%`,
              }}
            />
          </div>
        </div>

        <div className="nova-vtr-conteudo">
          {etapaAtual === 1 && (
            <section className="nova-vtr-painel">
              <div className="nova-vtr-titulo-etapa">
                <Database size={22} />

                <div>
                  <h3>
                    Modelo da viatura
                  </h3>

                  <p>
                    Selecione marca, modelo
                    e ano. Os dados técnicos
                    serão preenchidos pelo
                    cadastro de modelos.
                  </p>
                </div>
              </div>

              {modelos.length === 0 ? (
                <div className="nova-vtr-aviso">
                  Nenhum modelo ativo foi
                  encontrado. Cadastre um
                  registro em
                  modelos_viaturas antes de
                  continuar.
                </div>
              ) : (
                <>
                  <div className="nova-vtr-grid">
                    <label>
                      Marca *
                      <select
                        value={marcaFiltro}
                        onChange={(event) =>
                          selecionarMarca(
                            event.target.value
                          )
                        }
                      >
                        <option value="">
                          SELECIONE
                        </option>

                        {marcas.map(
                          (marca) => (
                            <option
                              key={marca}
                              value={marca}
                            >
                              {marca}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label>
                      Modelo *
                      <select
                        value={modeloFiltro}
                        onChange={(event) =>
                          selecionarModelo(
                            event.target.value
                          )
                        }
                        disabled={
                          !marcaFiltro
                        }
                      >
                        <option value="">
                          SELECIONE
                        </option>

                        {nomesModelos.map(
                          (modelo) => (
                            <option
                              key={modelo}
                              value={modelo}
                            >
                              {modelo}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label>
                      Ano *
                      <select
                        value={anoFiltro}
                        onChange={(event) =>
                          setAnoFiltro(
                            event.target.value
                          )
                        }
                        disabled={
                          !modeloFiltro
                        }
                      >
                        <option value="">
                          SELECIONE
                        </option>

                        {anos.map((ano) => (
                          <option
                            key={ano}
                            value={ano}
                          >
                            {ano}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {modeloSelecionado && (
                    <div className="nova-vtr-dados-automaticos">
                      <header>
                        <ShieldCheck size={19} />

                        <strong>
                          Dados técnicos
                          automáticos
                        </strong>
                      </header>

                      <div>
                        <article>
                          <span>
                            Combustível
                          </span>
                          <strong>
                            {
                              modeloSelecionado.combustivel
                            }
                          </strong>
                        </article>

                        <article>
                          <span>Tipo</span>
                          <strong>
                            {
                              modeloSelecionado.tipo
                            }
                          </strong>
                        </article>

                        <article>
                          <span>Pneus</span>
                          <strong>
                            {
                              modeloSelecionado.pneus
                            }
                          </strong>
                        </article>

                        <article>
                          <span>
                            Cárter
                          </span>
                          <strong>
                            {formatarNumero(
                              modeloSelecionado.capacidade_carter,
                              2
                            )}{" "}
                            L
                          </strong>
                        </article>

                        <article>
                          <span>Óleo</span>
                          <strong>
                            {
                              modeloSelecionado.especificacao_oleo
                            }
                          </strong>
                        </article>

                        <article>
                          <span>
                            Tanque
                          </span>
                          <strong>
                            {formatarNumero(
                              modeloSelecionado.capacidade_tanque,
                              2
                            )}{" "}
                            L
                          </strong>
                        </article>

                        <article>
                          <span>
                            Troca de óleo
                          </span>
                          <strong>
                            {formatarNumero(
                              modeloSelecionado.frequencia_troca_oleo
                            )}{" "}
                            KM
                          </strong>
                        </article>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {etapaAtual === 2 && (
            <section className="nova-vtr-painel">
              <div className="nova-vtr-titulo-etapa">
                <Car size={22} />

                <div>
                  <h3>
                    Identificação e lotação
                  </h3>

                  <p>
                    Informe a placa, o
                    prefixo e selecione a
                    fração à qual a viatura
                    pertence.
                  </p>
                </div>
              </div>

              <div className="nova-vtr-grid">
                <label>
                  Prefixo *
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    value={
                      formulario.prefixo
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        "prefixo",
                        somenteNumeros(
                          event.target.value
                        ).slice(0, 5)
                      )
                    }
                    placeholder="25853"
                  />
                </label>

                <label>
                  Placa *
                  <input
                    type="text"
                    maxLength={8}
                    value={normalizarPlaca(
                      formulario.placa
                    )}
                    onChange={(event) =>
                      atualizarCampo(
                        "placa",
                        event.target.value
                      )
                    }
                    placeholder="QNJ-1890"
                  />
                </label>

                <label className="nova-vtr-campo-largo">
                  Lotação *
                  <select
                    value={
                      formulario.lotacaoViaturaId
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        "lotacaoViaturaId",
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      SELECIONE
                    </option>

                    {lotacoes.map(
                      (lotacao) => (
                        <option
                          key={lotacao.id}
                          value={lotacao.id}
                        >
                          {lotacao.sigla ||
                            lotacao.nome}
                          {" — "}
                          {
                            lotacao.codigo_siad_unidade_frota
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>
              </div>

              {lotacaoSelecionada && (
                <div className="nova-vtr-dados-automaticos">
                  <header>
                    <Building2 size={19} />

                    <strong>
                      Dados da lotação
                    </strong>
                  </header>

                  <div>
                    <article>
                      <span>Lotação</span>
                      <strong>
                        {lotacaoSelecionada.sigla ||
                          lotacaoSelecionada.nome}
                      </strong>
                    </article>

                    <article>
                      <span>
                        Unidade Frota
                      </span>
                      <strong>
                        {
                          lotacaoSelecionada.codigo_siad_unidade_frota
                        }
                      </strong>
                    </article>

                    <article>
                      <span>Cidade</span>
                      <strong>
                        {
                          lotacaoSelecionada.cidade
                        }
                      </strong>
                    </article>
                  </div>
                </div>
              )}
            </section>
          )}

          {etapaAtual === 3 && (
            <section className="nova-vtr-painel">
              <div className="nova-vtr-titulo-etapa">
                <FileKey size={22} />

                <div>
                  <h3>
                    Patrimônio e controle
                  </h3>

                  <p>
                    Preencha os dados
                    exclusivos desta
                    viatura.
                  </p>
                </div>
              </div>

              <div className="nova-vtr-grid">
                <label>
                  Patrimônio *
                  <input
                    type="text"
                    value={
                      formulario.patrimonio
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        "patrimonio",
                        textoMaiusculo(
                          event.target.value
                        )
                      )
                    }
                    placeholder="NÚMERO DO PATRIMÔNIO"
                  />
                </label>

                <label>
                  Rádio *
                  <input
                    type="text"
                    value={
                      formulario.radio
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        "radio",
                        textoMaiusculo(
                          event.target.value
                        )
                      )
                    }
                    placeholder="NÚMERO OU PATRIMÔNIO"
                  />
                </label>

                <label className="nova-vtr-campo-largo">
                  Chassi *
                  <input
                    type="text"
                    maxLength={17}
                    value={
                      formulario.chassi
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        "chassi",
                        normalizarChassi(
                          event.target.value
                        )
                      )
                    }
                    placeholder="17 CARACTERES"
                  />
                </label>

                <label>
                  Renavam *
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={11}
                    value={
                      formulario.renavam
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        "renavam",
                        somenteNumeros(
                          event.target.value
                        ).slice(0, 11)
                      )
                    }
                    placeholder="00000000000"
                  />
                </label>

                <label>
                  Origem *
                  <select
                    value={
                      formulario.origem
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        "origem",
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      SELECIONE
                    </option>

                    <option value="ORGÂNICA">
                      ORGÂNICA
                    </option>

                    <option value="LOCADA">
                      LOCADA
                    </option>
                  </select>
                </label>

                <label>
                  Odômetro inicial *
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={
                      formulario.odometro
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        "odometro",
                        event.target.value
                      )
                    }
                    placeholder="0"
                  />
                </label>

                <label>
                  Valor venal *
                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      formulario.valorVenal
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        "valorVenal",
                        event.target.value
                      )
                    }
                    placeholder="Ex.: 72500,00"
                  />
                </label>

                <label>
                  Ano do valor venal *
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={
                      formulario.valorVenalAno
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        "valorVenalAno",
                        somenteNumeros(
                          event.target.value
                        ).slice(0, 4)
                      )
                    }
                  />
                </label>

                <label>
                  Data de chegada *
                  <input
                    type="date"
                    value={
                      formulario.dataChegada
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        "dataChegada",
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Situação *
                  <select
                    value={
                      formulario.situacao
                    }
                    onChange={(event) =>
                      atualizarCampo(
                        "situacao",
                        event.target.value
                      )
                    }
                  >
                    <option value="DISPONÍVEL">
                      DISPONÍVEL
                    </option>

                    <option value="DESCARREGADA">
                      DESCARREGADA
                    </option>
                  </select>
                </label>
              </div>
            </section>
          )}

          {etapaAtual === 4 && (
            <section className="nova-vtr-painel">
              <div className="nova-vtr-titulo-etapa">
                <ClipboardCheck size={22} />

                <div>
                  <h3>
                    Conferência final
                  </h3>

                  <p>
                    Confira os dados antes
                    de cadastrar a viatura.
                  </p>
                </div>
              </div>

              <div className="nova-vtr-pasta-previa">
                <span>
                  PASTA DA VIATURA
                </span>

                <strong>
                  GERADA AUTOMATICAMENTE
                </strong>

                <small>
                  O número sequencial será
                  informado após salvar.
                </small>
              </div>

              <div className="nova-vtr-resumo">
                <section>
                  <header>
                    <Car size={18} />
                    Identificação
                  </header>

                  <dl>
                    <div>
                      <dt>Placa</dt>
                      <dd>
                        {normalizarPlaca(
                          formulario.placa
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>Prefixo</dt>
                      <dd>
                        {
                          formulario.prefixo
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>Marca</dt>
                      <dd>
                        {
                          modeloSelecionado?.marca
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>Modelo</dt>
                      <dd>
                        {
                          modeloSelecionado?.modelo
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>Ano</dt>
                      <dd>
                        {
                          modeloSelecionado?.ano
                        }
                      </dd>
                    </div>
                  </dl>
                </section>

                <section>
                  <header>
                    <MapPin size={18} />
                    Lotação
                  </header>

                  <dl>
                    <div>
                      <dt>Fração</dt>
                      <dd>
                        {lotacaoSelecionada?.sigla ||
                          lotacaoSelecionada?.nome}
                      </dd>
                    </div>

                    <div>
                      <dt>
                        Unidade Frota
                      </dt>
                      <dd>
                        {
                          lotacaoSelecionada?.codigo_siad_unidade_frota
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>Cidade</dt>
                      <dd>
                        {
                          lotacaoSelecionada?.cidade
                        }
                      </dd>
                    </div>
                  </dl>
                </section>

                <section>
                  <header>
                    <Wrench size={18} />
                    Dados técnicos
                  </header>

                  <dl>
                    <div>
                      <dt>
                        Combustível
                      </dt>
                      <dd>
                        {
                          modeloSelecionado?.combustivel
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>Pneus</dt>
                      <dd>
                        {
                          modeloSelecionado?.pneus
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>Óleo</dt>
                      <dd>
                        {
                          modeloSelecionado?.especificacao_oleo
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>
                        Cárter
                      </dt>
                      <dd>
                        {formatarNumero(
                          modeloSelecionado?.capacidade_carter,
                          2
                        )}{" "}
                        L
                      </dd>
                    </div>

                    <div>
                      <dt>
                        Tanque
                      </dt>
                      <dd>
                        {formatarNumero(
                          modeloSelecionado?.capacidade_tanque,
                          2
                        )}{" "}
                        L
                      </dd>
                    </div>
                  </dl>
                </section>

                <section>
                  <header>
                    <Tag size={18} />
                    Patrimônio
                  </header>

                  <dl>
                    <div>
                      <dt>
                        Patrimônio
                      </dt>
                      <dd>
                        {
                          formulario.patrimonio
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>Rádio</dt>
                      <dd>
                        {formulario.radio}
                      </dd>
                    </div>

                    <div>
                      <dt>Chassi</dt>
                      <dd>
                        {formulario.chassi}
                      </dd>
                    </div>

                    <div>
                      <dt>Renavam</dt>
                      <dd>
                        {
                          formulario.renavam
                        }
                      </dd>
                    </div>
                  </dl>
                </section>

                <section>
                  <header>
                    <Gauge size={18} />
                    Controle
                  </header>

                  <dl>
                    <div>
                      <dt>Origem</dt>
                      <dd>
                        {
                          formulario.origem
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>Odômetro</dt>
                      <dd>
                        {formatarNumero(
                          formulario.odometro
                        )}{" "}
                        KM
                      </dd>
                    </div>

                    <div>
                      <dt>
                        Valor venal
                      </dt>
                      <dd>
                        {formatarMoeda(
                          converterValorMonetario(
                            formulario.valorVenal
                          )
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>
                        Referência
                      </dt>
                      <dd>
                        {
                          formulario.valorVenalAno
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>
                        Data de chegada
                      </dt>
                      <dd>
                        {
                          formulario.dataChegada
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>Situação</dt>
                      <dd>
                        {
                          formulario.situacao
                        }
                      </dd>
                    </div>
                  </dl>
                </section>
              </div>
            </section>
          )}

          {erro && (
            <div
              className="nova-vtr-erro"
              role="alert"
            >
              {erro}
            </div>
          )}
        </div>

        <footer className="nova-vtr-rodape">
          <button
            type="button"
            className="nova-vtr-botao secundario"
            onClick={
              etapaAtual === 1
                ? fechar
                : voltarEtapa
            }
            disabled={salvando}
          >
            {etapaAtual === 1 ? (
              <>
                <X size={18} />
                Cancelar
              </>
            ) : (
              <>
                <ArrowLeft size={18} />
                Voltar
              </>
            )}
          </button>

          {etapaAtual < 4 ? (
            <button
              type="button"
              className="nova-vtr-botao principal"
              onClick={avancarEtapa}
              disabled={
                salvando ||
                modelos.length === 0 ||
                lotacoes.length === 0
              }
            >
              Continuar
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              className="nova-vtr-botao salvar"
              onClick={salvar}
              disabled={salvando}
            >
              {salvando ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="nova-vtr-girando"
                  />
                  Salvando...
                </>
              ) : (
                <>
                  <Check size={18} />
                  Cadastrar viatura
                </>
              )}
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}

export default NovaViaturaModalV2;