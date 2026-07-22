import {
  Building2,
  FolderTree,
  Network,
} from "lucide-react";

function Indicadores({
  totalUnidades = 0,
  totalAtivas = 0,
  totalBaliza = 0,
}) {
  return (
    <section className="estrutura-indicadores">
      <article>
        <Network size={21} />

        <div>
          <span>Total de unidades</span>

          <strong>
            {totalUnidades}
          </strong>
        </div>
      </article>

      <article>
        <Building2 size={21} />

        <div>
          <span>Unidades ativas</span>

          <strong>
            {totalAtivas}
          </strong>
        </div>
      </article>

      <article>
        <FolderTree size={21} />

        <div>
          <span>Exibidas na Baliza</span>

          <strong>
            {totalBaliza}
          </strong>
        </div>
      </article>
    </section>
  );
}

export default Indicadores;