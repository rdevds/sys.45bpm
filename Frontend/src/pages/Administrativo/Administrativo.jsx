import { useState } from "react";

import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  Car,
  Users,
  Fuel,
  Wrench,
  CircleGauge,
  FileText,
  Settings,
  LogOut,
  Sun,
  Moon,
  Gauge,
  Files,
  ClipboardList,
  Network,
} from "lucide-react";

import "./Administrativo.css";

import { supabase } from "../../services/supabase.js";

/* =========================================================
   ITENS DO MENU
========================================================= */

const ITENS_MENU = [
  {
    id: "dashboard",
    titulo: "Dashboard",
    rota: "/administrativo",
    icone: LayoutDashboard,
    fim: true,
  },
  {
    id: "estrutura-organizacional",
    titulo: "Estrutura Organizacional",
    rota:
      "/administrativo/estrutura-organizacional",
    icone: Network,
  },
  {
    id: "viaturas",
    titulo: "Viaturas",
    rota: "/administrativo/viaturas",
    icone: Car,
  },
  {
    id: "militares",
    titulo: "Militares",
    rota: "/administrativo/militares",
    icone: Users,
  },
  {
    id: "carta-situacao",
    titulo: "Carta de Situação",
    rota: "/administrativo/carta-situacao",
    icone: ClipboardList,
  },
  {
    id: "abastecimentos",
    titulo: "Abastecimentos",
    rota: "/administrativo/abastecimentos",
    icone: Fuel,
  },
  {
    id: "odometros",
    titulo: "Odômetros",
    rota: "/administrativo/odometros",
    icone: Gauge,
  },
  {
    id: "manutencoes",
    titulo: "Manutenções",
    rota: "/administrativo/manutencoes",
    icone: Wrench,
  },
  {
    id: "pneus",
    titulo: "Pneus",
    rota: "/administrativo/pneus",
    icone: CircleGauge,
  },
  {
    id: "oficios",
    titulo: "Ofícios",
    rota: "/administrativo/oficios",
    icone: Files,
  },
  {
    id: "relatorios",
    titulo: "Relatórios",
    rota: "/administrativo/relatorios",
    icone: FileText,
  },
  {
    id: "configuracoes",
    titulo: "Configurações",
    rota: "/administrativo/configuracoes",
    icone: Settings,
  },
];

/* =========================================================
   COMPONENTE
========================================================= */

function Administrativo() {
  const navigate = useNavigate();
  const location = useLocation();

  const [tema, setTema] =
    useState("dark");

  const [saindo, setSaindo] =
    useState(false);

  const [erro, setErro] =
    useState("");

  /* =======================================================
     TÍTULO DA PÁGINA
  ======================================================= */

  function obterTituloPagina() {
    const caminho =
      location.pathname;

    if (
      caminho === "/administrativo" ||
      caminho === "/administrativo/"
    ) {
      return "Dashboard";
    }

    if (
      caminho.startsWith(
        "/administrativo/estrutura-organizacional"
      )
    ) {
      return "Estrutura Organizacional";
    }

    if (
      caminho.startsWith(
        "/administrativo/viaturas"
      )
    ) {
      const partesCaminho =
        caminho
          .split("/")
          .filter(Boolean);

      return partesCaminho.length > 2
        ? "Prontuário da viatura"
        : "Viaturas";
    }

    if (
      caminho.startsWith(
        "/administrativo/militares"
      )
    ) {
      return "Integrantes";
    }

    if (
      caminho.startsWith(
        "/administrativo/carta-situacao"
      )
    ) {
      return "Carta de Situação";
    }

    if (
      caminho.startsWith(
        "/administrativo/abastecimentos"
      )
    ) {
      return "Abastecimentos";
    }

    if (
      caminho.startsWith(
        "/administrativo/odometros"
      )
    ) {
      return "Odômetros atualizados";
    }

    if (
      caminho.startsWith(
        "/administrativo/manutencoes"
      )
    ) {
      return "Manutenções";
    }

    if (
      caminho.startsWith(
        "/administrativo/pneus"
      )
    ) {
      return "Pneus";
    }

    if (
      caminho.startsWith(
        "/administrativo/oficios"
      )
    ) {
      return "Ofícios";
    }

    if (
      caminho.startsWith(
        "/administrativo/relatorios"
      )
    ) {
      return "Relatórios";
    }

    if (
      caminho.startsWith(
        "/administrativo/configuracoes"
      )
    ) {
      return "Configurações";
    }

    return "Área Administrativa";
  }

  /* =======================================================
     LOGOUT
  ======================================================= */

  async function sair() {
    try {
      setSaindo(true);
      setErro("");

      const { error } =
        await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Erro ao sair:",
        error
      );

      setErro(
        error?.message ||
          "Não foi possível encerrar a sessão."
      );
    } finally {
      setSaindo(false);
    }
  }

  /* =======================================================
     TEMA
  ======================================================= */

  function alternarTema() {
    setTema((temaAtual) =>
      temaAtual === "dark"
        ? "light"
        : "dark"
    );
  }

  /* =======================================================
     RENDERIZAÇÃO
  ======================================================= */

  return (
    <main
      className={`admin-page ${
        tema === "light"
          ? "light-mode"
          : "dark-mode"
      }`}
    >
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <div className="admin-logo-icon">
            45º
          </div>

          <div>
            <h1>SiGeF</h1>
            <p>45º BPM</p>
          </div>
        </div>

        <nav className="admin-menu">
          {ITENS_MENU.map((item) => {
            const Icone =
              item.icone;

            return (
              <NavLink
                key={item.id}
                to={item.rota}
                end={item.fim}
                className={({
                  isActive,
                }) =>
                  isActive
                    ? "ativo"
                    : ""
                }
              >
                <Icone size={19} />

                <span>
                  {item.titulo}
                </span>
              </NavLink>
            );
          })}
        </nav>

        <button
          type="button"
          className="admin-sair"
          onClick={sair}
          disabled={saindo}
        >
          <LogOut size={19} />

          <span>
            {saindo
              ? "Saindo..."
              : "Sair"}
          </span>
        </button>
      </aside>

      <section className="admin-conteudo">
        <header className="admin-topbar">
          <div>
            <span>
              Área Administrativa
            </span>

            <h2>
              {obterTituloPagina()}
            </h2>
          </div>

          <div className="admin-topbar-acoes">
            <button
              type="button"
              className="tema-toggle"
              onClick={alternarTema}
              aria-label={
                tema === "dark"
                  ? "Ativar modo claro"
                  : "Ativar modo escuro"
              }
            >
              {tema === "dark" ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}

              <span>
                {tema === "dark"
                  ? "Modo Claro"
                  : "Modo Escuro"}
              </span>
            </button>

            <div className="admin-usuario">
              <strong>ADMIN</strong>
              <small>45º BPM</small>
            </div>
          </div>
        </header>

        {erro && (
          <div
            className="admin-erro"
            role="alert"
          >
            ⚠ {erro}
          </div>
        )}

        <div className="admin-area-pagina">
          <Outlet />
        </div>
      </section>
    </main>
  );
}

export default Administrativo;