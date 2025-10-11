# 🔁 Loop Until - Guida Completa

## 🎯 Cos'è Loop Until?

**Loop Until** è un nodo che ti permette di **ripetere una sezione del workflow** finché una condizione è vera. Perfetto per chatbot che chiedono "Vuoi continuare?" o per menu ripetitivi!

---

## 🚀 Come Funziona

### **Concetto Base**:
```
Inizio
  ↓
Fai qualcosa
  ↓
Loop Until: "Vuoi continuare?"
  ├─ 🔁 Sì (contiene "sì") → Torna a "Fai qualcosa"
  └─ 🚪 No → Esci e continua
```

### **Protezione Loop Infiniti**:
- ✅ **Max Iterazioni**: Default 10 (configurabile)
- ✅ **Auto-reset**: Resetta il contatore quando esci
- ✅ **Tracking**: Mostra iterazione corrente nei log

---

## 📦 Parametri

### **1. Tipo Condizione**
- **contains** - Contiene una delle parole (default)
- **equals** - Uguale esatto
- **not_contains** - NON contiene le parole
- **not_equals** - NON uguale

### **2. Valore Condizione**
- Per `contains`: Parole separate da virgola
  - Esempio: `"continua, sì, yes, si"`
- Per `equals`: Valore esatto
  - Esempio: `"sì"`

### **3. Max Iterazioni**
- Numero massimo di ripetizioni (default: 10)
- Protezione contro loop infiniti

### **4. Loop ID**
- ID univoco del loop (default: "loop_1")
- Usa ID diversi per loop multipli nello stesso workflow

---

## 🎨 Esempio 1: Menu Ripetitivo

### **Workflow**:
```
[Bot Says] "Benvenuto nel menu!"
    ↓
[Bot Says] "Scegli: 1=Info, 2=Supporto, 3=Esci"
    ↓
[Ask User] → risposta
    ↓
[If Contains] "1"
    ├─ Sì → [Bot Says] "Ecco le info..."
    └─ No → [If Contains] "2"
        ├─ Sì → [Bot Says] "Ecco il supporto..."
        └─ No → [Bot Says] "Scelta non valida"
    ↓
[Bot Says] "Vuoi fare altro?"
    ↓
[Ask User] → risposta
    ↓
[Loop Until]
    - Condizione: contains
    - Valore: "sì, si, yes, continua"
    - Max: 5
    ├─ 🔁 Continua → Collega a "Scegli: 1=Info..."
    └─ 🚪 Esci → [End] "Arrivederci!"
```

### **Conversazione**:
```
🤖 Benvenuto nel menu!
🤖 Scegli: 1=Info, 2=Supporto, 3=Esci
👤 1
🤖 Ecco le info...
🤖 Vuoi fare altro?
👤 sì
🔁 Loop 'loop_1' - Iterazione 1/5
🔁 Continuo il loop

🤖 Scegli: 1=Info, 2=Supporto, 3=Esci
👤 2
🤖 Ecco il supporto...
🤖 Vuoi fare altro?
👤 no
🔁 Loop 'loop_1' - Iterazione 2/5
🚪 Esco dal loop (condizione non soddisfatta)

🤖 Arrivederci!
```

---

## 🎨 Esempio 2: Raccolta Dati Multipli

### **Workflow**:
```
[Bot Says] "Inserisci nomi (scrivi 'basta' per finire)"
    ↓
[Ask User] → nome
    ↓
[Save Variable] ultimo_nome
    ↓
[Bot Says] "Salvato: {ultimo_nome}"
    ↓
[Loop Until]
    - Condizione: not_contains
    - Valore: "basta, stop, fine"
    - Max: 20
    ├─ 🔁 Continua → Torna a "Ask User"
    └─ 🚪 Esci → [Bot Says] "Raccolta completata!"
```

### **Conversazione**:
```
🤖 Inserisci nomi (scrivi 'basta' per finire)
👤 Mario
🤖 Salvato: Mario
🔁 Loop - Iterazione 1/20
🔁 Continuo il loop

👤 Luigi
🤖 Salvato: Luigi
🔁 Loop - Iterazione 2/20
🔁 Continuo il loop

👤 basta
🤖 Salvato: basta
🔁 Loop - Iterazione 3/20
🚪 Esco dal loop

🤖 Raccolta completata!
```

---

## 🎨 Esempio 3: Quiz Ripetuto

### **Workflow**:
```
[Bot Says] "Quiz! Quanto fa 2+2?"
    ↓
[Ask User] → risposta
    ↓
[If Contains] "4"
    ├─ Sì → [Bot Says] "Corretto! ✅"
    └─ No → [Bot Says] "Sbagliato! ❌"
    ↓
[Bot Says] "Vuoi un'altra domanda?"
    ↓
[Ask User] → risposta
    ↓
[Loop Until]
    - Condizione: equals
    - Valore: "sì"
    - Max: 3
    ├─ 🔁 Continua → Torna a "Quiz!"
    └─ 🚪 Esci → [End] "Grazie per aver giocato!"
```

