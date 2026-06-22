import { privacidadeContent } from '../../src/gdpr-legal';

export default function PrivacidadePage() {
  const { title, lastUpdated, sections } = privacidadeContent;

  return (
    <main>
      <h1>{title}</h1>
      <p>
        <small>Última actualização: {lastUpdated}</small>
      </p>
      {sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          <p>{section.body}</p>
        </section>
      ))}
      <p>
        <a href="/registar">Voltar ao registo</a>
      </p>
    </main>
  );
}
