import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  Mail,
} from "lucide-react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { supabase } from "../../services/supabase";

import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] =
    useState(false);
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function verificarSessao() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        navigate("/administrativo", {
          replace: true,
        });
      }
    }

    verificarSessao();
  }, [navigate]);

  async function entrar(event) {
    event.preventDefault();

    try {
      setEntrando(true);
      setErro("");

      const emailTratado = email
        .trim()
        .toLowerCase();

      if (!emailTratado) {
        throw new Error("INFORME O E-MAIL.");
      }

      if (!senha) {
        throw new Error("INFORME A SENHA.");
      }

      const { error } =
        await supabase.auth.signInWithPassword({
          email: emailTratado,
          password: senha,
        });

      if (error) {
        throw error;
      }

      const destino =
        location.state?.from?.pathname ||
        "/administrativo";

      navigate(destino, {
        replace: true,
      });
    } catch (error) {
      console.error("Erro ao entrar:", error);

      setErro(
        error?.message ===
          "Invalid login credentials"
          ? "E-MAIL OU SENHA INCORRETOS."
          : error?.message ||
              "NÃO FOI POSSÍVEL ENTRAR."
      );
    } finally {
      setEntrando(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-glow login-glow-um" />
      <div className="login-glow login-glow-dois" />

      <section className="login-card">
        <header className="login-cabecalho">
          <div className="login-icone">
            <LockKeyhole size={28} />
          </div>

          <span>ACESSO RESTRITO</span>

          <h1>Área Administrativa</h1>

          <p>
            Entre com o e-mail e a senha cadastrados
            para acessar o SiGeF.
          </p>
        </header>

        <form
          className="login-formulario"
          onSubmit={entrar}
        >
          <label>
            E-mail

            <div className="login-campo">
              <Mail size={19} />

              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value.toLowerCase()
                  )
                }
                placeholder="usuario@pmmg.mg.gov.br"
              />
            </div>
          </label>

          <label>
            Senha

            <div className="login-campo">
              <LockKeyhole size={19} />

              <input
                type={
                  mostrarSenha
                    ? "text"
                    : "password"
                }
                autoComplete="current-password"
                value={senha}
                onChange={(event) =>
                  setSenha(event.target.value)
                }
                placeholder="Digite sua senha"
              />

              <button
                type="button"
                className="login-mostrar-senha"
                onClick={() =>
                  setMostrarSenha((atual) => !atual)
                }
                aria-label={
                  mostrarSenha
                    ? "Ocultar senha"
                    : "Mostrar senha"
                }
              >
                {mostrarSenha ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </label>

          {erro && (
            <div className="login-erro">
              {erro}
            </div>
          )}

          <button
            type="submit"
            className="login-botao"
            disabled={entrando}
          >
            <LogIn size={19} />

            {entrando
              ? "Entrando..."
              : "Entrar"}
          </button>

          <button
            type="button"
            className="login-voltar"
            onClick={() => navigate("/")}
            disabled={entrando}
          >
            Voltar para a página inicial
          </button>

          <button
             type="button"
             className="login-link"
             onClick={() => navigate("/recuperar-senha")}
            >
               Esqueci minha senha
                 </button>

                <button
                type="button"
                className="login-link"
                onClick={() => navigate("/criar-senha")}
            >
  Primeiro acesso? Criar senha
</button>
        </form>
      </section>
    </main>
  );
}

export default Login;