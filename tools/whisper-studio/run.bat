@echo off
title SenseWhisper

:start
echo.
echo ================================================
echo   SenseWhisper - Starting...
echo   Close this window to stop the server.
echo ================================================
echo.
python app.py
echo.
echo [!] Server exited. Restarting in 3 seconds...
echo     Press Ctrl+C to cancel.
echo.
timeout /t 3 /nobreak >nul
goto start
