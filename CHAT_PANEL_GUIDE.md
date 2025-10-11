# 💬 Chat Panel - Guida Completa

## 🎯 Cos'è il Chat Panel?

Il **Chat Panel** è un'interfaccia chat **in tempo reale** che si apre automaticamente quando esegui un workflow con nodi chatbot. Ti permette di **interagire direttamente** con il bot mentre il workflow è in esecuzione!

---

## 🚀 Come Funziona

### **1. Crea un Workflow Chatbot**
Usa i nodi della categoria `simple_chatbot`:
- **Bot Says** - Il bot dice qualcosa
- **Ask User** - Il bot chiede qualcosa
- **If Contains** - Branch basato su parole chiave
- **Save Variable** - Salva risposte
- **End** - Fine conversazione

### **2. Esegui il Workflow**
Clicca il bottone **"Chat"** nella toolbar (o si apre automaticamente se ci sono nodi chatbot).

### **3. Interagisci in Tempo Reale**
- Il bot invia messaggi → Li vedi nella chat
- Il bot chiede qualcosa → Scrivi la risposta
- Premi **Enter** o clicca **Invia**
- Il workflow continua con la tua risposta!

---

## 🎨 Esempio Pratico

### Workflow:
```
[Bot Says] "Ciao! Come ti chiami?"
    ↓
[Ask User] → Aspetta risposta utente
    ↓
[Save Variable] nome_utente
    ↓
[Bot Says] "Ciao {nome_utente}! Piacere!"
    ↓
[End] "Arrivederci!"
```

### Cosa Succede:
1. **Esegui il workflow** → Chat panel si apre
2. **Bot**: "Ciao! Come ti chiami?"
3. **Tu scrivi**: "Mario"
4. **Bot**: "Ciao Mario! Piacere!"
5. **Bot**: "Arrivederci!"
6. **Chat**: "Conversazione terminata"

---

## 💡 Features del Chat Panel

### ✨ **Interfaccia**
- 💬 **Messaggi bot** - Sfondo bianco, allineati a sinistra
- 👤 **Messaggi utente** - Sfondo blu, allineati a destra
- ⏰ **Timestamp** - Ora di ogni messaggio
- 📜 **Auto-scroll** - Scorre automaticamente ai nuovi messaggi

### 🎛️ **Controlli**
- **Minimizza** - Riduci il panel (icona `-`)
- **Espandi** - Ingrandisci il panel (icona `□`)
- **Chiudi** - Chiudi il panel (icona `×`)
- **Pulisci chat** - Cancella tutti i messaggi

### 🔄 **Stati**
- **In attesa...** - Il bot sta aspettando la tua risposta
- **Scrivi la tua risposta...** - Input attivo
- **In attesa del bot...** - Input disabilitato

---

## 🔧 Come Usare

### **Aprire la Chat**
1. **Automatico**: Si apre quando aggiungi nodi chatbot
2. **Manuale**: Clicca il bottone **"Chat"** nella toolbar

### **Inviare Messaggi**
1. Aspetta che il bot chieda qualcosa (vedi "In attesa...")
2. Scrivi la risposta nell'input
3. Premi **Enter** o clicca **Invia** (icona ✉️)

### **Chiudere la Chat**
- Clicca la **×** in alto a destra
- Riapri cliccando **"Chat"** nella toolbar

---

## 🎯 Workflow Completo Esempio

### Chatbot Pizzeria con Chat Panel

```
[Bot Says] "Benvenuto in Pizzeria Mario! 🍕"
    ↓
[Ask User] "Come ti chiami?"
    ↓ (utente scrive: "Luca")
    
[Save Variable] nome_utente = "Luca"
    ↓
[Bot Says] "Ciao {nome_utente}! Vuoi ordinare?"
    ↓ (diventa: "Ciao Luca! Vuoi ordinare?")
    
[Ask User] "Scrivi 'sì' o 'no'"
    ↓ (utente scrive: "sì")
    
[If Contains] parole: "sì, si, yes"
    ├─ ✅ Sì
    │   ↓
    │   [Bot Says] "Perfetto {nome_utente}! Che pizza vuoi?"
    │   ↓
    │   [Ask User] "Scrivi il tipo di pizza"
    │   ↓ (utente scrive: "Margherita")
    │   
    │   [Save Variable] pizza = "Margherita"
    │   ↓
    │   [Bot Says] "Ottimo {nome_utente}! Pizza {pizza} in arrivo!"
    │   ↓
    │   [End] "Grazie {nome_utente}! A presto! 🍕"
    │
    └─ ❌ No
        ↓
        [End] "Va bene {nome_utente}, alla prossima!"
```

