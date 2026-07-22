import {
  RefreshCw,
  Search,
} from "lucide-react";

function BarraFerramentas({
  pesquisa = "",
  setPesquisa,
  expandirTudo,
  recolherTudo,
  carregarEstrutura,
  carregando = false,
}) {
  return (
    <section className="estrutura-ferramentas">
      <label className="estrutura-pesquisa">
        <Search size={18} />

        <input
          type="search"
          value={pesquisa}
          onChange={(event) =>
            setPesquisa(event.target.value)
          }
          placeholder="Pesquisar unidade, sigla, código ou cidade..."
        />
      </label>

      <div className="estrutura-acoes-arvore">
        <button
          type="button"
          onClick={expandirTudo}
        >
          Expandir
        </button>

        <button
          type="button"
          onClick={recolherTudo}
        >
          Recolher
        </button>

        <button
          type="button"
          className="estrutura-botao-atualizar"
          onClick={carregarEstrutura}
          disabled={carregando}
        >
          <RefreshCw
            size={18}
            className={
              carregando
                ? "estrutura-girando"
                : ""
            }
          />

          Atualizar
        </button>
      </div>
    </section>
  );
}

export default BarraFerramentas;