import { useNavigate } from "react-router-dom";

import {
  ArrowRight,
  Building2,
  Car,
  Check,
  Gauge,
  MapPin,
  Wrench,
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

  function texto(valor, fallback = "NÃO INFORMADO") {
    const valorTratado = String(
      valor ?? ""
    ).trim();

    return valorTratado || fallback;
  }

  function formatarOdometro(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
      return "NÃO INFORMADO";
    }

    return `${numero.toLocaleString(
      "pt-BR"
    )} km`;
  }

  function formatarMoeda(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
      return "A DEFINIR";
    }

    return numero.toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    );
  }

  function obterStatus() {
    return texto(
      viatura?.situacao,
      "SEM STATUS"
    ).toUpperCase();
  }

  function obterClasseStatus() {
    const status = obterStatus()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (
      status.includes("MANUTENCAO")
    ) {
      return "card-viatura--manutencao";
    }

    if (
      status.includes("INOPERANTE") ||
      status.includes("BAIXADA")
    ) {
      return "card-viatura--inoperante";
    }

    if (status.includes("RESERVA")) {
      return "card-viatura--reserva";
    }

    return "card-viatura--disponivel";
  }

  const marca = texto(
    viatura?.marca
  ).toUpperCase();

  const modelo = texto(
    viatura?.modelo
  ).toUpperCase();

  const ano = texto(
    viatura?.ano
  );

  const lotacao = texto(
    viatura?.lotacao,
    "LOTAÇÃO NÃO INFORMADA"
  ).toUpperCase();

  const cidade = texto(
    viatura?.cidade,
    "CIDADE NÃO INFORMADA"
  ).toUpperCase();

  const valorManutencao =
    viatura?.valor_manutencao ??
    viatura?.gasto_manutencao ??
    viatura?.total_manutencao;

  return (
    <article
      className={`
        card-viatura
        ${obterClasseStatus()}
      `}
      tabIndex={0}
      onKeyDown={(evento) => {
        if (
          evento.key === "Enter" ||
          evento.key === " "
        ) {
          evento.preventDefault();
          abrirProntuario();
        }
      }}
    >
      {/* SITUAÇÃO DA VIATURA */}
      <header className="card-viatura__topo">
        <span className="card-viatura__situacao">
          {obterStatus()}
        </span>
      </header>

      {/* ÁREA RESERVADA PARA A FOTO */}
      <div className="card-viatura__imagem-container">
        {viatura?.foto_url ? (
          <img
            src={viatura.foto_url}
            alt={`${marca} ${modelo}`}
            className="card-viatura__imagem"
          />
        ) : (
          <div className="card-viatura__imagem-vazia">
            <Car size={42} />

            <span>
              FOTO DA VIATURA
            </span>
          </div>
        )}
      </div>

      {/* PREFIXO, PLACA, MARCA E MODELO */}
      <section className="card-viatura__identificacao">
        <div className="card-viatura__numeracao">
          <h2 className="card-viatura__prefixo">
            {texto(
              viatura?.prefixo,
              "-----"
            )}
          </h2>

          <span className="card-viatura__placa">
            {texto(
              viatura?.placa,
              "SEM PLACA"
            ).toUpperCase()}
          </span>
        </div>

        <div className="card-viatura__modelo">
          <span className="card-viatura__marca-icone">
            <Car size={22} />
          </span>

          <div>
            <strong className="card-viatura__marca">
              {marca}
            </strong>

            <span className="card-viatura__nome-modelo">
              {modelo}
            </span>

            <span className="card-viatura__ano">
              {ano}
            </span>
          </div>
        </div>
      </section>

      {/* PRINCIPAIS INFORMAÇÕES */}
      <section className="card-viatura__dados">
        <div className="card-viatura__linha">
          <span className="card-viatura__rotulo">
            <MapPin size={15} />
            Cidade
          </span>

          <strong className="card-viatura__valor">
            {cidade}
          </strong>
        </div>

        <div className="card-viatura__linha">
          <span className="card-viatura__rotulo">
            <Building2 size={15} />
            Lotação
          </span>

          <strong className="card-viatura__valor">
            {lotacao}
          </strong>
        </div>

        <div className="card-viatura__linha">
          <span className="card-viatura__rotulo">
            <Gauge size={15} />
            Odômetro
          </span>

          <strong className="card-viatura__valor">
            {formatarOdometro(
              viatura?.odometro
            )}
          </strong>
        </div>

        <div className="card-viatura__linha">
          <span className="card-viatura__rotulo">
            <Wrench size={15} />
            Manutenção
          </span>

          <strong className="card-viatura__valor">
            {formatarMoeda(
              valorManutencao
            )}
          </strong>
        </div>
      </section>

      {/* STATUS GERAL / ACESSO AO PRONTUÁRIO */}
      <button
        type="button"
        className="card-viatura__rodape"
        onClick={abrirProntuario}
      >
        <span className="card-viatura__icone-status">
          <Check size={18} />
        </span>

        <span className="card-viatura__status-texto">
          <span>Status geral</span>

          <strong>
            {obterStatus() ===
            "DISPONÍVEL"
              ? "Operacional"
              : obterStatus()}
          </strong>
        </span>

        <ArrowRight
          className="card-viatura__seta"
          size={20}
        />
      </button>
    </article>
  );
}

export default CardViatura;