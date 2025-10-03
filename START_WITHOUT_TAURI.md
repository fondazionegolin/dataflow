# 🚀 Avvio Rapido SENZA Tauri (Solo Web App)

## Il Problema

Tauri richiede Rust, che non è installato. Ma **non è necessario** per sviluppare e usare l'applicazione!

## ✅ Soluzione: Usa la Web App

L'applicazione funziona perfettamente come **web app nel browser**, senza bisogno di Tauri.

---

## 🎯 Avvio Rapido (2 Terminali)

### Terminale 1: Backend

```bash
cd /Users/alessandrosaracino/CascadeProjects/dataflow-platform/backend

# Attiva virtual environment (con Python 3.11)
source venv/bin/activate

# Avvia backend
python main.py
```

**Dovresti vedere:**
```
INFO:     Uvicorn running on http://127.0.0.1:8765 (Press CTRL+C to quit)
```

### Terminale 2: Frontend

```bash
cd /Users/alessandrosaracino/CascadeProjects/dataflow-platform/frontend

# Avvia frontend (web app)
npm run dev
```

**Dovresti vedere:**
```
  VITE v5.0.7  ready in XXX ms

  ➜  Local:   http://localhost:1420/
  ➜  Network: use --host to expose
```

### Apri il Browser

Vai su: **http://localhost:1420**

🎉 **L'applicazione funziona perfettamente nel browser!**

---

## 📋 Script Automatico

Ho aggiornato `start-dev.sh` per funzionare senza Tauri:

```bash
cd /Users/alessandrosaracino/CascadeProjects/dataflow-platform
./start-dev.sh
```

Questo avvierà automaticamente backend e frontend.

---

## 🆘 Se Vuoi Comunque Installare Tauri (Opzionale)

Tauri è necessario solo per creare l'**app desktop** (file .app, .exe, ecc.).  
Per lo sviluppo, la web app è più che sufficiente!

### Installa Rust (se proprio vuoi Tauri)

```bash
# Installa Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Riavvia il terminale o esegui:
source $HOME/.cargo/env

# Verifica installazione
rustc --version
cargo --version

# Ora puoi usare Tauri
cd frontend
npm run tauri:dev
```

**Tempo installazione Rust**: ~5-10 minuti  
**Spazio richiesto**: ~1-2 GB

---

## 💡 Differenze Web App vs Desktop App

### Web App (http://localhost:1420)
- ✅ Funziona subito, nessuna installazione extra
- ✅ Più veloce da sviluppare
- ✅ Facile da debuggare (DevTools browser)
- ✅ Tutte le funzionalità disponibili
- ❌ Richiede browser aperto
- ❌ Non può essere distribuita come file .app/.exe

### Desktop App (Tauri)
- ✅ App standalone (file .app, .exe, .deb)
- ✅ Icona nel dock/taskbar
- ✅ Può essere distribuita agli utenti
- ✅ Integrazione OS migliore
- ❌ Richiede Rust installato
- ❌ Build più lenta
- ❌ File più grande (~10-20 MB)

**Per lo sviluppo e l'uso personale, la web app è perfetta!**

---

## 🎯 Workflow Consigliato

### Fase 1: Sviluppo (Ora)
Usa la **web app** (più veloce, più facile):
```bash
# Terminale 1
cd backend && source venv/bin/activate && python main.py

# Terminale 2  
cd frontend && npm run dev

# Browser
http://localhost:1420
```

### Fase 2: Distribuzione (Futuro)
Se vuoi distribuire l'app ad altri utenti:
1. Installa Rust
2. Build con Tauri: `npm run tauri:build`
3. Distribuisci il file .app/.exe/.deb

---

## ✅ Verifica che Tutto Funzioni

### 1. Backend Attivo?
```bash
curl http://127.0.0.1:8765
```

**Output atteso:**
```json
{"status":"ok","service":"DataFlow Platform API","version":"0.1.0"}
```

### 2. Frontend Attivo?
Apri browser: http://localhost:1420

**Dovresti vedere:**
- Node Palette a sinistra
- Canvas al centro
- Toolbar in alto

### 3. Crea un Workflow di Test
1. Trascina "Generate Synthetic Data" nel canvas
2. Trascina "2D Scatter Plot" nel canvas
3. Collega i due nodi
4. Configura i parametri
5. Clicca "Execute"
6. Vedi il grafico! 🎉

---

## 🐛 Troubleshooting

### Backend non parte
```bash
cd backend
source venv/bin/activate
python --version  # Deve essere 3.11.x
python main.py
```

### Frontend non parte
```bash
cd frontend
npm install  # Reinstalla dipendenze
npm run dev
```

### Porta 8765 occupata
```bash
# Trova processo
lsof -i :8765

# Termina processo
kill -9 <PID>
```

### Porta 1420 occupata
```bash
# Trova processo
lsof -i :1420

# Termina processo
kill -9 <PID>
```

---

## 📝 Comandi Utili

### Avvio Completo
```bash
# In un terminale
cd /Users/alessandrosaracino/CascadeProjects/dataflow-platform
./start-dev.sh
```

### Solo Backend
```bash
cd backend
source venv/bin/activate
python main.py
```

### Solo Frontend
```bash
cd frontend
npm run dev
```

### Test Backend
```bash
cd backend
source venv/bin/activate
python test_backend.py
```

### Build Frontend (Produzione)
```bash
cd frontend
npm run build
```

---

## 🎉 Sei Pronto!

**Non hai bisogno di Tauri per usare l'applicazione!**

La web app ha tutte le funzionalità:
- ✅ Drag & drop nodes
- ✅ Workflow execution
- ✅ Real-time plots
- ✅ Machine learning
- ✅ Save/load workflows
- ✅ Everything works!

**Apri http://localhost:1420 e inizia a creare workflow!** 🚀

---

## 📚 Prossimi Passi

1. ✅ Avvia backend e frontend
2. ✅ Apri http://localhost:1420
3. ✅ Leggi `GETTING_STARTED.md` per tutorial
4. ✅ Prova gli esempi in `examples/`
5. ✅ Crea il tuo primo workflow!

**Buon divertimento con DataFlow Platform!** 🌊📊
