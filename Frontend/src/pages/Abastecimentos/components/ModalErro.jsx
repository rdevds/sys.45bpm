import { X, Save } from "lucide-react";

function ModalErro({
  abastecimento,
  formErro,
  setFormErro,
  onFechar,
  onSalvar,
}) {
  if (!abastecimento) return null;

  return (
    <div className="modal-fundo">
      <div className="modal-abastecimento modal-erro">
        <div className="modal-topo">
          <h2>Registrar status do SIAD</h2>

          <button type="button" onClick={onFechar}>
            <X size={18} />
          </button>
        </div>

        <label className="campo-modal">
          Status
          <select
            value={formErro.status}
            onChange={(e) =>
              setFormErro((atual) => ({
                ...atual,
                status: e.target.value,
              }))
            }
          >
            <option value="PENDENTE">PENDENTE</option>
            <option value="LANÇADO SIAD">LANÇADO SIAD</option>
            <option value="ENV. CORREÇÃO">ENV. CORREÇÃO</option>
          </select>
        </label>

        <label className="campo-modal">
          Erro encontrado
          <textarea
            value={formErro.erro_siad}
            onChange={(e) =>
              setFormErro((atual) => ({
                ...atual,
                erro_siad: e.target.value.toUpperCase(),
              }))
            }
            placeholder="Descreva o erro encontrado..."
          />
        </label>

        <label className="campo-modal">
          Observação
          <textarea
            value={formErro.observacao_siad}
            onChange={(e) =>
              setFormErro((atual) => ({
                ...atual,
                observacao_siad: e.target.value.toUpperCase(),
              }))
            }
            placeholder="Ex: Corrigir cidade, valor, combustível..."
          />
        </label>

        <div className="modal-acoes">
          <button type="button" className="botao-cancelar" onClick={onFechar}>
            Cancelar
          </button>

          <button type="button" className="botao-salvar" onClick={onSalvar}>
            <Save size={17} />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalErro;