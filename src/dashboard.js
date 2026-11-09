import { supabase } from './supabase'

const sezioni = {
  home: () => `
    <h2>Home</h2>
    <p>Qui vedrai i post degli amici.</p>
  `,
  nuovo: () => `
    <h2>Nuovo post</h2>
    <p>Qui scriverai un post e caricherai le foto.</p>
  `,
  profilo: (utente) => `
    <h2>Profilo</h2>
    <p>Email: ${utente.email}</p>
  `,
}

export function mostraDashboard(app, utente) {
  app.innerHTML = `
    <header>
      <strong>Il nostro sito</strong>
      <button id="esci">Esci</button>
    </header>
    <nav>
      <button data-sezione="home">Home</button>
      <button data-sezione="nuovo">Nuovo post</button>
      <button data-sezione="profilo">Profilo</button>
    </nav>
    <main id="contenuto"></main>
  `

  const contenuto = document.querySelector('#contenuto')

  function vai(nome) {
    contenuto.innerHTML = sezioni[nome](utente)
    document.querySelectorAll('nav button').forEach((b) => {
      b.classList.toggle('attivo', b.dataset.sezione === nome)
    })
  }

  document.querySelectorAll('nav button').forEach((b) => {
    b.onclick = () => vai(b.dataset.sezione)
  })
  document.querySelector('#esci').onclick = () => supabase.auth.signOut()

  vai('home')
}