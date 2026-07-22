require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const oficiosRoutes = require(
  "./routes/oficios"
);

const app = express();

const PORT =
  process.env.PORT || 3001;

/* ============================================
   CONFIGURAÇÃO DE CORS
============================================ */

const origensPermitidas = [
  "http://localhost:5173",
  "http://localhost:5174",
];

app.use(
  cors({
    origin(origin, callback) {
      /*
       * Permite requisições sem origem, como:
       * - navegador acessando diretamente;
       * - Postman;
       * - ferramentas locais;
       */
      if (!origin) {
        return callback(null, true);
      }

      if (
        origensPermitidas.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(
        new Error(
          `Origem não permitida pelo CORS: ${origin}`
        )
      );
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],

    credentials: true,
  })
);

/* ============================================
   MIDDLEWARES
============================================ */

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

/* ============================================
   ARQUIVOS GERADOS
============================================ */

app.use(
  "/arquivos",
  express.static(
    path.join(__dirname, "output")
  )
);

/* ============================================
   ROTAS
============================================ */

app.get("/", (req, res) => {
  return res.status(200).json({
    sistema: "SIGEF 45º BPM",
    status: "Servidor funcionando",
    versao: "1.0.0",
  });
});

app.use(
  "/api/oficios",
  oficiosRoutes
);

/* ============================================
   ROTA NÃO ENCONTRADA
============================================ */

app.use((req, res) => {
  return res.status(404).json({
    sucesso: false,
    mensagem: "Rota não encontrada.",
    rota: req.originalUrl,
  });
});

/* ============================================
   TRATAMENTO DE ERROS
============================================ */

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "Erro não tratado no servidor:",
      error
    );

    if (
      error?.message?.includes(
        "Origem não permitida pelo CORS"
      )
    ) {
      return res.status(403).json({
        sucesso: false,
        mensagem: error.message,
      });
    }

    return res.status(500).json({
      sucesso: false,
      mensagem:
        error?.message ||
        "Erro interno do servidor.",
    });
  }
);

/* ============================================
   INICIALIZAÇÃO
============================================ */

app.listen(PORT, () => {
  console.log("");
  console.log(
    "==================================="
  );
  console.log(" SIGEF 45º BPM");
  console.log(
    "==================================="
  );
  console.log(
    `Servidor iniciado na porta ${PORT}`
  );
  console.log(
    `http://localhost:${PORT}`
  );
  console.log("");
});