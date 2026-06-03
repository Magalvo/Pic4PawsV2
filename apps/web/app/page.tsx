import { productName, primaryCtaLabel } from '@pic4paws/domain';
import { brandTokens } from '@pic4paws/ui';

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Portugal-first animal adoption platform</p>
        <h1>{productName}</h1>
        <p>
          Uma experiência segura para associações, adotantes e padrinhos, preparada para
          adoções, donativos e patrocínios recorrentes.
        </p>
        <a style={{ backgroundColor: brandTokens.colors.rescueOrange }} href="/dashboard">
          {primaryCtaLabel}
        </a>
      </section>
    </main>
  );
}
