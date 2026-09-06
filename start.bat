@echo off
setlocal
chcp 936 >nul
cd /d "%~dp0"

echo ============================================
echo    丝路新声 - 一键启动
echo ============================================
echo.

if not exist "server\node_modules" (
  echo [1/4] 首次运行，正在安装后端依赖...
  pushd server
  call npm install
  popd
)

if not exist "client\node_modules" (
  echo [2/4] 首次运行，正在安装前端依赖...
  pushd client
  call npm install
  popd
)

echo [edge-tts] checking Malay TTS dependency...
where edge-tts >nul 2>&1
if errorlevel 1 (
  echo [edge-tts] installing edge-tts via pip, needed for Malay voice...
  python -m pip install edge-tts >nul 2>&1
  where edge-tts >nul 2>&1
  if errorlevel 1 (
    echo [edge-tts] WARNING: install failed, Malay voice will not work.
  ) else (
    echo [edge-tts] installed OK.
  )
) else (
  echo [edge-tts] found.
)
echo.
echo [3/4] 正在构建前后端...
pushd server
call npm run build >nul 2>&1
popd
pushd client
call npm run build >nul 2>&1
popd

if not exist "client\dist\index.html" (
  echo 构建失败：请检查 client 目录是否有报错。
  pause
  exit /b 1
)

echo [4/4] 正在获取局域网地址并启动...
echo.
powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch '^127\.' -and $_.IPAddress -notmatch '^169\.254\.' } | Select-Object -First 1 -ExpandProperty IPAddress)" > "%TEMP%\srv_ip.txt" 2>nul
set "LANIP="
if exist "%TEMP%\srv_ip.txt" set /p LANIP=<"%TEMP%\srv_ip.txt"

echo ============================================
echo   启动成功！
echo   电脑访问:  http://localhost:3001
if defined LANIP echo   手机访问:  http://%LANIP%:3001
echo   请确保手机与电脑连接同一 WiFi / 局域网
echo ============================================
echo.
echo   提示：若手机无法打开，请在 Windows 防火墙放行 3001 端口。
echo   按 Ctrl+C 可停止服务。
echo.

pushd server
node dist/index.js
popd
