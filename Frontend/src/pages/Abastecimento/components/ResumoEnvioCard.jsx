import { useState } from "react";
import { salvarAbastecimento } from "../../../services/abastecimentosService";

function ResumoEnvioCard({
  motorista = {},
  cidadeAbastecimento = "",
  viatura = {},
  convenenteDoador = {},
  dadosAbastecimento = {},
  responsavelEnvio = {},
}) {
  const [enviado, setEnviado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [registroSalvo, setRegistroSalvo] = useState(null);

  function numero(valor) {
    return Number(String(valor || "0").replace(",", "."));
  }

  const total = Number(dadosAbastecimento?.valorTotalCalculado || 0);

  async function enviarAbastecimento() {
    try {
      setSalvando(true);

      const odometroAnterior = numero(
        dadosAbastecimento?.odometroAnterior || viatura?.odometro
      );

      const odometroAtual = numero(dadosAbastecimento?.odometro);

      const abastecimento = {
        motorista_id: motorista?.id || null,
        viatura_id: viatura?.id || null,
        convenente_id: convenenteDoador?.id || null,

        responsavel_id:
          responsavelEnvio?.tipo === "CONDUTOR"
            ? motorista?.id || null
            : responsavelEnvio?.militar?.id || null,

        numero_policia:
          motorista?.numero_policia || motorista?.numeroPolicia || "",

        motorista_nome: motorista?.nome || "",
        motorista_cpf: motorista?.cpf || "",
        motorista_email: motorista?.email || "",
        motorista_telefone: motorista?.telefone || "",

        prefixo: viatura?.prefixo || "",
        placa: viatura?.placa || "",
        marca: viatura?.marca || "",
        modelo: viatura?.modelo || "",
        unidade_frota: viatura?.unidadeFrota || "",
        cidade_viatura: viatura?.cidade || "",
        /*situacao_viatura: viatura?.situacao || "",*/

        cidade_abastecimento: cidadeAbastecimento,

        convenente_nome: convenenteDoador?.nome || "",
        tipo_abastecimento: convenenteDoador?.tipo || "",

        combustivel:
          dadosAbastecimento?.combustivel || viatura?.combustivel || "",

        data_hora: dadosAbastecimento?.dataHora || new Date().toISOString(),

        odometro_anterior: odometroAnterior,
        odometro_atual: odometroAtual,
        odometro: odometroAtual,

        km_rodados: numero(dadosAbastecimento?.kmRodados),

        litros: numero(dadosAbastecimento?.litros),
        valor_unitario: numero(dadosAbastecimento?.valorUnitario),
        /*valor_total: total,*/

        media_km_litro: numero(dadosAbastecimento?.mediaKmLitro),
        custo_por_km: numero(dadosAbastecimento?.custoPorKm),

        status_lancamento: "RECEBIDO",
        origem_dados: "FORMULARIO",
      };

      const salvo = await salvarAbastecimento(abastecimento);

      setRegistroSalvo(salvo);
      setEnviado(true);
    } catch (error) {
      console.error("ERRO SUPABASE COMPLETO:", error);

      alert(
        `Erro Supabase:\n\n${error?.message || "Sem mensagem"}\n\n${
          error?.details || ""
        }\n${error?.hint || ""}`
      );
    } finally {
      setSalvando(false);
    }
  }

  if (enviado) {
    return (
      <section className="form-card resumo-envio-card resumo-sucesso">
        <div className="resumo-sucesso-icone">✅</div>

        <h2>ABASTECIMENTO REGISTRADO</h2>

        {registroSalvo?.numero_abastecimento && (
          <p className="resumo-sucesso-texto">
            Nº {registroSalvo.numero_abastecimento}
          </p>
        )}

        <p className="resumo-sucesso-texto">
          TUDO CERTO! O REGISTRO FOI SALVO COM SUCESSO.
        </p>

        <div className="acoes-final">
          <button
            className="botao-enviar efeito-lamina"
            onClick={() => window.location.reload()}
          >
            🔄 NOVO ABASTECIMENTO
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="form-card resumo-envio-card">
      <h2 className="titulo-conferencia">🧾 CONFERÊNCIA FINAL</h2>

      <div className="resumo-container-dados">
        <div className="resumo-linha">
          <span className="resumo-label">👮 NOME:</span>
          <strong className="resumo-valor">{motorista?.nome}</strong>
        </div>

        <div className="resumo-linha">
          <span className="resumo-label">📍 CIDADE:</span>
          <strong className="resumo-valor">{cidadeAbastecimento}</strong>
        </div>

        <div className="resumo-linha">
          <span className="resumo-label">🚓 VIATURA:</span>
          <strong className="resumo-valor">
            {viatura?.prefixo} · {viatura?.placa} · {viatura?.modelo}
          </strong>
        </div>

        <div className="resumo-linha">
          <span className="resumo-label">🏢 LOTAÇÃO:</span>
          <strong className="resumo-valor">{viatura?.lotacao}</strong>
        </div>

        <div className="resumo-linha">
          <span className="resumo-label">📌 SITUAÇÃO:</span>
          <strong className="resumo-valor">{viatura?.situacao}</strong>
        </div>

        <div className="resumo-linha">
          <span className="resumo-label">🤝 CONVENENTE/DOADOR:</span>
          <strong className="resumo-valor">{convenenteDoador?.nome}</strong>
        </div>

        <div className="resumo-linha">
          <span className="resumo-label">🏷️ TIPO:</span>
          <strong className="resumo-valor">{convenenteDoador?.tipo}</strong>
        </div>

        <div className="resumo-linha">
          <span className="resumo-label">⛽ COMBUSTÍVEL:</span>
          <strong className="resumo-valor">
            {dadosAbastecimento?.combustivel || viatura?.combustivel}
          </strong>
        </div>

        <div className="resumo-linha">
          <span className="resumo-label">🔙 ODÔMETRO ANTERIOR:</span>
          <strong className="resumo-valor">
            {dadosAbastecimento?.odometroAnterior || viatura?.odometro} KM
          </strong>
        </div>

        <div className="resumo-linha">
          <span className="resumo-label">🛣️ ODÔMETRO ATUAL:</span>
          <strong className="resumo-valor">
            {dadosAbastecimento?.odometro} KM
          </strong>
        </div>

        <div className="resumo-linha">
          <span className="resumo-label">🛢️ LITROS:</span>
          <strong className="resumo-valor">
            {dadosAbastecimento?.litros} L
          </strong>
        </div>

        <div className="resumo-linha">
          <span className="resumo-label">💲 VALOR UNITÁRIO:</span>
          <strong className="resumo-valor">
            R$ {dadosAbastecimento?.valorUnitario}
          </strong>
        </div>

        <div className="resumo-linha">
          <span className="resumo-label">🛣 KM RODADOS:</span>
          <strong className="resumo-valor">
            {dadosAbastecimento?.kmRodados} KM
          </strong>
        </div>

        <div className="resumo-linha">
          <span className="resumo-label">📈 MÉDIA:</span>
          <strong className="resumo-valor">
            {Number(dadosAbastecimento?.mediaKmLitro || 0).toFixed(2)} KM/L
          </strong>
        </div>

        <div className="resumo-linha">
          <span className="resumo-label">💰 CUSTO POR KM:</span>
          <strong className="resumo-valor">
            R$ {Number(dadosAbastecimento?.custoPorKm || 0).toFixed(2)}
          </strong>
        </div>

        <div className="resumo-linha">
          <span className="resumo-label">🧍 RESPONSÁVEL:</span>
          <strong className="resumo-valor">
            {responsavelEnvio?.tipo === "CONDUTOR"
              ? "CONDUTOR"
              : responsavelEnvio?.militar?.nome}
          </strong>
        </div>
      </div>

      <div className="resumo-total">
        <span className="total-label">💵 TOTAL:</span>
        <strong className="total-valor">R$ {total.toFixed(2)}</strong>
      </div>

      <button
        className="botao-enviar efeito-lamina"
        onClick={enviarAbastecimento}
        disabled={salvando}
      >
        {salvando ? "SALVANDO..." : "ENVIAR ABASTECIMENTO"}
        <span className="seta-botao">→</span>
      </button>
    </section>
  );
}

export default ResumoEnvioCard;