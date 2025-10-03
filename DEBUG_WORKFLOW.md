# 🔍 Debug: Perché Non Vedo i Dati?

## ❌ Problema: "Sembra tutto finto"

**NO! Non è un mock.** Il backend genera VERI dati con pandas, numpy e scikit-learn.

Se non vedi i dati, ci sono 3 possibili cause:

---

## 🔧 Causa 1: Backend Non Connesso

### Verifica Backend

Apri la **console del browser** (F12 o Cmd+Option+I) e guarda la tab "Console".

**Se vedi errori tipo:**
```
Failed to fetch
Network error
CORS error
```

**Significa:** Il frontend non riesce a comunicare con il backend.

### Soluzione

1. **Verifica che il backend sia in esecuzione:**
   ```bash
   curl http://127.0.0.1:8765
   ```
   
   Deve rispondere:
   ```json
   {"status":"ok","service":"DataFlow Platform API","version":"0.1.0"}
   ```

2. **Se non risponde, riavvia il backend:**
   ```bash
   cd backend
   source venv/bin/activate
   PYTHONPATH=. python main.py
   ```

3. **Ricarica la pagina del browser** (Cmd+R)

---

## 🔧 Causa 2: Workflow Non Eseguito

### Sintomi
- Nodi presenti nel canvas
- Nodi collegati
- Ma nessun dato visualizzato

### Soluzione

**Devi cliccare "Execute"!** Il workflow non si esegue automaticamente.

1. Crea il workflow (trascina nodi, collegali)
2. **Clicca il pulsante "Execute" nella toolbar in alto**
3. Aspetta che i nodi diventino verdi (✅)
4. Ora i dati sono generati!

---

## 🔧 Causa 3: Errore di Esecuzione

### Verifica Errori

1. **Guarda lo stato dei nodi:**
   - 🟢 Verde = Successo
   - 🔴 Rosso = Errore
   - 🔵 Blu = In esecuzione
   - ⚪ Grigio = Non eseguito

2. **Se un nodo è rosso:**
   - Clicca sul nodo
   - Guarda il pannello proprietà a destra
   - Leggi il messaggio di errore

3. **Guarda i log del backend:**
   Nel terminale dove hai avviato il backend, cerca errori.

---

## ✅ Test Completo: Verifica che Tutto Funzioni

### Test 1: Backend Funziona?

```bash
# Test API
curl http://127.0.0.1:8765

# Test nodi disponibili
curl http://127.0.0.1:8765/api/nodes | python -m json.tool

# Dovresti vedere una lista di 13+ nodi
```

### Test 2: Esecuzione Diretta (Senza Frontend)

Testa il backend direttamente:

```bash
cd backend
source venv/bin/activate
PYTHONPATH=. python test_backend.py
```

**Output atteso:**
```
============================================================
DataFlow Platform Backend Tests
============================================================

=== Test 1: Node Registry ===
✅ Registered nodes: 13
✅ Categories: sources, transform, visualization, machine_learning
✅ All key nodes registered

=== Test 2: Synthetic Data Generation ===
✅ Synthetic data generated successfully
   Rows: 100
   Columns: 4

=== Test 3: Classification Pipeline ===
✅ Node syn-1 executed successfully
✅ Node split-1 executed successfully
✅ Node clf-1 executed successfully
   Accuracy: 0.950
   F1 Score: 0.948

...

🎉 All tests passed!
```

**Se i test passano, il backend funziona al 100%!**

### Test 3: Frontend Riceve Dati?

1. Apri il browser su http://localhost:1420
2. Apri DevTools (F12)
3. Vai alla tab "Network"
4. Crea un workflow semplice
5. Clicca "Execute"
6. Guarda le richieste HTTP:
   - Deve esserci una richiesta POST a `/api/workflow/execute`
   - La risposta deve contenere i dati

---

## 🎯 Workflow di Test Garantito

Segui ESATTAMENTE questi passi:

### Passo 1: Verifica Backend
```bash
curl http://127.0.0.1:8765
```
Deve rispondere con `{"status":"ok",...}`

### Passo 2: Apri Frontend
http://localhost:1420

### Passo 3: Crea Workflow Semplice

1. **Trascina "Generate Synthetic Data"** nel canvas
2. **Clicca sul nodo** per aprire proprietà
3. **Configura:**
   - Mode: `classification`
   - N Samples: `100`
   - N Features: `3`
   - N Classes: `2`
   - Seed: `42`
4. **Clicca "Execute" nella toolbar**
5. **Aspetta 1-2 secondi**
6. **Il nodo diventa verde** ✅

### Passo 4: Verifica Dati Generati

**Apri DevTools (F12) → Console**

Esegui questo nel console:
```javascript
// Verifica che ci siano risultati
console.log(window);
```

