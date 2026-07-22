import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Pencil,
  RefreshCw,
  Search,
  Sheet,
  UserRound,
} from "lucide-react";

import { listarMilitares } from "../../../services/militaresService";

import NovoMilitarModal from "./NovoMilitarModal";

import "./ListaMilitares.css";

function somenteNumeros(valor = "") {
  return String(valor || "").replace(/\D/g, "");
}

function formatarNumeroPolicia(valor = "") {
  const numeros = somenteNumeros(valor).slice(0, 7);

  if (numeros.length <= 3) {
    return numeros;
  }

  if (numeros.length <= 6) {
    return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
  }

  return `${numeros.slice(0, 3)}.${numeros.slice(
    3,
    6
  )}-${numeros.slice(6)}`;
}

function formatarCpf(valor = "") {
  const numeros = somenteNumeros(valor).slice(0, 11);

  if (numeros.length !== 11) {
    return valor || "-";
  }

  return `${numeros.slice(0, 3)}.${numeros.slice(
    3,
    6
  )}.${numeros.slice(6, 9)}-${numeros.slice(9)}`;
}

function formatarData(valor) {
  if (!valor) {
    return "-";
  }

  const data = new Date(`${valor}T00:00:00`);

  if (Number.isNaN(data.getTime())) {
    return "-";
  }

  return data.toLocaleDateString("pt-BR");
}

function cnhVencida(validade) {
  if (!validade) {
    return false;
  }

  const dataValidade = new Date(`${validade}T23:59:59`);

  if (Number.isNaN(dataValidade.getTime())) {
    return false;
  }

  return dataValidade < new Date();
}

