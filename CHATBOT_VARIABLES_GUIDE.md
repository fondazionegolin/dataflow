# 💾 Guida Variabili Chatbot

## 🎯 Cosa Sono le Variabili?

Le variabili ti permettono di **salvare le risposte dell'utente** e **riutilizzarle** nei messaggi successivi!

---

## 📦 Come Funziona

### 1️⃣ **Salva la Risposta**
Usa il nodo **"Save Variable"** per salvare quello che dice l'utente.

### 2️⃣ **Riutilizza nei Messaggi**
Usa `{nome_variabile}` nei messaggi del bot per inserire il valore salvato.

---

## 🎨 Esempio Pratico

### Workflow:
```
[Bot Says] "Come ti chiami?"
    ↓
[Ask User] → risposta: "Mario"
    ↓
[Save Variable] 
    - Nome: "nome_utente"
    - Valore: (collega da Ask User)
    ↓
[Bot Says] "Ciao {nome_utente}! Piacere di conoscerti!"
    ↓ (diventa)
    "Ciao Mario! Piacere di conoscerti!"
```

---

## 🔧 Come Creare

### Step 1: Chiedi all'Utente
1. Trascina **"Ask User"**
2. Scrivi la domanda: "Come ti chiami?"

### Step 2: Salva la Risposta
1. Trascina **"Save Variable"**
2. Collega l'output **"response"** di Ask User all'input **"value"** di Save Variable
3. Nel parametro "Nome Variabile" scrivi: `nome_utente`

### Step 3: Usa la Variabile
1. Trascina **"Bot Says"**
2. Scrivi: `Ciao {nome_utente}! Come stai?`
3. La variabile `{nome_utente}` verrà sostituita automaticamente!

---

## 🎨 Esempio Completo: Chatbot Personalizzato

```
[Bot Says] "Benvenuto! Come ti chiami?"
    ↓
[Ask User] → "Mario"
    ↓
[Save Variable] nome_utente = "Mario"
    ↓
[Bot Says] "Ciao {nome_utente}! Quanti anni hai?"
    ↓ (diventa: "Ciao Mario! Quanti anni hai?")
    
[Ask User] → "25"
    ↓
[Save Variable] eta = "25"
    ↓
[Bot Says] "Perfetto {nome_utente}! Hai {eta} anni."
    ↓ (diventa: "Perfetto Mario! Hai 25 anni.")
    
[Bot Says] "Cosa vuoi fare?"
    ↓
[Ask User] → "Voglio ordinare una pizza"
    ↓
[Save Variable] richiesta = "Voglio ordinare una pizza"
    ↓
[If Contains] parole: "pizza"
    ├─ ✅ Sì → [Bot Says] "Ottimo {nome_utente}! Ti aiuto con la pizza!"
    └─ ❌ No → [Bot Says] "Mi dispiace {nome_utente}, non ho capito: {richiesta}"
```

---

## 💡 Il Tuo Esempio

**Utente dice**: "buongiorno staminchia!"

**Workflow**:
```
[Ask User] "Come stai?"
    ↓ risposta: "buongiorno staminchia!"
    
[Save Variable]
    - Nome: "risposta_utente"
    - Valore: (collega da Ask User)
    ↓
    
[Bot Says] "Mi spiace che tu dica {risposta_utente}"
    ↓ (diventa)
    "Mi spiace che tu dica buongiorno staminchia!"
```

---

## 📋 Nodi Disponibili

### 💾 **Save Variable**
Salva un valore in una variabile.

**Input**: 
- `value` - Il valore da salvare (collega da Ask User)

**Parametri**:
- `variable_name` - Nome della variabile (es: `nome_utente`, `eta`, `risposta_utente`)
- `session_id` - ID sessione (lascia "default")

**Output**:
- `next` - Continua il flusso

---

### 💬 **Bot Says** (con variabili)
Mostra un messaggio con variabili.

**Sintassi**: Usa `{nome_variabile}` nel messaggio

**Esempi**:
- `Ciao {nome_utente}!`
- `Hai {eta} anni`
- `Mi hai detto: {risposta_utente}`
- `Benvenuto {nome_utente}, hai {eta} anni e vuoi {richiesta}`

