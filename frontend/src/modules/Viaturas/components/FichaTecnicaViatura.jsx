function FichaTecnicaViatura({ viatura }) {
  if (!viatura) return null;

  return (
    <section className="ficha-tecnica-card">
      <header className="ficha-tecnica-header">
        <div>
          <h3>Ficha Técnica</h3>
          <p>Dados principais da viatura.</p>
        </div>
      </header>

      <div className="ficha-tecnica-grid">
        <div>
          <span>Prefixo</span>
          <strong>{viatura.prefixo}</strong>
        </div>

        <div>
          <span>Placa</span>
          <strong>{viatura.placa}</strong>
        </div>

        <div>
          <span>Marca / Modelo</span>
          <strong>
            {viatura.marca} {viatura.modelo}
          </strong>
        </div>

        <div>
          <span>Ano</span>
          <strong>{viatura.ano}</strong>
        </div>

        <div>
          <span>Combustível</span>
          <strong>{viatura.combustivel}</strong>
        </div>

        <div>
          <span>Capacidade do tanque</span>
          <strong>{viatura.capacidadeTanque}</strong>
        </div>

        <div>
          <span>Capacidade do cárter</span>
          <strong>{viatura.capacidadeCarter}</strong>
        </div>

        <div>
          <span>Troca de óleo</span>
          <strong>{viatura.frequenciaTrocaDeOleo} km</strong>
        </div>

        <div>
          <span>Chassi</span>
          <strong>{viatura.chassi}</strong>
        </div>

        <div>
          <span>RENAVAM</span>
          <strong>{viatura.renavam}</strong>
        </div>

        <div>
          <span>Patrimônio</span>
          <strong>{viatura.patrimonio}</strong>
        </div>

        <div>
          <span>Valor venal</span>
          <strong>
            R$ {Number(viatura.valorVenal || 0).toLocaleString("pt-BR")}
          </strong>
        </div>
      </div>
    </section>
  );
}

export default FichaTecnicaViatura;