import { useState } from "react";
import { Pencil, UserCheck, UserSearch } from "lucide-react";
import Button from "../../../components/ui/Button.jsx";
import { buscarMilitarPorNumero } from "../../../utils/buscarMilitar.js";

function ResponsavelEnvioCard({ motorista, onResponsavelChange }) {
  const [tipo, setTipo] = useState("");
  const [numeroPolicia, setNumeroPolicia] = useState("");
  const [responsavel, setResponsavel] = useState(null);
  const [erro, setErro] = useState("");

  function selecionarCondutor() {
    setTipo("CONDUTOR");
    setResponsavel(motorista);
    setErro("");

    onResponsavelChange?.({
      tipo: "CONDUTOR",
      militar: motorista,
    });
  }

  function selecionarOutro() {
    setTipo("OUTRO");
    setResponsavel(null);
    setNumeroPolicia("");
    setErro("");
    onResponsavelChange?.(null);
  }

  function buscarResponsavel(valor) {
    const numero = valor.replace(/\D/g, "");
    setNumeroPolicia(numero);

    if (numero === motorista?.numeroPolicia) {
      setResponsavel(null);
      setErro(
        "O responsável informado não pode ser o mesmo condutor. Se for o condutor, selecione a opção Condutor."
      );
      onResponsavelChange?.(null);
      return;
    }

    const encontrado = buscarMilitarPorNumero(numero);

    if (encontrado) {
      setResponsavel(encontrado);
      setErro("");

      onResponsavelChange?.({
        tipo: "OUTRO",
        militar: encontrado,
      });
    } else {
      setResponsavel(null);
      setErro(
        numero.length > 0
          ? "Responsável não localizado. Verifique o Número de Polícia."
          : ""
      );

      onResponsavelChange?.(null);
    }
  }

  function alterarResponsavel() {
    setTipo("");
    setResponsavel(null);
    setNumeroPolicia("");
    setErro("");
    onResponsavelChange?.(null);
  }

  return (
    <section className="form-card motorista-card">
      <h2>Responsável pelo envio</h2>

      {!tipo && (
        <div className="acoes-contato">
          <Button variant="primary" onClick={selecionarCondutor}>
            <UserCheck size={16} />
            Condutor
          </Button>

          <Button variant="secondary" onClick={selecionarOutro}>
            <UserSearch size={16} />
            Outro
          </Button>
        </div>
      )}

      {tipo === "OUTRO" && !responsavel && (
        <>
          <label className="campo campo-compacto">
            Número de Polícia do responsável *
            <input
              value={numeroPolicia}
              onChange={(e) => buscarResponsavel(e.target.value)}
              placeholder="Ex: 1564574"
            />
          </label>

          {erro && (
            <>
              <div className="aviso-erro">⚠ {erro}</div>

              <div className="acoes-contato">
                <Button variant="secondary" onClick={alterarResponsavel}>
                  Editar opções
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {responsavel && (
        <div className="motorista-info">
          <div>
            <strong>
              {tipo === "CONDUTOR" ? "👤 Condutor" : "👤 Outro responsável"}
            </strong>

            <span>
              {responsavel.graduacao} {responsavel.nome}
            </span>

            {responsavel.email && <span>📧 {responsavel.email}</span>}
            {responsavel.telefone && <span>📱 {responsavel.telefone}</span>}
          </div>

          <Button variant="primary" onClick={alterarResponsavel}>
            <Pencil size={16} />
            Alterar
          </Button>
        </div>
      )}
    </section>
  );
}

export default ResponsavelEnvioCard;