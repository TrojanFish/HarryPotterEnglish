import os
import json
import requests

# ==============================================================================
#                          API Key Management
# ==============================================================================

_API_KEYS_FILE = os.path.join(os.path.dirname(__file__), "api_keys.json")
_api_keys = {"gemini": "", "qwen": ""}

# Cloud model names that route to DashScope (distinct from local Ollama qwen models)
_QWEN_CLOUD_MODELS = {"qwen-turbo", "qwen-plus", "qwen-max", "qwen-long", "qwen-max-longcontext"}

# All available cloud model options shown in the UI
CLOUD_MODELS = [
    "── 云端 Gemini (Google) ──",
    "gemini-2.0-flash",
    "gemini-1.5-flash-8b",
    "── 云端 Qwen (阿里云) ──",
    "qwen-plus",
    "qwen-turbo",
    "qwen-max",
]


def load_api_keys():
    global _api_keys
    if os.path.exists(_API_KEYS_FILE):
        try:
            with open(_API_KEYS_FILE, "r", encoding="utf-8") as f:
                _api_keys.update(json.load(f))
        except Exception:
            pass


def save_api_keys(gemini_key="", qwen_key=""):
    global _api_keys
    _api_keys = {"gemini": gemini_key.strip(), "qwen": qwen_key.strip()}
    try:
        with open(_API_KEYS_FILE, "w", encoding="utf-8") as f:
            json.dump(_api_keys, f)
    except Exception as e:
        print(f"保存 API 密钥失败: {e}")


def get_api_keys():
    return _api_keys.copy()


# Load keys at module import time
load_api_keys()


# ==============================================================================
#                          Model Discovery
# ==============================================================================

def get_ollama_models():
    """Fetches available models from local Ollama instance."""
    try:
        response = requests.get("http://127.0.0.1:11434/api/tags", timeout=2)
        if response.status_code == 200:
            models = [m['name'] for m in response.json().get('models', [])]
            return models
    except Exception:
        pass
    return ["qwen2.5:8b", "llama3", "mistral"]  # Fallback defaults


def get_available_models():
    """Returns all available models: local Ollama + cloud options."""
    local = get_ollama_models()
    return local + CLOUD_MODELS


# ==============================================================================
#                          LLM Routing Layer
# ==============================================================================

def _call_openai_compat(base_url, api_key, model, messages, timeout=120):
    """Call any OpenAI-compatible endpoint (Gemini, DashScope, etc.)."""
    try:
        import openai
        client = openai.OpenAI(api_key=api_key, base_url=base_url)
        resp = client.chat.completions.create(
            model=model,
            messages=messages,
            timeout=timeout,
        )
        return resp.choices[0].message.content or ""
    except Exception as e:
        return f"❌ API Error: {str(e)}"


def call_llm(model, prompt, system_prompt="You are a helpful assistant."):
    """
    Unified LLM router.
      gemini-*        → Google AI Studio (OpenAI-compatible)
      qwen-plus/turbo/max/long → Alibaba DashScope (OpenAI-compatible)
      anything else   → local Ollama
    """
    # Skip separator labels that may appear in the dropdown
    if model.startswith("──"):
        return "❌ 请选择具体的模型，不能选择分隔符。"

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user",   "content": prompt},
    ]

    if model.startswith("gemini-"):
        key = _api_keys.get("gemini", "")
        if not key:
            return "❌ 未设置 Gemini API Key，请在页面顶部「🔑 云端 AI 密钥设置」中填入并保存。"
        return _call_openai_compat(
            "https://generativelanguage.googleapis.com/v1beta/openai/",
            key, model, messages, timeout=120
        )

    elif model in _QWEN_CLOUD_MODELS:
        key = _api_keys.get("qwen", "")
        if not key:
            return "❌ 未设置 Qwen API Key，请在页面顶部「🔑 云端 AI 密钥设置」中填入并保存。"
        return _call_openai_compat(
            "https://dashscope.aliyuncs.com/compatible-mode/v1",
            key, model, messages, timeout=120
        )

    else:
        return call_ollama(model, prompt, system_prompt)


# ==============================================================================
#                          Google Translate (free)
# ==============================================================================

def google_translate(text, target_language="zh-CN"):
    """Fast, free translation using Google Translate API without auth."""
    url = "https://translate.googleapis.com/translate_a/single"
    params = {
        "client": "gtx",
        "sl": "en",
        "tl": target_language,
        "dt": "t",
        "q": text
    }
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        result = response.json()
        return "".join([sentence[0] for sentence in result[0] if sentence[0]])
    except Exception as e:
        return f"⚠️ 机器翻译失败: {e}"


# ==============================================================================
#                          Ollama (local)
# ==============================================================================

def call_ollama(model, prompt, system_prompt="You are a helpful assistant."):
    """Synchronous call to local Ollama generate API."""
    url = "http://127.0.0.1:11434/api/generate"
    payload = {
        "model": model,
        "prompt": prompt,
        "system": system_prompt,
        "stream": False
    }
    try:
        response = requests.post(url, json=payload, timeout=300)
        if response.status_code == 200:
            return response.json().get('response', "")
        else:
            return f"❌ Ollama Error: {response.status_code}"
    except Exception as e:
        return f"❌ Connection Error: {str(e)}"


