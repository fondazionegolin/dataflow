# 🤖 AI Dataset Generation con OpenAI

## ✨ Nuova Funzionalità: Genera Dataset con Linguaggio Naturale!

Ho aggiunto un nodo che usa **OpenAI GPT-4** per generare dataset realistici basati su descrizioni in linguaggio naturale!

## 🚀 Setup Rapido

### 1. Ottieni API Key OpenAI

1. Vai su https://platform.openai.com/api-keys
2. Crea un nuovo API key
3. Copia la chiave

### 2. Configura Backend

```bash
cd /Users/alessandrosaracino/CascadeProjects/dataflow-platform/backend

# Crea file .env
nano .env

# Aggiungi questa riga:
OPENAI_API_KEY=sk-your-actual-key-here

# Salva (Ctrl+O, Enter, Ctrl+X)
```

### 3. Installa Dipendenze

```bash
# Attiva venv
source venv/bin/activate

# Installa openai
pip install openai

# Riavvia backend
PYTHONPATH=. python main.py
```

## 🎯 Come Usare

### Esempio 1: Cilindrata vs Consumo

```
1. Trascina "AI Generate Dataset" nel canvas

2. Configura parametri:
   - Number of Rows: 100
   - Column Names: cilindrata,consumo
   - Description:
     "Voglio correlare dati di cilindrata motore (in cc) 
      con il consumo di carburante (km/l). 
      Cilindrata tra 1000 e 3000cc, 
      consumo tra 8 e 20 km/l. 
      Relazione inversa: più cilindrata = meno consumo."

3. Clicca "Execute"

4. OpenAI genera dataset realistico! ✨
```

### Esempio 2: Dati Immobiliari

```
Column Names: superficie,prezzo,camere,bagni

Description:
"Dataset immobiliare con:
- Superficie: 40-200 mq
- Prezzo: 100k-500k euro, correlato con superficie
- Camere: 1-5, correlato con superficie
- Bagni: 1-3, correlato con camere
Relazioni realistiche per mercato italiano."
```

### Esempio 3: Dati Medici

```
Column Names: età,pressione,colesterolo,rischio

Description:
"Dati medici pazienti:
- Età: 20-80 anni
- Pressione: 90-180 mmHg, aumenta con età
- Colesterolo: 150-300 mg/dL, aumenta con età
- Rischio cardiovascolare: 0-100, correlato con pressione e colesterolo"
```

## 📊 Parametri del Nodo

### Number of Rows
- Quante righe generare
- Min: 10, Max: 10000
- Default: 100

### Column Names
- Nomi colonne separati da virgola
- Esempio: `cilindrata,consumo,potenza`
- Usa nomi descrittivi in italiano o inglese

### Dataset Description
- Descrizione in linguaggio naturale
- Specifica:
  - Cosa rappresenta ogni colonna
  - Range di valori
  - Relazioni tra colonne
  - Pattern desiderati
- Più dettagli = dati più realistici!

### Random Seed
- Per riproducibilità
- Stesso seed = stesso dataset

## 🎨 Workflow Completo

```
AI Generate Dataset
    ↓
Select Columns (opzionale)
    ↓
2D Scatter Plot
    ↓
Regression/Classification
```

### Esempio Completo

```
1. AI Generate Dataset
   - Columns: cilindrata,consumo,anno,km
   - Description: "Auto usate con cilindrata, consumo, anno produzione, km percorsi"

2. Select Columns
   - Seleziona solo: cilindrata, consumo

3. 2D Scatter Plot
   - X: cilindrata
   - Y: consumo
   - Vedi correlazione!

4. Regression
   - Predici consumo da cilindrata
   - Vedi accuracy!
```

## 💡 Tips per Descrizioni Efficaci

### ✅ Buone Descrizioni

```
"Dataset vendite con:
- Prezzo: 10-100 euro
- Quantità: 1-50 unità
- Sconto: 0-30%
Relazione: prezzo alto = quantità bassa
Sconto applicato casualmente"
```

### ❌ Descrizioni Vaghe

```
"Dati di vendite"  ← Troppo vago!
```

### 🎯 Elementi Chiave

1. **Range valori** - Specifica min/max
2. **Relazioni** - Come le colonne si correlano
3. **Contesto** - Cosa rappresentano i dati
4. **Pattern** - Trend, stagionalità, noise

## 🔧 Troubleshooting

### Errore: "OpenAI API key not found"

```bash
# Verifica che .env esista
ls backend/.env

# Verifica contenuto
cat backend/.env

# Deve contenere:
OPENAI_API_KEY=sk-...

# Riavvia backend
```

### Errore: "Failed to parse OpenAI response"

- OpenAI a volte aggiunge testo extra
- Riprova con seed diverso
- Semplifica la descrizione

### Dataset Non Realistico

- Aggiungi più dettagli nella descrizione
- Specifica range numerici esatti
- Descrivi relazioni più chiaramente

## 💰 Costi OpenAI

- Usa GPT-4o-mini (economico)
- ~$0.15 per 1M token input
- ~$0.60 per 1M token output
- 100 righe ≈ $0.001-0.01
- Molto economico per testing!

## 🎉 Vantaggi

### vs Dataset Sintetici Tradizionali

**Tradizionale:**
- ❌ Pattern matematici rigidi
- ❌ Dati poco realistici
- ❌ Difficile specificare relazioni complesse

**AI-Generated:**
- ✅ Dati realistici e vari
- ✅ Descrizione in linguaggio naturale
- ✅ Relazioni complesse facili da specificare
- ✅ Noise naturale incluso
- ✅ Contesto semantico

## 📋 Esempi Pronti

### Business

```
Columns: fatturato,costi,profitto,dipendenti
Description: "Aziende PMI italiane. Fatturato 100k-5M, costi 60-80% fatturato, profitto = fatturato-costi, dipendenti 5-100 correlato con fatturato"
```

### Educazione

```
Columns: ore_studio,voto,assenze,età
Description: "Studenti universitari. Ore studio 0-40/settimana, voto 18-30 correlato positivo con ore studio, assenze 0-20, età 19-25"
```

### Sport

```
Columns: km_corsi,calorie,tempo,velocità
Description: "Sessioni running. Km 3-20, calorie 200-1500 correlato con km, tempo in minuti, velocità = km/tempo"
```

### Finanza

```
Columns: investimento,rendimento,rischio,anni
Description: "Portafogli investimento. Investimento 1k-100k, rendimento 2-15% annuo correlato con rischio, rischio 1-10, anni 1-30"
```

## 🔄 Prossimi Passi

Dopo aver testato l'AI Dataset Generation, implementeremo:

### Fase 2: Widget Flottanti (Prossima)
- Mini-finestre collegate ai nodi
- Preview automatiche
- Zoom e resize
- Aggiornamento live

### Fase 3: UI Reattiva
- Trasformazioni in tempo reale
- Preview prima dell'esecuzione
- Drag & drop colonne
- Visual query builder

## ✅ Test Rapido

```bash
# 1. Setup
cd backend
echo "OPENAI_API_KEY=sk-your-key" > .env
pip install openai
PYTHONPATH=. python main.py

# 2. Frontend
cd ../frontend
npm run dev

# 3. Test
- Trascina "AI Generate Dataset"
- Configura parametri
- Execute
- Vedi dati generati da AI! 🤖
```

---

**Ora hai dataset realistici generati da AI!** 🎉

Prossimo: Implementiamo i widget flottanti per la visualizzazione live! 🚀
