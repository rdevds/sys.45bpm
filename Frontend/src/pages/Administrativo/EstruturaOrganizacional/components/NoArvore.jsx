import {
  ChevronDown,
  ChevronRight,
  CircleDot,
} from "lucide-react";

import {
  obterIconeUnidade,
  obterTipoVisual,
  texto,
  textoMaiusculo,
} from "../utils/icones.jsx";

function NoArvore({
  unidade,
  nivel = 0,
  unidadesAbertas = new Set(),
  aoAlternar,
  aoSelecionar,
  unidadeSelecionadaId,
  pesquisaAtiva = false,
  children,
}) {
  const possuiFilhos =
    Array.isArray(unidade?.filhos) &&
    unidade.filhos.length > 0;

  const estaAberta =
    unidadesAbertas.has(
      Number(unidade?.id)
    );

  const estaSelecionada =
    Number(unidadeSelecionadaId) ===
    Number(unidade?.id);

  const tipoVisual =
    obterTipoVisual(unidade);

  const nome =
    textoMaiusculo(
      unidade?.nome ||
        unidade?.sigla ||
        "UNIDADE SEM NOME"
    );

  const codigo =
    texto(unidade?.codigo);

  const sigla =
    textoMaiusculo(
      unidade?.sigla
    );

  function selecionarUnidade() {
    if (
      typeof aoSelecionar ===
      "function"
    ) {
      aoSelecionar(unidade);
    }
  }

  function alternarFilhos(event) {
    event.stopPropagation();

    if (
      possuiFilhos &&
      typeof aoAlternar ===
        "function"
    ) {
      aoAlternar(unidade.id);
    }
  }

  return (
    <div className="estrutura-no">
      <div
        className={`estrutura-no-linha ${
          estaSelecionada
            ? "estrutura-no-linha-selecionada"
            : ""
        }`}
        style={{
          paddingLeft: `${
            nivel * 20 + 10
          }px`,
        }}
        onClick={selecionarUnidade}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault();
            selecionarUnidade();
          }
        }}
      >
        <button
          type="button"
          className="estrutura-no-expansor"
          onClick={alternarFilhos}
          disabled={!possuiFilhos}
          aria-label={
            possuiFilhos
              ? estaAberta
                ? "Recolher unidade"
                : "Expandir unidade"
              : "Unidade sem subunidades"
          }
        >
          {possuiFilhos ? (
            estaAberta ? (
              <ChevronDown
                size={17}
              />
            ) : (
              <ChevronRight
                size={17}
              />
            )
          ) : (
            <CircleDot size={8} />
          )}
        </button>

        <div
          className={`estrutura-no-icone estrutura-no-icone-${tipoVisual}`}
        >
          {obterIconeUnidade(
            unidade,
            17
          )}
        </div>

        <div className="estrutura-no-conteudo">
          <strong>{nome}</strong>

          <div className="estrutura-no-detalhes">
            {sigla &&
              sigla !== nome && (
                <span>{sigla}</span>
              )}

            {codigo && (
              <span className="estrutura-no-codigo">
                {codigo}
              </span>
            )}
          </div>
        </div>
      </div>

      {possuiFilhos &&
        (estaAberta ||
          pesquisaAtiva) && (
          <div className="estrutura-no-filhos">
            {children}
          </div>
        )}
    </div>
  );
}

export default NoArvore;