function TipoAbastecimentoCard({ convenenteDoador }) {
  if (!convenenteDoador) return null;

  return (
    <section className="form-card motorista-card">
      <h2>Tipo</h2>

      <div className="motorista-info">
        <div>
          <strong>
            {convenenteDoador.tipo === "CONVÊNIO" ? "📄 CONVÊNIO" : "🎁 DOAÇÃO"}
          </strong>

          <span>
            Tipo definido automaticamente conforme o convenente/doador.
          </span>
        </div>
      </div>
    </section>
  );
}

export default TipoAbastecimentoCard;