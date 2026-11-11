import { supabase } from '../supabase.js' // <-- adatta il percorso al tuo file di connessione

// ---------------------------------------------------------------
// PUNTEGGI (da AssegnazionePuntiCoppaRovesciamenti.xlsx)
// ---------------------------------------------------------------
const TIPI = {
  base:      { label: 'Rovesciamento Base',      punti: 5 },
  bottiglia: { label: 'Rovesciamento Bottiglia', punti: 7 },
  strabord:  { label: 'Strabordamento',          punti: 1 },
}

const EXTRA = [
  { key: 'rottura_bicchiere', label: 'Rottura bicchiere',                punti: 2 },
  { key: 'rottura_bottiglia', label: 'Rottura bottiglia',                punti: 4 },
  { key: 'braghe_mu',         label: 'Rovesciamento sulle braghe del Mu', punti: 3 },
  { key: 'primo',             label: '1^ rovesciamento',                 punti: 2 },
  { key: 'ultimo',            label: 'Ultimo rovesciamento',             punti: 4 },
  { key: 'fuori_provincia',   label: 'Fuori provincia (TV)',             punti: 2 },
  { key: 'gala',              label: 'Durante il Galà',                  punti: 3 },
  { key: 'xxv_aprile',        label: 'XXV Aprile',                       punti: 2 },
  { key: 'capodanno',         label: "Ultimo dell'anno e Capodanno",     punti: 2 },
]

// Weekend bonus (+4): confronto su mese-giorno, valido ogni anno
const WEEKEND_BONUS = [
  { label: '13-14 Febbraio', giorni: ['02-13', '02-14'], punti: 4 },
  { label: '22-23 Maggio',   giorni: ['05-22', '05-23'], punti: 4 },
  { label: '10-11 Luglio',   giorni: ['07-10', '07-11'], punti: 4 },
  { label: '18-19 Settembre', giorni: ['09-18', '09-19'], punti: 4 },
  { label: '20-21 Novembre', giorni: ['11-20', '11-21'], punti: 4 },
]

function calcolaPunti(r) {
  let tot = TIPI[r.tipo]?.punti ?? 0
  for (const e of EXTRA) if (r[e.key]) tot += e.punti
  const md = (r.data || '').slice(5, 10) // "YYYY-MM-DD" -> "MM-DD"
  if (WEEKEND_BONUS.some(w => w.giorni.includes(md))) tot += 4
  return tot
}

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const fmtData = (d) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('it-IT') : '')

