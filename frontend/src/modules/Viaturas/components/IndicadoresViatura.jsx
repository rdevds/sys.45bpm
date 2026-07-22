function normalizarStatus(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function IndicadoresViatura({ viaturas }) {
  const total = viaturas.length;

  const disponiveis = viaturas.filter((v) => {
    const status = normalizarStatus(v.situacao);
    return status === "DISPONIVEL" || status === "ATIVA";
  }).length;

  const manutencao = viaturas.filter((v) => {
    const status = normalizarStatus(v.situacao);
    return status === "EM MANUTENCAO" || status === "MANUTENCAO";
  }).length;

  const baixadas = viaturas.filter((v) => {
    const status = normalizarStatus(v.situacao);
    return status === "BAIXADA";
  }).length;

  return (
    <section className="indicadores-grid">
      <div className="indicador-card">
        <span>🚓</span>
        <strong>{total}</strong>
        <small>Total</small>
      </div>

      <div className="indicador-card ativo">
        <span>✅</span>
        <strong>{disponiveis}</strong>
        <small>Disponíveis</small>
      </div>

      <div className="indicador-card oficina">
        <span>🔧</span>
        <strong>{manutencao}</strong>
        <small>Em manutenção</small>
      </div>

      <div className="indicador-card alerta">
        <span>🚫</span>
        <strong>{baixadas}</strong>
        <small>Baixadas</small>
      </div>
    </section>
  );
}

export default IndicadoresViatura;