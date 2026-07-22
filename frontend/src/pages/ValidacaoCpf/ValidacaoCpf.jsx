import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { buscarMilitar } from "../../utils/buscarMilitar";
import "./ValidacaoCpf.css";

function ValidacaoCpf() {
  const { tipo } = useParams();
  const navigate = useNavigate();

  const [cpf4, setCpf4] = useState("");
  const [militar, setMilitar] = useState(null);
  const [erro, setErro] = useState("");

  const titulos = {
    abastecimento: "Registrar Abastecimento",
    baixa: "Comunicar Baixa",
    acidente: "Comunicar Acidente",
  };

  function validarCpf() {
    const resultado = buscarMilitar(cpf4);

    if (!resultado) {
      setMilitar(null);
      setErro("CPF não localizado. Procure o administrador do sistema.");
      return;
    }

    setErro("");
    setMilitar(resultado);
  }

  return (
    <main className="validacao-page">
      <button className="voltar-btn" onClick={() => navigate("/")}>
        <ArrowLeft size={18} />
        Voltar
      </button>

      <section className="validacao-card">
        <div className="validacao-icon">
          <ShieldCheck size={34} />
        </div>

        <h1>{titulos[tipo] || "Validação"}</h1>

        <p>
          Para continuar, informe os 4 primeiros dígitos do CPF do militar.
        </p>

        <input
          type="text"
          maxLength="4"
          placeholder="0000"
          className="cpf-input"
          value={cpf4}
          onChange={(e) => {
            setCpf4(e.target.value.replace(/\D/g, ""));
            setErro("");
            setMilitar(null);
          }}
        />

        <button className="continuar-btn" onClick={validarCpf}>
          Validar CPF
        </button>

        {militar && (
          <div className="resultado sucesso">
            <CheckCircle size={24} />
            <div>
              <strong>{militar.nome}</strong>
              <span>{militar.fracao} - {militar.cidade}</span>
            </div>
          </div>
        )}

        {erro && (
          <div className="resultado erro">
            <XCircle size={24} />
            <span>{erro}</span>
          </div>
        )}

        {militar && (
          <button
            className="prosseguir-btn"
            onClick={() => navigate("/abastecimento")}
>
                Prosseguir
          </button>
        )}

        <small>
          Acesso operacional simplificado do SiGeF 45º BPM.
        </small>
      </section>
    </main>
  );
}

export default ValidacaoCpf;