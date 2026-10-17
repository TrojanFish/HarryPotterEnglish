# SenseWhisper 🎙️

**SenseWhisper** 是一款针对英语学习优化的本地 Whisper 字幕生成工具。它不仅能够实现高效的语音转文字，更通过先进的 NLP 技术实现了智能语义断句，生成的字幕更符合人类语序，极大地提升了学习效率。

## ✨ 核心特性

- **智能语义断句 (Semantic Splitting)**：不同于传统的固定字符切分，SenseWhisper 利用 Spacy 模型识别句子结构，在逻辑断点处进行切分，让字幕读起来更有“语感”。
- **单词级高亮学习格式 (ASS)**：通过生成带有时标的 ASS 字幕，实现单词随进度高亮的效果。
- **本地化隐私保护**：完全在本地运行，支持 GPU 加速（CUDA/int8 量化），保护您的数据隐私且处理速度飞快。
- **干扰清洗 (Deduplication & Hallucination Removal)**：针对播客和长音频优化的清洗算法，有效去除 Whisper 常见的重复幻听和底噪干扰。
- **多格式输出**：同时支持 **SRT** (通用)、**ASS** (学习高亮)、**VTT** (网页播放器兼容) 以及 **Markdown (精读文稿)** 格式。
- **AI 学习伙伴 (New!)**：集成本地 **Ollama** 模型，自动为每一份文稿生成内容摘要、核心词汇解析和学习建议。

## 🚀 快速开始

### 1. 环境准备
确保您的电脑已安装 Python 3.10+ 以及 CUDA 环境（如需 GPU 加速）。

### 2. 安装依赖
```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### 3. 启动程序
```bash
python app.py
```

## 🛠️ 模型选择
建议使用 `faster-whisper` 的 `large-v3-turbo` 版本以获得最佳的识别精度与速度平衡。

## 📝 许可证
MIT License
