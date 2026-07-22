const fs = require("fs");
const path = require("path");
const os = require("os");
const {
  execFileSync,
} = require("child_process");

const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function garantirTexto(valor) {
  return String(valor ?? "").trim();
}

function garantirPasta(pasta) {
  if (!fs.existsSync(pasta)) {
    fs.mkdirSync(pasta, {
      recursive: true,
    });
  }
}

function removerArquivoSeExistir(
  caminhoArquivo
) {
  if (!fs.existsSync(caminhoArquivo)) {
    return;
  }

  try {
    fs.unlinkSync(caminhoArquivo);
  } catch (error) {
    throw new Error(
      `Não foi possível substituir o arquivo ${path.basename(
        caminhoArquivo
      )}. Feche o arquivo caso esteja aberto e tente novamente.`
    );
  }
}

function localizarLibreOffice() {
  const caminhosPossiveis = [
    process.env.LIBREOFFICE_PATH,

    "C:\\Program Files\\LibreOffice\\program\\soffice.com",

    "C:\\Program Files\\LibreOffice\\program\\soffice.exe",

    "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.com",

    "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
  ].filter(Boolean);

  const caminhoEncontrado =
    caminhosPossiveis.find((caminho) =>
      fs.existsSync(caminho)
    );

  if (!caminhoEncontrado) {
    throw new Error(
      "LibreOffice não encontrado. Verifique LIBREOFFICE_PATH no arquivo .env."
    );
  }

  return caminhoEncontrado;
}

/**
 * Converte um caminho do Windows para uma URI aceita
 * pelo LibreOffice.
 *
 * Exemplo:
 * C:\Temp\perfil
 * file:///C:/Temp/perfil
 */
function caminhoParaFileUri(caminho) {
  const caminhoResolvido =
    path.resolve(caminho);

  return `file:///${caminhoResolvido
    .replace(/\\/g, "/")
    .replace(/ /g, "%20")}`;
}

function removerPastaTemporaria(pasta) {
  if (!pasta) {
    return;
  }

  try {
    fs.rmSync(pasta, {
      recursive: true,
      force: true,
    });
  } catch (error) {
    console.warn(
      `Não foi possível remover a pasta temporária ${pasta}:`,
      error?.message
    );
  }
}

/* =========================================================
   CONVERSÃO DOCX → PDF
========================================================= */

