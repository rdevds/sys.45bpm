import { viaturas } from "../database/viaturas/viaturas";

export function buscarViaturaPorPrefixo(prefixo) {
  return viaturas.find(
    (viatura) => viatura.prefixo === prefixo
  );
}