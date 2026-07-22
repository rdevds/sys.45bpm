export function validarCnh(dataVencimento) {
  if (!dataVencimento) {
    return {
      valida: false,
      status: "SEM_CNH",
      mensagem: "A data de validade da CNH não está cadastrada.",
      diasRestantes: null,
    };
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const vencimento = new Date(`${dataVencimento}T00:00:00`);
  vencimento.setHours(0, 0, 0, 0);

  const diferenca = vencimento.getTime() - hoje.getTime();
  const diasRestantes = Math.ceil(diferenca / (1000 * 60 * 60 * 24));

  if (diasRestantes < 0) {
    return {
      valida: false,
      status: "VENCIDA",
      mensagem: `CNH vencida há ${Math.abs(diasRestantes)} dia(s).`,
      diasRestantes,
    };
  }

  if (diasRestantes === 0) {
    return {
      valida: true,
      status: "VENCE_HOJE",
      mensagem: "A CNH vence hoje.",
      diasRestantes,
    };
  }

  if (diasRestantes <= 30) {
    return {
      valida: true,
      status: "PROXIMA_VENCIMENTO",
      mensagem: `A CNH vence em ${diasRestantes} dia(s).`,
      diasRestantes,
    };
  }

  return {
    valida: true,
    status: "VALIDA",
    mensagem: `CNH válida por mais ${diasRestantes} dia(s).`,
    diasRestantes,
  };
}