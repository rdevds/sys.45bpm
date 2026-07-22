const express = require("express");

const {
  supabase,
} = require("../supabase.js");

const {
  gerarOficioCentralseg,
} = require("../gerar-oficio.js");

const router = express.Router();

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function texto(valor) {
  return String(valor ?? "").trim();
}

function textoMaiusculo(valor) {
  return texto(valor).toUpperCase();
}

function somenteNumeros(valor) {
  return texto(valor).replace(/\D/g, "");
}

function formatarPlaca(valor) {
  const placa = textoMaiusculo(valor).replace(
    /[^A-Z0-9]/g,
    ""
  );

  if (placa.length !== 7) {
    return textoMaiusculo(valor);
  }

  return `${placa.slice(0, 3)}-${placa.slice(3)}`;
}

function montarDadosOficio(
  dadosRecebidos,
  valoresFixos = {}
) {
  return {
    viaturaId: Number(
      dadosRecebidos.viaturaId ||
        dadosRecebidos.viatura_id ||
        valoresFixos.viaturaId
    ),

    placa: formatarPlaca(
      dadosRecebidos.placa ||
        valoresFixos.placa
    ),

    prefixo: somenteNumeros(
      dadosRecebidos.prefixo ||
        valoresFixos.prefixo
    ),

    marcaModelo: textoMaiusculo(
      dadosRecebidos.marcaModelo ||
        dadosRecebidos.marca_modelo ||
        valoresFixos.marcaModelo
    ),

    descricao: texto(
      dadosRecebidos.descricao ||
        valoresFixos.descricao
    ),

    nomeComandante: textoMaiusculo(
      dadosRecebidos.nomeComandante ||
        dadosRecebidos.nome_comandante ||
        valoresFixos.nomeComandante
    ),

    postoComandante: textoMaiusculo(
      dadosRecebidos.postoComandante ||
        dadosRecebidos.posto_comandante ||
        valoresFixos.postoComandante
    ),

    funcaoComandante: textoMaiusculo(
      dadosRecebidos.funcaoComandante ||
        dadosRecebidos.funcao_comandante ||
        valoresFixos.funcaoComandante
    ),

    numero: Number(
      dadosRecebidos.numero ||
        valoresFixos.numero
    ),

    ano: Number(
      dadosRecebidos.ano ||
        valoresFixos.ano ||
        new Date().getFullYear()
    ),
  };
}

function validarDadosOficio(dados) {
  const erros = [];

  if (
    !dados.viaturaId ||
    Number.isNaN(dados.viaturaId)
  ) {
    erros.push(
      "A viatura não foi informada."
    );
  }

  if (!dados.placa) {
    erros.push(
      "A placa da viatura não foi informada."
    );
  }

  if (!dados.prefixo) {
    erros.push(
      "O prefixo da viatura não foi informado."
    );
  }

  if (!dados.marcaModelo) {
    erros.push(
      "A marca e o modelo da viatura não foram informados."
    );
  }

  if (!dados.descricao) {
    erros.push(
      "A descrição do ofício não foi informada."
    );
  }

  if (!dados.nomeComandante) {
    erros.push(
      "O nome do comandante não foi informado."
    );
  }

  if (!dados.postoComandante) {
    erros.push(
      "O posto do comandante não foi informado."
    );
  }

  if (!dados.funcaoComandante) {
    erros.push(
      "A função do comandante não foi informada."
    );
  }

  if (
    !dados.ano ||
    Number.isNaN(dados.ano)
  ) {
    erros.push(
      "O ano do ofício é inválido."
    );
  }

  return erros;
}

function obterBaseUrl() {
  const porta =
    process.env.PORT || 3001;

  return (
    process.env.BACKEND_URL ||
    `http://localhost:${porta}`
  );
}

function montarUrlsArquivos(
  arquivoGerado
) {
  const baseUrl = obterBaseUrl();

  return {
    arquivoDocxUrl:
      `${baseUrl}${arquivoGerado.arquivoDocx}`,

    arquivoPdfUrl:
      `${baseUrl}${arquivoGerado.arquivoPdf}`,
  };
}

/* =========================================================
   CONSULTAR PRÓXIMO NÚMERO
========================================================= */

