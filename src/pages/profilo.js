import { supabase } from '../supabase'

export async function profilo(contenitore, utente) {
  contenitore.innerHTML = `
    <h2>Mio Profilo</h2>
    <p>${utente.email}</p>
    <button id="esci">Esci</button>
  `
  document.querySelector('#esci').onclick = () => supabase.auth.signOut()
}