function ListaMilitares() {
  const navigate = useNavigate();

  const [militares, setMilitares] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [militarEmEdicao, setMilitarEmEdicao] =
    useState(null);

  useEffect(() => {
    carregarMilitares();
  }, []);

  async function carregarMilitares() {
    try {
      setCarregando(true);
      setErro("");

      const dados = await listarMilitares();

      setMilitares(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error("Erro ao carregar militares:", error);

      setErro(
        error?.message ||
          "NÃO FOI POSSÍVEL CARREGAR OS MILITARES."
      );
    } finally {
      setCarregando(false);
    }
  }

  function abrirEdicao(militar) {
    setMilitarEmEdicao(militar);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setMilitarEmEdicao(null);
  }

  async function concluirSalvamento() {
    fecharModal();
    await carregarMilitares();
  }

  const militaresFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toUpperCase();
    const termoNumerico = somenteNumeros(pesquisa);

    if (!termo) {
      return militares;
    }

    return militares.filter((militar) => {
      const texto = [
        militar.numero_policia,
        formatarNumeroPolicia(militar.numero_policia),
        militar.nome_policia,
        militar.nome,
        militar.graduacao,
        militar.cpf,
        formatarCpf(militar.cpf),
        militar.email,
        militar.telefone,
        militar.cidade,
        militar.fracao,
        militar.funcao,
        militar.categoria_cnh,
        militar.perfil_sistema,
      ]
        .filter(Boolean)
        .join(" ")
        .toUpperCase();

      const numeroPolicia = somenteNumeros(
        militar.numero_policia
      );

      const cpf = somenteNumeros(militar.cpf);

      return (
        texto.includes(termo) ||
        (termoNumerico &&
          (numeroPolicia.includes(termoNumerico) ||
            cpf.includes(termoNumerico)))
      );
    });
  }, [militares, pesquisa]);

  return (
    <main className="lista-militares-page">
      <section className="lista-militares-container">
        <header className="lista-militares-cabecalho">
          <div>
            <button
              type="button"
              className="lista-militares-voltar"
              onClick={() => navigate("/militares")}
            >
              <ArrowLeft size={18} />
              Voltar para militares
            </button>

            <span className="lista-militares-etiqueta">
              ADMINISTRATIVO
            </span>

            <h1>Planilha de Militares</h1>

            <p>
              Consulta completa dos militares cadastrados no
              SiGeF.
            </p>
          </div>

          <button
            type="button"
            className="lista-militares-atualizar"
            onClick={carregarMilitares}
            disabled={carregando}
          >
            <RefreshCw
              size={18}
              className={
                carregando
                  ? "lista-militares-girando"
                  : ""
              }
            />

            {carregando ? "Atualizando..." : "Atualizar"}
          </button>
        </header>

        <section className="lista-militares-resumo">
          <div>
            <Sheet size={20} />

            <span>
              <strong>{militaresFiltrados.length}</strong>
              registro(s) exibido(s)
            </span>
          </div>

          <label className="lista-militares-pesquisa">
            <Search size={19} />

            <input
              type="text"
              value={pesquisa}
              onChange={(event) =>
                setPesquisa(event.target.value)
              }
              placeholder="Pesquisar por nome, número de polícia, CPF, cidade, fração ou função..."
            />
          </label>
        </section>

        {erro && (
          <div className="lista-militares-mensagem lista-militares-erro">
            {erro}
          </div>
        )}

        {carregando && (
          <div className="lista-militares-mensagem">
            Carregando militares...
          </div>
        )}

        {!carregando &&
          !erro &&
          militaresFiltrados.length === 0 && (
            <div className="lista-militares-vazio">
              <UserRound size={44} />

              <h2>Nenhum militar encontrado</h2>

              <p>
                Altere os termos da pesquisa ou cadastre um novo
                militar.
              </p>
            </div>
          )}

        {!carregando &&
          !erro &&
          militaresFiltrados.length > 0 && (
            <section className="lista-militares-tabela-card">
              <div className="lista-militares-tabela-scroll">
                <table className="lista-militares-tabela">
                  <thead>
                    <tr>
                      <th>Nº de Polícia</th>
                      <th>Nome de Polícia</th>
                      <th>Nome Completo</th>
                      <th>Graduação</th>
                      <th>CPF</th>
                      <th>E-mail</th>
                      <th>Telefone</th>
                      <th>Cidade</th>
                      <th>Lotação</th>
                      <th>Função</th>
                      <th>CNH</th>
                      <th>Validade CNH</th>
                      <th>Perfil</th>
                      <th>Acesso</th>
                      <th>Situação</th>
                      <th>Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {militaresFiltrados.map((militar) => {
                      const vencida = cnhVencida(
                        militar.validade_cnh
                      );

                      return (
                        <tr
                          key={militar.id}
                          className={
                            !militar.ativo
                              ? "lista-militar-inativo"
                              : vencida
                                ? "lista-militar-cnh-vencida"
                                : ""
                          }
                        >
                          <td className="lista-numero-policia">
                            {formatarNumeroPolicia(
                              militar.numero_policia
                            )}
                          </td>

                          <td className="lista-nome-policia">
                            {militar.nome_policia || "-"}
                          </td>

                          <td>{militar.nome || "-"}</td>

                          <td>
                            {militar.graduacao || "-"}
                          </td>

                          <td>{formatarCpf(militar.cpf)}</td>

                          <td className="lista-email">
                            {militar.email || "-"}
                          </td>

                          <td>{militar.telefone || "-"}</td>

                          <td>{militar.cidade || "-"}</td>

                          <td>{militar.fracao || "-"}</td>

                          <td>{militar.funcao || "-"}</td>

                          <td>
                            {militar.categoria_cnh || "-"}
                          </td>

                          <td>
                            <span
                              className={
                                vencida
                                  ? "lista-cnh-vencida"
                                  : ""
                              }
                            >
                              {formatarData(
                                militar.validade_cnh
                              )}
                            </span>
                          </td>

                          <td>
                            <span className="lista-perfil">
                              {militar.perfil_sistema ||
                                "CONSULTA"}
                            </span>
                          </td>

                          <td>
                            <span
                              className={
                                militar.acesso_sistema
                                  ? "lista-sim"
                                  : "lista-nao"
                              }
                            >
                              {militar.acesso_sistema
                                ? "SIM"
                                : "NÃO"}
                            </span>
                          </td>

                          <td>
                            <span
                              className={
                                militar.ativo
                                  ? "lista-status lista-status-ativo"
                                  : "lista-status lista-status-inativo"
                              }
                            >
                              {militar.ativo
                                ? "ATIVO"
                                : "INATIVO"}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="lista-editar"
                              onClick={() =>
                                abrirEdicao(militar)
                              }
                            >
                              <Pencil size={15} />
                              Editar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

        <NovoMilitarModal
          aberto={modalAberto}
          militarEmEdicao={militarEmEdicao}
          aoFechar={fecharModal}
          aoSalvar={concluirSalvamento}
        />
      </section>
    </main>
  );
}

export default ListaMilitares;