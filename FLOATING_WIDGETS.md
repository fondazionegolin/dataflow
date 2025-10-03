# 🎨 Widget Flottanti - Visualizzazione Live!

## 🎉 Nuova Architettura UI!

Ho implementato un sistema di **widget flottanti** che si attaccano automaticamente ai nodi e mostrano i risultati in tempo reale!

## ✨ Come Funziona

### Automatico!

Quando esegui un workflow:
1. ✅ **Widget appaiono automaticamente** sotto i nodi eseguiti
2. ✅ **Tipo widget** scelto automaticamente (data/plot/metrics)
3. ✅ **Collegati visivamente** al nodo
4. ✅ **Draggable** - sposta dove vuoi
5. ✅ **Resizable** - 3 dimensioni (small/medium/large)
6. ✅ **Chiudibili** - click X per nascondere

### Tipi di Widget

#### 📊 Data Widget
**Per nodi che generano dati:**
- Generate Synthetic Data
- Load CSV
- Select Columns
- Transform Columns

**Mostra:**
- Tabella dati (prime 5-20 righe)
- Scroll per vedere tutte le colonne
- Contatore righe/colonne

#### 📈 Plot Widget
**Per nodi di visualizzazione:**
- 2D Scatter Plot
- 3D Scatter Plot
- Histogram

**Mostra:**
- Grafico Plotly interattivo
- Zoom, pan, hover
- Fullscreen disponibile

#### 📊 Metrics Widget
**Per nodi ML:**
- Regression
- Classification

**Mostra:**
- Metriche principali
- Accuracy, R², RMSE, ecc.
- Formato compatto

## 🎯 Workflow Esempio

```
1. Trascina "AI Generate Dataset"
   - Configura parametri
   
2. Execute
   
3. 🎉 Widget appare automaticamente sotto il nodo!
   - Mostra tabella dati
   - Draggable
   - Resizable
   
4. Aggiungi "2D Scatter Plot"
   - Collega
   - Configura X, Y
   - Execute
   
5. 🎉 Widget grafico appare!
   - Grafico interattivo
   - Sotto il nodo plot
   
6. Aggiungi "Regression"
   - Collega
   - Execute
   
7. 🎉 Widget metriche appare!
   - Mostra accuracy, R², ecc.
```

## 🎨 Features Widget

### Draggable
- **Click header** e trascina
- Posiziona dove vuoi
- Rimane collegato visivamente al nodo

### Resizable
- **Click icona resize** (↗️)
- 3 dimensioni:
  - Small: 256×192px
  - Medium: 384×256px
  - Large: 600×400px

### Chiudibile
- **Click X** per nascondere
- Widget rimane in memoria
- Riappare se esegui di nuovo

### Auto-positioning
- Widget appare **sotto il nodo**
- Offset automatico
- Segue zoom del canvas

## 💡 Vantaggi

### vs Modale

**Prima (Modale):**
- ❌ Devi cliccare nodo per vedere risultati
- ❌ Modale copre tutto
- ❌ Non vedi più nodi
- ❌ Devi chiudere per continuare

**Ora (Widget):**
- ✅ **Risultati sempre visibili**
- ✅ **Vedi tutto il workflow**
- ✅ **Confronta risultati** tra nodi
- ✅ **Workflow fluido**
- ✅ **Preview live**

### Workflow Visuale

```
┌─────────────────────────────────────────────┐
│                                             │
│  [Generate Data]                            │
│       ↓                                     │
│  ┌──────────────┐                          │
│  │ 📊 Data      │ ← Widget flottante!      │
│  │ 100 rows     │                           │
│  │ 5 columns    │                           │
│  └──────────────┘                          │
│       ↓                                     │
│  [2D Plot]                                  │
│       ↓                                     │
│  ┌──────────────┐                          │
│  │ 📈 Plot      │ ← Widget grafico!        │
│  │ [Grafico]    │                           │
│  └──────────────┘                          │
│                                             │
└─────────────────────────────────────────────┘
```

