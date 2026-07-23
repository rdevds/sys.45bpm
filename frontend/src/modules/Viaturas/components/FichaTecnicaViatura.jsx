<section className="dados-tecnicos-automaticos">
  <header className="dados-tecnicos-header">
    <ShieldCheck size={18} />
    <span>Dados técnicos automáticos</span>
  </header>

  <div className="dados-tecnicos-grid">

    <div className="dado">
      <span>Combustível</span>
      <strong>{viatura.combustivel || "-"}</strong>
    </div>

    <div className="dado">
      <span>Tipo</span>
      <strong>{viatura.tipo || "-"}</strong>
    </div>

    <div className="dado">
      <span>Pneus</span>
      <strong>{viatura.pneus || "-"}</strong>
    </div>

    <div className="dado">
      <span>Óleo do Motor</span>
      <strong>{viatura.oleoMotor || "-"}</strong>
    </div>

    <div className="dado">
      <span>Cárter</span>
      <strong>
        {viatura.capacidadeCarter
          ? `${viatura.capacidadeCarter} L`
          : "-"}
      </strong>
    </div>

    <div className="dado">
      <span>Tanque</span>
      <strong>
        {viatura.capacidadeTanque
          ? `${viatura.capacidadeTanque} L`
          : "-"}
      </strong>
    </div>

    <div className="dado">
      <span>Troca de Óleo</span>
      <strong>
        {viatura.trocaOleo
          ? `${Number(viatura.trocaOleo).toLocaleString("pt-BR")} km`
          : "-"}
      </strong>
    </div>

    <div className="dado">
      <span>Correia Dentada</span>
      <strong>
        {viatura.trocaCorreia
          ? `${Number(viatura.trocaCorreia).toLocaleString("pt-BR")} km`
          : "-"
        }
      </strong>
    </div>

    <div className="dado">
      <span>Filtro de Ar</span>
      <strong>
        {viatura.trocaFiltroAr
          ? `${Number(viatura.trocaFiltroAr).toLocaleString("pt-BR")} km`
          : "-"
        }
      </strong>
    </div>

    <div className="dado">
      <span>Filtro Combustível</span>
      <strong>
        {viatura.trocaFiltroCombustivel
          ? `${Number(viatura.trocaFiltroCombustivel).toLocaleString("pt-BR")} km`
          : "-"
        }
      </strong>
    </div>

    <div className="dado">
      <span>Fluido de Freio</span>
      <strong>
        {viatura.trocaFluidoFreio
          ? `${Number(viatura.trocaFluidoFreio).toLocaleString("pt-BR")} km`
          : "-"
        }
      </strong>
    </div>

    <div className="dado">
      <span>Arrefecimento</span>
      <strong>
        {viatura.capacidadeArrefecimento
          ? `${viatura.capacidadeArrefecimento} L`
          : "-"
        }
      </strong>
    </div>

  </div>
</section>