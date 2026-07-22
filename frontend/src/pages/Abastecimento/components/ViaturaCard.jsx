import { useEffect, useState } from "react";
import {
  Car,
  Pencil,
  Search,
} from "lucide-react";

import Button from "../../../components/ui/Button.jsx";

import { buscarViaturas } from "../../../services/viaturasService.js";

import {
  formatarPlaca,
  normalizarTexto,
} from "../../../utils/formatadores.js";

function ViaturaCard({ onViaturaChange }) {
  const [listaViaturas, setListaViaturas] = useState([]);
  const [busca, setBusca] = useState("");
  const [viatura, setViatura] = useState(null);

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarViaturas() {
      try {
        setCarregando(true);
        setErro("");

        const dados = await buscarViaturas();

        setListaViaturas(dados ?? []);
      } catch (error) {
        console.error(
          "Erro ao carregar viaturas:",
          error
        );

        setListaViaturas([]);

        setErro(
          error?.message ||
            "Não foi possível carregar as viaturas."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarViaturas();
  }, []);

  function localizarViatura(valor) {
    const texto = normalizarTexto(valor).slice(0, 8);

    setBusca(texto);
    setErro("");

    const somenteNumeros = texto.replace(/\D/g, "");

    const placaSemMascara = texto.replace(
      /[^A-Z0-9]/g,
      ""
    );

    const digitouPrefixoCompleto =
      somenteNumeros.length === 5 ;
     

    const digitouPlacaCompleta =
      placaSemMascara.length === 7;

    if (
      !digitouPrefixoCompleto &&
      !digitouPlacaCompleta
    ) {
      setViatura(null);
      onViaturaChange?.(null);
      return;
    }

    const encontrada = listaViaturas.find(
      (item) => {
        const prefixoBanco = String(
          item?.prefixo || ""
        ).replace(/\D/g, "");

        const placaBanco = normalizarTexto(
          item?.placa || ""
        ).replace(/[^A-Z0-9]/g, "");

        return (
          prefixoBanco === somenteNumeros ||
          placaBanco === placaSemMascara
        );
      }
    );

    if (!encontrada) {
      setViatura(null);
      setErro("Viatura não localizada.");
      onViaturaChange?.(null);
      return;
    }

    if (
      encontrada.ativo === false ||
      normalizarTexto(encontrada.situacao) ===
        "BAIXADA"
    ) {
      setViatura(null);

      setErro(
        "A viatura localizada não está disponível para abastecimento."
      );

      onViaturaChange?.(null);
      return;
    }

    setViatura(encontrada);
    setErro("");

    onViaturaChange?.(encontrada);
  }

  function alterarViatura() {
    setBusca("");
    setErro("");
    setViatura(null);

    onViaturaChange?.(null);
  }

  return (
    <section className="form-card viatura-card">
      <div className="form-card-cabecalho">
        <div>
          <span className="form-card-icone">
            <Car size={20} />
          </span>

          <div>
            <h2>Viatura</h2>

            <p>
              Informe o prefixo ou a placa da
              viatura.
            </p>
          </div>
        </div>
      </div>

      {carregando && (
        <div className="campo-ajuda">
          Carregando viaturas...
        </div>
      )}

      {!carregando && !viatura && (
        <>
          <label className="campo campo-compacto">
            Prefixo ou placa *
            <div className="campo-com-icone">
              <Search size={18} />

              <input
                value={busca}
                onChange={(event) =>
                  localizarViatura(
                    event.target.value
                  )
                }
                placeholder="Ex.: 25853 ou QNJ-1890"
              />
            </div>
          </label>

          {erro && (
            <div className="aviso-erro">
              ⚠ {erro}
            </div>
          )}
        </>
      )}

      {viatura && (
        <div className="motorista-info viatura-info">
          <div className="motorista-dados viatura-dados">
            <strong className="motorista-nome viatura-prefixo">
              {viatura.prefixo || "SEM PREFIXO"}
            </strong>

            <span>
              <strong>Placa:</strong>{" "}
              {formatarPlaca(viatura.placa)}
            </span>

            <span>
              <strong>Marca:</strong>{" "}
              {viatura.marca || "NÃO INFORMADA"}
            </span>

            <span>
              <strong>Modelo:</strong>{" "}
              {viatura.modelo || "NÃO INFORMADO"}
            </span>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={alterarViatura}
          >
            <Pencil size={16} />
            Alterar viatura
          </Button>
        </div>
      )}
    </section>
  );
}

export default ViaturaCard;