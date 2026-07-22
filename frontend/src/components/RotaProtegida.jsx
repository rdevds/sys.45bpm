import { useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { supabase } from "../services/supabase";

function RotaProtegida() {
  const location = useLocation();

  const [sessao, setSessao] = useState(null);
  const [verificando, setVerificando] =
    useState(true);

  useEffect(() => {
    let montado = true;

    async function carregarSessao() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (montado) {
        setSessao(session);
        setVerificando(false);
      }
    }

    carregarSessao();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_evento, session) => {
        setSessao(session);
        setVerificando(false);
      }
    );

    return () => {
      montado = false;
      subscription.unsubscribe();
    };
  }, []);

  if (verificando) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          color: "#ffffff",
          background: "#070b12",
        }}
      >
        Verificando acesso...
      </main>
    );
  }

  if (!sessao) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
}

export default RotaProtegida;