function BateriaViatura({ bateria }) {
  if (!bateria) {
    return (
      <section className="bateria-card bateria-vazia">
        <h3>🔋 Bateria</h3>
        <p>Nenhuma bateria cadastrada.</p>
      </section>
    );
  }

  const hoje = new Date();
  const validade = new Date(bateria.validadeGarantia);

  const diasRestantes = Math.ceil(
    (validade - hoje) / (1000 * 60 * 60 * 24)
  );

  let status = "🟢 Garantia vigente";

  if (diasRestantes <= 15 && diasRestantes >= 0) {
    status = `🟡 Garantia vence em ${diasRestantes} dias`;
  }

  if (diasRestantes < 0) {
    status = "🔴 Garantia da bateria vencida";
  }

  return (
    <section className="bateria-card">
      <h3>🔋 Bateria</h3>

      <p><strong>Marca:</strong> {bateria.marca}</p>
      <p><strong>Modelo:</strong> {bateria.modelo}</p>
      <p><strong>Instalação:</strong> {bateria.dataInstalacao}</p>
      <p><strong>Garantia até:</strong> {bateria.validadeGarantia}</p>
      <p><strong>Status:</strong> {status}</p>

      <div className="bateria-fotos">
        {bateria.fotoBateria && (
          <img src={bateria.fotoBateria} alt="Foto da bateria" />
        )}

        {bateria.fotoGarantia && (
          <img src={bateria.fotoGarantia} alt="Foto da garantia" />
        )}
      </div>
    </section>
  );
}

export default BateriaViatura;