---

## 💡 Tips & Tricks

### ✅ **Cosa Fare**

1. **Usa Loop ID univoci** se hai più loop nello stesso workflow
   ```
   Loop 1: loop_id = "menu_loop"
   Loop 2: loop_id = "quiz_loop"
   ```

2. **Imposta Max Iterazioni appropriate**
   - Menu: 5-10
   - Raccolta dati: 20-50
   - Quiz: 3-5

3. **Usa condizioni chiare**
   - `contains: "sì, si, yes"` per conferme
   - `not_contains: "no, basta, stop"` per continuare finché non dice stop

4. **Collega sempre entrambi gli output**
   - 🔁 **Continua Loop** → Torna all'inizio del loop
   - 🚪 **Esci Loop** → Continua il workflow

### ❌ **Cosa Evitare**

1. **Loop senza Exit** - Collega sempre l'output "Esci Loop"
2. **Max troppo alto** - Rischi timeout o esecuzioni lunghe
3. **Condizioni impossibili** - Assicurati che la condizione possa essere falsa
4. **Loop ID duplicati** - Usa ID univoci per ogni loop

---

## 🔧 Come Creare un Loop

### **Step 1: Crea la Sezione da Ripetere**
```
[Bot Says] "Messaggio"
    ↓
[Ask User] → input
    ↓
[Fai qualcosa con input]
```

### **Step 2: Aggiungi Loop Until**
```
    ↓
[Bot Says] "Vuoi continuare?"
    ↓
[Ask User] → risposta
    ↓
[Loop Until]
    - Collega "risposta" all'input "value"
    - Configura condizione
```

### **Step 3: Collega gli Output**
```
[Loop Until]
    ├─ 🔁 Continua → Collega a "Messaggio" (inizio loop)
    └─ 🚪 Esci → Collega a nodo successivo o End
```

---

## 🐛 Troubleshooting

### **Loop non si ripete**
- Verifica che l'output "Continua Loop" sia collegato all'inizio del loop
- Controlla che la condizione sia vera

### **Loop infinito**
- Impossibile! Max iterazioni lo ferma automaticamente
- Se serve più iterazioni, aumenta "Max Iterazioni"

### **Condizione non funziona**
- Controlla il tipo di condizione (contains vs equals)
- Verifica che le parole chiave siano corrette
- Guarda i log: `🔍 Condizione 'contains' con '...' su '...' → ✅/❌`

### **"Workflow contains cycles"**
- Normale con loop! Il sistema lo permette automaticamente
- Se vedi questo errore, assicurati di avere un nodo "Loop Until" nel workflow

---

## 📊 Output del Nodo

### **Output Ports**:
- **🔁 continue_loop** - `True` se deve continuare, `False` altrimenti
- **🚪 exit_loop** - `True` se deve uscire, `False` altrimenti

### **Metadata**:
```json
{
  "loop_id": "loop_1",
  "iteration": 3,
  "condition_met": true,
  "max_reached": false
}
```

---

## 🎯 Casi d'Uso

### **1. Menu Interattivo**
Ripeti il menu finché l'utente non sceglie "Esci"

### **2. Raccolta Dati**
Chiedi più elementi finché l'utente dice "basta"

### **3. Quiz/Giochi**
Ripeti domande finché l'utente vuole continuare

### **4. Form Multi-Step**
Permetti di modificare i dati inseriti

### **5. Conferma Ripetuta**
Chiedi conferma finché l'input è valido

---

## 🔥 Esempio Completo: Chatbot Pizzeria con Loop

```
[Bot Says] "Benvenuto in Pizzeria Mario! 🍕"
    ↓
[Bot Says] "Vuoi ordinare?"
    ↓
[Ask User] → risposta
    ↓
[If Contains] "sì, si, yes"
    ├─ Sì
    │   ↓
    │   [Bot Says] "Che pizza vuoi?"
    │   ↓
    │   [Ask User] → pizza
    │   ↓
    │   [Save Variable] ultima_pizza
    │   ↓
    │   [Bot Says] "Pizza {ultima_pizza} aggiunta! Vuoi ordinare altro?"
    │   ↓
    │   [Ask User] → risposta
    │   ↓
    │   [Loop Until]
    │       - Condizione: contains
    │       - Valore: "sì, si, yes, ancora"
    │       - Max: 5
    │       - Loop ID: "ordine_loop"
    │       ├─ 🔁 Continua → Torna a "Che pizza vuoi?"
    │       └─ 🚪 Esci
    │           ↓
    │           [Bot Says] "Ordine completato! Totale: ..."
    │           ↓
    │           [End] "Grazie! 🍕"
    │
    └─ No → [End] "Va bene, alla prossima!"
```

---

**Ora puoi creare chatbot con loop infiniti (ma sicuri)! 🔁🚀**
