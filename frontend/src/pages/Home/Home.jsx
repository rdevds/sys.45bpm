import { useNavigate } from "react-router-dom";

import {
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
      titulo: "Abastecimento",
      descricao:
        "Registrar um novo abastecimento da viatura.",
      classe: "blue",
      icone: <Fuel />,
      rota: "/abastecimento",
    },
    {
      titulo: "Viaturas",
      descricao:
        "Consultar a frota e acessar o prontuário das viaturas.",
      classe: "orange",
      icone: <Car />,
      rota: "/viaturas",
    },
    {
      titulo: "Manutenções",
      descricao:
        "Registrar solicitações e acompanhar manutenções.",
      classe: "red",
      icone: <Wrench />,
      rota: "/administrativo",
    },
    {
      titulo: "Área Administrativa",
      descricao:
        "Gerenciar militares, abastecimentos e demais módulos.",
      classe: "purple",
      icone: <ShieldCheck />,
      rota: "/administrativo",
    },
  ];

  return (
    <main className="home-page">
      <div className="home-glow glow-one" />
      <div className="home-glow glow-two" />

      <header className="home-header">
        <div className="brand">
          <div className="brand-icon">
            <Car size={28} />
          </div>

          <div>
            <h2>SiGeF</h2>
            <p>Sistema de Gestão de Frota · 45º BPM</p>
          </div>
        </div>

        <button
          type="button"
          className="admin-btn"
          onClick={() => navigate("/administrativo")}
        >
          <ShieldCheck size={19} />
          Área Administrativa
        </button>
      </header>

      <section className="hero">
        <div className="hero-text">
          <span className="badge">
            SISTEMA DE GESTÃO DE FROTA
          </span>

          <h1>Gestão eficiente da frota</h1>

          <p>
            Registre abastecimentos, acompanhe viaturas e
            organize as atividades do 45º BPM.
          </p>
        </div>

        <div className="cards-grid">
          {cards.map((card) => (
            <button
              key={card.titulo}
              type="button"
              className={`action-card ${card.classe}`}
              onClick={() => navigate(card.rota)}
            >
              <div className="card-icon">
                {card.icone}
              </div>

              <h3>{card.titulo}</h3>

              <p>{card.descricao}</p>

              <span>
                <ArrowRight size={22} />
              </span>
            </button>
          ))}
        </div>
      </section>

      <footer className="home-footer">
        SiGeF · Sistema de Gestão de Frota do 45º BPM
      </footer>
    </main>
  );
}

export default Home;