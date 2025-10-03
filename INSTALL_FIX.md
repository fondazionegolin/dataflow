# 🔧 Soluzione Rapida - Python 3.13 Troppo Nuovo

## Il Problema

Hai **Python 3.13.5** che è troppo recente. Molte librerie scientifiche (pandas, numpy, scikit-learn) non hanno ancora versioni pre-compilate per Python 3.13.

## ✅ Soluzione Raccomandata: Usa Python 3.11

### Opzione 1: Installa Python 3.11 con Homebrew (CONSIGLIATO)

```bash
# Installa Python 3.11
brew install python@3.11

# Verifica installazione
/opt/homebrew/bin/python3.11 --version

# Crea virtual environment con Python 3.11
cd /Users/alessandrosaracino/CascadeProjects/dataflow-platform/backend
/opt/homebrew/bin/python3.11 -m venv venv

# Attiva
source venv/bin/activate

# Aggiorna pip
pip install --upgrade pip setuptools wheel

# Installa dipendenze
pip install -r requirements.txt
```

### Opzione 2: Usa pyenv per gestire versioni Python

```bash
# Installa pyenv
brew install pyenv

# Installa Python 3.11
pyenv install 3.11.7

# Imposta Python 3.11 per questo progetto
cd /Users/alessandrosaracino/CascadeProjects/dataflow-platform
pyenv local 3.11.7

# Ora python3 punterà a 3.11
python3 --version  # Dovrebbe mostrare 3.11.7

# Crea venv
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

### Opzione 3: Installa da python.org

1. Vai su https://www.python.org/downloads/
2. Scarica Python 3.11.x (ultima versione 3.11)
3. Installa
4. Usa `/Library/Frameworks/Python.framework/Versions/3.11/bin/python3.11`

```bash
cd /Users/alessandrosaracino/CascadeProjects/dataflow-platform/backend
/Library/Frameworks/Python.framework/Versions/3.11/bin/python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

---

## 🚀 Installazione Rapida (Dopo aver installato Python 3.11)

```bash
cd /Users/alessandrosaracino/CascadeProjects/dataflow-platform/backend

# Se hai usato Homebrew
/opt/homebrew/bin/python3.11 -m venv venv

# Attiva
source venv/bin/activate

# Verifica che stai usando Python 3.11
python --version  # Dovrebbe mostrare 3.11.x

# Aggiorna pip
pip install --upgrade pip setuptools wheel

# Installa dipendenze (ora dovrebbe funzionare!)
pip install -r requirements.txt

# Test
python test_backend.py
```

---

## 🆘 Alternative se Non Puoi Installare Python 3.11

### Opzione A: Usa Conda (Più Facile)

```bash
# Installa Miniconda
# https://docs.conda.io/en/latest/miniconda.html

# Crea environment con Python 3.11
conda create -n dataflow python=3.11
conda activate dataflow

# Installa pacchetti
cd /Users/alessandrosaracino/CascadeProjects/dataflow-platform/backend
conda install pandas numpy scikit-learn plotly scipy
pip install fastapi uvicorn pydantic python-multipart pyarrow python-dotenv aiofiles joblib

# Test
python test_backend.py
```

### Opzione B: Usa Docker

Creeremo un Dockerfile se necessario.

---

## 📋 Comandi Completi (Copia-Incolla)

### Con Homebrew Python 3.11

```bash
# Installa Python 3.11
brew install python@3.11

# Vai alla directory backend
cd /Users/alessandrosaracino/CascadeProjects/dataflow-platform/backend

# Rimuovi vecchio venv se esiste
rm -rf venv

# Crea nuovo venv con Python 3.11
/opt/homebrew/bin/python3.11 -m venv venv

# Attiva
source venv/bin/activate

# Verifica versione
python --version

# Aggiorna pip
pip install --upgrade pip setuptools wheel

# Installa dipendenze
pip install -r requirements.txt

# Test
python test_backend.py

# Se tutto ok, avvia server
python main.py
```

---

## ✅ Verifica Successo

Dopo l'installazione, dovresti vedere:

```bash
python test_backend.py

# Output atteso:
============================================================
DataFlow Platform Backend Tests
============================================================

=== Test 1: Node Registry ===
✅ Registered nodes: 13
✅ Categories: sources, transform, visualization, machine_learning
✅ All key nodes registered

...

🎉 All tests passed!
```

---

## 💡 Perché Python 3.13 Non Funziona?

Python 3.13 è uscito da poco (ottobre 2024). Le librerie scientifiche come pandas e numpy devono:
1. Compilare nuove versioni per Python 3.13
2. Testare la compatibilità
3. Pubblicare i "wheels" (pacchetti pre-compilati)

Questo processo richiede tempo. **Python 3.11 è la versione più stabile e compatibile** per data science.

---

## 🎯 Prossimi Passi

Una volta installato con Python 3.11:

1. ✅ Test backend: `python test_backend.py`
2. ✅ Avvia backend: `python main.py`
3. ✅ In altro terminale, installa frontend:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
4. ✅ Apri browser: `http://localhost:1420`

---

## 📞 Serve Aiuto?

Se hai problemi:
1. Leggi `TROUBLESHOOTING_INSTALL.md`
2. Verifica di usare Python 3.11 (non 3.13)
3. Controlla che pip sia aggiornato
4. Prova l'installazione con Conda

Buona fortuna! 🚀
