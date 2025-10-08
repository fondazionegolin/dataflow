# 🚀 Quick Reference: Modelli LLM per RTX 4090

## ⚠️ SOLO MODELLI OPEN ACCESS (No Login HuggingFace)

Tutti i modelli in questa lista sono **open access** e non richiedono autorizzazione.

---

## Top 5 Modelli Consigliati

### 1. 🥇 **Qwen2.5-7B** - Migliore per Italiano
```
Model: Qwen/Qwen2.5-7B
VRAM: ~14GB | Qualità: ⭐⭐⭐⭐⭐ | Italiano: ✅✅
```
**Quando usarlo**: Progetti in italiano, multilingua, alta qualità

### 2. 🥈 **Phi-2** - Migliore Efficienza
```
Model: microsoft/phi-2
VRAM: ~6GB | Qualità: ⭐⭐⭐⭐ | Velocità: ⚡⚡⚡
```
**Quando usarlo**: Sperimentazione, test rapidi, risorse limitate

### 3. 🥉 **Qwen2.5-1.5B** - Bilanciato
```
Model: Qwen/Qwen2.5-1.5B
VRAM: ~4GB | Qualità: ⭐⭐⭐ | Velocità: ⚡⚡⚡
```
**Quando usarlo**: Buon compromesso qualità/velocità

### 4. **TinyLlama-1.1B** - Ultra Veloce
```
Model: TinyLlama/TinyLlama-1.1B-Chat-v1.0
VRAM: ~3GB | Qualità: ⭐⭐⭐ | Velocità: ⚡⚡⚡
```
**Quando usarlo**: Test rapidi, risorse molto limitate

### 5. **StableLM-2-1.6B** - Alternativa Stabile
```
Model: stabilityai/stablelm-2-1_6b
VRAM: ~4GB | Qualità: ⭐⭐⭐ | Velocità: ⚡⚡⚡
```
**Quando usarlo**: Alternativa a Qwen per progetti piccoli

---

## ⚙️ Impostazioni Rapide

### Setup Veloce (Phi-2)
```yaml
Batch Size: 4
Gradient Accumulation: 4
Max Length: 128
Epochs: 3
```
⏱️ ~5-10 min per 1000 esempi

### Setup Qualità (Qwen2.5-7B)
```yaml
Batch Size: 1
Gradient Accumulation: 16
Max Length: 128
Epochs: 3
```
⏱️ ~20-30 min per 1000 esempi

### Setup Massimo (Qwen2.5-7B)
```yaml
Batch Size: 1
Gradient Accumulation: 16
Max Length: 256
Epochs: 2
```
⏱️ ~30-40 min per 1000 esempi

---

## 🎯 Scegli per Caso d'Uso

| Caso d'Uso | Modello Consigliato | Accesso |
|------------|---------------------|----------|
| 🇮🇹 **Italiano** | Qwen/Qwen2.5-7B | ✅ Open |
| 💬 **Chatbot** | Qwen/Qwen2.5-7B | ✅ Open |
| 💻 **Codice** | microsoft/phi-2 | ✅ Open |
| ⚡ **Velocità** | microsoft/phi-2 | ✅ Open |
| 📝 **Scrittura** | Qwen/Qwen2.5-7B | ✅ Open |
| 🧪 **Test** | TinyLlama/TinyLlama-1.1B-Chat-v1.0 | ✅ Open |

---

## 🆘 Problemi Comuni

### ❌ CUDA Out of Memory
1. Batch Size → 1
2. Max Length → 64
3. Usa modello più piccolo

### ⏳ Troppo Lento
1. Usa Phi-2 o TinyLlama
2. Riduci Max Length
3. Riduci Epochs

### 🔒 Model Gated (403 Error)
1. ❌ Modello rimosso dalla lista (richiede autorizzazione)
2. ✅ Usa alternative open access: Qwen2.5-7B, phi-2, TinyLlama

---

## 📊 Confronto Veloce

| Modello | Parametri | VRAM | Qualità | Italiano | Accesso |
|---------|-----------|------|---------|----------|----------|
| TinyLlama | 1.1B | 3GB | ⭐⭐⭐ | ⚠️ | ✅ Open |
| Qwen2.5-1.5B | 1.5B | 4GB | ⭐⭐⭐ | ✅ | ✅ Open |
| Phi-2 | 2.7B | 6GB | ⭐⭐⭐⭐ | ⚠️ | ✅ Open |
| Qwen2-7B | 7B | 14GB | ⭐⭐⭐⭐ | ✅✅ | ✅ Open |
| Qwen2.5-7B | 7B | 14GB | ⭐⭐⭐⭐⭐ | ✅✅ | ✅ Open |

---

## 🚀 Inizia Subito

1. **Riavvia backend**: `./start-dev.sh`
2. **Scegli modello** dalla lista
3. **Configura parametri**
4. **Avvia fine-tuning**!

📖 Guida completa: `LLM_MODELS_GUIDE.md`
