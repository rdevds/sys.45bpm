function AlertasViatura({ viatura }) {
  const odometro = Number(viatura?.odometro || 0);
  const trocaOleoKm = Number(viatura?.frequenciaTrocaDeOleo || 10000);
  const ultimoOleoKm = Number(viatura?.ultimoOleoKm || 0);

  const proximaTrocaOleo = ultimoOleoKm + trocaOleoKm;
  const kmRestantesOleo = proximaTrocaOleo - odometro;

  let statusOleo = "EM DIA";

  if (kmRestantesOleo <= 1000 && kmRestantesOleo > 0) {
    statusOleo = "ATENÇÃO";
  }

  if (kmRestantesOleo <= 0) {
    statusOleo = "VENCIDO";
  }

  return (
    <section className="alertas-viatura">
      <h3>Alertas da Viatura</h3>

      <div className={`alerta-item ${statusOleo.toLowerCase()}`}>
        <div>
          <strong>Óleo do motor</strong>
          <span>
            Próxima troca: {proximaTrocaOleo.toLocaleString("pt-BR")} km
          </span>
        </div>

        <b>{statusOleo}</b>
      </div>
    </section>
  );
}

export default AlertasViatura;