@echo off
chcp 65001 > nul
cd /d "%~dp0"

title Hogwarts Audio - Whisper 转写工作台

echo ============================================================
echo           正在启动 Whisper 智能转写工作台 (Gradio Web UI)
echo ============================================================
echo.
echo [INFO] 正在启动 Python Gradio 转写服务...
echo [INFO] 启动后将自动在默认浏览器中打开 http://localhost:7860
echo.

start "" powershell -NoProfile -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:7860'"
python tools/whisper-studio/app.py
