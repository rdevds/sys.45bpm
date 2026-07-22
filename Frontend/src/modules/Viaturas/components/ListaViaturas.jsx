import CardViatura from "./CardViatura";

function ListaViaturas({ viaturas = [] }) {
  if (!Array.isArray(viaturas) || viaturas.length === 0) {
    return (
      <section className="lista-vazia">
        <h3>Nenhuma viatura encontrada</h3>
        <p>Tente alterar os filtros ou cadastre uma nova viatura.</p>
      </section>
    );
  }

  return (
    <section className="lista-viaturas">
      {viaturas.map((viatura) => (
        <CardViatura
          key={viatura.id || viatura.prefixo}
          viatura={viatura}
        />
      ))}
    </section>
  );
}

export default ListaViaturas;