## 🎯 Casi d'Uso

### 1. Esplorazione Dati

```
Generate Data → Widget mostra dati
  ↓
Select Columns → Widget mostra selezione
  ↓
Transform → Widget mostra trasformazione
```

**Vedi ogni step in tempo reale!**

### 2. Visualizzazione Multipla

```
Data
  ├→ Plot 2D → Widget grafico 1
  ├→ Plot 3D → Widget grafico 2
  └→ Histogram → Widget grafico 3
```

**Confronta visualizzazioni affiancate!**

### 3. ML Pipeline

```
Data → Split
  ├→ Train → Regression → Widget metriche
  └→ Test → Predict → Widget risultati
```

**Monitora metriche in tempo reale!**

## 🔧 Personalizzazione

### Posizione Widget

Widget appare automaticamente sotto il nodo con offset di 150px.

Per modificare:
```typescript
// FloatingWidget.tsx, line ~38
const offsetY = 150; // Cambia questo valore
```

### Dimensioni Default

```typescript
// FloatingWidget.tsx, line ~27
const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');
```

### Stile Widget

```typescript
// FloatingWidget.tsx, line ~102
className="bg-white rounded-lg shadow-2xl border-2 border-primary/20"
```

## 🚀 Prossimi Miglioramenti

### Fase 2.1: Connessioni Visive
- [ ] Linee che collegano widget a nodi
- [ ] Animazioni quando dati cambiano
- [ ] Highlight al hover

### Fase 2.2: Widget Interattivi
- [ ] Edit dati direttamente nel widget
- [ ] Selezione colonne nel widget data
- [ ] Filtri live

### Fase 2.3: Layout Automatico
- [ ] Auto-arrange widget
- [ ] Evita sovrapposizioni
- [ ] Grid snap

### Fase 2.4: Widget Avanzati
- [ ] Widget code editor
- [ ] Widget SQL query
- [ ] Widget custom

## 📋 Test Completo

```bash
# 1. Riavvia frontend
cd frontend
npm run dev

# 2. Crea workflow
Generate Synthetic Data
  ↓
2D Scatter Plot

# 3. Execute

# 4. Vedi widget apparire! 🎉

# 5. Prova:
- Drag widget
- Resize widget
- Close widget
- Execute di nuovo (widget riappare)
```

## ✅ Checklist

- [x] Widget flottanti
- [x] Auto-creazione dopo execute
- [x] 3 tipi (data/plot/metrics)
- [x] Draggable
- [x] Resizable (3 size)
- [x] Chiudibile
- [x] Auto-positioning sotto nodo
- [x] Tabelle dati
- [x] Grafici Plotly
- [x] Metriche ML
- [ ] Connessioni visive (TODO)
- [ ] Edit interattivo (TODO)
- [ ] Layout automatico (TODO)

## 🎨 Architettura

### Store
```typescript
widgetStore.ts
- widgets: Widget[]
- addWidget(nodeId, type)
- removeWidget(nodeId)
- toggleWidget(nodeId)
```

### Component
```typescript
FloatingWidget.tsx
- Draggable header
- Resizable (3 sizes)
- Renders data/plot/metrics
- Auto-positioning
```

### Integration
```typescript
App.tsx
- Auto-creates widgets on execute
- Renders visible widgets
- Passes node position and data
```

## 🎉 Risultato

**Ora hai un'interfaccia veramente visuale e reattiva!**

- ✅ Widget flottanti collegati ai nodi
- ✅ Visualizzazione automatica risultati
- ✅ Workflow completamente visibile
- ✅ Drag & drop widget
- ✅ Resize on-the-fly
- ✅ Confronto risultati multipli

**Riavvia il frontend e prova!** 🚀

---

**File creati:**
- ✅ `frontend/src/components/FloatingWidget.tsx`
- ✅ `frontend/src/store/widgetStore.ts`
- ✅ `frontend/src/App.tsx` (aggiornato)

**Prossimo:** Connessioni visive e edit interattivo! 🎨
