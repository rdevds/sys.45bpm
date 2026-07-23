import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Edit3,
  Plus,
  Power,
  Search,
  Truck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  alterarStatusModeloViatura,
  buscarModelosViaturas,
} from "../../services/modelosViaturasService.js";

import ModeloViaturaModal from "./components/ModeloViaturaModal.jsx";
import "./ModelosViaturas.css";

function texto(valor) {
  return String(valor ?? "").trim().toUpperCase();
}

function formatarNumero(valor, casas = 0) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) return "-";

  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

function ModelosViaturas() {
  const navigate = useNavigate();

  const [modelos, setModelos] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [modeloEdicao, setModeloEdicao] = useState(null);

  useEffect(() => {
    carregarModelos();
  }, []);

  async function carregarModelos() {
    try {
      setCarregando(true);
      setErro("");

      const dados = await buscarModelosViaturas();
      setModelos(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error("Erro ao carregar modelos:", error);
      setErro(
        error?.message ||
          "NÃO FOI POSSÍVEL CARREGAR OS MODELOS."
      );
    } finally {
      setCarregando(false);
    }
  }

  function abrirNovo() {
    setModeloEdicao(null);
    setModalAberto(true);
  }

  function abrirEdicao(modelo) {
    setModeloEdicao(modelo);
    setModalAberto(true);
  }

  function fecharModal() {
    setModeloEdicao(null);
    setModalAberto(false);
  }

  async function modeloSalvo() {
    fecharModal();
    await carregarModelos();
  }

  async function alternarStatus(modelo) {
    try {
      setErro("");

      await alterarStatusModeloViatura(
        modelo.id,
        !modelo.ativo
      );

      await carregarModelos();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      setErro(
        error?.message ||
          "NÃO FOI POSSÍVEL ALTERAR O STATUS."
      );
    }
  }

  const modelosFiltrados = useMemo(() => {
    const termo = texto(pesquisa);

    if (!termo) return modelos;

    return modelos.filter((modelo) =>
      [
        modelo.marca,
        modelo.modelo,
        modelo.ano,
        modelo.combustivel,
        modelo.tipo,
        modelo.pneus,
        modelo.especificacao_oleo,
      ]
        .filter(Boolean)
        .join(" ")
        .toUpperCase()
        .includes(termo)
    );
  }, [modelos, pesquisa]);

  const ativos = modelos.filter((modelo) => modelo.ativo).length;

  return (
    <main className="modelos-vtr-page">
      <section className="modelos-vtr-container">
        <header className="modelos-vtr-header">
          <div>
            <button
              type="button"
              className="modelos-vtr-voltar"
              onClick={() => navigate("/administrativo/viaturas")}
            >
              <ArrowLeft size={17} />
              Voltar para frota
            </button>

            <span>CADASTRO AUXILIAR</span>
            <h1>Modelos de Viaturas</h1>
            <p>
              Padronização dos dados técnicos utilizados pelas viaturas.
            </p>
          </div>

          <button
            type="button"
            className="modelos-vtr-novo"
            onClick={abrirNovo}
          >
            <Plus size={18} />
            Novo modelo
          </button>
        </header>

        <section className="modelos-vtr-indicadores">
          <article>
            <span>Total</span>
            <strong>{modelos.length}</strong>
          </article>

          <article>
            <span>Ativos</span>
            <strong>{ativos}</strong>
          </article>

          <article>
            <span>Inativos</span>
            <strong>{modelos.length - ativos}</strong>
          </article>
        </section>

        <label className="modelos-vtr-pesquisa">
          <Search size={18} />
          <input
            type="text"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar por marca, modelo, ano, combustível ou pneu..."
          />
        </label>

        {erro && (
          <div className="modelo-vtr-erro" role="alert">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="modelos-vtr-mensagem">
            Carregando modelos...
          </div>
        ) : modelosFiltrados.length === 0 ? (
          <div className="modelos-vtr-mensagem">
            Nenhum modelo encontrado.
          </div>
        ) : (
          <section className="modelos-vtr-lista">
            {modelosFiltrados.map((modelo) => (
              <article
                key={modelo.id}
                className={`modelo-vtr-card ${
                  modelo.ativo ? "" : "inativo"
                }`}
              >
                <header>
                  <div>
                    <span
                      className={`modelo-vtr-status ${
                        modelo.ativo ? "ativo" : "inativo"
                      }`}
                    >
                      {modelo.ativo ? "ATIVO" : "INATIVO"}
                    </span>

                    <h2>
                      {modelo.marca} {modelo.modelo}
                    </h2>

                    <p>Ano {modelo.ano}</p>
                  </div>

                  <Truck size={30} />
                </header>

                <div className="modelo-vtr-dados">
                  <div>
                    <span>Combustível</span>
                    <strong>{modelo.combustivel}</strong>
                  </div>

                  <div>
                    <span>Tipo</span>
                    <strong>{modelo.tipo}</strong>
                  </div>

                  <div>
                    <span>Pneus</span>
                    <strong>{modelo.pneus}</strong>
                  </div>

                  <div>
                    <span>Cárter</span>
                    <strong>
                      {formatarNumero(modelo.capacidade_carter, 2)} L
                    </strong>
                  </div>

                  <div>
                    <span>Óleo</span>
                    <strong>{modelo.especificacao_oleo}</strong>
                  </div>

                  <div>
                    <span>Tanque</span>
                    <strong>
                      {formatarNumero(modelo.capacidade_tanque, 2)} L
                    </strong>
                  </div>

                  <div>
                    <span>Troca de óleo</span>
                    <strong>
                      {formatarNumero(modelo.frequencia_troca_oleo)} KM
                    </strong>
                  </div>
                </div>

                <footer>
                  <button
                    type="button"
                    onClick={() => abrirEdicao(modelo)}
                  >
                    <Edit3 size={16} />
                    Editar
                  </button>

                  <button
                    type="button"
                    className={modelo.ativo ? "desativar" : "ativar"}
                    onClick={() => alternarStatus(modelo)}
                  >
                    <Power size={16} />
                    {modelo.ativo ? "Desativar" : "Ativar"}
                  </button>
                </footer>
              </article>
            ))}
          </section>
        )}
      </section>

      {modalAberto && (
        <ModeloViaturaModal
          modeloEdicao={modeloEdicao}
          onFechar={fecharModal}
          onSalvo={modeloSalvo}
        />
      )}
    </main>
  );
}

export default ModelosViaturas;