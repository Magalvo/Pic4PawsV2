export default function HomePage() {
  return (
    <main className="min-h-dvh bg-bg flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
          Plataforma de adopção animal
        </p>
        <h1 className="text-4xl font-extrabold text-ink tracking-tight leading-tight mb-4 max-w-md">
          Ajuda um animal a encontrar a sua família
        </h1>
        <p className="text-muted text-base max-w-sm mb-10 leading-relaxed">
          Liga abrigos, adotantes e padrinhos. Perfis de animais, adoções,
          donativos e operações de abrigo — com privacidade desde o início.
        </p>

        {/* Role cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl mb-8">
          {/* Adopter card */}
          <div className="bg-surface rounded-card border border-border-warm p-6 flex flex-col items-center text-center shadow-sm">
            <span className="text-4xl mb-3">🐾</span>
            <h2 className="text-base font-bold text-ink mb-2">Quero Adotar</h2>
            <p className="text-sm text-muted mb-5 leading-relaxed">
              Encontra animais disponíveis perto de ti e candidata-te directamente.
            </p>
            <a
              href="/animais"
              className="w-full text-center py-2.5 rounded-cta bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors"
            >
              Explorar animais →
            </a>
          </div>

          {/* Shelter card */}
          <div className="bg-surface rounded-card border border-border p-6 flex flex-col items-center text-center shadow-sm">
            <span className="text-4xl mb-3">🏠</span>
            <h2 className="text-base font-bold text-ink mb-2">Sou um Abrigo</h2>
            <p className="text-sm text-muted mb-5 leading-relaxed">
              Publica perfis de animais, gere adopções e recebe donativos num só lugar.
            </p>
            <a
              href="/abrigos/registar"
              className="w-full text-center py-2.5 rounded-cta bg-teal text-white text-sm font-bold hover:bg-teal-hover transition-colors"
            >
              Registar abrigo →
            </a>
          </div>
        </div>

        <p className="text-sm text-muted">
          Já tens conta?{' '}
          <a href="/entrar" className="text-primary font-semibold hover:underline">
            Entrar
          </a>
        </p>
      </section>

      {/* Footer strip */}
      <footer className="py-4 text-center text-xs text-muted border-t border-border">
        <a href="/termos" className="hover:underline">Termos</a>
        {' · '}
        <a href="/privacidade" className="hover:underline">Privacidade</a>
      </footer>
    </main>
  );
}
