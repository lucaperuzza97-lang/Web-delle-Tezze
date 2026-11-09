export function renderNavbar() {
  return `
    <header class="topbar">
      <a href="#/home" class="titolo">Web delle Tezze</a>
      <nav>
        <a href="#/coppa-rovesciamenti">Coppa Rovesciamenti</a>
        <a href="#/coppa-g">Coppa G</a>
        <a href="#/squallore">Squallore</a>
        <a href="#/eventi">Tutti gli Eventi</a>
      </nav>
      <a href="#/profilo" class="profilo" title="Mio Profilo">👤</a>
    </header>
  `;
}