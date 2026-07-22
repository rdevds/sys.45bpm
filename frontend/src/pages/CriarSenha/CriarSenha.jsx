import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../../services/supabase";

import "../Login/Login.css";

function CriarSenha() {
  const navigate = useNavigate();

  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");

  const [mostrarSenha, setMostrarSenha] =
    useState(false);

  const [sessaoValida, setSessaoValida] =
    useState(false);

  const [verificando, setVerificando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [erro, setErro] = useState("");

  const [sucesso, setSucesso] =
    useState("");

  useEffect(() => {
    let montado = true;

    async function verificarSessao() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!montado) {
        return;
      }

      setSessaoValida(Boolean(session));
      setVerificando(false);
    }

    verificarSessao();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (evento, session) => {
        if (!montado) {
          return;
        }

        if (
          evento === "SIGNED_IN" ||
          evento === "PASSWORD_RECOVERY" ||
          evento === "INITIAL_SESSION"
        ) {
          setSessaoValida(Boolean(session));
          setVerificando(false);
        }
      }
    );

    return () => {
      montado = false;
      subscription.unsubscribe();
    };
  }, []);

  async function criarSenha(event) {
    event.preventDefault();

    try {
      setErro("");
      setSucesso("");

      if (!sessaoValida) {
        throw new Error(
          "O LINK NÃO É VÁLIDO OU JÁ EXPIROU."
        );
      }

      if (senha.length < 8) {
        throw new Error(
          "A SENHA DEVE POSSUIR PELO MENOS 8 CARACTERES."
        );
      }

      if (!/[A-Z]/.test(senha)) {
        throw new Error(
          "A SENHA DEVE POSSUIR UMA LETRA MAIÚSCULA."
        );
      }

      if (!/[a-z]/.test(senha)) {
        throw new Error(
          "A SENHA DEVE POSSUIR UMA LETRA MINÚSCULA."
        );
      }

      if (!/[0-9]/.test(senha)) {
        throw new Error(
          "A SENHA DEVE POSSUIR UM NÚMERO."
        );
      }

      if (senha !== confirmacao) {
        throw new Error(
          "AS SENHAS INFORMADAS NÃO COINCIDEM."
        );
      }

      setSalvando(true);

      const { error } =
        await supabase.auth.updateUser({
          password: senha,
        });

      if (error) {
        throw error;
      }

      setSucesso(
        "SENHA CRIADA COM SUCESSO."
      );

      setSenha("");
      setConfirmacao("");

      setTimeout(() => {
        navigate("/administrativo", {
          replace: true,
        });
      }, 1200);
    } catch (error) {
      console.error(
        "Erro ao criar senha:",
        error
      );

      setErro(
        error?.message ||
          "NÃO FOI POSSÍVEL CRIAR A SENHA."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (verificando) {
    return (
      <main className="login-page">
        <section className="login-card">
          <p>Validando convite...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="login-page">
      <div className="login-glow login-glow-um" />
      <div className="login-glow login-glow-dois" />

      <section className="login-card">
        <header className="login-cabecalho">
          <div className="login-icone">
            <KeyRound size={28} />
          </div>

          <span>PRIMEIRO ACESSO</span>

          <h1>Criar senha</h1>

          <p>
            Defina sua senha pessoal para acessar
            a área administrativa do SiGeF.
          </p>
        </header>

        {!sessaoValida ? (
          <div className="login-erro">
            O LINK DE CONVITE É INVÁLIDO OU
            EXPIROU. SOLICITE UM NOVO CONVITE
            AO ADMINISTRADOR.
          </div>
        ) : (
          <form
            className="login-formulario"
            onSubmit={criarSenha}
          >
            <label>
              Nova senha

              <div className="login-campo">
                <KeyRound size={19} />

                <input
                  type={
                    mostrarSenha
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  value={senha}
                  onChange={(event) =>
                    setSenha(event.target.value)
                  }
                  placeholder="Digite sua nova senha"
                />

                <button
                  type="button"
                  className="login-mostrar-senha"
                  onClick={() =>
                    setMostrarSenha(
                      (atual) => !atual
                    )
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

            <label>
              Confirmar senha

              <div className="login-campo">
                <ShieldCheck size={19} />

                <input
                  type={
                    mostrarSenha
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  value={confirmacao}
                  onChange={(event) =>
                    setConfirmacao(
                      event.target.value
                    )
                  }
                  placeholder="Digite novamente"
                />
              </div>
            </label>

            <small
              style={{
                color: "#94a3b8",
                lineHeight: 1.5,
              }}
            >
              Use pelo menos 8 caracteres,
              contendo letra maiúscula,
              minúscula e número.
            </small>

            {erro && (
              <div className="login-erro">
                {erro}
              </div>
            )}

            {sucesso && (
              <div
                className="login-erro"
                style={{
                  color: "#86efac",
                  borderColor:
                    "rgba(34, 197, 94, 0.42)",
                  background:
                    "rgba(20, 83, 45, 0.24)",
                }}
              >
                {sucesso}
              </div>
            )}

            <button
              type="submit"
              className="login-botao"
              disabled={salvando}
            >
              <ShieldCheck size={19} />

              {salvando
                ? "Criando senha..."
                : "Criar minha senha"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export default CriarSenha;