# ==============================================================================
#                          High-level Task Functions
# ==============================================================================

def analyze_transcript(model, full_text):
    """Nine-section structured analysis for Chinese English learners."""
    system_prompt = """你是一位专门教授中国学生的顶级英语专家 SenseWhisper AI。
你必须严格按照要求的【九个板块】格式输出，禁止自行缩减内容。
所有解析必须针对中国学生常见的痛点（如：中式英语、听力连读、文化隔阂）。"""

    prompt = f"""请对以下播客文稿进行深度语言和文化分析。

文稿内容：
---
{full_text}
---

请严格按照以下格式 and 要求输出，不要输出任何开场白：

### 1. 📝 主题深度概览 (Thematic Summary)
- [要求：用 3-4 句中文概括核心内容，并说明该素材对英语学习者的具体价值点（如：词汇丰富度、语速、口音特征等）。]

### 3. 💎 地道表达与词汇精讲 (Vocabulary & Idioms)
- [要求：列出 6-8 个地道表达/短语词组。每个必须包含：用法解析、中文意思、原句重现、以及中国学生容易用错的点。]

### 4. 🏗️ 实用句型拆解 (Sentence Pattern Analysis)
- [要求：挑选 2 个高价值句型。拆解语法结构，并给出一个中国学生可以在日常口语中直接替换使用的范例。]

### 5. 🌍 文化与背景知识 (Cultural & Contextual Notes)
- [要求：解释文中的社交礼仪、幽默点或相关背景。如果没有，请分析说话者的语气 and 情感隐喻。这对于理解 native speaker 的思维至关重要。]

### 6. 👂 听力与发音要点 (EFL Listening Guide)
- [要求：找出文中出现的连读 (Linking)、弱读 (Weak forms) 或失爆 (Stop consonants) 现象。请结合文中的具体例子进行讲解。]

### 7. 🏆 专项练习建议 (Actionable Advice)
- [要求：提供一个具体的跟读 (Shadowing) 或听抄建议。]

### 8. 🧠 关键细节自测 (Comprehension Check)
- [要求：设计 3 个关于播客细节的中文问题，并在下方以"点击查看答案"的形式（Markdown 引用或折叠）给出答案。]

### 9. 💬 深度讨论导引 (Discussion & Writing Prompts)
- [要求：提供 2 个启发性问题，引导学生用英语思考播客主题，并给出 3-5 个推荐使用的关键词。]

### 10. 👤 说话人画像与语感分析 (Speaker Profile & Style)
- [要求：分析说话人的口音特征（如英美音、方言）、语言风格（ formal/informal）以及建议练习的语速档位。]

请开始你的深度解析："""

    return call_llm(model, prompt, system_prompt)


def generate_quiz(model, full_text):
    """Generates a MCQ + True/False quiz from transcript. Returns markdown string."""
    system_prompt = "你是一位专业的英语测验出题专家，擅长基于真实语料出题，题目清晰、干扰项合理。"
    prompt = f"""请根据以下播客文稿内容，生成一份英语理解测验。

文稿内容（前 6000 字）：
---
{full_text[:6000]}
---

请严格按以下 Markdown 格式输出，不要输出任何开场白：

## Part A：选择题 Multiple Choice

1. [基于文稿细节的问题]
   - A) [选项]
   - B) [选项]
   - C) [选项]
   - D) [选项]

   > ✅ 答案：X）[正确选项内容] — [一句话解析]

（共出 5 道选择题，每题格式同上）

---

## Part B：判断正误 True or False

1. [基于文稿内容的陈述，真实或故意错误]

   > ✅ 答案：True / False — [一句话解析，说明原文依据]

（共出 5 道判断题，每题格式同上）

---

---

## Part C：开放性写作 Writing Prompts

1. [基于播客主题的开放性问题，引导学生用英文输出]

   **推荐词汇/句型**: [3-5 个来自文稿的关键词或短语]

（共出 2 道写作题，每题格式同上）

---

要求：
- 选择题/判断题必须有明确的文稿依据，不要凭空捏造
- 选择题的干扰项要合理，不能太明显
- 选择题/判断题全部使用中文出题
- 写作 prompt 用英文提问，推荐词汇列英文
"""
    return call_llm(model, prompt, system_prompt)


def translate_paragraph(model, text):
    """Translates a single paragraph into idiomatic Chinese."""
    system_prompt = "你是一位资深的中英翻译专家，擅落地口语风格转换。"
    prompt = f"""请将以下英语播客片段翻译为地道的中文。
要求：
1. 保持口语感，不要太机械。
2. 直接输出翻译后的中文，不要包含原文，也不要有任何解释性文字。

待翻译文本：
{text}
"""
    return call_llm(model, prompt, system_prompt)
