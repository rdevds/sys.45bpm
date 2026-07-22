import {
  Network,
  X,
} from "lucide-react";

import {
  obterIconeUnidade,
  obterTipoVisual,
  texto,
  textoMaiusculo,
} from "../utils/icones.jsx";

function PainelDetalhes({
  unidadeSelecionada,
  unidadePaiSelecionada,
  quantidadeSubunidades = 0,
  aoFechar,
  aoEditar,
  aoNovaSubunidade,
  aoMover,
  aoAlternarSituacao,
}) {
  if (!unidadeSelecionada) {
    return (
      <section className="estrutura-explorer-detalhes">
        <div className="estrutura-detalhes-vazio">
          <Network size={44} />

          <strong>
            Selecione uma unidade
          </strong>

          <span>
            Clique em um item da árvore para
            visualizar seus dados.
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className="estrutura-explorer-detalhes">
      <header className="estrutura-detalhes-cabecalho">
        <div className="estrutura-detalhes-identidade">
          <div
            className={`estrutura-detalhes-icone estrutura-no-icone-${obterTipoVisual(
              unidadeSelecionada
            )}`}
          >
            {obterIconeUnidade(
              unidadeSelecionada,
              24
            )}
          </div>

          <div>
            <span>
              UNIDADE SELECIONADA
            </span>

            <h2>
              {textoMaiusculo(
                unidadeSelecionada.nome ||
                  unidadeSelecionada.sigla ||
                  "UNIDADE SEM NOME"
              )}
            </h2>

            <p>
              {textoMaiusculo(
                unidadeSelecionada.sigla
              ) || "SEM SIGLA"}

              {unidadeSelecionada.codigo
                ? ` • CÓDIGO ${unidadeSelecionada.codigo}`
                : ""}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="estrutura-detalhes-fechar"
          onClick={aoFechar}
          aria-label="Fechar detalhes"
        >
          <X size={19} />
        </button>
      </header>

      <div className="estrutura-detalhes-resumo">
        <article>
          <span>SUBUNIDADES</span>

          <strong>
            {quantidadeSubunidades}
          </strong>
        </article>

        <article>
          <span>BALIZA</span>

          <strong>
            {unidadeSelecionada.exibe_baliza
              ? "SIM"
              : "NÃO"}
          </strong>
        </article>

        <article>
          <span>SITUAÇÃO</span>

          <strong>
            {unidadeSelecionada.ativa !== false
              ? "ATIVA"
              : "INATIVA"}
          </strong>
        </article>
      </div>

      <div className="estrutura-detalhes-grade">
        <div>
          <span>Código</span>

          <strong>
            {texto(
              unidadeSelecionada.codigo
            ) || "NÃO INFORMADO"}
          </strong>
        </div>

        <div>
          <span>Sigla</span>

          <strong>
            {textoMaiusculo(
              unidadeSelecionada.sigla
            ) || "NÃO INFORMADA"}
          </strong>
        </div>

        <div>
          <span>Tipo</span>

          <strong>
            {textoMaiusculo(
              unidadeSelecionada.tipo
            ) || "NÃO INFORMADO"}
          </strong>
        </div>

        <div>
          <span>Cidade</span>

          <strong>
            {textoMaiusculo(
              unidadeSelecionada.cidade
            ) || "NÃO INFORMADA"}
          </strong>
        </div>

        <div className="estrutura-detalhes-campo-largo">
          <span>Unidade superior</span>

          <strong>
            {unidadePaiSelecionada
              ? textoMaiusculo(
                  unidadePaiSelecionada.nome ||
                    unidadePaiSelecionada.sigla
                )
              : "UNIDADE RAIZ"}
          </strong>
        </div>

        <div>
          <span>Ordem de exibição</span>

          <strong>
            {unidadeSelecionada.ordem_exibicao ??
              "NÃO INFORMADA"}
          </strong>
        </div>

        <div>
          <span>Nível</span>

          <strong>
            {unidadeSelecionada.nivel ??
              "NÃO INFORMADO"}
          </strong>
        </div>

        <div className="estrutura-detalhes-campo-largo">
          <span>Caminho organizacional</span>

          <strong>
            {textoMaiusculo(
              unidadeSelecionada.caminho_nome
            ) || "NÃO INFORMADO"}
          </strong>
        </div>
      </div>

      <div className="estrutura-detalhes-acoes">
        <button
          type="button"
          className="estrutura-acao estrutura-acao-principal"
          onClick={aoEditar}
        >
          Editar unidade
        </button>

        <button
          type="button"
          className="estrutura-acao"
          onClick={aoNovaSubunidade}
        >
          Nova subunidade
        </button>

        <button
          type="button"
          className="estrutura-acao"
          onClick={aoMover}
        >
          Mover unidade
        </button>

        <button
          type="button"
          className="estrutura-acao estrutura-acao-perigo"
          onClick={aoAlternarSituacao}
        >
          {unidadeSelecionada.ativa !== false
            ? "Desativar"
            : "Ativar"}
        </button>
      </div>

      
    </section>
  );
}

export default PainelDetalhes;