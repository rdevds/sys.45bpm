import { useEffect, useMemo, useState } from "react";

import {
  CalendarClock,
  Calculator,
  Droplets,
  FileCheck,
  Fuel,
  Gauge,
  Route,
} from "lucide-react";

function DadosAbastecimentoCard({
  viatura,
  convenenteDoador,
  onDadosChange,
}) {
  const combustiveisConvenente =
    convenenteDoador?.combustiveis || [];

  function obterDataHoraAtual() {
    const agora = new Date();
    const diferencaFuso = agora.getTimezoneOffset() * 60000;

    return new Date(agora.getTime() - diferencaFuso)
      .toISOString()
      .slice(0, 16);
  }

  function numero(valor) {
    const texto = String(valor ?? "")
      .trim()
      .replace(/\./g, "")
      .replace(",", ".");

    const convertido = Number(texto);

    return Number.isFinite(convertido)
      ? convertido
      : 0;
  }

  function moeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarKm(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    });
  }

  function formatarDecimal(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  const combustiveisPermitidos = useMemo(() => {
    const combustivelViatura = String(
      viatura?.combustivel || ""
    )
      .trim()
      .toUpperCase();

    const combustiveis = combustiveisConvenente.map(
      (item) => String(item).trim().toUpperCase()
    );

    if (combustivelViatura === "FLEX") {
      return combustiveis.filter((item) =>
        ["GASOLINA", "ETANOL", "ÁLCOOL"].includes(item)
      );
    }

    if (combustivelViatura.includes("DIESEL")) {
      return combustiveis.filter((item) =>
        item.includes("DIESEL")
      );
    }

    if (combustivelViatura.includes("GASOLINA")) {
      return combustiveis.filter((item) =>
        item.includes("GASOLINA")
      );
    }

    if (
      combustivelViatura.includes("ETANOL") ||
      combustivelViatura.includes("ÁLCOOL")
    ) {
      return combustiveis.filter(
        (item) =>
          item.includes("ETANOL") ||
          item.includes("ÁLCOOL")
      );
    }

    return combustiveis;
  }, [viatura, combustiveisConvenente]);

  const [dados, setDados] = useState({
    combustivel: "",
    dataHora: obterDataHoraAtual(),
    odometro: "",
    litros: "",
    valorUnitario: "",
  });

  useEffect(() => {
    setDados((atual) => {
      if (combustiveisPermitidos.length === 1) {
        return {
          ...atual,
          combustivel: combustiveisPermitidos[0],
        };
      }

      if (
        atual.combustivel &&
        !combustiveisPermitidos.includes(
          atual.combustivel
        )
      ) {
        return {
          ...atual,
          combustivel: "",
        };
      }

      return atual;
    });
  }, [combustiveisPermitidos]);

  const odometroAnterior = numero(viatura?.odometro);
  const odometroMinimo = odometroAnterior + 20;
  const odometroAtual = numero(dados.odometro);
  const litros = numero(dados.litros);
  const valorUnitario = numero(
    dados.valorUnitario
  );

  const odometroInvalido =
    odometroAtual > 0 &&
    odometroAtual < odometroMinimo;

  const kmRodados =
    odometroAtual >= odometroMinimo
      ? odometroAtual - odometroAnterior
      : 0;

  const valorTotal =
    litros > 0 && valorUnitario > 0
      ? litros * valorUnitario
      : 0;

  const mediaKmLitro =
    kmRodados > 0 && litros > 0
      ? kmRodados / litros
      : 0;

  const custoPorKm =
    kmRodados > 0 && valorTotal > 0
      ? valorTotal / kmRodados
      : 0;

  function classePreenchido(valor) {
    return valor ? "preenchido" : "";
  }

  function atualizarCampo(campo, valor) {
    let novoValor = valor;

    if (campo === "odometro") {
      novoValor = String(valor).replace(/\D/g, "");
    }

    if (
      campo === "litros" ||
      campo === "valorUnitario"
    ) {
      novoValor = String(valor)
        .replace(/[^0-9,.]/g, "")
        .replace(/\.(?=.*\.)/g, "")
        .replace(/,(?=.*,)/g, "");
    }

    if (campo === "combustivel") {
      novoValor = String(valor).toUpperCase();
    }

    setDados((atual) => ({
      ...atual,
      [campo]: novoValor,
    }));
  }

  useEffect(() => {
    onDadosChange?.({
      ...dados,

      odometro: odometroAtual,
      litros,
      valorUnitario,

      odometroAnterior,
      odometroMinimo,
      odometroAtual,
      kmRodados,

      valorTotalCalculado: valorTotal,
      mediaKmLitro,
      custoPorKm,

      odometroInvalido,
    });
  }, [
    dados,
    odometroAnterior,
    odometroMinimo,
    odometroAtual,
    litros,
    valorUnitario,
    kmRodados,
    valorTotal,
    mediaKmLitro,
    custoPorKm,
    odometroInvalido,
    onDadosChange,
  ]);

  return (
    <section className="form-card dados-abastecimento-card">
      <div className="dados-card-titulo">
        <div className="dados-icone">
          <Fuel size={22} />
        </div>

        <div>
          <h2>Dados do abastecimento</h2>

          <p>
            Informe os dados principais do lançamento.
          </p>
        </div>
      </div>

      <div className="tipo-abastecimento-box">
        <FileCheck size={20} />

        <div>
          <strong>
            {convenenteDoador?.tipo === "CONVÊNIO"
              ? "CONVÊNIO"
              : "DOAÇÃO"}
          </strong>

          <span>
            Tipo definido automaticamente pelo
            convenente ou doador.
          </span>
        </div>
      </div>

      <div className="dados-grid duas-colunas">
        <label className="campo campo-compacto">
          <span>
            <Fuel size={15} />
            Combustível *
          </span>

          {combustiveisPermitidos.length > 1 ? (
            <select
              className={classePreenchido(
                dados.combustivel
              )}
              value={dados.combustivel}
              onChange={(event) =>
                atualizarCampo(
                  "combustivel",
                  event.target.value
                )
              }
            >
              <option value="">Selecione</option>

              {combustiveisPermitidos.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          ) : (
            <input
              className={classePreenchido(
                dados.combustivel
              )}
              value={dados.combustivel}
              placeholder="Nenhum combustível disponível"
              disabled
              readOnly
            />
          )}
        </label>

        <label className="campo campo-compacto">
          <span>
            <CalendarClock size={15} />
            Data e hora *
          </span>

          <input
            className={classePreenchido(
              dados.dataHora
            )}
            type="datetime-local"
            value={dados.dataHora}
            onChange={(event) =>
              atualizarCampo(
                "dataHora",
                event.target.value
              )
            }
          />
        </label>
      </div>

      <label className="campo campo-compacto">
        <span>
          <Gauge size={15} />
          Odômetro do abastecimento *
        </span>

        <input
          className={classePreenchido(
            dados.odometro
          )}
          type="text"
          inputMode="numeric"
          value={dados.odometro}
          onChange={(event) =>
            atualizarCampo(
              "odometro",
              event.target.value
            )
          }
          placeholder={`Mínimo ${formatarKm(
            odometroMinimo
          )} km`}
        />

        <div className="ultimo-odometro">
          Último abastecimento:{" "}
          <strong>
            {formatarKm(odometroAnterior)} km
          </strong>
        </div>

        {odometroInvalido && (
          <div className="erro-odometro">
            O odômetro deve ser no mínimo{" "}
            <strong>
              {formatarKm(odometroMinimo)} km
            </strong>
            .
          </div>
        )}
      </label>

      <div className="dados-grid duas-colunas">
        <label className="campo campo-compacto">
          <span>
            <Droplets size={15} />
            Quantidade de litros *
          </span>

          <input
            className={classePreenchido(
              dados.litros
            )}
            type="text"
            inputMode="decimal"
            value={dados.litros}
            onChange={(event) =>
              atualizarCampo(
                "litros",
                event.target.value
              )
            }
            placeholder="Ex: 42,5"
          />
        </label>

        <label className="campo campo-compacto">
          <span>R$ Valor unitário *</span>

          <input
            className={classePreenchido(
              dados.valorUnitario
            )}
            type="text"
            inputMode="decimal"
            value={dados.valorUnitario}
            onChange={(event) =>
              atualizarCampo(
                "valorUnitario",
                event.target.value
              )
            }
            placeholder="Ex: 6,25"
          />
        </label>
      </div>

      {kmRodados > 0 && litros > 0 && (
        <div className="resumo-desempenho">
          <div className="resumo-desempenho-item">
            <span className="resumo-desempenho-icone">
              <Route size={20} />
            </span>

            <div>
              <span className="resumo-desempenho-label">
                KM RODADOS
              </span>

              <strong>
                {formatarKm(kmRodados)} km
              </strong>
            </div>
          </div>

          <div className="resumo-desempenho-item">
            <span className="resumo-desempenho-icone">
              <Droplets size={20} />
            </span>

            <div>
              <span className="resumo-desempenho-label">
                MÉDIA
              </span>

              <strong>
                {formatarDecimal(mediaKmLitro)} km/L
              </strong>
            </div>
          </div>

          <div className="resumo-desempenho-item">
            <span className="resumo-desempenho-icone">
              <Calculator size={20} />
            </span>

            <div>
              <span className="resumo-desempenho-label">
                CUSTO POR KM
              </span>

              <strong>
                {moeda(custoPorKm)}
              </strong>
            </div>
          </div>
        </div>
      )}

      {valorTotal > 0 && (
        <div className="valor-total-card">
          <div className="valor-total-icone">
            <Calculator size={26} />
          </div>

          <div>
            <span>
              TOTAL DO ABASTECIMENTO
            </span>

            <strong>
              {moeda(valorTotal)}
            </strong>
          </div>

          <div className="valor-total-info">
            <span>CÁLCULO AUTOMÁTICO</span>

            <small>
              Litros × Valor unitário
            </small>
          </div>
        </div>
      )}
    </section>
  );
}

export default DadosAbastecimentoCard;