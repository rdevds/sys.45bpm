import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Abastecimento.css";

import MotoristaCard from "./components/MotoristaCard";
import CidadeAbastecimentoCard from "./components/CidadeAbastecimentoCard";
import ViaturaCard from "./components/ViaturaCard";
import ConvenenteDoadorCard from "./components/ConvenenteDoadorCard";
import DadosAbastecimentoCard from "./components/DadosAbastecimentoCard";
import ResponsavelEnvioCard from "./components/ResponsavelEnvioCard";
import ResumoEnvioCard from "./components/ResumoEnvioCard";

function Abastecimento() {
  const navigate = useNavigate();

  const [motorista, setMotorista] = useState(null);
  const [cidadeAbastecimento, setCidadeAbastecimento] = useState("");
  const [viatura, setViatura] = useState(null);
  const [convenenteDoador, setConvenenteDoador] = useState(null);
  const [dadosAbastecimento, setDadosAbastecimento] = useState(null);
  const [responsavelEnvio, setResponsavelEnvio] = useState(null);

  const dadosAbastecimentoCompleto =
    dadosAbastecimento?.combustivel &&
    dadosAbastecimento?.dataHora &&
    Number(dadosAbastecimento?.odometro) > 0 &&
    Number(dadosAbastecimento?.litros) > 0 &&
    Number(dadosAbastecimento?.valorUnitario) > 0 &&
    !dadosAbastecimento?.odometroInvalido;

  return (
    <main className="abastecimento-page">
      <section className="abastecimento-wrapper">
        {!responsavelEnvio ? (
          <>
            <header className="abastecimento-topbar">
              <div>
                <span className="abastecimento-badge">SiGeF 45º BPM</span>

                <h1>Registrar Abastecimento</h1>

                <p>SOMENTE ABASTECIMENTOS ATRAVÉS DE DOAÇÃO E CONVÊNIO.</p>
              </div>

              <button
                className="voltar-home"
                type="button"
                onClick={() => navigate("/")}
              >
                Voltar
              </button>
            </header>

            <section className="formulario-operacional">
              <MotoristaCard onMotoristaChange={setMotorista} />

              {motorista && (
                <CidadeAbastecimentoCard
                  onCidadeChange={setCidadeAbastecimento}
                />
              )}

              {cidadeAbastecimento && (
                <ViaturaCard onViaturaChange={setViatura} />
              )}

              {viatura && (
                <ConvenenteDoadorCard
                  onConvenenteChange={setConvenenteDoador}
                />
              )}

              

              {convenenteDoador && (
                <DadosAbastecimentoCard
                  viatura={viatura}
                  convenenteDoador={convenenteDoador}
                  onDadosChange={setDadosAbastecimento}
                />
              )}

              {dadosAbastecimentoCompleto && (
                <ResponsavelEnvioCard
                  motorista={motorista}
                  onResponsavelChange={setResponsavelEnvio}
                />
              )}
            </section>
          </>
        ) : (
          <ResumoEnvioCard
            motorista={motorista}
            cidadeAbastecimento={cidadeAbastecimento}
            viatura={viatura}
            convenenteDoador={convenenteDoador}
            dadosAbastecimento={dadosAbastecimento}
            responsavelEnvio={responsavelEnvio}
          />
        )}
      </section>
    </main>
  );
}



export default Abastecimento;