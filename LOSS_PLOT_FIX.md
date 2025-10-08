# Fix: Collegare Loss Plot a 2D Scatter Plot

## Problema
Quando si prova a collegare l'output "Loss Plot" del nodo "Fine-tune LLM" all'input del nodo "2D Scatter Plot", si ottiene l'errore:

```
Failed to create 2D plot: Unable to convert data_frame of type <class 'str'> 
to pandas DataFrame. Please provide a supported dataframe type.
```

## Causa
Il nodo "Fine-tune LLM" restituisce il "Loss Plot" come un **grafico Plotly serializzato** (stringa JSON), non come dati tabulari. Il nodo "2D Scatter Plot" invece si aspetta un **DataFrame pandas** con colonne numeriche.

## Soluzione

Ho aggiunto un nuovo output al nodo "Fine-tune LLM":

### Prima (solo grafico)
```
Outputs:
  - model (MODEL)
  - metrics (METRICS)
  - loss_plot (PARAMS) ← Grafico serializzato (stringa JSON)
```

### Dopo (grafico + dati)
```
Outputs:
  - model (MODEL)
  - metrics (METRICS)  
  - loss_plot (PARAMS) ← Grafico serializzato
  - loss_history (TABLE) ← ✨ NUOVO: Dati della loss in formato tabella
```

## Come Usare

### Opzione 1: Usa il nuovo output "Loss History Table"

1. **Nodo Fine-tune LLM**
   - Configura e addestra il modello
   
2. **Nodo 2D Scatter Plot**
   - Collega l'output **"Loss History Table"** (non "Loss Plot"!)
   - Configura:
     - X: `step` (passo di training)
     - Y: `loss` (valore della loss)
     - Opzionale: Color: `loss` per gradiente di colore

### Opzione 2: Visualizza direttamente il Loss Plot

Il nodo "Fine-tune LLM" già mostra automaticamente il grafico della loss nel pannello di preview. Non serve collegarlo ad altri nodi per visualizzarlo!

## Struttura della Loss History Table

La tabella contiene:

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| `step` | int | Passo di training (0, 1, 2, ...) |
| `loss` | float | Valore della loss a quel passo |

Esempio:
```
   step    loss
0     0  2.4567
1    10  1.8234
2    20  1.5432
3    30  1.3210
```

## Workflow di Esempio

```
[LLM Dataset] → [Fine-tune LLM] → [2D Scatter Plot]
                       ↓
                 loss_history
```

**Configurazione 2D Scatter Plot:**
- Data: Collegato a "loss_history"
- X Axis: `step`
- Y Axis: `loss`
- Title: "Training Loss Over Time"

## Note

- ✅ Il grafico "Loss Plot" è già ottimizzato e viene mostrato automaticamente
- ✅ Usa "Loss History Table" solo se vuoi personalizzare il grafico
- ✅ Puoi collegare "Loss History Table" anche ad altri nodi di visualizzazione (3D Plot, ecc.)
- ⚠️ Non collegare mai "Loss Plot" (PARAMS) a nodi che vogliono TABLE come input

## Riavvio Necessario

Dopo questa modifica, **riavvia il backend**:

```bash
# Ferma il backend (Ctrl+C)
./start-dev.sh
```

Il nuovo output "Loss History Table" sarà disponibile nel nodo "Fine-tune LLM".
