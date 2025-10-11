# 📐 Guida ai Nodi Matematici ed Equazioni

## Panoramica

Il sistema di equazioni matematiche permette di:
- ✍️ Scrivere equazioni con input visuale e tastiera matematica
- 📈 Visualizzare grafici di funzioni
- 🔬 Analizzare funzioni (derivate, integrali, punti critici)
- 🎯 Calcolare valori specifici f(x)
- 📉 Convertire regressioni in equazioni

---

## 🆕 Nuovi Nodi

### 1. **Equazione** (`math.equation`)
**Scopo**: Definire equazioni matematiche

**Input**: Nessuno

**Output**:
- `equation`: Dati dell'equazione (JSON)
- `function`: Funzione valutabile

**Parametri**:
- `equation_str`: Equazione (es: `x**2 + 2*x + 1`)
- `variable`: Variabile indipendente (default: `x`)

**Sintassi supportata**:
```python
x**2          # x al quadrato
x**3          # x al cubo
sqrt(x)       # radice quadrata
exp(x)        # e^x
log(x)        # logaritmo naturale (ln)
log10(x)      # logaritmo base 10
sin(x)        # seno
cos(x)        # coseno
tan(x)        # tangente
abs(x)        # valore assoluto
pi            # costante π
E             # costante e (Eulero)
```

**Esempi**:
- Parabola: `x**2 - 4*x + 3`
- Esponenziale: `2*exp(-x)`
- Trigonometrica: `sin(2*x) + cos(x)`
- Sigmoide: `1/(1 + exp(-x))`
- Gaussiana: `exp(-x**2/2)`

---

### 2. **Grafico Equazione** (`math.plot_equation`)
**Scopo**: Visualizzare equazione come grafico 2D

**Input**:
- `equation`: Equazione dal nodo Equazione

**Output**:
- `plot`: Grafico interattivo
- `points`: Tabella con punti (x, y)

**Parametri**:
- `x_min`: Valore minimo x (default: -10)
- `x_max`: Valore massimo x (default: 10)
- `num_points`: Numero di punti (default: 200)
- `title`: Titolo grafico (opzionale)

**Workflow esempio**:
```
[Equazione] → [Grafico Equazione]
```

---

### 3. **Valuta Equazione** (`math.evaluate`)
**Scopo**: Calcolare f(x) per valori x specifici

**Input**:
- `equation`: Equazione dal nodo Equazione
- `x_values`: Valori x (opzionale, da tabella o nodo numerico)

**Output**:
- `result`: Tabella con colonne `x` e `f(x)`

**Parametri**:
- `x_input`: Valori x separati da virgola (se nessun input connesso)

**Workflow esempio**:
```
[Equazione] → [Valuta Equazione]
[Input Numerico] → [Valuta Equazione]
```

---

### 4. **Analisi Funzione** (`math.function_analysis`)
**Scopo**: Studio completo di funzione

**Input**:
- `equation`: Equazione dal nodo Equazione

**Output**:
- `analysis`: Analisi completa (JSON)
- `derivative`: Derivata prima
- `integral`: Integrale indefinito

**Parametri**:
- `compute_derivative`: Calcola derivata (default: true)
- `compute_integral`: Calcola integrale (default: true)
- `find_critical_points`: Trova punti critici (default: true)
- `find_zeros`: Trova zeri/radici (default: true)

**Risultati forniti**:
- Derivata prima: `f'(x)`
- Integrale: `∫f(x)dx`
- Punti critici: dove `f'(x) = 0`
- Zeri: dove `f(x) = 0`
- Formato LaTeX per visualizzazione

**Workflow esempio**:
```
[Equazione] → [Analisi Funzione] → [Visualizza risultati]
                    ↓
            [Grafico Equazione] (per derivata)
```

---

### 5. **Regressione a Equazione** (`math.regression_to_equation`)
**Scopo**: Convertire coefficienti di regressione in equazione

