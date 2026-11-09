import './style.css'
import { supabase } from './supabase'
import { avviaRouter, fermaRouter } from './router'

const app = document.querySelector('#app')

function mostraLogin() {
  app.innerHTML = `
    <div class="login-pagina">
      <h1>Web delle Tezze</h1>
      <p>Buongiornissimo e benvenut* nel Web Delle Tezze. Se hai voglia e te la reffi
      potrai far parte anche tu di questo spazio.<br>
      Potrai fare tante cose ma devi però registrarti. Buon divertimento!</p>

      <div class="login-box">
        <input id="email" type="email" placeholder="Email" />
        <input id="password" type="password" placeholder="Password" />
        <button id="accedi">Accedi</button>
        <button id="registrati">Registrati</button>
        <p id="messaggio"></p>
      </div>
    </div>
  `

  const messaggio = document.querySelector('#messaggio')
  const leggiCampi = () => ({
    email: document.querySelector('#email').value,
    password: document.querySelector('#password').value,
  })

  document.querySelector('#accedi').onclick = async () => {
    const { error } = await supabase.auth.signInWithPassword(leggiCampi())
    if (error) messaggio.textContent = error.message
  }

  document.querySelector('#registrati').onclick = async () => {
    const { error } = await supabase.auth.signUp(leggiCampi())
    messaggio.textContent = error
      ? error.message
      : 'Registrazione fatta! Se richiesto, controlla la tua email.'
  }
}

let idUtenteCorrente = null

supabase.auth.onAuthStateChange((evento, sessione) => {
  if (sessione) {
    if (sessione.user.id === idUtenteCorrente) return
    idUtenteCorrente = sessione.user.id
    avviaRouter(app, sessione.user)
  } else {
    idUtenteCorrente = null
    fermaRouter()
    mostraLogin()
  }
})