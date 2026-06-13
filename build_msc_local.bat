@echo off
setlocal

cd /d "%~dp0"

echo [1/3] Checking pnpm...
where pnpm >nul 2>nul
if errorlevel 1 (
    echo ERROR: pnpm not found.
    exit /b 1
)

echo [2/3] Compiling production build...
call pnpm run compile:prod
if errorlevel 1 (
    echo ERROR: compile failed.
    pause
    exit /b 1
)

echo [2/3] Building Windows installer...
call pnpm exec electron-builder --windows nsis:x64 --publish never
if errorlevel 1 (
    echo ERROR: electron-builder failed.
    pause
    exit /b 1
)

echo.
echo Build completed.
pause
exit /b 0