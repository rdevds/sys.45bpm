import { Network } from "lucide-react";

import NoArvore from "./NoArvore.jsx";

function ArvoreOrganizacional({
  arvore = [],
  unidadesAbertas,
  aoAlternar,
  aoSelecionar,
  unidadeSelecionadaId,
  pesquisaAtiva = false,
}) {
  function renderizarNos(
    unidades,
    nivel = 0
  ) {
    return unidades.map((unidade) => (
      <NoArvore
        key={unidade.id}
        unidade={unidade}
        nivel={nivel}
        unidadesAbertas={
          unidadesAbertas
        }
        aoAlternar={aoAlternar}
        aoSelecionar={aoSelecionar}
        unidadeSelecionadaId={
          unidadeSelecionadaId
        }
        pesquisaAtiva={
          pesquisaAtiva
        }
      >
        {Array.isArray(
          unidade.filhos
        ) &&
          unidade.filhos.length > 0 &&
          renderizarNos(
            unidade.filhos,
            nivel + 1
          )}
      </NoArvore>
    ));
  }

  return (
    <aside className="estrutura-explorer-arvore">
      <header className="estrutura-explorer-titulo">
        <div>
          <span>HIERARQUIA</span>

          <strong>
            45º BPM
          </strong>
        </div>

        <Network size={20} />
      </header>

      <div className="estrutura-arvore">
        {renderizarNos(arvore)}
      </div>
    </aside>
  );
}

export default ArvoreOrganizacional;