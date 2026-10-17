@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion
cd /d "%~dp0"

title Hogwarts Audio - 控制中心

:MENU
cls
echo ============================================================
echo           Hogwarts Audio 本地开发与工具控制中心
echo ============================================================
echo.
echo   [1] 启动 Hogwarts Audio 主应用 (Web 前端学习平台)
echo   [2] 启动 Whisper 智能转写工作台 (Gradio 可视化界面)
echo   [3] 同时启动两者 (主应用 + 转写工作台)
echo   [4] 增量同步内容至 Cloudflare R2 (npm run content:sync)
echo   [5] 重新编译本地内容清单 (npm run content:build)
echo   [0] 退出控制中心
echo.
echo ============================================================
set /p choice="请输入选项编号 [0-5]: "

if "%choice%"=="1" goto START_WEB
if "%choice%"=="2" goto START_WHISPER
if "%choice%"=="3" goto START_BOTH
if "%choice%"=="4" goto SYNC_R2
if "%choice%"=="5" goto COMPILE_FEED
if "%choice%"=="0" goto EXIT
echo.
echo [ERROR] 无效输入，请重新输入...
timeout /t 2 > nul
goto MENU

:START_WEB
echo.
echo [INFO] 正在启动 Hogwarts Audio 主应用...
start "Hogwarts Audio - Web App" cmd /k "cd /d "%~dp0" && npm run dev"
timeout /t 2 > nul
start http://localhost:5173
echo [OK] 已在后台窗口启动开发服务器，并尝试在浏览器打开 http://localhost:5173
echo.
pause
goto MENU

:START_WHISPER
echo.
echo [INFO] 正在启动 Whisper 智能转写工作台...
start "Hogwarts Audio - Whisper Studio" cmd /k "cd /d "%~dp0" && python tools/whisper-studio/app.py"
timeout /t 2 > nul
start http://localhost:7860
echo [OK] 已在后台窗口启动转写服务，并尝试在浏览器打开 http://localhost:7860
echo.
pause
goto MENU

:START_BOTH
echo.
echo [INFO] 正在同时启动 Web 主应用与 Whisper 转写工作台...
start "Hogwarts Audio - Web App" cmd /k "cd /d "%~dp0" && npm run dev"
start "Hogwarts Audio - Whisper Studio" cmd /k "cd /d "%~dp0" && python tools/whisper-studio/app.py"
timeout /t 3 > nul
start http://localhost:5173
start http://localhost:7860
echo [OK] 已在两个独立窗口分别启动主应用与转写服务。
echo.
pause
goto MENU

:SYNC_R2
echo.
echo [INFO] 正在执行增量 R2 同步流水线...
call npm run content:sync
echo.
pause
goto MENU

:COMPILE_FEED
echo.
echo [INFO] 正在重新编译本地 content/ 目录清单...
call npm run content:build
echo.
pause
goto MENU

:EXIT
echo.
echo [INFO] 感谢使用 Hogwarts Audio，再见！
timeout /t 1 > nul
exit /b 0