function converterDocxParaPdf({
  caminhoDocx,
  outputDir,
}) {
  console.log("");
  console.log(
    "=================================="
  );
  console.log(
    "INICIANDO CONVERSÃO PARA PDF"
  );
  console.log(
    `DOCX: ${caminhoDocx}`
  );
  console.log(
    `OUTPUT: ${outputDir}`
  );
  console.log(
    "=================================="
  );

  const libreOfficePath =
    localizarLibreOffice();

  garantirPasta(outputDir);

  if (!fs.existsSync(caminhoDocx)) {
    throw new Error(
      `Arquivo DOCX não encontrado: ${caminhoDocx}`
    );
  }

  const nomeBase =
    path.parse(caminhoDocx).name;

  const nomeArquivoPdf =
    `${nomeBase}.pdf`;

  const caminhoPdfFinal = path.join(
    outputDir,
    nomeArquivoPdf
  );

  /*
   * Cria um perfil exclusivo do LibreOffice.
   * Isso evita conflito com outra instância aberta.
   */
  const pastaPerfil = fs.mkdtempSync(
    path.join(
      os.tmpdir(),
      "sigef-libreoffice-profile-"
    )
  );

  /*
   * Cria uma pasta exclusiva para receber a conversão.
   * Depois o PDF é copiado para backend/output.
   */
  const pastaConversao = fs.mkdtempSync(
    path.join(
      os.tmpdir(),
      "sigef-libreoffice-output-"
    )
  );

  const perfilUri =
    caminhoParaFileUri(pastaPerfil);

  const caminhoPdfTemporario =
    path.join(
      pastaConversao,
      nomeArquivoPdf
    );

  /*
   * Evita conflito entre variáveis do Python do Windows
   * e as bibliotecas internas do LibreOffice.
   */
  const ambiente = {
    ...process.env,
  };

  delete ambiente.PYTHONHOME;
  delete ambiente.PYTHONPATH;

  console.log(
    `LibreOffice: ${libreOfficePath}`
  );
  console.log(
    `Perfil temporário: ${pastaPerfil}`
  );
  console.log(
    `Pasta temporária do PDF: ${pastaConversao}`
  );

  try {
    const resultado = execFileSync(
      libreOfficePath,
      [
        `-env:UserInstallation=${perfilUri}`,
        "--headless",
        "--invisible",
        "--nodefault",
        "--nolockcheck",
        "--nologo",
        "--nofirststartwizard",
        "--convert-to",
        "pdf:writer_pdf_Export",
        "--outdir",
        pastaConversao,
        caminhoDocx,
      ],
      {
        encoding: "utf8",
        windowsHide: true,
        timeout: 120000,
        maxBuffer:
          10 * 1024 * 1024,
        env: ambiente,
      }
    );

    if (resultado?.trim()) {
      console.log(
        "Resposta do LibreOffice:"
      );
      console.log(
        resultado.trim()
      );
    }

    console.log(
      "LIBREOFFICE FINALIZOU"
    );

    if (
      !fs.existsSync(
        caminhoPdfTemporario
      )
    ) {
      const arquivosTemporarios =
        fs.existsSync(pastaConversao)
          ? fs.readdirSync(
              pastaConversao
            )
          : [];

      console.error(
        "Arquivos encontrados na pasta temporária:",
        arquivosTemporarios
      );

      throw new Error(
        "O LibreOffice terminou a execução, mas não criou o PDF."
      );
    }

    const dadosPdfTemporario =
      fs.statSync(
        caminhoPdfTemporario
      );

    if (
      dadosPdfTemporario.size === 0
    ) {
      throw new Error(
        "O PDF criado pelo LibreOffice está vazio."
      );
    }

    removerArquivoSeExistir(
      caminhoPdfFinal
    );

    fs.copyFileSync(
      caminhoPdfTemporario,
      caminhoPdfFinal
    );

    if (
      !fs.existsSync(
        caminhoPdfFinal
      )
    ) {
      throw new Error(
        "O PDF foi convertido, mas não pôde ser salvo na pasta output."
      );
    }

    const dadosPdfFinal =
      fs.statSync(
        caminhoPdfFinal
      );

    if (dadosPdfFinal.size === 0) {
      removerArquivoSeExistir(
        caminhoPdfFinal
      );

      throw new Error(
        "O PDF final está vazio."
      );
    }

    console.log(
      `PDF GERADO: ${caminhoPdfFinal}`
    );
    console.log(
      `TAMANHO: ${dadosPdfFinal.size} bytes`
    );
    console.log(
      "=================================="
    );
    console.log("");

    return caminhoPdfFinal;
  } catch (error) {
    const stdout =
      error?.stdout
        ?.toString?.()
        .trim();

    const stderr =
      error?.stderr
        ?.toString?.()
        .trim();

    console.error(
      "Erro na conversão do PDF:"
    );

    if (stdout) {
      console.error(
        "Saída:",
        stdout
      );
    }

    if (stderr) {
      console.error(
        "Detalhes:",
        stderr
      );
    }

    console.error(
      "Mensagem:",
      error?.message
    );

    throw new Error(
      error?.message ||
        "O DOCX foi criado, mas o LibreOffice não conseguiu convertê-lo para PDF."
    );
  } finally {
    removerPastaTemporaria(
      pastaPerfil
    );

    removerPastaTemporaria(
      pastaConversao
    );
  }
}

/* =========================================================
   GERAR OFÍCIO CENTRALSEG
========================================================= */

