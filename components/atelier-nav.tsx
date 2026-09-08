export function AtelierNav({
  kicker = "Client atelier",
  current,
}: {
  kicker?: string;
  current?: "setup" | "showroom";
}) {
  return (
    <header className="atelier-nav">
      <a href="/setup" className="atelier-mark">
        <span className="font-display text-[22px] leading-none tracking-tight sm:text-[24px]">Midas AI</span>
        <span className="atelier-mark-sub hidden sm:inline">{kicker}</span>
      </a>
      <nav className="atelier-nav-links" aria-label="Atelier">
        <a href="/setup" aria-current={current === "setup" ? "page" : undefined}>
          Setup
        </a>
        <a href="/brief">Brief</a>
        <a href="/">Midas catalog</a>
      </nav>
    </header>
  );
}
