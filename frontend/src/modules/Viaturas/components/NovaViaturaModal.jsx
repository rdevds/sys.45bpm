import { useMemo, useState } from "react";

import { STATUS_VIATURA } from "../../../config/StatusViaturas";
import { formatarPlaca, normalizarTexto } from "../../../utils/formatadores";

function NovaViaturaModal({ viaturas = [], onFechar, onSalvar }) {
  const [form, setForm] = useState({
    prefixo: "",
    placa: "",
    lotacao: "",
    unidadeFrota: "",
    cidade: "",
    marca: "",
    modelo: "",
    ano: "",
    combustivel: "",
    odometro: "",
    situacao: STATUS_VIATURA.DISPONIVEL,
  });

  const sugestoes = useMemo(() => {
    function unicos(campo) {
      return [...new Set(viaturas.map((v) => v[campo]).filter(Boolean))];
    }

    return {
      lotacao: unicos("lotacao"),
      unidadeFrota: unicos("unidadeFrota"),
      cidade: unicos("cidade"),
      marca: unicos("marca"),
      modelo: unicos("modelo"),
    };
  }, [viaturas]);

  function atualizar(campo, valor) {
    let valorFormatado = normalizarTexto(valor);

    if (campo === "placa") {
      valorFormatado = formatarPlaca(valor);
    }

    if (campo === "prefixo") {
      valorFormatado = valor.replace(/\D/g, "").slice(0, 5);
    }

    setForm((atual) => ({
      ...atual,
      [campo]: valorFormatado,
    }));
  }

  function placaJaExiste() {
    return viaturas.some((v) => normalizarTexto(v.placa) === form.placa);
  }

  function prefixoJaExiste() {
    return viaturas.some((v) => normalizarTexto(v.prefixo) === form.prefixo);
  }

  function salvar() {
    if (form.prefixo.length !== 5) {
      alert("O prefixo deve possuir exatamente 5 dígitos.");
      return;
    }

    if (!form.placa) {
      alert("Informe a placa da viatura.");
      return;
    }

    if (placaJaExiste()) {
      alert("Já existe uma viatura cadastrada com esta placa.");
      return;
    }

    if (prefixoJaExiste()) {
      alert("Já existe uma viatura cadastrada com este prefixo.");
      return;
    }

    const novaViatura = {
      ...form,
      ano: Number(form.ano || 0),
      odometro: Number(form.odometro || 0),
    };

    onSalvar(novaViatura);
  }

  return (
    <div className="modal-backdrop">
      <section className="modal-viatura">
        <header className="modal-header">
          <div>
            <h2>Nova Viatura</h2>
            <p>Cadastro rápido de nova viatura.</p>
          </div>

          <button onClick={onFechar} className="modal-fechar">
            ×
          </button>
        </header>

        <datalist id="sugestoes-lotacao">
          {sugestoes.lotacao.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>

        <datalist id="sugestoes-unidade-frota">
          {sugestoes.unidadeFrota.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>

        <datalist id="sugestoes-cidade">
          {sugestoes.cidade.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>

        <datalist id="sugestoes-marca">
          {sugestoes.marca.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>

        <datalist id="sugestoes-modelo">
          {sugestoes.modelo.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>

        <div className="modal-grid">
          <label>
            Prefixo
            <input
  type="text"
  inputMode="numeric"
  maxLength={5}
  value={form.prefixo}
  onChange={(event) =>
    setForm((dadosAtuais) => ({
      ...dadosAtuais,
      prefixo: event.target.value
        .replace(/\D/g, "")
        .slice(0, 5),
    }))
  }
/>
          </label>

          <label>
            Placa
            <input
              value={form.placa}
              onChange={(e) => atualizar("placa", e.target.value)}
              placeholder="EX: QNJ-1890"
              maxLength={8}
            />
          </label>

          <label>
            Lotação
            <input
              list="sugestoes-lotacao"
              value={form.lotacao}
              onChange={(e) => atualizar("lotacao", e.target.value)}
            />
          </label>

          <label>
            Unidade Frota
            <input
              list="sugestoes-unidade-frota"
              value={form.unidadeFrota}
              maxLength={7}
              onChange={(e) => atualizar("unidadeFrota", e.target.value)}
            />
          </label>

          <label>
            Cidade
            <input
              list="sugestoes-cidade"
              value={form.cidade}
              onChange={(e) => atualizar("cidade", e.target.value)}
            />
          </label>

          <label>
            Marca
            <input
              list="sugestoes-marca"
              value={form.marca}
              onChange={(e) => atualizar("marca", e.target.value)}
            />
          </label>

          <label>
            Modelo
            <input
              list="sugestoes-modelo"
              value={form.modelo}
              onChange={(e) => atualizar("modelo", e.target.value)}
            />
          </label>

          <label>
            Ano
            <input
              type="number"
              value={form.ano}
              onChange={(e) => atualizar("ano", e.target.value)}
            />
          </label>

          <label>
            Combustível
            <select
              value={form.combustivel}
              onChange={(e) => atualizar("combustivel", e.target.value)}
            >
              <option value="">SELECIONE</option>
              <option value="FLEX">FLEX</option>
              <option value="GASOLINA">GASOLINA</option>
              <option value="ETANOL">ETANOL</option>
              <option value="DIESEL S10">DIESEL S10</option>
            </select>
          </label>

          <label>
            Odômetro
            <input
              type="number"
              value={form.odometro}
              onChange={(e) => atualizar("odometro", e.target.value)}
            />
          </label>

          <label>
            Situação
            <select
              value={form.situacao}
              onChange={(e) => atualizar("situacao", e.target.value)}
            >
              <option value={STATUS_VIATURA.DISPONIVEL}>DISPONÍVEL</option>
              <option value={STATUS_VIATURA.MANUTENCAO}>EM MANUTENÇÃO</option>
              <option value={STATUS_VIATURA.BAIXADA}>BAIXADA</option>
            </select>
          </label>
        </div>

        <footer className="modal-acoes">
          <button className="botao-cancelar-modal" onClick={onFechar}>
            Cancelar
          </button>

          <button className="botao-salvar-modal" onClick={salvar}>
            Salvar viatura
          </button>
        </footer>
      </section>
    </div>
  );
}

export default NovaViaturaModal;