// ---------------------------------------------------------------
// RENDER PAGINA
// ---------------------------------------------------------------
export async function copparovesciamenti(container) {
  container.innerHTML = `
    <section class="coppa">
      <h2>🏆 Coppa Rovesciamenti</h2>
      <p class="coppa-intro">
        La coppa viene assegnata ogni anno all'utente che ottiene il maggior numero di punti,
        in base ai rovesciamenti di bicchieri/bottiglie effettuati durante l'anno.
      </p>

      <div class="card" id="sezione-regolamento">
        <h3>📜 Regolamento</h3>
        <p><em>Regolamento in arrivo...</em></p>

        <h4>Punti base</h4>
        <table class="tabella-punti">
          <thead><tr><th>Evento</th><th>Punti</th></tr></thead>
          <tbody>
            ${Object.values(TIPI).map(t => `<tr><td>${t.label}</td><td>${t.punti}</td></tr>`).join('')}
          </tbody>
        </table>

        <h4>Eventi aggiuntivi</h4>
        <table class="tabella-punti">
          <thead><tr><th>Evento</th><th>Punti</th></tr></thead>
          <tbody>
            ${EXTRA.map(e => `<tr><td>${e.label}</td><td>+${e.punti}</td></tr>`).join('')}
          </tbody>
        </table>

        <h4>Weekend con punti bonus</h4>
        <table class="tabella-punti">
          <thead><tr><th>Weekend</th><th>Punti</th></tr></thead>
          <tbody>
            ${WEEKEND_BONUS.map(w => `<tr><td>${w.label}</td><td>+${w.punti}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>

      <div class="card" id="sezione-partecipanti">
        <h3>👥 Partecipanti</h3>
        <div id="lista-partecipanti">Caricamento...</div>
      </div>

      <div class="card">
        <button id="btn-nuovo" class="btn-primary">➕ Nuovo rovesciamento</button>
      </div>

      <div class="card" id="sezione-ultimo">
        <h3>🥂 Ultimo rovesciamento</h3>
        <div id="ultimo-rovesciamento">Caricamento...</div>
      </div>
    </section>

    <div id="modal-nuovo" class="modal hidden">
      <div class="modal-content">
        <h3>Nuovo rovesciamento</h3>
        <div id="form-nuovo">
          <label>Data
            <input type="date" id="f-data" required />
          </label>

          <label>Nome
            <select id="f-nome" required></select>
          </label>

          <label>Luogo
            <input type="text" id="f-luogo" required />
          </label>

          <label>Foto
            <input type="file" id="f-foto" accept="image/*" />
          </label>

          <label>Tipo rovesciamento
            <select id="f-tipo" required>
              ${Object.entries(TIPI).map(([k, t]) => `<option value="${k}">${t.label}</option>`).join('')}
            </select>
          </label>

          <div class="checks">
            ${EXTRA.map(e => `
              <label class="check">
                <input type="checkbox" data-key="${e.key}" /> ${e.label} (+${e.punti})
              </label>`).join('')}
          </div>

          <p id="f-anteprima-punti" class="anteprima-punti"></p>
          <p id="f-errore" class="errore"></p>

          <div class="modal-actions">
            <button type="button" id="btn-annulla">Annulla</button>
            <button type="button" id="btn-conferma" class="btn-primary">Conferma</button>
          </div>
        </div>
      </div>
    </div>
  `

  const modal = container.querySelector('#modal-nuovo')
  const selNome = container.querySelector('#f-nome')
  const errore = container.querySelector('#f-errore')
  const anteprima = container.querySelector('#f-anteprima-punti')

  // ---- Partecipanti ----
  const { data: partecipanti, error: errPart } = await supabase
    .from('partecipanti')
    .select('id, nome, email, note')
    .order('nome')

  const boxPart = container.querySelector('#lista-partecipanti')
  if (errPart) {
    boxPart.textContent = 'Errore nel caricamento dei partecipanti.'
    console.error(errPart)
  } else if (!partecipanti.length) {
    boxPart.textContent = 'Nessun partecipante inserito.'
  } else {
    boxPart.innerHTML = `
      <div class="tabella-scroll">
        <table class="tabella-punti">
          <thead><tr><th>Nome</th><th>Email</th><th>Note</th></tr></thead>
          <tbody>
            ${partecipanti.map(p => `
              <tr><td>${esc(p.nome)}</td><td>${esc(p.email)}</td><td>${esc(p.note)}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>`
    selNome.innerHTML = partecipanti.map(p => `<option value="${p.id}">${esc(p.nome)}</option>`).join('')
  }

  // ---- Anteprima punti nel form ----
  function aggiornaAnteprima() {
    const r = leggiForm()
    anteprima.textContent = `Punti di questo rovesciamento: ${calcolaPunti(r)}`
  }

  function leggiForm() {
    const r = {
      data: container.querySelector('#f-data').value,
      partecipante_id: selNome.value,
      luogo: container.querySelector('#f-luogo').value.trim(),
      tipo: container.querySelector('#f-tipo').value,
    }
    container.querySelectorAll('.checks input[type=checkbox]').forEach(cb => {
      r[cb.dataset.key] = cb.checked
    })
    return r
  }

  modal.addEventListener('input', aggiornaAnteprima)
  modal.addEventListener('change', aggiornaAnteprima)

  // ---- Apri / chiudi modal ----
  container.querySelector('#btn-nuovo').addEventListener('click', () => {
    errore.textContent = ''
    container.querySelector('#f-data').value = new Date().toISOString().slice(0, 10)
    aggiornaAnteprima()
    modal.classList.remove('hidden')
  })
  container.querySelector('#btn-annulla').addEventListener('click', () => modal.classList.add('hidden'))

  // ---- Salvataggio ----
  const btnConferma = container.querySelector('#btn-conferma')
  btnConferma.addEventListener('click', async () => {
    errore.textContent = ''
    const r = leggiForm()
    if (!r.data || !r.partecipante_id || !r.luogo || !r.tipo) {
      errore.textContent = 'Compila data, nome, luogo e tipo.'
      return
    }

    btnConferma.disabled = true
    btnConferma.textContent = 'Salvataggio...'

    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Upload foto (opzionale)
      let foto_url = null
      const file = container.querySelector('#f-foto').files[0]
      if (file) {
        const ext = file.name.split('.').pop()
        const path = `${user.id}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('rovesciamenti').upload(path, file)
        if (upErr) throw upErr
        foto_url = supabase.storage.from('rovesciamenti').getPublicUrl(path).data.publicUrl
      }

      const { error: insErr } = await supabase
        .from('rovesciamenti')
        .insert({ ...r, foto_url, user_id: user.id })
      if (insErr) throw insErr

      modal.classList.add('hidden')
      container.querySelector('#f-luogo').value = ''
      container.querySelector('#f-foto').value = ''
      container.querySelectorAll('.checks input').forEach(cb => (cb.checked = false))
      await caricaUltimo()
    } catch (e) {
      console.error(e)
      errore.textContent = 'Errore nel salvataggio: ' + (e.message || e)
    } finally {
      btnConferma.disabled = false
      btnConferma.textContent = 'Conferma'
    }
  })

  // ---- Ultimo rovesciamento ----
  async function caricaUltimo() {
    const box = container.querySelector('#ultimo-rovesciamento')
    const { data, error } = await supabase
      .from('rovesciamenti')
      .select('*, partecipanti(nome)')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      box.textContent = 'Errore nel caricamento.'
      console.error(error)
      return
    }
    if (!data.length) {
      box.textContent = 'Ancora nessun rovesciamento registrato.'
      return
    }

    const r = data[0]
    const extraAttivi = EXTRA.filter(e => r[e.key]).map(e => `<li>${e.label} (+${e.punti})</li>`).join('')
    box.innerHTML = `
      <div class="ultimo">
        ${r.foto_url ? `<img src="${esc(r.foto_url)}" alt="Foto rovesciamento" class="foto-rov" />` : ''}
        <ul class="dettagli">
          <li><strong>Data:</strong> ${fmtData(r.data)}</li>
          <li><strong>Nome:</strong> ${esc(r.partecipanti?.nome)}</li>
          <li><strong>Luogo:</strong> ${esc(r.luogo)}</li>
          <li><strong>Tipo:</strong> ${esc(TIPI[r.tipo]?.label)}</li>
          <li><strong>Punti totali:</strong> ${calcolaPunti(r)}</li>
        </ul>
        ${extraAttivi ? `<p><strong>Extra:</strong></p><ul>${extraAttivi}</ul>` : ''}
      </div>`
  }

  await caricaUltimo()
}
