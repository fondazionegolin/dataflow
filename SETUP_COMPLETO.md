# 🚀 Setup Completo - Guida Passo-Passo

## 📋 Situazione Attuale

Hai due problemi da risolvere:
1. ❌ Python 3.13 (troppo nuovo per le librerie)
2. ❌ Tauri non installato (ma non necessario!)

## ✅ Soluzione Completa

### Passo 1: Installa Python 3.11

```bash
# Installa Python 3.11 con Homebrew
brew install python@3.11

# Verifica installazione
/opt/homebrew/bin/python3.11 --version
```

### Passo 2: Setup Backend

```bash
# Vai alla directory backend
cd /Users/alessandrosaracino/CascadeProjects/dataflow-platform/backend

# Rimuovi vecchio virtual environment (se esiste)
rm -rf venv

# Crea nuovo venv con Python 3.11
/opt/homebrew/bin/python3.11 -m venv venv

# Attiva venv
source venv/bin/activate

# Verifica che stai usando Python 3.11
python --version  # Deve mostrare 3.11.x

# Aggiorna pip
pip install --upgrade pip setuptools wheel

# Installa dipendenze
pip install -r requirements.txt

# Test (dovrebbe passare tutti i test)
python test_backend.py
```

**Output atteso:**
```
============================================================
DataFlow Platform Backend Tests
============================================================
...
🎉 All tests passed!
```

### Passo 3: Setup Frontend

```bash
# Vai alla directory frontend
cd /Users/alessandrosaracino/CascadeProjects/dataflow-platform/frontend

# Installa dipendenze Node
npm install
```

### Passo 4: Avvia l'Applicazione (Web App)

**Opzione A: Script Automatico**
```bash
cd /Users/alessandrosaracino/CascadeProjects/dataflow-platform
./start-dev.sh
```

**Opzione B: Manuale (2 Terminali)**

Terminale 1 - Backend:
```bash
cd /Users/alessandrosaracino/CascadeProjects/dataflow-platform/backend
source venv/bin/activate
python main.py
```

Terminale 2 - Frontend:
```bash
cd /Users/alessandrosaracino/CascadeProjects/dataflow-platform/frontend
npm run dev
```

### Passo 5: Apri nel Browser

Vai su: **http://localhost:1420**

🎉 **L'applicazione è pronta!**

---

## 🎯 Primo Workflow (2 minuti)

1. **Trascina "Generate Synthetic Data"** dalla palette a sinistra
2. **Clicca sul nodo** per aprire le proprietà a destra
3. **Configura**:
   - Mode: classification
   - Samples: 1000
   - Features: 5
   - Classes: 3
4. **Trascina "2D Scatter Plot"** nel canvas
5. **Collega i nodi**: Trascina dal pallino blu del primo nodo al pallino blu del secondo
6. **Configura il plot**:
   - X Column: feature_0
   - Y Column: feature_1
   - Color Column: target
7. **Clicca "Execute"** nella toolbar in alto
8. **Vedi il risultato!** 🎨

---

## 📋 Checklist Completa

### Setup Iniziale
- [ ] Python 3.11 installato
- [ ] Backend venv creato con Python 3.11
- [ ] Dipendenze Python installate
- [ ] Test backend passati
- [ ] Dipendenze Node installate

### Verifica Funzionamento
- [ ] Backend risponde su http://127.0.0.1:8765
- [ ] Frontend carica su http://localhost:1420
- [ ] Node palette visibile a sinistra
- [ ] Canvas interattivo al centro
- [ ] Properties panel a destra
- [ ] Toolbar in alto

### Primo Workflow
- [ ] Nodo trascinato nel canvas
- [ ] Parametri configurati
- [ ] Nodi collegati
- [ ] Workflow eseguito
- [ ] Risultati visualizzati

---

## 🆘 Risoluzione Problemi

### Backend non parte

**Problema**: `ModuleNotFoundError` o errori import
```bash
cd backend
source venv/bin/activate
python --version  # Verifica sia 3.11.x
pip install -r requirements.txt  # Reinstalla
```

**Problema**: Porta 8765 occupata
```bash
lsof -i :8765  # Trova processo
kill -9 <PID>  # Termina processo
```

### Frontend non parte

**Problema**: Errori npm
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install  # Reinstalla tutto
```

**Problema**: Porta 1420 occupata
```bash
lsof -i :1420
kill -9 <PID>
```

### Tauri non funziona

**Non è un problema!** Usa la web app:
- Leggi `START_WITHOUT_TAURI.md`
- Tauri serve solo per creare l'app desktop
- Per sviluppo, la web app è perfetta

---

## 📚 File di Aiuto

1. **`INSTALL_FIX.md`** - Problema Python 3.13
2. **`START_WITHOUT_TAURI.md`** - Usare senza Tauri
3. **`TROUBLESHOOTING_INSTALL.md`** - Problemi installazione
4. **`GETTING_STARTED.md`** - Tutorial completo
5. **`QUICK_REFERENCE.md`** - Riferimento rapido

---

## 🎓 Prossimi Passi

### Oggi
1. ✅ Setup completo
2. ✅ Primo workflow funzionante
3. ✅ Familiarizza con l'interfaccia

### Domani
1. Prova i workflow di esempio in `examples/`
2. Sperimenta con diversi algoritmi ML
3. Crea pipeline più complesse

### Questa Settimana
1. Leggi la documentazione in `docs/`
2. Crea workflow personalizzati
3. Esplora tutti i nodi disponibili

---

## 💡 Suggerimenti

### Performance
- I nodi cachano automaticamente i risultati
- Cambia solo i parametri necessari
- Usa il seed globale per riproducibilità

### Workflow
- Inizia semplice, aggiungi complessità gradualmente
- Salva spesso (Export button)
- Usa nomi descrittivi per i workflow

### Debug
- Controlla la console del browser (F12)
- Guarda i log del backend nel terminale
- I nodi rossi indicano errori (clicca per dettagli)

---

## 🎉 Sei Pronto!

**Comandi Rapidi:**

```bash
# Setup completo (una volta sola)
brew install python@3.11
cd backend
/opt/homebrew/bin/python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
python test_backend.py

cd ../frontend
npm install

# Avvio quotidiano
cd /Users/alessandrosaracino/CascadeProjects/dataflow-platform
./start-dev.sh

# Apri browser
open http://localhost:1420
```

**Buon lavoro con DataFlow Platform!** 🌊📊

---

## 📞 Supporto

- **Documentazione**: Cartella `docs/`
- **Esempi**: Cartella `examples/`
- **Guide**: File `*.md` nella root
- **Test**: `backend/test_backend.py`

**Versione**: 0.1.0  
**Status**: Ready to Use ✅