async function obterProximoNumero(ano) {
  const {
    data,
    error,
  } = await supabase.rpc(
    "proximo_numero_oficio_centralseg",
    {
      p_ano: ano,
    }
  );

  if (error) {
    console.error(
      "Erro ao consultar número do ofício:",
      error
    );

    throw new Error(
      `Não foi possível gerar o número do ofício: ${error.message}`
    );
  }

  const numero = Number(data);

  if (
    !numero ||
    Number.isNaN(numero)
  ) {
    throw new Error(
      "O Supabase retornou um número de ofício inválido."
    );
  }

  return numero;
}

/* =========================================================
   TESTE DA ROTA
   GET /api/oficios
========================================================= */

router.get("/", (req, res) => {
  return res.status(200).json({
    sucesso: true,
    mensagem:
      "Rota de ofícios funcionando.",
  });
});

/* =========================================================
   LISTAR OFÍCIOS
   GET /api/oficios/centralseg
========================================================= */

router.get(
  "/centralseg",
  async (req, res) => {
    try {
      const {
        data,
        error,
      } = await supabase
        .from("oficios_centralseg")
        .select("*")
        .order("ano", {
          ascending: false,
        })
        .order("numero", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      return res.status(200).json({
        sucesso: true,
        oficios: data ?? [],
      });
    } catch (error) {
      console.error(
        "Erro ao listar ofícios:",
        error
      );

      return res.status(500).json({
        sucesso: false,
        mensagem:
          error?.message ||
          "Não foi possível listar os ofícios.",
      });
    }
  }
);

/* =========================================================
   GERAR OFÍCIO CENTRALSEG
   POST /api/oficios/centralseg
========================================================= */

router.post(
  "/centralseg",
  async (req, res) => {
    try {
      const dadosRecebidos =
        req.body ?? {};

      const dadosOficio =
        montarDadosOficio(
          dadosRecebidos
        );

      const erros =
        validarDadosOficio(
          dadosOficio
        );

      if (erros.length > 0) {
        return res.status(400).json({
          sucesso: false,
          mensagem:
            "Existem dados obrigatórios não preenchidos.",
          erros,
        });
      }

      dadosOficio.numero =
        await obterProximoNumero(
          dadosOficio.ano
        );

      const arquivoGerado =
        gerarOficioCentralseg(
          dadosOficio
        );

      const {
        arquivoDocxUrl,
        arquivoPdfUrl,
      } = montarUrlsArquivos(
        arquivoGerado
      );

      const registro = {
        numero:
          dadosOficio.numero,

        ano:
          dadosOficio.ano,

        viatura_id:
          dadosOficio.viaturaId,

        placa:
          dadosOficio.placa,

        prefixo:
          dadosOficio.prefixo,

        marca_modelo:
          dadosOficio.marcaModelo,

        descricao:
          dadosOficio.descricao,

        nome_comandante:
          dadosOficio.nomeComandante,

        posto_comandante:
          dadosOficio.postoComandante,

        funcao_comandante:
          dadosOficio.funcaoComandante,

        arquivo_docx:
          arquivoDocxUrl,

        arquivo_pdf:
          arquivoPdfUrl,
      };

      const {
        data: oficioSalvo,
        error: erroRegistro,
      } = await supabase
        .from("oficios_centralseg")
        .insert(registro)
        .select()
        .single();

      if (erroRegistro) {
        console.error(
          "Erro ao registrar ofício:",
          erroRegistro
        );

        throw erroRegistro;
      }

      return res.status(201).json({
        sucesso: true,

        mensagem:
          "Ofício Centralseg gerado com sucesso.",

        oficio: {
          ...oficioSalvo,

          arquivoDocx:
            arquivoDocxUrl,

          arquivoPdf:
            arquivoPdfUrl,

          nomeArquivo:
            arquivoGerado.nomeArquivoDocx,

          nomeArquivoDocx:
            arquivoGerado.nomeArquivoDocx,

          nomeArquivoPdf:
            arquivoGerado.nomeArquivoPdf,
        },
      });
    } catch (error) {
      console.error(
        "Erro na geração do Ofício Centralseg:",
        error
      );

      if (
        error?.code === "23505" ||
        error?.message?.includes(
          "duplicate key"
        )
      ) {
        return res.status(409).json({
          sucesso: false,
          mensagem:
            "O número deste ofício já foi utilizado. Tente gerar novamente.",
        });
      }

      return res.status(500).json({
        sucesso: false,

        mensagem:
          error?.message ||
          "Não foi possível gerar o Ofício Centralseg.",
      });
    }
  }
);

/* =========================================================
   ATUALIZAR OFÍCIO CENTRALSEG
   PUT /api/oficios/centralseg/:id
========================================================= */

router.put(
  "/centralseg/:id",
  async (req, res) => {
    try {
      const id = Number(
        req.params.id
      );

      if (
        !id ||
        Number.isNaN(id)
      ) {
        return res.status(400).json({
          sucesso: false,
          mensagem:
            "Identificador do ofício inválido.",
        });
      }

      const {
        data: oficioExistente,
        error: erroBusca,
      } = await supabase
        .from("oficios_centralseg")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (erroBusca) {
        throw erroBusca;
      }

      if (!oficioExistente) {
        return res.status(404).json({
          sucesso: false,
          mensagem:
            "Ofício não encontrado.",
        });
      }

      const dadosRecebidos =
        req.body ?? {};

      const dadosOficio =
        montarDadosOficio(
          dadosRecebidos,
          {
            viaturaId:
              oficioExistente.viatura_id,

            placa:
              oficioExistente.placa,

            prefixo:
              oficioExistente.prefixo,

            marcaModelo:
              oficioExistente.marca_modelo,

            descricao:
              oficioExistente.descricao,

            nomeComandante:
              oficioExistente.nome_comandante,

            postoComandante:
              oficioExistente.posto_comandante,

            funcaoComandante:
              oficioExistente.funcao_comandante,

            numero:
              oficioExistente.numero,

            ano:
              oficioExistente.ano,
          }
        );

      /*
       * O número e o ano sempre permanecem iguais
       * aos do registro original.
       */
      dadosOficio.numero =
        Number(
          oficioExistente.numero
        );

      dadosOficio.ano =
        Number(
          oficioExistente.ano
        );

      const erros =
        validarDadosOficio(
          dadosOficio
        );

      if (erros.length > 0) {
        return res.status(400).json({
          sucesso: false,
          mensagem:
            "Existem dados obrigatórios não preenchidos.",
          erros,
        });
      }

      /*
       * Regenera DOCX e PDF usando o mesmo
       * número e o mesmo ano.
       */
      const arquivoGerado =
        gerarOficioCentralseg(
          dadosOficio
        );

      const {
        arquivoDocxUrl,
        arquivoPdfUrl,
      } = montarUrlsArquivos(
        arquivoGerado
      );

      const atualizacao = {
        viatura_id:
          dadosOficio.viaturaId,

        placa:
          dadosOficio.placa,

        prefixo:
          dadosOficio.prefixo,

        marca_modelo:
          dadosOficio.marcaModelo,

        descricao:
          dadosOficio.descricao,

        nome_comandante:
          dadosOficio.nomeComandante,

        posto_comandante:
          dadosOficio.postoComandante,

        funcao_comandante:
          dadosOficio.funcaoComandante,

        arquivo_docx:
          arquivoDocxUrl,

        arquivo_pdf:
          arquivoPdfUrl,
      };

      const {
        data: oficioAtualizado,
        error: erroAtualizacao,
      } = await supabase
        .from("oficios_centralseg")
        .update(atualizacao)
        .eq("id", id)
        .select()
        .single();

      if (erroAtualizacao) {
        console.error(
          "Erro ao atualizar ofício:",
          erroAtualizacao
        );

        throw erroAtualizacao;
      }

      return res.status(200).json({
        sucesso: true,

        mensagem:
          "Ofício Centralseg atualizado com sucesso.",

        oficio: {
          ...oficioAtualizado,

          arquivoDocx:
            arquivoDocxUrl,

          arquivoPdf:
            arquivoPdfUrl,

          nomeArquivo:
            arquivoGerado.nomeArquivoDocx,

          nomeArquivoDocx:
            arquivoGerado.nomeArquivoDocx,

          nomeArquivoPdf:
            arquivoGerado.nomeArquivoPdf,
        },
      });
    } catch (error) {
      console.error(
        "Erro na atualização do Ofício Centralseg:",
        error
      );

      return res.status(500).json({
        sucesso: false,

        mensagem:
          error?.message ||
          "Não foi possível atualizar o Ofício Centralseg.",
      });
    }
  }
);

module.exports = router;