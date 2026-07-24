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
      titulo: "Baixa de viatura",
      descricao:
        "Registrar a indisponibilidade da viatura e iniciar o processo de baixa.",
      classe: "red",
      icone: <Wrench />,
      rota: "/baixa-viatura",
    },
    {
      titulo: "Baixa por acidente",
      descricao:
        "Informar acidente envolvendo viatura e iniciar os procedimentos necessários.",
      classe: "orange",
      icone: <AlertTriangle />,
      rota: "/baixa-acidente",
    },
    {
      titulo: "Abastecimento via XSM",
      descricao:
        "Registrar abastecimento realizado por convênio ou doação.",
      classe: "blue",
      icone: <Fuel />,
      rota: "/abastecimento",
    },
    {
      titulo: "Área Administrativa",
      descricao:
        "Gerenciar viaturas, militares, abastecimentos e demais módulos.",
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
          Área Administrativa
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
        SIGE · Sistema Integrado de Gestão do
        45º BPM
      </footer>
    </main>
  );
}

export default Home;