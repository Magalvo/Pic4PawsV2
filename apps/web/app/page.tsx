import { brandTokens } from '@pic4paws/ui';
import { webFoundationContent } from '../src/foundation';

export default function HomePage() {
  const { hero, primaryAction, readiness } = webFoundationContent;

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">{hero.eyebrow}</p>
        <h1>{hero.title}</h1>
        <p className="lead">{hero.body}</p>
        <span className="status-pill" style={{ backgroundColor: brandTokens.colors.rescueOrange }}>
          {primaryAction.label}
        </span>
      </section>

      <section className="readiness" aria-label="Estado da fundação técnica">
        {readiness.map((item) => (
          <article className="readiness-item" key={item.id}>
            <div>
              <h2>{item.label}</h2>
              <p>{item.description}</p>
            </div>
            <span>{item.status === 'contract-ready' ? 'Contrato pronto' : item.status}</span>
          </article>
        ))}
      </section>
    </main>
  );
}