function gerarOficioCentralseg(
  dadosOficio
) {
  const templatePath = path.join(
    __dirname,
    "templates",
    "oficio-centralseg-template.docx"
  );

  const outputDir = path.join(
    __dirname,
    "output"
  );

  if (!fs.existsSync(templatePath)) {
    throw new Error(
      `Template não encontrado em: ${templatePath}`
    );
  }

  const templateInfo =
    fs.statSync(templatePath);

  if (templateInfo.size === 0) {
    throw new Error(
      "O arquivo de template está vazio."
    );
  }

  garantirPasta(outputDir);

  const numero = garantirTexto(
    dadosOficio.numero
  );

  const ano = garantirTexto(
    dadosOficio.ano
  );

  if (!numero) {
    throw new Error(
      "O número do ofício não foi informado."
    );
  }

  if (!ano) {
    throw new Error(
      "O ano do ofício não foi informado."
    );
  }

  const nomeBase =
    `Oficio_Centralseg_${numero}_${ano}`;

  const nomeArquivoDocx =
    `${nomeBase}.docx`;

  const nomeArquivoPdf =
    `${nomeBase}.pdf`;

  const caminhoDocx = path.join(
    outputDir,
    nomeArquivoDocx
  );

  const caminhoPdf = path.join(
    outputDir,
    nomeArquivoPdf
  );

  removerArquivoSeExistir(
    caminhoDocx
  );

  removerArquivoSeExistir(
    caminhoPdf
  );

  const content = fs.readFileSync(
    templatePath,
    "binary"
  );

  const zip = new PizZip(content);

  const doc = new Docxtemplater(
    zip,
    {
      paragraphLoop: true,
      linebreaks: true,

      nullGetter() {
        return "";
      },
    }
  );

  const marcaModelo =
    dadosOficio.marcaModelo ||
    dadosOficio.marca_modelo ||
    "";

  const nomeComandante =
    dadosOficio.nomeComandante ||
    dadosOficio.nome_comandante ||
    "";

  const postoComandante =
    dadosOficio.postoComandante ||
    dadosOficio.posto_comandante ||
    "";

  const funcaoComandante =
    dadosOficio.funcaoComandante ||
    dadosOficio.funcao_comandante ||
    "";

  doc.render({
    numero,
    ano,

    placa: garantirTexto(
      dadosOficio.placa
    ),

    prefixo: garantirTexto(
      dadosOficio.prefixo
    ),

    marca_modelo:
      garantirTexto(marcaModelo),

    descricao:
      garantirTexto(
        dadosOficio.descricao
      ),

    nome_comandante:
      garantirTexto(
        nomeComandante
      ),

    posto_comandante:
      garantirTexto(
        postoComandante
      ),

    funcao_comandante:
      garantirTexto(
        funcaoComandante
      ),
  });

  const buffer = doc
    .getZip()
    .generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

  fs.writeFileSync(
    caminhoDocx,
    buffer
  );

  if (!fs.existsSync(caminhoDocx)) {
    throw new Error(
      "O arquivo DOCX não foi criado."
    );
  }

  const informacoesDocx =
    fs.statSync(
      caminhoDocx
    );

  if (
    informacoesDocx.size === 0
  ) {
    throw new Error(
      "O DOCX gerado está vazio."
    );
  }

  console.log(
    `DOCX gerado com sucesso: ${caminhoDocx}`
  );
  console.log(
    `Tamanho do DOCX: ${informacoesDocx.size} bytes`
  );

  const caminhoPdfGerado =
    converterDocxParaPdf({
      caminhoDocx,
      outputDir,
    });

  return {
    numero: Number(numero),
    ano: Number(ano),

    nomeArquivo:
      nomeArquivoDocx,

    nomeArquivoDocx,
    nomeArquivoPdf,

    caminhoArquivo:
      caminhoDocx,

    caminhoDocx,

    caminhoPdf:
      caminhoPdfGerado,

    arquivoDocx:
      `/arquivos/${nomeArquivoDocx}`,

    arquivoPdf:
      `/arquivos/${nomeArquivoPdf}`,
  };
}

module.exports = {
  gerarOficioCentralseg,
};