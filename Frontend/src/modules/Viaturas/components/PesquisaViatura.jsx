import { Search } from "lucide-react";

function PesquisaViatura({ termoBusca, onBuscar }) {
  return (
    <section className="pesquisa-viatura">
      <div className="pesquisa-icone">
        <Search size={18} />
      </div>

      <input
        value={termoBusca}
        onChange={(e) => onBuscar(e.target.value)}
        placeholder="Pesquisar por prefixo, placa, cidade, modelo..."
      />
    </section>
  );
}

export default PesquisaViatura;