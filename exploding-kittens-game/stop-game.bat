@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 爆炸小猫游戏 - 一键停止脚本 (Windows)
REM Exploding Kittens Game - One-click Stop Script

echo 🛑 停止爆炸小猫游戏...
echo 🛑 Stopping Exploding Kittens Game...

REM 获取脚本所在目录
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

set STOPPED_COUNT=0

echo 🔍 查找运行中的进程...
echo 🔍 Finding running processes...

REM 停止 Vite 进程 (前端)
echo 🛑 停止前端进程 (Vite)...
echo 🛑 Stopping frontend processes (Vite)...
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo csv ^| findstr "vite"') do (
    if not "%%i"=="" (
        echo 🔍 发现 Vite 进程: %%i
        echo 🔍 Found Vite process: %%i
        taskkill /pid %%i /f >nul 2>&1
        set /a STOPPED_COUNT+=1
    )
)

REM 停止 ts-node 进程 (后端)
echo 🛑 停止后端进程 (ts-node)...
echo 🛑 Stopping backend processes (ts-node)...
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo csv ^| findstr "ts-node"') do (
    if not "%%i"=="" (
        echo 🔍 发现 ts-node 进程: %%i
        echo 🔍 Found ts-node process: %%i
        taskkill /pid %%i /f >nul 2>&1
        set /a STOPPED_COUNT+=1
    )
)

REM 停止所有可能的 Node.js 开发服务器进程
echo 🧹 清理 Node.js 开发进程...
echo 🧹 Cleaning up Node.js development processes...

REM 查找包含 "dev" 的 Node.js 进程
for /f "tokens=1,2" %%a in ('wmic process where "name='node.exe'" get processid^,commandline /format:csv ^| findstr /i "dev"') do (
    if not "%%b"=="" (
        echo 🔍 发现开发进程: %%b
        echo 🔍 Found development process: %%b
        taskkill /pid %%b /f >nul 2>&1
        set /a STOPPED_COUNT+=1
    )
)

REM 查找包含 "vite" 的 Node.js 进程
for /f "tokens=1,2" %%a in ('wmic process where "name='node.exe'" get processid^,commandline /format:csv ^| findstr /i "vite"') do (
    if not "%%b"=="" (
        echo 🔍 发现 Vite 进程: %%b
        echo 🔍 Found Vite process: %%b
        taskkill /pid %%b /f >nul 2>&1
        set /a STOPPED_COUNT+=1
    )
)

REM 查找包含 "server" 的 Node.js 进程
for /f "tokens=1,2" %%a in ('wmic process where "name='node.exe'" get processid^,commandline /format:csv ^| findstr /i "server"') do (
    if not "%%b"=="" (
        echo 🔍 发现服务器进程: %%b
        echo 🔍 Found server process: %%b
        taskkill /pid %%b /f >nul 2>&1
        set /a STOPPED_COUNT+=1
    )
)

REM 检查端口占用并终止相关进程
echo 🔍 检查端口占用...
echo 🔍 Checking port usage...

REM 检查 3001 端口 (服务器)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do (
    if not "%%a"=="" (
        echo 🔍 端口 3001 被进程 %%a 占用，正在终止...
        echo 🔍 Port 3001 is used by process %%a, terminating...
        taskkill /pid %%a /f >nul 2>&1
        set /a STOPPED_COUNT+=1
    )
)

REM 检查 5173 端口 (前端)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173"') do (
    if not "%%a"=="" (
        echo 🔍 端口 5173 被进程 %%a 占用，正在终止...
        echo 🔍 Port 5173 is used by process %%a, terminating...
        taskkill /pid %%a /f >nul 2>&1
        set /a STOPPED_COUNT+=1
    )
)

REM 清理可能的 CMD 窗口
echo 🧹 清理相关命令行窗口...
echo 🧹 Cleaning up related command windows...
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq cmd.exe" /fo csv ^| findstr "npm"') do (
    if not "%%i"=="" (
        taskkill /pid %%i /f >nul 2>&1
    )
)

echo.
if !STOPPED_COUNT! gtr 0 (
    echo ✅ 游戏已完全停止！
    echo ✅ Game completely stopped!
) else (
    echo ℹ️  没有发现运行中的游戏进程
    echo ℹ️  No running game processes found
)

echo.
echo 📊 清理完成统计:
echo 📊 Cleanup summary:
echo    • 停止的进程数: !STOPPED_COUNT!
echo    • Stopped processes: !STOPPED_COUNT!
echo    • 日志文件保留在 logs\ 目录
echo    • Log files preserved in logs\ directory
echo.
echo 💡 提示: 使用 start-game.bat 重新启动游戏
echo 💡 Tip: Use start-game.bat to restart the game

if "%1" neq "silent" (
    echo.
    echo 按任意键退出...
    echo Press any key to exit...
    pause >nul
)
