import { useState } from "react";
import { Pencil, MapPin } from "lucide-react";
import Button from "../../../components/ui/Button.jsx";

const cidades = [
  "BRASILÂNDIA DE MINAS - MG",
  "CANABRAVA - MG",
  "GUARDA-MOR - MG",
  "JOÃO PINHEIRO - MG",
  "LUIZLÂNDIA DO OESTE - MG",
  "PARACATU - MG",
  "VAZANTE - MG",
];

function CidadeAbastecimentoCard({ onCidadeChange }) {
  const [cidade, setCidade] = useState("");

  function selecionarCidade(valor) {
    setCidade(valor);
    onCidadeChange?.(valor);
  }

  function alterarCidade() {
    setCidade("");
    onCidadeChange?.("");
  }

  return (
    <section className="form-card motorista-card">
      <h2>Cidade de abastecimento</h2>

      {!cidade && (
        <label className="campo campo-compacto">
          Onde a viatura foi abastecida? *
          <select
            value={cidade}
            onChange={(e) => selecionarCidade(e.target.value)}
          >
            <option value="">Selecione a cidade</option>

            {cidades.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      )}

      {cidade && (
        <div className="motorista-info">
          <div>
            <strong>
              <MapPin size={16} /> {cidade}
            </strong>
            <span></span>
          </div>

          <Button variant="primary" onClick={alterarCidade}>
            <Pencil size={16} />
            Alterar cidade
          </Button>
        </div>
      )}
    </section>
  );
}

export default CidadeAbastecimentoCard;