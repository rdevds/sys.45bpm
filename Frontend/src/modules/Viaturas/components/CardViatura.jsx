import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Car,
  Fuel,
  Gauge,
  MapPin,
} from "lucide-react";

function CardViatura({ viatura = {} }) {
  const navigate = useNavigate();

  function abrirProntuario() {
    const prefixo = String(
      viatura?.prefixo || ""
    )
      .replace(/\D/g, "")
      .slice(0, 5);

    if (!/^\d{5}$/.test(prefixo)) {
      console.error(
        "Prefixo inválido para abrir o prontuário:",
        viatura?.prefixo
      );

      return;
    }

    navigate(
      `/administrativo/viaturas/${prefixo}`
    );
  }

  function formatarOdometro(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
      return "0 km";
    }

    return `${numero.toLocaleString(
      "pt-BR"
    )} km`;
  }

  function obterStatus() {
    return String(
      viatura?.situacao || "SEM STATUS"
    )
      .trim()
      .toUpperCase();
  }

  return (
    <article className="card-viatura">
      <div className="card-viatura-topo">
        <div className="card-prefixo">
          <Car size={18} />

          <strong>
            {viatura.prefixo || "-"}
          </strong>
        </div>

        <span className="status-viatura">
          {obterStatus()}
        </span>
      </div>

      <div className="card-viatura-corpo">
        <h3>
          {viatura.placa || "-"}
        </h3>

        <p className="modelo-viatura">
          {viatura.marca || "-"}{" "}
          {viatura.modelo || ""}
        </p>

        <div className="card-viatura-info">
          <span>
            <MapPin size={15} />
            {viatura.cidade || "-"}
          </span>

          <span>
            <Building2 size={15} />
            {viatura.lotacao || "-"}
          </span>

          <span>
            <Fuel size={15} />
            {viatura.combustivel || "-"}
          </span>

          <span>
            <Gauge size={15} />

            {formatarOdometro(
              viatura.odometro
            )}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="botao-prontuario"
        onClick={abrirProntuario}
        disabled={!viatura?.prefixo}
      >
        <span>Ver prontuário</span>
        <ArrowRight size={16} />
      </button>
    </article>
  );
}

export default CardViatura;