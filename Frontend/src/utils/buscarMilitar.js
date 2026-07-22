import { militares } from "../database/militares/militares";

export function buscarMilitarPorNumero(numeroPolicia) {
  return militares.find(
    (militar) => militar.numeroPolicia === numeroPolicia
  );
}