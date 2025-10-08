# Come Avviare DataFlow Platform

## 🚀 Avvio Rapido

### Metodo Standard (Consigliato)

```bash
./start-dev.sh
```

Questo script:
- ✅ Avvia il backend FastAPI su http://127.0.0.1:8765
- ✅ Avvia il frontend React su http://localhost:1420
- ✅ Abilita automaticamente le ottimizzazioni GPU
- ✅ Gestisce entrambi i processi (Ctrl+C per fermare tutto)

**Apri il browser su:** http://localhost:1420

---

## 📋 Setup Iniziale (Solo la Prima Volta)

### 1. Backend Python

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# IMPORTANTE per generazione immagini: installa xformers
pip install xformers
```

### 2. Frontend Node.js

```bash
cd frontend
npm install
```

### 3. Crea il file API mancante

Il file `frontend/src/lib/api.ts` è già stato creato automaticamente.

---

## 🎮 Ottimizzazioni GPU (RTX 4090)

Lo script `start-dev.sh` ora include automaticamente:

```bash
export PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True
export CUDA_LAUNCH_BLOCKING=0
export TORCH_CUDNN_V8_API_ENABLED=1
```

Queste variabili:
- Riducono la frammentazione della memoria GPU
- Prevengono errori "CUDA Out of Memory"
- Ottimizzano le performance

**Per dettagli completi:** Leggi `GPU_OPTIMIZATION.md`

---

## 🔧 Metodi Alternativi

### Solo Backend

```bash
cd backend
source venv/bin/activate
python main.py
```

Backend disponibile su: http://127.0.0.1:8765

### Solo Frontend

```bash
cd frontend
npm run dev
```

Frontend disponibile su: http://localhost:1420

### Desktop App (con Tauri)

```bash
cd frontend
npm run tauri dev
```

Apre l'app desktop invece del browser.

---

## 🛑 Come Fermare

- **Se hai usato `./start-dev.sh`**: Premi `Ctrl+C` nel terminale
- **Se hai avviato manualmente**: Chiudi i terminali o usa `Ctrl+C` in ognuno

---

## 📝 Risoluzione Problemi

### Errore: "Failed to resolve import @/lib/api"

✅ **RISOLTO**: Il file `frontend/src/lib/api.ts` è stato creato e il `.gitignore` aggiornato.

### Errore: "CUDA out of memory"

✅ **RISOLTO**: Le ottimizzazioni GPU sono ora abilitate automaticamente in `start-dev.sh`.

**Ulteriori ottimizzazioni:**
1. Installa xformers: `pip install xformers`
2. Riavvia il backend
3. Leggi `GPU_OPTIMIZATION.md` per impostazioni avanzate

### Backend non si avvia

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend non si avvia

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Documentazione

- **README.md**: Panoramica generale del progetto
- **GPU_OPTIMIZATION.md**: Guida completa ottimizzazioni GPU
- **GETTING_STARTED.md**: Tutorial passo-passo
- **API_FIX.md**: Dettagli sul fix dell'import API

---

## ✅ Checklist Pre-Avvio

- [ ] Backend venv creato e dipendenze installate
- [ ] Frontend node_modules installati
- [ ] xformers installato (per generazione immagini)
- [ ] File `frontend/src/lib/api.ts` esiste
- [ ] GPU drivers NVIDIA aggiornati (se usi generazione immagini)

**Tutto pronto?** Esegui: `./start-dev.sh` 🚀
