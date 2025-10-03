# Guida alla Risoluzione Problemi di Installazione

## Problema: Errore nell'installazione di pandas/numpy

### Sintomi
```
Preparing metadata (pyproject.toml) ... error
error: subprocess-exited-with-error
```

### Cause Comuni
1. Mancano strumenti di compilazione
2. Versione Python incompatibile
3. pip/setuptools obsoleti

---

## 🔧 Soluzioni

### Soluzione 1: Aggiorna pip e setuptools (PROVA PRIMA QUESTA)

```bash
cd backend
source venv/bin/activate  # Se già creato

# Aggiorna pip, setuptools e wheel
pip install --upgrade pip setuptools wheel

# Riprova l'installazione
pip install -r requirements.txt
```

### Soluzione 2: Usa requirements-minimal.txt

```bash
cd backend
source venv/bin/activate

# Usa versioni più flessibili
pip install -r requirements-minimal.txt
```

### Soluzione 3: Installa dipendenze di sistema (macOS)

```bash
# Installa Xcode Command Line Tools
xcode-select --install

# Se hai Homebrew, installa anche:
brew install python@3.11
```

### Soluzione 4: Installa pacchetti uno alla volta

```bash
cd backend
source venv/bin/activate

# Installa i pacchetti base prima
pip install fastapi uvicorn pydantic python-multipart

# Poi i pacchetti di data science
pip install numpy  # Installa numpy per primo
pip install pandas
pip install scikit-learn
pip install plotly
pip install pyarrow
pip install scipy joblib python-dotenv aiofiles
```

### Soluzione 5: Usa Python 3.11 invece di 3.12+

Se hai Python 3.12 o superiore, alcune librerie potrebbero non avere ancora wheels pre-compilati.

```bash
# Verifica versione
python3 --version

# Se è 3.12+, installa Python 3.11
brew install python@3.11  # macOS
# oppure scarica da python.org

# Crea venv con Python 3.11
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

### Soluzione 6: Installa solo i pacchetti essenziali

Se nulla funziona, installa solo il minimo necessario:

```bash
cd backend
source venv/bin/activate

pip install fastapi uvicorn pandas numpy scikit-learn plotly
```

---

## 🧪 Verifica Installazione

Dopo l'installazione, verifica che tutto funzioni:

```bash
cd backend
source venv/bin/activate
python -c "import pandas; import numpy; import sklearn; import plotly; print('✅ Tutti i pacchetti importati correttamente!')"
```

Se vedi il messaggio di successo, puoi procedere!

---

## 🚀 Avvio Rapido Dopo l'Installazione

```bash
# Test backend
cd backend
source venv/bin/activate
python test_backend.py

# Se i test passano, avvia il server
python main.py
```

---

## 📋 Checklist Risoluzione Problemi

- [ ] Python 3.10 o 3.11 installato (non 3.12+)
- [ ] pip aggiornato (`pip install --upgrade pip`)
- [ ] setuptools e wheel aggiornati
- [ ] Xcode Command Line Tools installati (macOS)
- [ ] Virtual environment attivato
- [ ] Provato requirements-minimal.txt
- [ ] Provato installazione pacchetto per pacchetto

---

## 🆘 Ancora Problemi?

### Opzione A: Usa Docker (se disponibile)

Creeremo un Dockerfile se necessario.

### Opzione B: Usa Conda

```bash
# Installa Miniconda se non ce l'hai
# https://docs.conda.io/en/latest/miniconda.html

# Crea environment
conda create -n dataflow python=3.11
conda activate dataflow

# Installa pacchetti
conda install pandas numpy scikit-learn plotly scipy
pip install fastapi uvicorn pydantic python-multipart pyarrow python-dotenv aiofiles
```

### Opzione C: Versioni Specifiche Testate

Se tutto il resto fallisce, usa queste versioni specifiche che sappiamo funzionare:

```bash
pip install fastapi==0.104.1 uvicorn==0.24.0
pip install numpy==1.24.4  # Versione più stabile
pip install pandas==2.0.3  # Versione più compatibile
pip install scikit-learn==1.3.2
pip install plotly==5.17.0
pip install pyarrow==12.0.1
pip install scipy==1.11.4
pip install joblib==1.3.2
pip install pydantic==2.5.0
pip install python-multipart==0.0.6
pip install python-dotenv==1.0.0
pip install aiofiles==23.2.1
```

---

## 💡 Suggerimenti

1. **Usa sempre un virtual environment** - Non installare mai pacchetti globalmente
2. **Aggiorna pip prima di tutto** - Molti problemi si risolvono così
3. **Python 3.11 è la scelta più sicura** - Migliore compatibilità
4. **Installa numpy per primo** - Altri pacchetti dipendono da esso
5. **Sii paziente** - L'installazione può richiedere 5-10 minuti

---

## 📞 Informazioni di Debug Utili

Se chiedi aiuto, fornisci queste informazioni:

```bash
# Versione Python
python3 --version

# Versione pip
pip --version

# Sistema operativo
uname -a  # macOS/Linux
# oppure
systemctl  # Windows

# Versione Xcode (macOS)
xcode-select --version

# Log completo dell'errore
pip install -r requirements.txt 2>&1 | tee install_log.txt
```

---

## ✅ Installazione Riuscita?

Una volta installato tutto, testa:

```bash
cd backend
source venv/bin/activate
python test_backend.py
```

Se vedi "🎉 All tests passed!", sei pronto! 🚀

Procedi con:
```bash
python main.py
```

E in un altro terminale:
```bash
cd frontend
npm install
npm run dev
```

Buon lavoro! 🎉
