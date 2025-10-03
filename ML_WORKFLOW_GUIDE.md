# 🤖 Machine Learning Workflow - Guida Completa

## 🎯 Come Funziona il ML

### Workflow Completo: Train → Predict

```
1. Generate Data
   ↓
2. Split Data (Train/Test)
   ↓
3. Regression (Train)
   ↓ (model)
4. Predict (Test con dati incogniti)
```

## 📊 Esempio Pratico

### Step 1: Genera Dataset

```
AI Generate Dataset
- Columns: cilindrata,consumo
- Description: "Cilindrata 1000-3000cc, consumo 5-20 km/l, relazione inversa"
- Run
```

**Output**: 100 righe con cilindrata e consumo

### Step 2: Split Train/Test

```
Train/Test Split
- Input: Dataset completo
- Test Size: 0.2 (20% per test)
- Random Seed: 42
- Run
```

**Output**: 
- `train` (80 righe) → Per training
- `test` (20 righe) → Per predizione

### Step 3: Train Model

```
Regression
- Input: train data
- Algorithm: linear_regression
- Target Column: consumo
- Feature Columns: cilindrata
- Run
```

**Output**:
- `model` (modello trainato)
- Metriche: R²=0.9994, RMSE=0.0294

### Step 4: Predict su Dati Incogniti

```
Predict
- Input 1: model (dal nodo Regression)
- Input 2: test data (dati MAI visti dal modello)
- Run
```

**Output**:
- Predizioni per le 20 righe di test
- Confronto: valore reale vs predetto

## 🎨 Workflow Visivo

```
┌─────────────────┐
│ Generate Data   │ (100 righe)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Train/Test Split│
└────┬───────┬────┘
     │       │
     │       └─────────────┐
     ↓                     ↓
┌─────────┐         ┌──────────┐
│ Train   │         │ Test     │
│ (80)    │         │ (20)     │
└────┬────┘         └────┬─────┘
     │                   │
     ↓                   │
┌─────────────┐          │
│ Regression  │          │
│ (Train)     │          │
└────┬────────┘          │
     │                   │
     │ model             │ test data
     │                   │
     └─────────┬─────────┘
               ↓
        ┌──────────────┐
        │   Predict    │
        │ (Incogniti)  │
        └──────────────┘
```

## 💡 Concetti Chiave

### Train Data
- **Dati conosciuti** usati per addestrare il modello
- Il modello "impara" la relazione tra features e target
- Esempio: 80 auto con cilindrata E consumo noti

### Test Data
- **Dati incogniti** MAI visti dal modello durante training
- Usati per verificare se il modello generalizza
- Esempio: 20 auto con cilindrata nota, consumo da predire

### Model
- **Modello trainato** che ha imparato la relazione
- Può essere usato per predire nuovi dati
- Output del nodo Regression

### Predict
- **Applica il modello** a dati nuovi
- Input: model + dati incogniti
- Output: predizioni

## 🎯 Esempio Concreto

### Scenario: Predire Consumo Auto

**Dati Training (80 auto)**:
```
cilindrata | consumo (noto)
1200       | 15.2
1500       | 12.8
2000       | 10.5
...
```

**Modello impara**: "Più cilindrata → Meno consumo"

**Dati Test (20 auto)**:
```
cilindrata | consumo (?)
1300       | ??? ← Da predire
1800       | ??? ← Da predire
2200       | ??? ← Da predire
```

**Predict Output**:
```
cilindrata | consumo_predetto
1300       | 14.1
1800       | 11.2
2200       | 9.3
```

## 📊 Metriche ML

### R² (R-squared)
- **0.9994** = Ottimo! Il modello spiega 99.94% della varianza
- Più vicino a 1 = Migliore

### RMSE (Root Mean Square Error)
- **0.0294** = Errore medio di 0.03 km/l
- Più vicino a 0 = Migliore

### MAE (Mean Absolute Error)
- **0.0143** = Errore assoluto medio
- Più vicino a 0 = Migliore

## 🔄 Workflow Completo Esempio

```bash
1. AI Generate Dataset
   - Columns: cilindrata,potenza,consumo
   - Description: "Auto con cilindrata, potenza, consumo correlati"
   - Run → 100 righe

2. Train/Test Split
   - Test Size: 0.2
   - Run → train (80) + test (20)

3. Regression
   - Input: train
   - Target: consumo
   - Features: cilindrata,potenza
   - Algorithm: linear_regression
   - Run → model + metriche

4. Predict
   - Input 1: model
   - Input 2: test
   - Run → predizioni per 20 auto

5. Visualizza Risultati
   - 2D Plot: consumo_reale vs consumo_predetto
   - Vedi quanto è accurato!
```

## 🎨 Colori Nodi

Ora i nodi hanno colori per categoria:

- **Verde**: Data Sources (Generate, Load)
- **Blu**: Transform (Select, Split)
- **Arancione**: Visualization (Plot 2D/3D)
- **Viola**: Machine Learning (Regression, Predict)

## 💡 Tooltip

Passa il mouse sull'icona **?** in ogni nodo per vedere:
- Descrizione
- Esempio d'uso
- Come configurarlo

## ✅ Checklist Workflow ML

- [ ] Genera o carica dataset
- [ ] Split train/test (80/20)
- [ ] Train model su train data
- [ ] Predict su test data (incogniti)
- [ ] Visualizza risultati
- [ ] Valuta metriche (R², RMSE)

## 🚀 Prova Ora!

1. Riavvia frontend
2. Crea workflow come sopra
3. Passa mouse su **?** per vedere esempi
4. Nota i colori: Verde → Blu → Viola
5. Run ogni nodo in sequenza
6. Vedi predizioni!

---

**Ora il ML è chiaro e i nodi sono colorati!** 🎨