### Conversazione nella Chat:

```
🤖 Bot: Benvenuto in Pizzeria Mario! 🍕
🤖 Bot: Come ti chiami?
💬 In attesa...

👤 Tu: Luca

🤖 Bot: Ciao Luca! Vuoi ordinare?
🤖 Bot: Scrivi 'sì' o 'no'
💬 In attesa...

👤 Tu: sì

🤖 Bot: Perfetto Luca! Che pizza vuoi?
🤖 Bot: Scrivi il tipo di pizza
💬 In attesa...

👤 Tu: Margherita

🤖 Bot: Ottimo Luca! Pizza Margherita in arrivo!
🤖 Bot: Grazie Luca! A presto! 🍕
✅ Conversazione terminata
```

---

## 🔥 Tips & Tricks

### 💡 **Tip 1: Timeout**
Se non rispondi entro **60 secondi**, il workflow usa la "Risposta Test" del nodo.

### 💡 **Tip 2: Variabili**
Usa `{nome_variabile}` nei messaggi del bot per personalizzare!

### 💡 **Tip 3: Debug**
Guarda anche il **Log Panel** in basso per vedere cosa succede dietro le quinte.

### 💡 **Tip 4: Pulisci Chat**
Clicca "Pulisci chat" per ricominciare da zero senza chiudere il panel.

### 💡 **Tip 5: Minimizza**
Minimizza il panel per vedere meglio il workflow mentre chatti.

---

## 🎨 Personalizzazione

### **Posizione**
- Il chat panel è **fisso in basso a destra**
- **Non copre** il workflow o i log
- **Ridimensionabile**: Minimizza/Espandi

### **Dimensioni**
- **Normale**: 96 (larghezza) × 600px (altezza)
- **Minimizzato**: 80 × 16px (solo header)

### **Stile**
- **Messaggi bot**: Bianco con bordo grigio
- **Messaggi utente**: Blu con testo bianco
- **Input**: Bordo blu quando attivo
- **Bottone invia**: Blu quando può inviare

---

## 🐛 Troubleshooting

### **Chat non si apre**
- Verifica di avere nodi `simple_chatbot.*` nel workflow
- Clicca manualmente il bottone **"Chat"** nella toolbar

### **Bot non risponde**
- Controlla il **Log Panel** per errori
- Verifica che i nodi siano collegati correttamente

### **Input disabilitato**
- L'input è attivo solo quando il bot chiede qualcosa (nodo **Ask User**)
- Aspetta che appaia "In attesa..." sopra l'input

### **Timeout**
- Se non rispondi entro 60 secondi, il workflow continua con la risposta test
- Riduci il timeout o rispondi più velocemente

---

## 📊 Architettura Tecnica

### **Frontend** (`ChatPanel.tsx`)
- WebSocket connection a `ws://localhost:8000/ws/chat`
- Riceve messaggi dal bot (`bot_message`)
- Riceve richieste di input (`ask_user`)
- Invia risposte utente (`user_response`)

### **Backend** (`main.py`)
- WebSocket endpoint `/ws/chat`
- Broadcast messaggi a tutti i client connessi
- Gestisce pending input con `asyncio.Future`

### **Nodi Chatbot** (`simple_chatbot.py`)
- **Bot Says**: Broadcast `bot_message`
- **Ask User**: Broadcast `ask_user` + attende risposta
- **End**: Broadcast `chat_end`

---

## 🚀 Quick Start

1. **Crea workflow** con nodi `simple_chatbot`
2. **Clicca "Chat"** nella toolbar
3. **Esegui workflow** (bottone ▶️ su un nodo)
4. **Interagisci** nella chat!

---

## 📚 Nodi Compatibili

Tutti i nodi della categoria **`simple_chatbot`**:
- ✅ Bot Says
- ✅ Ask User
- ✅ If Contains
- ✅ Yes/No
- ✅ Multi Choice
- ✅ Save Variable
- ✅ Show Variables
- ✅ End

---

**Ora hai un chatbot completamente interattivo! 🎉**
