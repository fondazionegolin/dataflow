# 🤖 Guida Chatbot Semplice

## 🎯 Idea Base

Crea chatbot **visivamente** come un **albero decisionale**:
- Ogni nodo è un messaggio o una domanda
- Ogni risposta crea un **branch** (ramo)
- Colleghi i nodi per creare il flusso

**Niente programmazione, solo drag & drop!**

---

## 📦 Nodi Disponibili (Categoria: `simple_chatbot`)

### 1. 💬 **Bot Says**
Il bot dice qualcosa.

**Esempio**: "Ciao! Benvenuto!"

---

### 2. ❓ **Ask User**
Chiedi qualcosa all'utente.

**Esempio**: "Come ti chiami?"

**Output**: La risposta dell'utente

---

### 3. 🔀 **If Contains**
Se la risposta contiene certe parole → vai in un path.

**Esempio**: 
- Parole: "ciao, salve, buongiorno"
- Se l'utente dice "ciao" → ✅ Sì
- Se dice altro → ❌ No

**2 Output**:
- ✅ **Sì** - Contiene le parole
- ❌ **No** - Non le contiene

---

### 4. ❓ **Yes/No**
Domanda Sì/No con 2 path.

**Esempio**: "Vuoi continuare?"

**2 Output**:
- ✅ **Sì**
- ❌ **No**

---

### 5. 🎯 **Multi Choice**
Scelta multipla con 4 opzioni.

**Esempio**: 
```
Cosa vuoi fare?
1. Informazioni
2. Supporto
3. Ordine
4. Esci
```

**4 Output**:
- 1️⃣ Opzione 1
- 2️⃣ Opzione 2
- 3️⃣ Opzione 3
- 4️⃣ Opzione 4

---

### 6. 🏁 **End**
Fine conversazione.

**Esempio**: "Grazie! Arrivederci! 👋"

---

## 🎨 Esempio 1: Chatbot Semplice

```
[Bot Says] "Ciao! Come ti chiami?"
    ↓
[Ask User] (risposta)
    ↓
[Bot Says] "Piacere di conoscerti!"
    ↓
[End] "Arrivederci!"
```

**Come si crea**:
1. Trascina **Bot Says** → Scrivi: "Ciao! Come ti chiami?"
2. Collega a **Ask User**
3. Collega a **Bot Says** → Scrivi: "Piacere!"
4. Collega a **End**

---

## 🎨 Esempio 2: Chatbot con Branch

```
[Bot Says] "Ciao!"
    ↓
[Ask User] "Come stai?"
    ↓
[If Contains] parole: "bene, ottimo, benissimo"
    ├─ ✅ Sì → [Bot Says] "Che bello! 😊"
    └─ ❌ No → [Bot Says] "Mi dispiace... 😔"
```

**Come si crea**:
1. **Bot Says**: "Ciao!"
2. **Ask User**: "Come stai?"
3. **If Contains**: Parole = "bene, ottimo, benissimo"
4. Collega **✅ Sì** a **Bot Says** "Che bello!"
5. Collega **❌ No** a **Bot Says** "Mi dispiace..."

---

## 🎨 Esempio 3: Menu con Scelte

```
[Bot Says] "Benvenuto!"
    ↓
[Multi Choice] "Cosa vuoi fare?"
    1. Info
    2. Supporto
    3. Ordine
    4. Esci
    ├─ 1️⃣ → [Bot Says] "Ecco le info..."
    ├─ 2️⃣ → [Bot Says] "Ti aiuto subito!"
    ├─ 3️⃣ → [Bot Says] "Fai il tuo ordine..."
    └─ 4️⃣ → [End] "Ciao!"
```

**Come si crea**:
1. **Bot Says**: "Benvenuto!"
2. **Multi Choice**: 
   - Opzione 1: "Info"
   - Opzione 2: "Supporto"
   - Opzione 3: "Ordine"
   - Opzione 4: "Esci"
3. Collega ogni output (1️⃣, 2️⃣, 3️⃣, 4️⃣) al suo path

---

## 🎨 Esempio 4: Chatbot Completo (Pizzeria)

```
[Bot Says] "Benvenuto in Pizzeria Mario! 🍕"
    ↓
[Yes/No] "Vuoi ordinare una pizza?"
    ├─ ✅ Sì
    │   ↓
    │   [Multi Choice] "Che pizza vuoi?"
    │       1. Margherita
    │       2. Diavola
    │       3. Capricciosa
    │       4. Annulla
    │       ├─ 1️⃣ → [Bot Says] "Margherita scelta!"
    │       ├─ 2️⃣ → [Bot Says] "Diavola scelta!"
    │       ├─ 3️⃣ → [Bot Says] "Capricciosa scelta!"
    │       └─ 4️⃣ → [End] "Ordine annullato"
    │           ↓
    │       [Multi Choice] "Che dimensione?"
    │           1. Piccola
    │           2. Media
    │           3. Grande
    │           ├─ 1️⃣ → [Bot Says] "Piccola: €5"
    │           ├─ 2️⃣ → [Bot Says] "Media: €7"
    │           └─ 3️⃣ → [Bot Says] "Grande: €9"
    │               ↓
    │           [End] "Ordine confermato! Grazie! 🍕"
    │
    └─ ❌ No → [End] "Va bene, alla prossima!"
```

---

## 💡 Tips & Tricks

### ✅ **Cosa Fare**
- **Inizia semplice**: Un path lineare prima
- **Testa subito**: Usa "Risposta Test" per provare
- **Un branch alla volta**: Aggiungi complessità gradualmente
- **Nomi chiari**: Scrivi messaggi comprensibili

### ❌ **Cosa Evitare**
- **Troppi branch**: Max 3-4 livelli
- **Messaggi lunghi**: Brevi e chiari
- **Loop infiniti**: Assicurati ci sia sempre un End

---

## 🔥 Vantaggi

✅ **Visuale**: Vedi il flusso della conversazione  
✅ **Semplice**: Niente codice, solo drag & drop  
✅ **Veloce**: Crea chatbot in 5 minuti  
✅ **Testabile**: Prova subito con risposte simulate  
✅ **Flessibile**: Aggiungi branch quando serve  

---

## 🎯 Quando Usarlo

- ✅ **FAQ Bot**: Risposte a domande frequenti
- ✅ **Menu Bot**: Navigazione tra opzioni
- ✅ **Survey Bot**: Questionari e sondaggi
- ✅ **Order Bot**: Ordini guidati step-by-step
- ✅ **Support Bot**: Supporto clienti base

---

## 🚀 Quick Start

1. **Apri la palette** → Cerca "simple_chatbot"
2. **Trascina "Bot Says"** → Scrivi il messaggio di benvenuto
3. **Aggiungi "Ask User"** → Fai una domanda
4. **Aggiungi "If Contains"** → Crea un branch
5. **Collega i nodi** → Segui il flusso
6. **Aggiungi "End"** → Chiudi la conversazione
7. **Esegui!** → Testa il tuo chatbot

---

## 📚 Differenza con Chatbot Avanzato

| Feature | Simple Chatbot | Chatbot Avanzato |
|---------|---------------|------------------|
| **Complessità** | ⭐ Facile | ⭐⭐⭐ Complesso |
| **Visuale** | ✅ Albero chiaro | ❌ Nodi sparsi |
| **AI** | ❌ No | ✅ OpenAI |
| **Context** | ❌ No | ✅ Variabili |
| **Uso** | FAQ, Menu | Assistenti AI |

**Consiglio**: Inizia con Simple Chatbot, poi passa ad Avanzato se serve AI!

---

**Buon divertimento! 🚀**
