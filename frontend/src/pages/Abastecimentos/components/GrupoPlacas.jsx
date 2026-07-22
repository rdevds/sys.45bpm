function GrupoPlacas({
  grupos = [],
  onSelecionarPlaca,
}) {
  if (grupos.length === 0) {
    return null;
  }

  return (
    <section className="grupos-placas">
      {grupos.map((grupo) => (
        <button
          key={grupo.placa}
          type="button"
          className="grupo-placa-card"
          onClick={() => onSelecionarPlaca(grupo.placa)}
        >
          <div className="grupo-placa-topo">
            <strong>{grupo.placa}</strong>
          </div>

          <span>Prefixo: {grupo.prefixo}</span>

          <small>
            {grupo.total}{" "}
            {grupo.total === 1
              ? "abastecimento"
              : "abastecimentos"}
          </small>
        </button>
      ))}
    </section>
  );
}

export default GrupoPlacas;