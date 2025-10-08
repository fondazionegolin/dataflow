# ⚡ Quick Guide: Testare Modelli con Input Custom

## 🎯 Problema
Hai un modello ML trainato e vuoi testare **UN SOLO VALORE** personalizzato.

## ✅ Soluzione Rapida: Custom Table

### Step 1: Traina il Modello
```
[Dataset] → [Train/Test Split] → [ML Classification]
```

### Step 2: Crea Input di Test

1. **Aggiungi nodo "Custom Table"** (categoria Sources)

2. **Click "Modifica Tabella"**

3. **Rinomina le colonne** per corrispondere alle features del training:
   - Se hai trainato con colonna `review_text` → rinomina Column1 in `review_text`
   - Se hai trainato con `text` → rinomina in `text`
   - **I NOMI DEVONO ESSERE IDENTICI!**

4. **Aggiungi i tuoi dati di test:**
   ```
   review_text
   "Questo prodotto è fantastico!"
   "Servizio pessimo"
   ```

5. **Salva la tabella**

### Step 3: Testa il Modello

```
[ML Classification] → model → [ML Predict] ← table ← [Custom Table]
```

**Esegui ML Predict** e vedi i risultati!

---

## 📊 Esempio Completo

### Sentiment Analysis

**Training:**
```
[AI Generate Dataset]
  Template: nlp_sentiment_reviews
  Rows: 200
    ↓
[Train/Test Split]
  Test Size: 0.2
    ↓
[ML Classification]
  Algorithm: Logistic Regression
  Features: review_text
  Target: sentiment
```

**Testing Custom:**
```
[Custom Table]
  Colonne: review_text
  Dati:
    - "Il servizio è eccellente!"
    - "Prodotto difettoso"
    - "Nella media"
    ↓
[ML Predict]
  (collega model da Classification)
```

**Risultato:**
| review_text | predicted_sentiment |
|-------------|---------------------|
| "Il servizio è eccellente!" | positive |
| "Prodotto difettoso" | negative |
| "Nella media" | neutral |

---

## 🔢 Con Features Numeriche

Se il modello usa features numeriche, usa **Numeric Input**:

```
[Numeric Input]
  Value: 150
  Label: text_length  ← Diventa il nome della colonna!
    ↓
[Custom Table]
  (la colonna si chiama automaticamente "text_length")
    ↓
[ML Predict]
```

---

## ⚠️ Errori Comuni

### ❌ Errore: "Column 'review_text' not found"
**Causa:** Nome colonna nel test diverso dal training

**Soluzione:**
- Training usa `review_text` → Test DEVE usare `review_text`
- Training usa `text` → Test DEVE usare `text`

### ❌ Errore: "Shape mismatch"
**Causa:** Numero di colonne diverso

**Soluzione:**
- Se training ha 3 features → test DEVE avere 3 colonne
- Usa `Select Columns` per verificare le features del training

### ❌ Errore: "Invalid data type"
**Causa:** Tipo di dato sbagliato

**Soluzione:**
- Text features → inserisci testo
- Numeric features → inserisci numeri

---

## 💡 Tips Veloci

1. **Verifica Nomi Colonne:**
   ```
   [Dataset] → [Select Columns] → Vedi quali colonne usa il training
   ```

2. **Testa Singolo Valore:**
   - Custom Table con 1 sola riga

3. **Testa Batch:**
   - Custom Table con più righe

4. **Salva Test Frequenti:**
   - Crea CSV con test standard
   - Usa `Load CSV` invece di Custom Table

5. **Slice per Test Rapidi:**
   ```
   [Custom Table] → [Slice Rows] → [ML Predict]
                     (Start: 0, End: 1)  ← Solo prima riga
   ```

---

## 🚀 Workflow Minimo

**3 Nodi per testare input custom:**

```
1. [ML Classification] ← (già trainato)
2. [Custom Table] ← (crea input di test)
3. [ML Predict] ← (collega 1 e 2)
```

**Tempo:** 30 secondi ⏱️

---

## 📝 Checklist

Prima di testare:
- [ ] Modello trainato con successo
- [ ] Conosci i nomi delle features (colonne) usate nel training
- [ ] Custom Table ha le stesse colonne del training
- [ ] Dati di test inseriti correttamente

---

*Per guida completa vedi: SENTIMENT_ANALYSIS_GUIDE.md* 📚
