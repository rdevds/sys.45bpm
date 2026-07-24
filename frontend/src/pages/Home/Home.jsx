import { useNavigate } from "react-router-dom";

import {
  AlertTriangle,
  ArrowRight,
  Car,
  Fuel,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import "./Home.css";

function Home() {
  const navigate = useNavigate();

  const cards = [
    {
      titulo: "Baixa para manutenção",
      descricao:
        "Relate problemas apresentados pela viatura e encaminhe a solicitação para a Frota.",
      classe: "red",
      icone: <Wrench size={28} />,
      rota: "/baixa-viatura",
    },
    {
      titulo: "Baixa por acidente",
      descricao:
        "Informe acidente envolvendo viatura e inicie os procedimentos necessários.",
      classe: "orange",
      icone: <AlertTriangle size={28} />,
      rota: "/baixa-acidente",
    },
    {
      titulo: "Abastecimento via XSM",
      descricao:
        "Registre abastecimentos realizados por convênio ou doação.",
      classe: "blue",
      icone: <Fuel size={28} />,
      rota: "/abastecimento",
    },
    {
      titulo: "Área Administrativa",
      descricao:
        "Gerencie viaturas, militares, abastecimentos, manutenções e demais módulos.",
      classe: "purple",
      icone: <ShieldCheck size={28} />,
      rota: "/administrativo",
    },
  ];

  return (
    <main className="home-page">
      <div
        className="home-glow glow-one"
        aria-hidden="true"
      />

      <div
        className="home-glow glow-two"
        aria-hidden="true"
      />

      <header className="home-header">
        <div className="brand">
          <div className="brand-icon">
            <Car size={28} />
          </div>

          <div>
            <h2>SIGE</h2>

            <p>
              Sistema Integrado de Gestão · 45º BPM
            </p>
          </div>
        </div>

        <button
          type="button"
          className="admin-btn"
          onClick={() =>
            navigate("/administrativo")
          }
        >
          <ShieldCheck size={19} />

          <span>
            Área Administrativa
          </span>
        </button>
      </header>

      <section className="hero">
        <div className="hero-text">
          <span className="badge">
            SISTEMA INTEGRADO DE GESTÃO
          </span>

          <h1>
            Gestão eficiente e integrada
          </h1>

          <p>
            Registre baixas, acidentes,
            abastecimentos e acompanhe as
            atividades da frota do 45º BPM.
          </p>
        </div>

        <div className="cards-grid">
          {cards.map((card) => (
            <button
              key={card.titulo}
              type="button"
              className={`action-card ${card.classe}`}
              onClick={() =>
                navigate(card.rota)
              }
              aria-label={`Abrir ${card.titulo}`}
            >
              <div className="card-icon">
                {card.icone}
              </div>

              <div className="card-content">
                <h3>{card.titulo}</h3>

                <p>{card.descricao}</p>
              </div>

              <span className="card-arrow">
                <ArrowRight size={22} />
              </span>
            </button>
          ))}
        </div>
      </section>

      <footer className="home-footer">
        SIGE · Sistema Integrado de Gestão do
        45º BPM
      </footer>
    </main>
  );
}

export default Home;