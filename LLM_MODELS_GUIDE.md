# Guida ai Modelli LLM per RTX 4090

## ⚠️ SOLO MODELLI OPEN ACCESS (No Login Richiesto)

Il nodo **Fine-tune LLM** ora supporta **solo modelli non gated** che non richiedono autorizzazione su Hugging Face.

**Modelli rimossi** (richiedono accesso):
- ❌ Meta Llama (tutti)
- ❌ Mistral (tutti)
- ❌ Google Gemma (tutti)
- ❌ Microsoft Phi-3 e Phi-3.5

---

## 🏆 Modelli Consigliati per RTX 4090

### 1. **Microsoft Phi-2** (2.7B) ⭐ CONSIGLIATO
- **VRAM**: ~6GB (FP16)
- **Qualità**: Eccellente per dimensioni ridotte
- **Velocità**: Molto veloce
- **Lingue**: Principalmente inglese
- **Ideale per**: Sperimentazione rapida, fine-tuning veloce
- **✅ OPEN ACCESS**: Nessun login richiesto

```
Model: microsoft/phi-2
```

### 2. **Qwen2.5-7B** (7B) ⭐ MIGLIORE PER ITALIANO
- **VRAM**: ~14GB (FP16)
- **Qualità**: Eccellente, molto versatile
- **Velocità**: Media
- **Lingue**: Multilingua superiore (ottimo per italiano)
- **Ideale per**: Progetti multilingua avanzati, italiano
- **✅ OPEN ACCESS**: Nessun login richiesto

```
Model: Qwen/Qwen2.5-7B
```

### 3. **Qwen2.5-1.5B** (1.5B) ⭐ VELOCE + ITALIANO
- **VRAM**: ~4GB (FP16)
- **Qualità**: Buona per dimensioni ridotte
- **Velocità**: Molto veloce
- **Lingue**: Multilingua (buono per italiano)
- **Ideale per**: Sperimentazione veloce con supporto italiano
- **✅ OPEN ACCESS**: Nessun login richiesto

```
Model: Qwen/Qwen2.5-1.5B
```

### 4. **TinyLlama-1.1B** (1.1B)
- **VRAM**: ~3GB (FP16)
- **Qualità**: Buona per dimensioni molto ridotte
- **Velocità**: Velocissimo
- **Lingue**: Principalmente inglese
- **Ideale per**: Test rapidi, risorse limitate
- **✅ OPEN ACCESS**: Nessun login richiesto

```
Model: TinyLlama/TinyLlama-1.1B-Chat-v1.0
```

```
Model: Qwen/Qwen2.5-7B
```

---

## 📊 Tabella Comparativa Completa (Solo Open Access)

| Modello | Parametri | VRAM (FP16) | Qualità | Velocità | Italiano | Accesso |
|---------|-----------|-------------|---------|----------|----------|---------|
| **distilgpt2** | 82M | ~1GB | Base | ⚡⚡⚡ | ❌ | ✅ Open |
| **gpt2** | 124M | ~1GB | Base | ⚡⚡⚡ | ❌ | ✅ Open |
| **gpt2-medium** | 355M | ~2GB | Buona | ⚡⚡⚡ | ❌ | ✅ Open |
| **SmolLM-360M** | 360M | ~1GB | Base | ⚡⚡⚡ | ⚠️ | ✅ Open |
| **TinyLlama-1.1B** | 1.1B | ~3GB | Buona | ⚡⚡⚡ | ⚠️ | ✅ Open |
| **Qwen2-1.5B** | 1.5B | ~4GB | Buona | ⚡⚡⚡ | ✅ | ✅ Open |
| **Qwen2.5-1.5B** ⭐ | 1.5B | ~4GB | Buona | ⚡⚡⚡ | ✅ | ✅ Open |
| **stablelm-2-1.6b** | 1.6B | ~4GB | Buona | ⚡⚡⚡ | ⚠️ | ✅ Open |
| **SmolLM-1.7B** | 1.7B | ~4GB | Buona | ⚡⚡⚡ | ⚠️ | ✅ Open |
| **phi-2** ⭐⭐ | 2.7B | ~6GB | Eccellente | ⚡⚡ | ⚠️ | ✅ Open |
| **Qwen2-7B** | 7B | ~14GB | Eccellente | ⚡ | ✅✅ | ✅ Open |
| **Qwen2.5-7B** ⭐⭐⭐ | 7B | ~14GB | Eccellente | ⚡ | ✅✅ | ✅ Open |

**Legenda:**
- ⚡⚡⚡ = Molto veloce
- ⚡⚡ = Veloce
- ⚡ = Media velocità
- ✅✅ = Supporto italiano eccellente
- ✅ = Supporto italiano buono
- ⚠️ = Supporto italiano limitato
- ❌ = Solo inglese

---

## 🎯 Scegli il Modello Giusto (Solo Open Access)

### Per Sperimentazione Rapida ⚡
```
microsoft/phi-2 (2.7B) ⭐ CONSIGLIATO
TinyLlama/TinyLlama-1.1B-Chat-v1.0 (1.1B)
HuggingFaceTB/SmolLM-360M (360M)
```
- ✅ Nessun login richiesto
- Caricamento veloce
- Training rapido
- Ottimi per testare pipeline

### Per Progetti in Italiano 🇮🇹
```
Qwen/Qwen2.5-7B (7B) ⭐⭐⭐ MIGLIORE
Qwen/Qwen2.5-1.5B (1.5B) ⭐ VELOCE
Qwen/Qwen2-7B (7B)
```
- ✅ Nessun login richiesto
- Eccellente comprensione italiano
- Generazione naturale
- Multilingua superiore

