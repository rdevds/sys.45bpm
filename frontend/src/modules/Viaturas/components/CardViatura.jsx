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
  <header className="card-viatura-cabecalho">
    <div className="card-viatura-identificacao">
      <span className="card-viatura-status disponivel">
        DISPONÍVEL
      </span>

      <span className="card-viatura-pasta">
        PASTA 8
      </span>
    </div>

    <button
      type="button"
      className="card-viatura-placa"
      onClick={abrirProntuario}
    >
      HMH-8598
      <ChevronRight size={16} />
    </button>
  </header>

  <div className="card-viatura-corpo">
    <div className="card-viatura-dado">
      <span>Prefixo</span>
      <strong>17771</strong>
    </div>

    <div className="card-viatura-dado">
      <span>Marca / Modelo</span>
      <strong>FIAT DUCATO — 2008</strong>
    </div>

    <div className="card-viatura-dado">
      <span>Odômetro</span>
      <strong>108.350 KM</strong>
    </div>

    <div className="card-viatura-dado">
      <span>Combustível</span>
      <strong>DIESEL S10</strong>
    </div>

    <div className="card-viatura-dado">
      <span>Cidade</span>
      <strong>PARACATU</strong>
    </div>

    <div className="card-viatura-dado">
      <span>Lotação</span>
      <strong>88ª CIA</strong>
    </div>
  </div>

  <footer className="card-viatura-rodape">
    <span className="card-viatura-unidade">
      Unidade Frota: 1251609
    </span>

    <button
      type="button"
      className="card-viatura-prontuario"
      onClick={abrirProntuario}
    >
      Ver prontuário
      <ChevronRight size={15} />
    </button>
  </footer>
</article>
  );
}

export default CardViatura;

