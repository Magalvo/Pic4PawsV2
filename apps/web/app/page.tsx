import { webFoundationContent } from '../src/foundation';

export default function HomePage() {
  const { hero, primaryAction } = webFoundationContent;

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">{hero.eyebrow}</p>
        <h1>{hero.title}</h1>
        <p className="lead">{hero.body}</p>
        <div className="cta-group">
          <a href={primaryAction.href ?? '/registar'} className="btn-primary">
            {primaryAction.label}
          </a>
          <a href="/entrar" className="btn-secondary">
            Entrar
          </a>
        </div>
      </section>

      <section className="features" aria-label="O que podes fazer no Pic4Paws">
        <article className="feature-card">
          <h2>Para adotantes</h2>
          <p>
            Encontra animais disponíveis para adopção perto de ti e candidata-te
            diretamente a partir da plataforma.
          </p>
        </article>
        <article className="feature-card">
          <h2>Para abrigos</h2>
          <p>
            Regista o teu abrigo, publica perfis de animais e acompanha candidaturas
            de adopção e donativos num só lugar.
          </p>
        </article>
        <article className="feature-card">
          <h2>Para padrinhos</h2>
          <p>
            Apoia animais em abrigos com contribuições regulares mesmo que não possas
            adoptá-los.
          </p>
        </article>
      </section>

      <section className="privacy-note">
        <p>
          Privacidade desde o início — os teus dados nunca são partilhados com
          terceiros sem o teu consentimento explícito.
        </p>
      </section>
    </main>
  );
}