**Input**:
- `coefficients`: Coefficienti da regressione

**Output**:
- `equation`: Equazione in formato standard
- `equation_string`: Stringa equazione

**Parametri**:
- `regression_type`: Tipo (linear, polynomial, exponential)

**Tipi supportati**:
- **Linear**: `y = mx + b`
- **Polynomial**: `y = ax² + bx + c`
- **Exponential**: `y = a·e^(bx)`

**Workflow esempio**:
```
[Scatter 2D] → [Calcola Regressione] → [Regressione a Equazione] → [Grafico Equazione]
```

---

## 🎯 Workflow Completi

### Workflow 1: Analisi Completa di Funzione
```
[Equazione: x**2 - 4*x + 3]
    ↓
    ├→ [Grafico Equazione] → Visualizza parabola
    ├→ [Analisi Funzione] → Derivata, zeri, punti critici
    └→ [Valuta Equazione] → Calcola valori specifici
```

### Workflow 2: Da Dati a Equazione
```
[Carica CSV con dati x,y]
    ↓
[Scatter 2D con regressione]
    ↓
[Regressione a Equazione]
    ↓
[Grafico Equazione] → Visualizza funzione di regressione
```

### Workflow 3: Studio di Funzione Completo
```
[Equazione: sin(x) + cos(2*x)]
    ↓
[Analisi Funzione]
    ├→ derivata → [Grafico Equazione] → Visualizza f'(x)
    ├→ integral → [Grafico Equazione] → Visualizza ∫f(x)dx
    └→ analysis → [Visualizza JSON] → Punti critici, zeri
```

---

## 🎨 Tastiera Matematica

Il nodo **Equazione** include una tastiera visuale con:

**Operazioni base**:
- `x²`, `x³`, `xⁿ` - Potenze
- `√x`, `ⁿ√x` - Radici

**Funzioni esponenziali e logaritmiche**:
- `eˣ` - Esponenziale
- `ln(x)` - Logaritmo naturale
- `log₁₀(x)` - Logaritmo base 10

**Funzioni trigonometriche**:
- `sin(x)`, `cos(x)`, `tan(x)`

**Costanti**:
- `π` (pi)
- `e` (Eulero)
- `∞` (infinito)

**Altri**:
- `|x|` - Valore assoluto
- `x/y` - Frazione
- `()` - Parentesi

---

## 💡 Esempi Pratici

### Esempio 1: Parabola con Analisi
```python
Equazione: x**2 - 4*x + 3

Analisi fornisce:
- Derivata: 2*x - 4
- Zeri: x = 1, x = 3
- Punto critico: x = 2 (minimo)
- Vertice: (2, -1)
```

### Esempio 2: Funzione Sigmoide
```python
Equazione: 1/(1 + exp(-x))

Usata in machine learning per:
- Classificazione binaria
- Reti neurali
- Regressione logistica
```

### Esempio 3: Gaussiana
```python
Equazione: exp(-x**2/2)

Usata per:
- Distribuzione normale
- Filtri di smoothing
- Kernel functions
```

---

## 🔧 Requisiti Tecnici

**Backend**:
- Python 3.8+
- `sympy` per manipolazione simbolica
- `numpy` per calcoli numerici
- `plotly` per visualizzazione

**Installazione dipendenze**:
```bash
pip install sympy numpy plotly
```

---

## 🚀 Prossimi Sviluppi

- [ ] Supporto per equazioni parametriche
- [ ] Grafici 3D per funzioni f(x,y)
- [ ] Calcolo di limiti
- [ ] Serie di Taylor
- [ ] Trasformate di Fourier
- [ ] Equazioni differenziali
- [ ] Sistemi di equazioni

---

## 📚 Risorse

- [SymPy Documentation](https://docs.sympy.org/)
- [Mathematical Functions Reference](https://en.wikipedia.org/wiki/List_of_mathematical_functions)
- [Calculus Basics](https://www.khanacademy.org/math/calculus-1)
