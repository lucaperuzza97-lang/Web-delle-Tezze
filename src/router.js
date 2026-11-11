import { renderNavbar } from './navbar.js';
import { home } from './pages/home.js';
import { squallore } from './pages/squallore.js';
import { eventi } from './pages/eventi.js';
import { profilo } from './pages/profilo.js';
import { coppag } from './pages/coppag.js';
import { copparovesciamenti } from './pages/copparovesciamenti.js';


const routes = {
  '/home': home,
  '/coppa-rovesciamenti': copparovesciamenti,
  '/coppa-g': coppag,
  '/squallore': squallore,
  '/eventi': eventi,
  '/profilo': profilo,
};

let listener = null

export function avviaRouter(app, utente) {
  fermaRouter()

  async function mostraPagina() {
    const percorso = location.hash.slice(1) || '/home'
    const pagina = routes[percorso] || home

    app.innerHTML = renderNavbar() + '<main id="contenuto"></main>'
    await pagina(document.getElementById('contenuto'), utente)
  }

  listener = mostraPagina
  window.addEventListener('hashchange', listener)
  mostraPagina()
}

export function fermaRouter() {
  if (listener) {
    window.removeEventListener('hashchange', listener)
    listener = null
  }
}