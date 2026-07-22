import {
  normalizarPlaca,
} from "./normalizarRegistro.js";

export function cruzarComViaturas(
  registros,
  viaturas
) {
  const mapaViaturas = new Map();

  for (const viatura of viaturas ?? []) {
    const placaNormalizada =
      viatura.placa_normalizada ||
      normalizarPlaca(viatura.placa);

    if (placaNormalizada) {
      mapaViaturas.set(
        placaNormalizada,
        viatura
      );
    }
  }

  const registrosValidos = [];
  const registrosNaoLocalizados = [];

  for (const registro of registros ?? []) {
    const placaNormalizada =
      normalizarPlaca(
        registro.placa_original
      );

    const viatura =
      mapaViaturas.get(placaNormalizada);

    if (!viatura) {
      registrosNaoLocalizados.push({
        ...registro,
        placa_normalizada:
          placaNormalizada,

        situacao_previa:
          "VIATURA_NAO_LOCALIZADA",
      });

      continue;
    }

    const odometroImportado =
      Number(registro.odometro_importado);

    const odometroAtual =
      Number(viatura.odometro ?? 0);

    const possuiOdometro =
      Number.isFinite(
        odometroImportado
      );

    const diferenca = possuiOdometro
      ? odometroImportado - odometroAtual
      : null;

    let situacaoPrevia = "COERENTE";

    if (!possuiOdometro) {
      situacaoPrevia = "NAO_INFORMADO";
    } else if (diferenca < 0) {
      situacaoPrevia =
        "MENOR_QUE_ATUAL";
    } else if (diferenca > 5000) {
      situacaoPrevia =
        "AUMENTO_ELEVADO";
    }

    registrosValidos.push({
      ...registro,

      placa_normalizada:
        placaNormalizada,

      viatura_id: viatura.id,
      prefixo_viatura:
        viatura.prefixo,
      placa_cadastrada:
        viatura.placa,
      cidade_viatura:
        viatura.cidade,
      marca_viatura:
        viatura.marca,
      modelo_viatura:
        viatura.modelo,

      odometro_atual_viatura:
        odometroAtual,

      diferenca_odometro:
        diferenca,

      situacao_previa:
        situacaoPrevia,
    });
  }

  return {
    registrosValidos,
    registrosNaoLocalizados,
  };
}