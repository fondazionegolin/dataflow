# 🎭 Guida Analisi Sentiment - DataFlow

## 📋 Indice
1. [Introduzione](#introduzione)
2. [Workflow Base: Sentiment Analysis](#workflow-base)
3. [Testing con Input Personalizzati](#testing-input-personalizzati)
4. [Esempi Pratici](#esempi-pratici)
5. [Tips & Tricks](#tips-tricks)

---

## 🎯 Introduzione

L'analisi del sentiment permette di classificare testi come positivi, negativi o neutri. Questa guida mostra come:
- Creare un modello di sentiment analysis
- Testare il modello con input personalizzati
- Creare dataset di test custom

---

## 🔧 Workflow Base: Sentiment Analysis

### Metodo 1: Usando AI Generate Dataset

```
[AI Generate Dataset] → [Train/Test Split] → [ML Classification] → [ML Predict]
     (Template: nlp_sentiment_reviews)         (80/20)              (Logistic Regression)
```

**Step by Step:**

1. **AI Generate Dataset**
   - Template: `nlp_sentiment_reviews`
   - Rows: 200
   - Genera automaticamente recensioni con sentiment

2. **Train/Test Split**
   - Test Size: 0.2 (20%)
   - Stratify by: `sentiment`

3. **ML Classification**
   - Algorithm: Logistic Regression
   - Features: `review_text` (verrà vettorizzato automaticamente)
   - Target: `sentiment`

4. **ML Predict**
   - Collega `model` da Classification
   - Collega `test` da Split
   - Ottieni predizioni!

---

## 🎯 Testing con Input Personalizzati

### ❌ Problema Comune
Hai un modello trainato e vuoi testare UNA SOLA frase personalizzata, tipo:
- "Questo prodotto è fantastico!"
- "Servizio pessimo, non lo consiglio"

### ✅ Soluzione: Custom Table

#### Metodo 1: Custom Table Manuale

```
[Custom Table] → [ML Predict]
   (Crea input)     (usa modello trainato)
```

**Step by Step:**

1. **Aggiungi Custom Table**
   - Categoria: Sources
   - Click su "Modifica Tabella"

2. **Crea la struttura**
   - Colonna 1: Rinomina in `review_text` (DEVE avere lo stesso nome della feature del training!)
   - Aggiungi righe con i tuoi testi:
     ```
     review_text
     "Questo prodotto è fantastico!"
     "Servizio pessimo, non lo consiglio"
     "Prodotto nella media"
     ```

3. **Collega a ML Predict**
   - Custom Table → ML Predict (input `table`)
   - ML Classification → ML Predict (input `model`)

4. **Esegui e vedi i risultati!**

#### Metodo 2: Numeric Input + Custom Table (per features numeriche)

Se il tuo modello usa features numeriche (es. lunghezza testo, numero parole):

```
[Numeric Input] → [Custom Table] → [ML Predict]
  (label="text_length")
```

**Esempio:**
1. Numeric Input:
   - Value: 150
   - Label: `text_length`

2. Custom Table:
   - Collega Numeric Input a Input 1
   - La colonna si chiamerà automaticamente `text_length`!

3. Aggiungi altre colonne se necessario

---

## 📚 Esempi Pratici

### Esempio 1: Sentiment Analysis Completo

**Workflow:**
```
[AI Generate Dataset] → [Select Columns] → [Train/Test Split] → [ML Classification]
  (nlp_sentiment)        (review, sentiment)      (80/20)              ↓
                                                                   [ML Predict] ← [Custom Table]
                                                                                    (test custom)
```

**Custom Table per Testing:**
```csv
review_text
"Il servizio clienti è eccellente!"
"Prodotto difettoso, chiedo rimborso"
"Consegna veloce, prodotto ok"
```

### Esempio 2: Sentiment con Features Multiple

**Dataset con più features:**
- `review_text`: testo recensione
- `review_length`: lunghezza
- `rating`: voto 1-5

**Workflow:**
```
[AI Generate Dataset] → [Train/Test Split] → [ML Classification]
                                                      ↓
[Numeric Input] → [Custom Table] → [ML Predict]
  (review_length)
```

**Custom Table:**
1. Collega Numeric Input (label=`review_length`) a Input 1
2. Aggiungi colonna manuale `review_text`
3. Aggiungi colonna manuale `rating`

### Esempio 3: Testing Batch

Per testare molti input custom:

**Opzione A: CSV File**
```
[Load CSV] → [ML Predict]
  (test_data.csv)
```

**Opzione B: AI Generate**
```
[AI Generate Dataset] → [ML Predict]
  (Descrizione: "10 recensioni negative su ristoranti")
```

---

## 💡 Tips & Tricks

### 1. **Nomi Colonne DEVONO Corrispondere**
```
❌ Training: "text" → Testing: "review"  (ERRORE!)
✅ Training: "text" → Testing: "text"    (OK!)
```

### 2. **Usa Select Columns per Pulizia**
```
[Dataset] → [Select Columns] → [Train/Test Split]
              (solo colonne necessarie)
```

### 3. **Verifica Features con View Table**
Prima di predire, controlla che le colonne siano corrette:
```
[Custom Table] → [View Full Table]
```

### 4. **Slice Rows per Testing Rapido**
Testa solo alcune righe:
```
[Custom Table] → [Slice Rows] → [ML Predict]
                  (Start: 0, End: 5)
```

### 5. **Salva Input di Test Frequenti**
Crea un CSV con i tuoi test standard:
```csv
review_text,expected_sentiment
"Ottimo prodotto!",positive
"Pessimo servizio",negative
"Nella media",neutral
```

Poi usa `Load CSV` ogni volta che vuoi testare.

---

## 🎓 Workflow Completo Esempio

### Sentiment Analysis con Testing Custom

```
1. TRAINING:
   [AI Generate Dataset]
   ↓ (nlp_sentiment_reviews, 500 rows)
   [Select Columns]
   ↓ (review_text, sentiment)
   [Train/Test Split]
   ↓ (80/20, stratify=sentiment)
   [ML Classification]
   ↓ (Logistic Regression, features=review_text, target=sentiment)
   
2. TESTING AUTOMATICO:
   [Train/Test Split] → test → [ML Predict]
                                     ↑
                                   model
   
3. TESTING CUSTOM:
   [Custom Table]
   ↓ (Crea tabella con colonna "review_text")
   [ML Predict]
   ↑ (collega model da Classification)
```

**Custom Table Content:**
| review_text |
|-------------|
| "Fantastico! Lo consiglio a tutti" |
| "Delusione totale" |
| "Prodotto ok, niente di speciale" |

**Risultato:**
| review_text | predicted_sentiment | confidence |
|-------------|---------------------|------------|
| "Fantastico! Lo consiglio a tutti" | positive | 0.95 |
| "Delusione totale" | negative | 0.89 |
| "Prodotto ok, niente di speciale" | neutral | 0.72 |

---

## 🚀 Quick Start

### Test Rapido in 3 Passi:

1. **Genera Dataset**
   ```
   AI Generate Dataset → Template: nlp_sentiment_reviews → 100 rows
   ```

2. **Traina Modello**
   ```
   Train/Test Split (80/20) → ML Classification (Logistic Regression)
   ```

3. **Testa Input Custom**
   ```
   Custom Table → Modifica Tabella → Aggiungi:
   - Colonna: review_text
   - Righe: i tuoi testi
   → Collega a ML Predict
   ```

---

## ❓ FAQ

**Q: Come testo una singola frase?**
A: Usa Custom Table con una sola riga.

**Q: Il modello da errore "column not found"**
A: Verifica che i nomi delle colonne nel test siano IDENTICI a quelli del training.

**Q: Posso testare testi in italiano?**
A: Sì! Usa AI Generate Dataset con descrizione in italiano o Custom Table.

**Q: Come salvo i risultati del test?**
A: Collega ML Predict a un nodo di visualizzazione o esporta i risultati.

**Q: Posso testare più modelli contemporaneamente?**
A: Sì! Crea più branch:
```
[Custom Table] → [ML Predict] (Modello 1)
              → [ML Predict] (Modello 2)
              → [ML Predict] (Modello 3)
```

---

## 📝 Checklist Testing

Prima di testare, verifica:

- [ ] Nomi colonne identici tra training e test
- [ ] Stesso numero di features
- [ ] Stesso tipo di dati (text, numeric, etc.)
- [ ] Nessun valore mancante
- [ ] Modello trainato con successo

---

## 🎯 Conclusione

Il Custom Table è lo strumento perfetto per testare modelli con input personalizzati:
- ✅ Flessibile: crea qualsiasi struttura
- ✅ Veloce: testa singoli valori o batch
- ✅ Intuitivo: interfaccia visuale
- ✅ Potente: supporta tutte le features

**Prossimi Passi:**
1. Prova il workflow base
2. Crea il tuo Custom Table di test
3. Sperimenta con diversi algoritmi
4. Salva i workflow di successo!

---

*Creato per DataFlow Platform - Visual Data Science Made Easy* 🚀
