import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  LoaderCircle,
  Upload,
  XCircle,
} from "lucide-react";

import Button from "../../components/ui/Button.jsx";

import {
  lerArquivoAbastecimentos,
  cruzarRegistrosComViaturas,
  cruzarRegistrosComMilitares,
  importarAbastecimentos,
} from "../../services/abastecimentosImportadosService.js";

import "./OdometrosAtualizados.css";

function OdometrosAtualizados() {
  const [arquivo, setArquivo] = useState(null);
  const [fonte, setFonte] = useState("");
  const [nomeAba, setNomeAba] = useState("");

  const [registrosValidos, setRegistrosValidos] =
    useState([]);

  const [
    registrosNaoLocalizados,
    setRegistrosNaoLocalizados,
  ] = useState([]);

  const [lendo, setLendo] = useState(false);
  const [importando, setImportando] =
    useState(false);

  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const resumo = useMemo(() => {
    const coerentes = registrosValidos.filter(
      (registro) =>
        registro.situacao_previa === "COERENTE"
    ).length;

    const divergentes = registrosValidos.filter(
      (registro) =>
        registro.situacao_previa !== "COERENTE"
    ).length;

    return {
      total:
        registrosValidos.length +
        registrosNaoLocalizados.length,

      localizados: registrosValidos.length,
      naoLocalizados:
        registrosNaoLocalizados.length,

      coerentes,
      divergentes,
    };
  }, [
    registrosValidos,
    registrosNaoLocalizados,
  ]);

  async function selecionarArquivo(event) {
    const arquivoSelecionado =
      event.target.files?.[0];

    setErro("");
    setMensagem("");
    setArquivo(null);
    setFonte("");
    setNomeAba("");
    setRegistrosValidos([]);
    setRegistrosNaoLocalizados([]);

    if (!arquivoSelecionado) {
      return;
    }

    try {
      setLendo(true);

      const resultado =
        await lerArquivoAbastecimentos(
          arquivoSelecionado
        );

      const cruzamento =
        await cruzarRegistrosComViaturas(
          resultado.registros
        );

      let registrosValidosFinais =
        cruzamento.registrosValidos;

      let registrosComProblema = [
        ...cruzamento.registrosNaoLocalizados,
      ];

      /*
       * O relatório POC identifica o condutor pelo CPF.
       * Por isso, somente os registros POC precisam ser
       * cruzados com a tabela militares nesta etapa.
       *
       * O PRIME continua com os registros localizados
       * pela placa, sem ser bloqueado pela ausência de CPF.
       */
      if (resultado.fonte === "POC") {
        const resultadoMilitares =
          await cruzarRegistrosComMilitares(
            cruzamento.registrosValidos
          );

        registrosValidosFinais =
          resultadoMilitares.registrosLocalizados;

        registrosComProblema = [
          ...registrosComProblema,
          ...resultadoMilitares.registrosNaoLocalizados,
        ];
      }

      setArquivo(arquivoSelecionado);
      setFonte(resultado.fonte);
      setNomeAba(resultado.aba);

      setRegistrosValidos(
        registrosValidosFinais
      );

      setRegistrosNaoLocalizados(
        registrosComProblema
      );
    } catch (error) {
      console.error(
        "Erro ao processar arquivo:",
        error
      );

      setErro(
        error?.message ||
          "Não foi possível processar o arquivo."
      );
    } finally {
      setLendo(false);
      event.target.value = "";
    }
  }

  async function confirmarImportacao() {
    if (!registrosValidos.length) {
      setErro(
        "Não existem registros de viaturas cadastradas para importar."
      );
      return;
    }

    try {
      setImportando(true);
      setErro("");
      setMensagem("");

      const registrosParaImportar =
        registrosValidos.map(
          ({
            situacao_previa,
            ...registro
          }) => registro
        );

      const dadosImportados =
        await importarAbastecimentos(
          registrosParaImportar
        );

      setMensagem(
        `${dadosImportados.length} abastecimento(s) importado(s) com sucesso.`
      );

      setRegistrosValidos([]);
      setRegistrosNaoLocalizados([]);
      setArquivo(null);
      setFonte("");
      setNomeAba("");
    } catch (error) {
      console.error(
        "Erro ao importar registros:",
        error
      );

      setErro(
        error?.message ||
          "Não foi possível concluir a importação."
      );
    } finally {
      setImportando(false);
    }
  }

  function limparImportacao() {
    setArquivo(null);
    setFonte("");
    setNomeAba("");
    setRegistrosValidos([]);
    setRegistrosNaoLocalizados([]);
    setErro("");
    setMensagem("");
  }

  function formatarData(data) {
    if (!data) {
      return "—";
    }

    const [ano, mes, dia] =
      String(data).split("-");

    if (!ano || !mes || !dia) {
      return data;
    }

    return `${dia}/${mes}/${ano}`;
  }

  function formatarNumero(valor, casas = 0) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
      return "—";
    }

    return numero.toLocaleString("pt-BR", {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    });
  }

  function formatarMoeda(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
      return "—";
    }

    return numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function obterClasseSituacao(situacao) {
    if (situacao === "COERENTE") {
      return "situacao situacao-sucesso";
    }

    return "situacao situacao-aviso";
  }

  function obterTextoSituacao(situacao) {
    const textos = {
      COERENTE: "COERENTE",
      MENOR_QUE_ATUAL: "KM MENOR",
      AUMENTO_ELEVADO: "AUMENTO ELEVADO",
      NAO_INFORMADO: "SEM KM",
    };

    return textos[situacao] || situacao;
  }

  return (
    <main className="odometros-pagina">
      <header className="odometros-cabecalho">
        <div>
          <h1>Odômetros atualizados</h1>

          <p>
            Importe os abastecimentos e confira as
            placas e os odômetros.
          </p>
        </div>
      </header>

      <section className="odometros-upload">
        <div className="upload-icone">
          <FileSpreadsheet size={28} />
        </div>

        <div className="upload-conteudo">
          <strong>Importar arquivo</strong>

          <span>
            Formatos permitidos: XLS e XLSX
          </span>
        </div>

        <label className="upload-botao">
          <Upload size={18} />

          {lendo
            ? "Processando..."
            : "Selecionar arquivo"}

          <input
            type="file"
            accept=".xls,.xlsx"
            disabled={lendo || importando}
            onChange={selecionarArquivo}
          />
        </label>
      </section>

      {lendo && (
        <div className="odometros-processando">
          <LoaderCircle
            className="icone-girando"
            size={20}
          />

          Lendo e cruzando placas e condutores...
        </div>
      )}

      {erro && (
        <div className="odometros-mensagem odometros-erro">
          <XCircle size={20} />
          {erro}
        </div>
      )}

      {mensagem && (
        <div className="odometros-mensagem odometros-sucesso">
          <CheckCircle2 size={20} />
          {mensagem}
        </div>
      )}

      {arquivo && (
        <>
          <section className="arquivo-resumo">
            <div>
              <strong>{arquivo.name}</strong>

              <span>
                Fonte: {fonte} | Aba: {nomeAba}
              </span>
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={limparImportacao}
              disabled={importando}
            >
              Limpar
            </Button>
          </section>

          <section className="indicadores-importacao">
            <article>
              <span>Total de linhas</span>
              <strong>{resumo.total}</strong>
            </article>

            <article>
              <span>Placas localizadas</span>
              <strong>{resumo.localizados}</strong>
            </article>

            <article>
              <span>Odômetros coerentes</span>
              <strong>{resumo.coerentes}</strong>
            </article>

            <article>
              <span>Divergências</span>
              <strong>{resumo.divergentes}</strong>
            </article>

            <article>
              <span>Fora do cadastro</span>
              <strong>
                {resumo.naoLocalizados}
              </strong>
            </article>
          </section>

          <section className="tabela-importacao-card">
            <div className="tabela-importacao-titulo">
              <div>
                <h2>Registros do 45º BPM</h2>

                <p>
                  Somente estas placas serão
                  importadas.
                </p>
              </div>
            </div>

            <div className="tabela-importacao-scroll">
              <table className="tabela-importacao">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Placa</th>
                    <th>Prefixo</th>
                    <th>Cidade</th>
                    <th>Condutor</th>
                    <th>CPF</th>
                    <th>Combustível</th>
                    <th>Litros</th>
                    <th>Valor</th>
                    <th>KM atual</th>
                    <th>KM importado</th>
                    <th>Diferença</th>
                    <th>Situação</th>
                  </tr>
                </thead>

                <tbody>
                  {registrosValidos.map(
                    (registro, indice) => (
                      <tr
                        key={
                          registro.chave_importacao ||
                          indice
                        }
                      >
                        <td>
                          {formatarData(
                            registro.data_abastecimento
                          )}
                        </td>

                        <td>
                          {registro.placa_cadastrada ||
                            registro.placa_original}
                        </td>

                        <td>
                          {registro.prefixo_viatura ||
                            "—"}
                        </td>

                        <td>
                          {registro.cidade_viatura ||
                            "—"}
                        </td>

                        <td>
                          {registro.nome_condutor ||
                            "—"}
                        </td>

                        <td>
                          {registro.cpf_condutor ||
                            "—"}
                        </td>

                        <td>
                          {registro.combustivel ||
                            "—"}
                        </td>

                        <td>
                          {formatarNumero(
                            registro.quantidade_litros,
                            3
                          )}
                        </td>

                        <td>
                          {formatarMoeda(
                            registro.valor_total
                          )}
                        </td>

                        <td>
                          {formatarNumero(
                            registro.odometro_atual_viatura
                          )}
                        </td>

                        <td>
                          {formatarNumero(
                            registro.odometro_importado
                          )}
                        </td>

                        <td>
                          {registro.diferenca_odometro >
                          0
                            ? "+"
                            : ""}

                          {formatarNumero(
                            registro.diferenca_odometro
                          )}
                        </td>

                        <td>
                          <span
                            className={obterClasseSituacao(
                              registro.situacao_previa
                            )}
                          >
                            {obterTextoSituacao(
                              registro.situacao_previa
                            )}
                          </span>
                        </td>
                      </tr>
                    )
                  )}

                  {!registrosValidos.length && (
                    <tr>
                      <td
                        colSpan="13"
                        className="tabela-vazia"
                      >
                        Nenhuma placa cadastrada foi
                        localizada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {registrosNaoLocalizados.length >
            0 && (
            <section className="placas-nao-localizadas">
              <div className="placas-nao-localizadas-titulo">
                <AlertTriangle size={20} />

                <div>
                  <strong>
                    Registros com pendência
                  </strong>

                  <span>
                    Placas ou condutores não localizados
                    não serão importados.
                  </span>
                </div>
              </div>

              <div className="placas-lista">
                {registrosNaoLocalizados.map(
                  (registro, indice) => (
                    <span
                      key={
                        registro.chave_importacao ||
                        indice
                      }
                    >
                      {registro.placa_original ||
                        "SEM PLACA"}
                      {" — "}
                      {registro.situacao_condutor ===
                      "CONDUTOR_NAO_LOCALIZADO"
                        ? `CPF ${
                            registro.cpf_condutor ||
                            "NÃO INFORMADO"
                          } NÃO LOCALIZADO`
                        : "VIATURA NÃO LOCALIZADA"}
                    </span>
                  )
                )}
              </div>
            </section>
          )}

          <footer className="acoes-importacao">
            <Button
              type="button"
              variant="secondary"
              onClick={limparImportacao}
              disabled={importando}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={confirmarImportacao}
              disabled={
                importando ||
                registrosValidos.length === 0
              }
            >
              {importando
                ? "Importando..."
                : `Importar ${registrosValidos.length} registro(s)`}
            </Button>
          </footer>
        </>
      )}
    </main>
  );
}

export default OdometrosAtualizados;