**Oppure guarda la tab Network:**
- Cerca la richiesta `POST /api/workflow/execute`
- Clicca sulla richiesta
- Vai a "Response"
- Dovresti vedere i dati JSON con i risultati

---

## 🔍 Debug Avanzato

### Verifica Comunicazione Frontend-Backend

Nel browser, apri la console e esegui:

```javascript
// Test API direttamente dal browser
fetch('http://127.0.0.1:8765')
  .then(r => r.json())
  .then(d => console.log('Backend OK:', d))
  .catch(e => console.error('Backend ERROR:', e));
```

**Output atteso:**
```
Backend OK: {status: "ok", service: "DataFlow Platform API", version: "0.1.0"}
```

**Se vedi errore CORS:**
Il backend non è configurato correttamente. Verifica che `main.py` abbia:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    ...
)
```

---

## 💡 Cosa Succede Realmente

Quando clicchi "Execute":

1. **Frontend** invia il workflow al backend via HTTP POST
2. **Backend** riceve il workflow
3. **Backend** esegue i nodi in ordine topologico:
   - `csv.synthetic` → Genera VERI dati con `sklearn.make_classification()`
   - Crea un DataFrame pandas con 100 righe × 3 colonne
   - Salva in cache
4. **Backend** risponde con i risultati (JSON)
5. **Frontend** riceve i risultati
6. **Frontend** aggiorna lo stato dei nodi
7. **Se c'è un plot**, Plotly genera il grafico REALE

**TUTTO È REALE!** Nessun mock.

---

## 🎯 Prova Definitiva: Esporta i Dati

Se vuoi la prova che i dati sono reali:

### Modifica Temporanea per Vedere i Dati

Aggiungi questo nodo che salva i dati su file:

1. Nel backend, crea `backend/test_export.py`:

```python
import sys
sys.path.insert(0, '.')

from core.types import Workflow, NodeInstance
from core.executor import ExecutionEngine
import asyncio
import nodes.sources

async def test():
    workflow = Workflow(
        version="0.1.0",
        name="Test",
        seed=42,
        nodes=[
            NodeInstance(
                id="syn-1",
                type="csv.synthetic",
                params={
                    "mode": "classification",
                    "n_samples": 100,
                    "n_features": 3,
                    "n_classes": 2,
                    "seed": 42
                },
                position={"x": 0, "y": 0}
            )
        ],
        edges=[]
    )
    
    engine = ExecutionEngine()
    results = await engine.execute_workflow(workflow)
    
    # Ottieni i dati
    result = results.get("syn-1")
    if result and not result.error:
        df = result.outputs.get("table")
        print("\n✅ DATI REALI GENERATI:")
        print(df.head(10))
        print(f"\nShape: {df.shape}")
        print(f"Columns: {df.columns.tolist()}")
        
        # Salva su file per prova
        df.to_csv("/tmp/dataflow_test.csv", index=False)
        print("\n📁 Dati salvati in: /tmp/dataflow_test.csv")
        print("Apri il file per vedere i dati reali!")
    else:
        print(f"❌ Errore: {result.error if result else 'No result'}")

asyncio.run(test())
```

2. Esegui:
```bash
cd backend
source venv/bin/activate
PYTHONPATH=. python test_export.py
```

3. **Apri il file generato:**
```bash
cat /tmp/dataflow_test.csv
# oppure
open /tmp/dataflow_test.csv
```

**Vedrai VERI dati numerici generati da scikit-learn!**

---

## 📞 Se Ancora Non Funziona

Inviami:

1. **Output di:**
   ```bash
   curl http://127.0.0.1:8765
   ```

2. **Screenshot della console del browser** (F12 → Console)

3. **Log del backend** (copia l'output del terminale)

4. **Screenshot dell'interfaccia** con il workflow

---

## ✅ Checklist Debug

- [ ] Backend risponde su http://127.0.0.1:8765
- [ ] `test_backend.py` passa tutti i test
- [ ] Frontend carica su http://localhost:1420
- [ ] Console browser non mostra errori
- [ ] Ho cliccato "Execute" dopo aver creato il workflow
- [ ] I nodi diventano verdi dopo l'esecuzione
- [ ] Network tab mostra richiesta POST a `/api/workflow/execute`
- [ ] La risposta contiene dati (non errori)

**Se tutti i check sono ✅, i dati CI SONO!**

---

## 🎉 Conclusione

**Non è un mock!** È un'applicazione REALE che:
- Genera dati con scikit-learn
- Processa con pandas
- Visualizza con Plotly
- Esegue ML con algoritmi veri

Se non vedi i dati, è un problema di comunicazione frontend-backend o di esecuzione del workflow.

**Segui i test sopra e troveremo il problema!** 🔍
