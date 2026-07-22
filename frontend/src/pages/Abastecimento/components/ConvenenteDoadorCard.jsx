import { useState } from "react";
import { Building2, Pencil } from "lucide-react";
import Button from "../../../components/ui/Button.jsx";
import { convenentesDoadores } from "../../../database/convenentes/convenentes.js";

function ConvenenteDoadorCard({ onConvenenteChange }) {
  const [convenente, setConvenente] = useState(null);

  function selecionarConvenente(nome) {
    const encontrado = convenentesDoadores.find((item) => item.nome === nome);

    setConvenente(encontrado || null);
    onConvenenteChange?.(encontrado || null);
  }

  function alterarConvenente() {
    setConvenente(null);
    onConvenenteChange?.(null);
  }

  return (
    <section className="form-card motorista-card">
      <h2>Convenente/Doador</h2>

      {!convenente && (
        <label className="campo campo-compacto">
          Informe o convenente ou doador *
          <select
            value=""
            onChange={(e) => selecionarConvenente(e.target.value)}
          >
            <option value="">Selecione</option>

            {convenentesDoadores.map((item) => (
              <option key={item.nome} value={item.nome}>
                {item.nome}
              </option>
            ))}
          </select>
        </label>
      )}

      {convenente && (
        <div className="motorista-info">
          <div>
            <strong>
              <Building2 size={16} /> {convenente.nome}
            </strong>
            <span>Tipo: {convenente.tipo}</span>
            <span>Combustíveis: {convenente.combustiveis.join(", ")}</span>
          </div>

          <Button variant="primary" onClick={alterarConvenente}>
            <Pencil size={16} />
            Alterar
          </Button>
        </div>
      )}
    </section>
  );
}

export default ConvenenteDoadorCard;