import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";

// PÁGINAS PÚBLICAS
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import CriarSenha from "./pages/CriarSenha/CriarSenha";
import Abastecimento from "./pages/Abastecimento/Abastecimento";
import BaixaViatura from "./pages/BaixaViatura/BaixaViatura.jsx";
import BaixaAcidente from "./pages/BaixaAcidente/BaixaAcidente.jsx";

// ÁREA ADMINISTRATIVA
import Administrativo from "./pages/Administrativo/Administrativo";
import Abastecimentos from "./pages/Abastecimentos/Abastecimentos";
import Militares from "./pages/Administrativo/Militares/Militares";
import CartaSituacao from "./pages/Administrativo/CartaSituacao/CartaSituacao";
import OdometrosAtualizados from "./pages/OdometrosAtualizados/OdometrosAtualizados.jsx";
import Oficios from "./pages/Oficios/Oficios";
import EstruturaOrganizacional from "./pages/Administrativo/EstruturaOrganizacional/EstruturaOrganizacional.jsx";

// MÓDULO DE VIATURAS
import Viaturas from "./modules/Viaturas/Viaturas.jsx";
import ModelosViaturas from "./modules/Viaturas/ModelosViaturas.jsx";
import ProntuarioViatura from "./modules/Viaturas/components/ProntuarioViatura.jsx";

/* =========================================================
   DASHBOARD ADMINISTRATIVO
========================================================= */

function DashboardAdministrativo() {
  return (
    <section className="admin-painel">
      <span className="admin-painel-etiqueta">
        SIGE 45º BPM
      </span>

      <h3>Dashboard</h3>

      <p>
        Visão geral do Sistema Integrado de Gestão.
      </p>
    </section>
  );
}

/* =========================================================
   CONTEÚDO TEMPORÁRIO PARA MÓDULOS EM CONSTRUÇÃO
========================================================= */

function ConteudoEmConstrucao({
  titulo,
  texto = "Módulo em desenvolvimento.",
}) {
  return (
    <section className="admin-painel">
      <span className="admin-painel-etiqueta">
        SIGE 45º BPM
      </span>

      <h3>{titulo}</h3>

      <p>{texto}</p>
    </section>
  );
}

/* =========================================================
   PÁGINA NÃO ENCONTRADA
========================================================= */

function PaginaNaoEncontrada() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px",
        color: "#ffffff",
        background: "#0a101b",
      }}
    >
      <h1>Página não encontrada</h1>

      <p>Verifique o endereço acessado.</p>
    </main>
  );
}

/* =========================================================
   REDIRECIONAMENTO DO PRONTUÁRIO ANTIGO
========================================================= */

function RedirecionarProntuario() {
  const { prefixo } = useParams();

  if (!prefixo) {
    return (
      <Navigate
        to="/administrativo/viaturas"
        replace
      />
    );
  }

  return (
    <Navigate
      to={`/administrativo/viaturas/${prefixo}`}
      replace
    />
  );
}

/* =========================================================
   ROTAS DA APLICAÇÃO
========================================================= */

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =====================================================
            ROTAS PÚBLICAS
        ====================================================== */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/criar-senha"
          element={<CriarSenha />}
        />

        <Route
          path="/baixa-viatura"
          element={<BaixaViatura />}
        />

        <Route
          path="/baixa-acidente"
          element={<BaixaAcidente />}
        />

        <Route
          path="/abastecimento"
          element={<Abastecimento />}
        />

        {/* =====================================================
            ÁREA ADMINISTRATIVA
        ====================================================== */}

        <Route
          path="/administrativo"
          element={<Administrativo />}
        >
          <Route
            index
            element={<DashboardAdministrativo />}
          />

          <Route
            path="estrutura-organizacional"
            element={<EstruturaOrganizacional />}
          />

          <Route
            path="viaturas"
            element={<Viaturas />}
          />

          <Route
            path="viaturas/modelos"
            element={<ModelosViaturas />}
          />

          <Route
            path="viaturas/:prefixo"
            element={<ProntuarioViatura />}
          />

          <Route
            path="militares"
            element={<Militares />}
          />

          <Route
            path="carta-situacao"
            element={<CartaSituacao />}
          />

          <Route
            path="abastecimentos"
            element={<Abastecimentos />}
          />

          <Route
            path="odometros"
            element={<OdometrosAtualizados />}
          />

          <Route
            path="manutencoes"
            element={
              <ConteudoEmConstrucao
                titulo="Manutenções"
                texto="Módulo de manutenções em desenvolvimento."
              />
            }
          />

          <Route
            path="pneus"
            element={
              <ConteudoEmConstrucao
                titulo="Pneus"
                texto="Módulo de controle de pneus em desenvolvimento."
              />
            }
          />

          <Route
            path="oficios"
            element={<Oficios />}
          />

          <Route
            path="relatorios"
            element={
              <ConteudoEmConstrucao
                titulo="Relatórios"
                texto="Módulo de relatórios em desenvolvimento."
              />
            }
          />

          <Route
            path="configuracoes"
            element={
              <ConteudoEmConstrucao
                titulo="Configurações"
                texto="Módulo de configurações em desenvolvimento."
              />
            }
          />

          <Route
            path="*"
            element={
              <ConteudoEmConstrucao
                titulo="Página não encontrada"
                texto="O endereço administrativo acessado não existe."
              />
            }
          />
        </Route>

        {/* =====================================================
            REDIRECIONAMENTOS ANTIGOS
        ====================================================== */}

        <Route
          path="/viaturas"
          element={
            <Navigate
              to="/administrativo/viaturas"
              replace
            />
          }
        />

        <Route
          path="/viaturas/:prefixo"
          element={<RedirecionarProntuario />}
        />

        <Route
          path="/militares"
          element={
            <Navigate
              to="/administrativo/militares"
              replace
            />
          }
        />

        <Route
          path="/estrutura-organizacional"
          element={
            <Navigate
              to="/administrativo/estrutura-organizacional"
              replace
            />
          }
        />

        <Route
          path="/carta-situacao"
          element={
            <Navigate
              to="/administrativo/carta-situacao"
              replace
            />
          }
        />

        <Route
          path="/abastecimentos"
          element={
            <Navigate
              to="/administrativo/abastecimentos"
              replace
            />
          }
        />

        <Route
          path="/odometros"
          element={
            <Navigate
              to="/administrativo/odometros"
              replace
            />
          }
        />

        <Route
          path="/manutencoes"
          element={
            <Navigate
              to="/administrativo/manutencoes"
              replace
            />
          }
        />

        <Route
          path="/pneus"
          element={
            <Navigate
              to="/administrativo/pneus"
              replace
            />
          }
        />

        <Route
          path="/oficios"
          element={
            <Navigate
              to="/administrativo/oficios"
              replace
            />
          }
        />

        <Route
          path="/relatorios"
          element={
            <Navigate
              to="/administrativo/relatorios"
              replace
            />
          }
        />

        <Route
          path="/configuracoes"
          element={
            <Navigate
              to="/administrativo/configuracoes"
              replace
            />
          }
        />

        {/* =====================================================
            FALLBACK GERAL
        ====================================================== */}

        <Route
          path="*"
          element={<PaginaNaoEncontrada />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;