---

### 📋 **Show Variables** (debug)
Mostra tutte le variabili salvate (utile per debug).

---

## 🎯 Regole Importanti

### ✅ **Cosa Fare**
- **Nomi chiari**: `nome_utente`, `eta`, `risposta_utente`
- **Usa underscore**: `nome_utente` ✅ non `nome utente` ❌
- **Salva prima di usare**: Salva la variabile prima di usarla in Bot Says
- **Stesso session_id**: Usa lo stesso session_id in tutti i nodi

### ❌ **Cosa Evitare**
- **Spazi nei nomi**: `risposta utente` ❌ → usa `risposta_utente` ✅
- **Variabili non salvate**: Se usi `{nome}` ma non l'hai salvata, resta `{nome}`
- **Session_id diversi**: Se usi session_id diversi, le variabili non si vedono

---

## 🔥 Esempi Avanzati

### Esempio 1: Form Completo
```
[Bot Says] "Registrazione"
[Ask User] "Nome?" → [Save Variable] nome
[Ask User] "Email?" → [Save Variable] email
[Ask User] "Età?" → [Save Variable] eta
[Bot Says] "Riepilogo: {nome}, {email}, {eta} anni. Confermi?"
[Yes/No]
    ├─ Sì → [Bot Says] "Grazie {nome}! Registrazione completata!"
    └─ No → [Bot Says] "Ok {nome}, riprova quando vuoi"
```

### Esempio 2: Supporto Personalizzato
```
[Bot Says] "Ciao! Come ti chiami?"
[Ask User] → [Save Variable] nome
[Bot Says] "Ciao {nome}! Qual è il problema?"
[Ask User] → [Save Variable] problema
[If Contains] "password"
    ├─ Sì → [Bot Says] "{nome}, ti aiuto con la password"
    └─ No → [Bot Says] "{nome}, per '{problema}' contatta il supporto"
```

### Esempio 3: Quiz Personalizzato
```
[Bot Says] "Quiz! Come ti chiami?"
[Ask User] → [Save Variable] nome
[Bot Says] "Ok {nome}, quanto fa 2+2?"
[Ask User] → [Save Variable] risposta
[If Contains] "4"
    ├─ Sì → [Bot Says] "Bravo {nome}! Risposta corretta!"
    └─ No → [Bot Says] "Mi dispiace {nome}, hai risposto {risposta} ma è sbagliato"
```

---

## 🎨 Tips & Tricks

### 💡 **Tip 1: Variabili Multiple**
Puoi usare più variabili nello stesso messaggio:
```
"Ciao {nome}! Hai {eta} anni e vuoi {prodotto}. Il totale è {prezzo}€"
```

### 💡 **Tip 2: Debug con Show Variables**
Aggiungi **Show Variables** per vedere tutte le variabili salvate:
```
[Save Variable] nome
[Save Variable] eta
[Show Variables] → Vedi: {nome: "Mario", eta: "25"}
```

### 💡 **Tip 3: Variabili in If Contains**
Puoi salvare la risposta e poi controllarla:
```
[Ask User] → risposta
[Save Variable] risposta_utente
[If Contains] "ciao"
    ├─ Sì → [Bot Says] "Hai detto {risposta_utente} che contiene 'ciao'!"
    └─ No → [Bot Says] "Hai detto {risposta_utente} ma non contiene 'ciao'"
```

---

## 🚀 Quick Start

1. **Chiedi**: Usa **Ask User**
2. **Salva**: Collega a **Save Variable** e dai un nome
3. **Usa**: Scrivi `{nome_variabile}` in **Bot Says**
4. **Testa**: Esegui e vedi la magia! ✨

---

## 📚 Riepilogo

| Azione | Nodo | Esempio |
|--------|------|---------|
| **Chiedi** | Ask User | "Come ti chiami?" |
| **Salva** | Save Variable | `nome_utente` |
| **Usa** | Bot Says | `Ciao {nome_utente}!` |
| **Debug** | Show Variables | Vedi tutte le variabili |

---

**Ora puoi creare chatbot personalizzati! 🎉**
