@echo off
chcp 65001 > nul
cd /d "%~dp0"

title Hogwarts Audio - 主应用

echo ============================================================
echo           正在启动 Hogwarts Audio 学习平台 (Web App)
echo ============================================================
echo.
echo [INFO] 正在启动 Vite 本地开发服务器...
echo [INFO] 启动后将自动在默认浏览器中打开 http://localhost:5173
echo.

start "" powershell -NoProfile -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:5173'"
npm run dev