### Per Massima Qualità 🏆
```
Qwen/Qwen2.5-7B (7B) ⭐⭐⭐
microsoft/phi-2 (2.7B) ⭐⭐
Qwen/Qwen2-7B (7B)
```
- ✅ Nessun login richiesto
- Ottima performance
- Output di alta qualità
- Bilanciamento qualità/velocità

### Per Efficienza Memoria 💾
```
Qwen/Qwen2.5-1.5B (1.5B) ⭐ CONSIGLIATO
TinyLlama/TinyLlama-1.1B-Chat-v1.0 (1.1B)
HuggingFaceTB/SmolLM-1.7B (1.7B)
```
- ✅ Nessun login richiesto
- Usano meno VRAM (3-4GB)
- Permettono batch size maggiori
- Training più veloce

---

## ⚙️ Ottimizzazioni Automatiche

Il sistema applica automaticamente:

### 1. **Auto FP16**
- Modelli 7B+ usano automaticamente FP16
- Riduce uso memoria del 50%
- Nessuna perdita significativa di qualità

### 2. **Device Map Automatico**
- Modelli 5B+ usano sharding automatico
- Distribuisce il modello tra GPU e RAM
- Permette di caricare modelli più grandi

### 3. **Gradient Checkpointing**
- Modelli 2B+ usano gradient checkpointing
- Riduce uso memoria durante training
- Rallenta leggermente il training (~20%)

### 4. **Trust Remote Code**
- Abilita automaticamente per modelli che lo richiedono
- Necessario per Phi, Qwen, Gemma

---

## 🚀 Impostazioni Consigliate per RTX 4090

### Modelli Piccoli (< 3B)
```yaml
Batch Size: 4-8
Gradient Accumulation: 2-4
Max Length: 128-256
FP16: Auto (opzionale)
```

### Modelli Medi (3B-5B)
```yaml
Batch Size: 2-4
Gradient Accumulation: 4-8
Max Length: 128
FP16: Auto (consigliato)
```

### Modelli Grandi (7B-9B)
```yaml
Batch Size: 1-2
Gradient Accumulation: 8-16
Max Length: 64-128
FP16: Auto (obbligatorio)
Gradient Checkpointing: Auto
```

---

## 📝 Esempi di Utilizzo

### Esempio 1: Fine-tuning Rapido (Phi-2)
```
Model: microsoft/phi-2
Epochs: 3
Batch Size: 4
Gradient Accumulation: 4
Max Length: 128
Learning Rate: 5e-5
```
**Tempo stimato**: ~5-10 min per 1000 esempi

### Esempio 2: Progetto Italiano (Qwen2.5-7B)
```
Model: Qwen/Qwen2.5-7B
Epochs: 3
Batch Size: 1
Gradient Accumulation: 16
Max Length: 128
Learning Rate: 2e-5
FP16: Auto (enabled)
```
**Tempo stimato**: ~20-30 min per 1000 esempi

### Esempio 3: Massima Qualità (Mistral-7B-Instruct)
```
Model: mistralai/Mistral-7B-Instruct-v0.3
Epochs: 2
Batch Size: 1
Gradient Accumulation: 16
Max Length: 256
Learning Rate: 1e-5
FP16: Auto (enabled)
```
**Tempo stimato**: ~30-40 min per 1000 esempi

---

## 🔧 Troubleshooting

### Errore: CUDA Out of Memory

**Soluzioni:**
1. Riduci `Batch Size` a 1
2. Aumenta `Gradient Accumulation Steps`
3. Riduci `Max Length` (es. 64)
4. Usa modello più piccolo
5. Abilita `Use CPU Only` (molto lento)

### Errore: Model not found

**Soluzione:**
Alcuni modelli richiedono accettazione licenza su HuggingFace:
1. Vai su https://huggingface.co/[model_name]
2. Accetta la licenza
3. Login: `huggingface-cli login`

### Modello troppo lento

**Soluzioni:**
1. Usa modello più piccolo (< 3B)
2. Riduci `Max Length`
3. Riduci `Epochs`
4. Limita dataset con `Max Training Samples`

---

## 🎓 Modelli per Caso d'Uso

### Customer Support / Chatbot
- **Consigliato**: `mistralai/Mistral-7B-Instruct-v0.3`
- **Alternativa**: `meta-llama/Llama-3.2-3B`

### Generazione Testo Creativo
- **Consigliato**: `Qwen/Qwen2.5-7B`
- **Alternativa**: `microsoft/phi-2`

### Code Generation
- **Consigliato**: `microsoft/Phi-3.5-mini-instruct`
- **Alternativa**: `Qwen/Qwen2.5-7B`

### Multilingua (Italiano)
- **Consigliato**: `Qwen/Qwen2.5-7B` ⭐
- **Alternativa**: `mistralai/Mistral-7B-v0.3`

### Sperimentazione / Ricerca
- **Consigliato**: `microsoft/phi-2`
- **Alternativa**: `TinyLlama/TinyLlama-1.1B-Chat-v1.0`

---

## 📚 Risorse Aggiuntive

### HuggingFace Model Hub
- Phi: https://huggingface.co/microsoft/phi-2
- Llama: https://huggingface.co/meta-llama
- Mistral: https://huggingface.co/mistralai
- Qwen: https://huggingface.co/Qwen
- Gemma: https://huggingface.co/google

### Documentazione
- Transformers: https://huggingface.co/docs/transformers
- PEFT (LoRA): https://huggingface.co/docs/peft

---

## 🔄 Prossimi Passi

1. **Riavvia il backend** per caricare i nuovi modelli
2. **Scegli un modello** dalla lista
3. **Configura i parametri** secondo le raccomandazioni
4. **Inizia il fine-tuning**!

```bash
./start-dev.sh
```

Buon fine-tuning! 🚀
