@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js no esta instalado. Instala Node.js 22 LTS.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Instalando dependencias verificadas...
  call npm ci
  if errorlevel 1 goto :error
)

echo Verificando y compilando Store MAY...
call npm run typecheck
if errorlevel 1 goto :error
call npm run build
if errorlevel 1 goto :error

start "Store MAY Browser" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://127.0.0.1:4174/'"
call npm run start:local
exit /b %errorlevel%

:error
echo.
echo No se pudo iniciar Store MAY. Revisa el mensaje anterior.
pause
exit /b 1
