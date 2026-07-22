import { abastecimentosAnteriores } from "../database/abastecimentos/abastecimentos.js";

export function calcularValorUnitarioSugerido(convenente, combustivel) {
  const registros = abastecimentosAnteriores.filter(
    (item) =>
      item.convenente === convenente &&
      item.combustivel === combustivel
  );

  const totalLitros = registros.reduce(
    (soma, item) => soma + Number(item.litros),
    0
  );

  const totalValores = registros.reduce(
    (soma, item) => soma + Number(item.valorTotal),
    0
  );

  if (totalLitros <= 0) return null;

  return totalValores / totalLitros;
}