import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FileText,
  Plus,
  Search,
  Download,
  Eye,
  Pencil,
  X,
  Car,
  UserRound,
  CalendarDays,
  Hash,
  LoaderCircle,
} from "lucide-react";

import "./Oficios.css";

import {
  atualizarOficioCentralseg,
  buscarOficios,
  buscarProximoNumeroOficio,
  buscarViaturaParaOficio,
  gerarOficioCentralseg,
} from "../../services/oficiosService.js";

const FORMULARIO_INICIAL = {
  viaturaId: null,
  placa: "",
  prefixo: "",
  marcaModelo: "",
  descricao: "",
  nomeComandante: "",
  postoComandante: "",
  funcaoComandante: "COMANDANTE",
};

function Oficios() {
  const [oficios, setOficios] = useState([]);
  const [pesquisa, setPesquisa] = useState("");

  const [modalAberto, setModalAberto] =
    useState(false);

  const [oficioEmEdicao, setOficioEmEdicao] =
    useState(null);

  const [carregando, setCarregando] =
    useState(true);

  const [buscandoViatura, setBuscandoViatura] =
    useState(false);

  const [processandoOficio, setProcessandoOficio] =
    useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [numeroPrevisto, setNumeroPrevisto] =
    useState(null);

  const [formulario, setFormulario] = useState(
    FORMULARIO_INICIAL
  );

  const anoAtual = new Date().getFullYear();

  const editando = Boolean(oficioEmEdicao);

  useEffect(() => {
    carregarDados();
  }, []);

  const oficiosFiltrados = useMemo(() => {
    const termo = pesquisa
      .trim()
      .toUpperCase();

    if (!termo) {
      return oficios;
    }

    return oficios.filter((oficio) => {
      const textoPesquisa = [
        oficio.numero,
        oficio.ano,
        oficio.placa,
        oficio.prefixo,
        oficio.marca_modelo,
        oficio.nome_comandante,
        oficio.posto_comandante,
        oficio.funcao_comandante,
        oficio.descricao,
      ]
        .filter(Boolean)
        .join(" ")
        .toUpperCase();

      return textoPesquisa.includes(termo);
    });
  }, [oficios, pesquisa]);

  const totalAnoAtual = useMemo(() => {
    return oficios.filter(
      (oficio) =>
        Number(oficio.ano) === anoAtual
    ).length;
  }, [oficios, anoAtual]);

  const totalViaturas = useMemo(() => {
    return new Set(
      oficios
        .map((oficio) => oficio.viatura_id)
        .filter(Boolean)
    ).size;
  }, [oficios]);

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro("");

      const [
        listaOficios,
        proximoNumero,
      ] = await Promise.all([
        buscarOficios(),
        buscarProximoNumeroOficio(
          anoAtual
        ),
      ]);

      setOficios(
        Array.isArray(listaOficios)
          ? listaOficios
          : []
      );

      setNumeroPrevisto(
        proximoNumero
      );
    } catch (error) {
      console.error(
        "Erro ao carregar o módulo de ofícios:",
        error
      );

      setErro(
        error?.message ||
          "Não foi possível carregar os ofícios."
      );
    } finally {
      setCarregando(false);
    }
  }

  function formatarPlaca(valor) {
    const placa = String(valor ?? "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 7);

    if (placa.length <= 3) {
      return placa;
    }

    return `${placa.slice(
      0,
      3
    )}-${placa.slice(3)}`;
  }

  function atualizarCampo(evento) {
  const {
    name,
    value,
  } = evento.target;

  let valorAtualizado = value;

  if (
    name !== "descricao" &&
    name !== "placa"
  ) {
    valorAtualizado =
      value.toUpperCase();
  }

  if (name === "placa") {
    valorAtualizado =
      formatarPlaca(value);

    /*
     * Ao alterar a placa, limpa os dados
     * vinculados à viatura anterior.
     *
     * Assim, a nova busca será feita
     * exclusivamente pela nova placa.
     */
    setFormulario(
      (dadosAtuais) => ({
        ...dadosAtuais,

        placa: valorAtualizado,

        prefixo: "",
        viaturaId: null,
        marcaModelo: "",
      })
    );

    return;
  }

  if (name === "prefixo") {
    valorAtualizado = value
      .replace(/\D/g, "")
      .slice(0, 6);

    /*
     * Ao alterar o prefixo, limpa os dados
     * vinculados à viatura anterior.
     *
     * Assim, a nova busca será feita
     * exclusivamente pelo novo prefixo.
     */
    setFormulario(
      (dadosAtuais) => ({
        ...dadosAtuais,

        prefixo: valorAtualizado,

        placa: "",
        viaturaId: null,
        marcaModelo: "",
      })
    );

    return;
  }

  setFormulario(
    (dadosAtuais) => ({
      ...dadosAtuais,
      [name]: valorAtualizado,
    })
  );
}
  function abrirModalNovo() {
    setOficioEmEdicao(null);
    setFormulario(
      FORMULARIO_INICIAL
    );
    setErro("");
    setSucesso("");
    setModalAberto(true);
  }

  function abrirModalEdicao(
    oficio
  ) {
    setOficioEmEdicao(oficio);

    setFormulario({
      viaturaId:
        oficio.viatura_id ?? null,

      placa: formatarPlaca(
        oficio.placa ?? ""
      ),

      prefixo: String(
        oficio.prefixo ?? ""
      ),

      marcaModelo: String(
        oficio.marca_modelo ?? ""
      )
        .trim()
        .toUpperCase(),

      descricao: String(
        oficio.descricao ?? ""
      ),

      nomeComandante: String(
        oficio.nome_comandante ?? ""
      )
        .trim()
        .toUpperCase(),

      postoComandante: String(
        oficio.posto_comandante ?? ""
      )
        .trim()
        .toUpperCase(),

      funcaoComandante: String(
        oficio.funcao_comandante ||
          "COMANDANTE"
      )
        .trim()
        .toUpperCase(),
    });

    setErro("");
    setSucesso("");
    setModalAberto(true);
  }

  function fecharModal() {
    if (processandoOficio) {
      return;
    }

    setModalAberto(false);
    setOficioEmEdicao(null);
    setFormulario(
      FORMULARIO_INICIAL
    );
    setErro("");
  }

  async function localizarViatura() {
    try {
      setBuscandoViatura(true);
      setErro("");
      setSucesso("");

      const viatura =
        await buscarViaturaParaOficio(
          {
            prefixo:
              formulario.prefixo,

            placa:
              formulario.placa,
          }
        );

      const marcaModelo = [
        viatura.marca,
        viatura.modelo,
      ]
        .filter(Boolean)
        .join(" ")
        .trim()
        .toUpperCase();

      setFormulario(
        (dadosAtuais) => ({
          ...dadosAtuais,

          viaturaId:
            viatura.id,

          prefixo: String(
            viatura.prefixo ?? ""
          ),

          placa: formatarPlaca(
            viatura.placa ?? ""
          ),

          marcaModelo,
        })
      );

      setSucesso(
        "Viatura localizada e vinculada ao ofício."
      );
    } catch (error) {
      console.error(
        "Erro ao localizar a viatura:",
        error
      );

      setFormulario(
        (dadosAtuais) => ({
          ...dadosAtuais,
          viaturaId: null,
          marcaModelo: "",
        })
      );

      setErro(
        error?.message ||
          "Não foi possível localizar a viatura."
      );
    } finally {
      setBuscandoViatura(false);
    }
  }

  function validarFormulario() {
    if (!formulario.viaturaId) {
      throw new Error(
        "Busque e selecione uma viatura cadastrada."
      );
    }

    if (
      !formulario.placa.trim()
    ) {
      throw new Error(
        "Informe a placa da viatura."
      );
    }

    if (
      !formulario.prefixo.trim()
    ) {
      throw new Error(
        "Informe o prefixo da viatura."
      );
    }

    if (
      !formulario.marcaModelo.trim()
    ) {
      throw new Error(
        "A marca e o modelo da viatura não foram preenchidos."
      );
    }

    if (
      !formulario.nomeComandante.trim()
    ) {
      throw new Error(
        "Informe o nome do comandante."
      );
    }

    if (
      !formulario.postoComandante.trim()
    ) {
      throw new Error(
        "Informe o posto do comandante."
      );
    }

    if (
      !formulario.funcaoComandante.trim()
    ) {
      throw new Error(
        "Informe a função do comandante."
      );
    }

    if (
      !formulario.descricao.trim()
    ) {
      throw new Error(
        "Informe a descrição do ofício."
      );
    }
  }

  function montarDadosOficio() {
    return {
      viaturaId:
        formulario.viaturaId,

      placa:
        formulario.placa,

      prefixo:
        formulario.prefixo,

      marcaModelo:
        formulario.marcaModelo
          .trim()
          .toUpperCase(),

      descricao:
        formulario.descricao.trim(),

      nomeComandante:
        formulario.nomeComandante
          .trim()
          .toUpperCase(),

      postoComandante:
        formulario.postoComandante
          .trim()
          .toUpperCase(),

      funcaoComandante:
        formulario.funcaoComandante
          .trim()
          .toUpperCase(),

      ano: editando
        ? Number(
            oficioEmEdicao.ano
          )
        : anoAtual,
    };
  }

  async function salvarOficio(
    evento
  ) {
    evento.preventDefault();

    try {
      setProcessandoOficio(true);
      setErro("");
      setSucesso("");

      validarFormulario();

      const dadosOficio =
        montarDadosOficio();

      let resultado;

      if (editando) {
        resultado =
          await atualizarOficioCentralseg(
            oficioEmEdicao.id,
            dadosOficio
          );
      } else {
        resultado =
          await gerarOficioCentralseg(
            dadosOficio
          );
      }

      const oficioSalvo =
        resultado?.oficio;

      if (!oficioSalvo) {
        throw new Error(
          editando
            ? "O backend não retornou os dados do ofício atualizado."
            : "O backend não retornou os dados do ofício gerado."
        );
      }

      setModalAberto(false);
      setOficioEmEdicao(null);
      setFormulario(
        FORMULARIO_INICIAL
      );

      await carregarDados();

      setSucesso(
        editando
          ? `Ofício nº ${oficioSalvo.numero}/${oficioSalvo.ano} atualizado com sucesso.`
          : `Ofício nº ${oficioSalvo.numero}/${oficioSalvo.ano} gerado com sucesso.`
      );

      const arquivoPdf =
        oficioSalvo.arquivoPdf ||
        oficioSalvo.arquivo_pdf;

      if (arquivoPdf) {
        window.open(
          arquivoPdf,
          "_blank",
          "noopener,noreferrer"
        );
      }
    } catch (error) {
      console.error(
        editando
          ? "Erro ao atualizar o ofício:"
          : "Erro ao gerar o ofício:",
        error
      );

      setErro(
        error?.message ||
          (editando
            ? "Não foi possível atualizar o ofício."
            : "Não foi possível gerar o ofício.")
      );
    } finally {
      setProcessandoOficio(false);
    }
  }

  function formatarData(data) {
    if (!data) {
      return "-";
    }

    const dataConvertida =
      new Date(data);

    if (
      Number.isNaN(
        dataConvertida.getTime()
      )
    ) {
      return "-";
    }

    return dataConvertida
      .toLocaleDateString(
        "pt-BR"
      );
  }

  function abrirArquivo(url) {
    if (!url) {
      setErro(
        "O arquivo ainda não está disponível."
      );

      return;
    }

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <section className="oficios-page">
      <header className="oficios-cabecalho">
        <div>
          <span className="oficios-etiqueta">
            GESTÃO DE DOCUMENTOS
          </span>

          <h1>
            Ofícios Centralseg
          </h1>

          <p>
            Gere, consulte e acompanhe
            os ofícios relacionados às
            viaturas do 45º BPM.
          </p>
        </div>

        <button
          type="button"
          className="oficios-botao-principal"
          onClick={abrirModalNovo}
        >
          <Plus size={19} />
          Novo Ofício
        </button>
      </header>

      {erro && (
        <div
          className="oficios-alerta-erro"
          role="alert"
        >
          ⚠ {erro}
        </div>
      )}

      {sucesso && (
        <div
          className="oficios-alerta-sucesso"
          role="status"
        >
          ✓ {sucesso}
        </div>
      )}

      <section className="oficios-indicadores">
        <article className="oficios-indicador">
          <div className="oficios-indicador-icone">
            <FileText size={22} />
          </div>

          <div>
            <span>
              Total de ofícios
            </span>

            <strong>
              {oficios.length}
            </strong>
          </div>
        </article>

        <article className="oficios-indicador">
          <div className="oficios-indicador-icone">
            <CalendarDays size={22} />
          </div>

          <div>
            <span>
              Emitidos neste ano
            </span>

            <strong>
              {totalAnoAtual}
            </strong>
          </div>
        </article>

        <article className="oficios-indicador">
          <div className="oficios-indicador-icone">
            <Car size={22} />
          </div>

          <div>
            <span>
              Viaturas vinculadas
            </span>

            <strong>
              {totalViaturas}
            </strong>
          </div>
        </article>
      </section>

      <section className="oficios-conteudo">
        <div className="oficios-barra">
          <div className="oficios-pesquisa">
            <Search size={18} />

            <input
              type="text"
              value={pesquisa}
              onChange={(evento) =>
                setPesquisa(
                  evento.target.value
                )
              }
              placeholder="Pesquisar por número, placa, prefixo ou comandante..."
            />
          </div>
        </div>

        <div className="oficios-tabela-container">
          <table className="oficios-tabela">
            <thead>
              <tr>
                <th>Número</th>
                <th>Data</th>
                <th>Viatura</th>
                <th>Marca/Modelo</th>
                <th>Comandante</th>
                <th>Situação</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {carregando ? (
                <tr>
                  <td
                    colSpan="7"
                    className="oficios-vazio"
                  >
                    <LoaderCircle
                      size={38}
                      className="oficios-spinner"
                    />

                    <strong>
                      Carregando ofícios
                    </strong>

                    <span>
                      Aguarde enquanto os
                      registros são
                      consultados.
                    </span>
                  </td>
                </tr>
              ) : oficiosFiltrados.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="oficios-vazio"
                  >
                    <FileText size={38} />

                    <strong>
                      Nenhum ofício
                      encontrado
                    </strong>

                    <span>
                      Clique em “Novo
                      Ofício” para gerar o
                      primeiro documento.
                    </span>
                  </td>
                </tr>
              ) : (
                oficiosFiltrados.map(
                  (oficio) => (
                    <tr key={oficio.id}>
                      <td>
                        <strong>
                          Nº{" "}
                          {oficio.numero}/
                          {oficio.ano}
                        </strong>
                      </td>

                      <td>
                        {formatarData(
                          oficio.criado_em
                        )}
                      </td>

                      <td>
                        <div className="oficios-viatura">
                          <strong>
                            {oficio.prefixo ||
                              "-"}
                          </strong>

                          <span>
                            {oficio.placa ||
                              "-"}
                          </span>
                        </div>
                      </td>

                      <td>
                        {oficio.marca_modelo ||
                          "-"}
                      </td>

                      <td>
                        {oficio.nome_comandante ||
                          "-"}
                      </td>

                      <td>
                        <span className="oficios-status">
                          GERADO
                        </span>
                      </td>

                      <td>
                        <div className="oficios-acoes">
                          <button
                            type="button"
                            title="Visualizar PDF"
                            onClick={() =>
                              abrirArquivo(
                                oficio.arquivo_pdf
                              )
                            }
                            disabled={
                              !oficio.arquivo_pdf
                            }
                          >
                            <Eye
                              size={17}
                            />
                          </button>

                          <button
                            type="button"
                            title="Baixar DOCX"
                            onClick={() =>
                              abrirArquivo(
                                oficio.arquivo_docx
                              )
                            }
                            disabled={
                              !oficio.arquivo_docx
                            }
                          >
                            <Download
                              size={17}
                            />
                          </button>

                          <button
                            type="button"
                            title="Atualizar ofício"
                            onClick={() =>
                              abrirModalEdicao(
                                oficio
                              )
                            }
                          >
                            <Pencil
                              size={17}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalAberto && (
        <div
          className="oficios-modal-fundo"
          onMouseDown={fecharModal}
        >
          <div
            className="oficios-modal"
            onMouseDown={(evento) =>
              evento.stopPropagation()
            }
          >
            <header className="oficios-modal-cabecalho">
              <div>
                <span>
                  {editando
                    ? "ATUALIZAR DOCUMENTO"
                    : "NOVO DOCUMENTO"}
                </span>

                <h2>
                  {editando
                    ? `Atualizar Ofício nº ${oficioEmEdicao.numero}/${oficioEmEdicao.ano}`
                    : "Gerar Ofício Centralseg"}
                </h2>

                <p>
                  {editando
                    ? "Corrija os dados necessários. O número e o ano serão mantidos."
                    : "Preencha os dados necessários para gerar o documento."}
                </p>
              </div>

              <button
                type="button"
                className="oficios-modal-fechar"
                onClick={fecharModal}
                disabled={
                  processandoOficio
                }
                aria-label="Fechar"
              >
                <X size={21} />
              </button>
            </header>

            <form
              className="oficios-formulario"
              onSubmit={salvarOficio}
            >
              <section className="oficios-formulario-secao">
                <div className="oficios-secao-titulo">
                  <Car size={19} />

                  <div>
                    <strong>
                      Dados da viatura
                    </strong>

                    <span>
                      Informe a placa ou o
                      prefixo e clique em
                      buscar.
                    </span>
                  </div>
                </div>

                <div className="oficios-formulario-grade">
                  <label>
                    <span>Placa</span>

                    <input
                      type="text"
                      name="placa"
                      value={
                        formulario.placa
                      }
                      onChange={
                        atualizarCampo
                      }
                      placeholder="ABC-1234"
                      maxLength={8}
                    />
                  </label>

                  <label>
                    <span>Prefixo</span>

                    <input
                      type="text"
                      name="prefixo"
                      value={
                        formulario.prefixo
                      }
                      onChange={
                        atualizarCampo
                      }
                      placeholder="25854"
                      maxLength={6}
                      inputMode="numeric"
                    />
                  </label>

                  <div className="oficios-busca-viatura">
                    <button
                      type="button"
                      className="oficios-botao-buscar"
                      onClick={
                        localizarViatura
                      }
                      disabled={
                        buscandoViatura ||
                        processandoOficio
                      }
                    >
                      {buscandoViatura ? (
                        <LoaderCircle
                          size={18}
                          className="oficios-spinner"
                        />
                      ) : (
                        <Search
                          size={18}
                        />
                      )}

                      {buscandoViatura
                        ? "Buscando..."
                        : "Buscar viatura"}
                    </button>
                  </div>

                  <label className="oficios-campo-largo">
                    <span>
                      Marca e modelo
                    </span>

                    <input
                      type="text"
                      name="marcaModelo"
                      value={
                        formulario.marcaModelo
                      }
                      readOnly
                      placeholder="Será preenchido automaticamente"
                    />
                  </label>
                </div>
              </section>

              <section className="oficios-formulario-secao">
                <div className="oficios-secao-titulo">
                  <UserRound
                    size={19}
                  />

                  <div>
                    <strong>
                      Responsável pelo
                      comando
                    </strong>

                    <span>
                      Informe quem assinará
                      o ofício.
                    </span>
                  </div>
                </div>

                <div className="oficios-formulario-grade">
                  <label className="oficios-campo-largo">
                    <span>
                      Nome do comandante
                    </span>

                    <input
                      type="text"
                      name="nomeComandante"
                      value={
                        formulario.nomeComandante
                      }
                      onChange={
                        atualizarCampo
                      }
                      placeholder="NOME COMPLETO"
                    />
                  </label>

                  <label>
                    <span>Posto</span>

                    <input
                      type="text"
                      name="postoComandante"
                      value={
                        formulario.postoComandante
                      }
                      onChange={
                        atualizarCampo
                      }
                      placeholder="TEN CEL PM"
                    />
                  </label>

                  <label>
                    <span>Função</span>

                    <select
                      name="funcaoComandante"
                      value={
                        formulario.funcaoComandante
                      }
                      onChange={
                        atualizarCampo
                      }
                    >
                      <option value="COMANDANTE">
                        COMANDANTE
                      </option>

                      <option value="RESPONDENDO PELO COMANDO">
                        RESPONDENDO PELO
                        COMANDO
                      </option>
                    </select>
                  </label>
                </div>
              </section>

              <section className="oficios-formulario-secao">
                <div className="oficios-secao-titulo">
                  <FileText
                    size={19}
                  />

                  <div>
                    <strong>
                      Descrição
                    </strong>

                    <span>
                      Descreva o problema
                      ou a solicitação que
                      constará no
                      documento.
                    </span>
                  </div>
                </div>

                <label>
                  <span>
                    Descrição do ofício
                  </span>

                  <textarea
                    name="descricao"
                    value={
                      formulario.descricao
                    }
                    onChange={
                      atualizarCampo
                    }
                    placeholder="Descreva detalhadamente a situação da viatura..."
                    rows="7"
                  />
                </label>
              </section>

              <footer className="oficios-modal-rodape">
                <div className="oficios-numero-aviso">
                  <Hash size={17} />

                  <span>
                    {editando
                      ? "Número mantido: "
                      : "Próximo número previsto: "}

                    <strong>
                      {editando
                        ? `${oficioEmEdicao.numero}/${oficioEmEdicao.ano}`
                        : `${
                            numeroPrevisto ??
                            "..."
                          }/${anoAtual}`}
                    </strong>
                  </span>
                </div>

                <div className="oficios-modal-botoes">
                  <button
                    type="button"
                    className="oficios-botao-cancelar"
                    onClick={fecharModal}
                    disabled={
                      processandoOficio
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="oficios-botao-gerar"
                    disabled={
                      processandoOficio ||
                      buscandoViatura
                    }
                  >
                    {processandoOficio ? (
                      <LoaderCircle
                        size={18}
                        className="oficios-spinner"
                      />
                    ) : editando ? (
                      <Pencil size={18} />
                    ) : (
                      <FileText
                        size={18}
                      />
                    )}

                    {processandoOficio
                      ? editando
                        ? "Atualizando..."
                        : "Gerando..."
                      : editando
                        ? "Atualizar Ofício"
                        : "Gerar Ofício"}
                  </button>
                </div>
              </footer>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Oficios;