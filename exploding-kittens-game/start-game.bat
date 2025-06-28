@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 爆炸小猫游戏 - 一键启动脚本 (Windows)
REM Exploding Kittens Game - One-click Start Script

echo 🐱 启动爆炸小猫游戏...
echo 🐱 Starting Exploding Kittens Game...

REM 检查 Node.js 是否安装
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到 Node.js，请先安装 Node.js 16.0+
    echo ❌ Error: Node.js not found, please install Node.js 16.0+
    pause
    exit /b 1
)

REM 检查 npm 是否安装
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到 npm，请先安装 npm
    echo ❌ Error: npm not found, please install npm
    pause
    exit /b 1
)

REM 获取脚本所在目录
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo 📁 当前目录: %SCRIPT_DIR%
echo 📁 Current directory: %SCRIPT_DIR%

REM 检查依赖是否已安装
if not exist "node_modules" (
    echo 📦 安装前端依赖...
    echo 📦 Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo ❌ 前端依赖安装失败
        echo ❌ Frontend dependencies installation failed
        pause
        exit /b 1
    )
)

if not exist "server\node_modules" (
    echo 📦 安装后端依赖...
    echo 📦 Installing backend dependencies...
    cd server
    call npm install
    if errorlevel 1 (
        echo ❌ 后端依赖安装失败
        echo ❌ Backend dependencies installation failed
        pause
        exit /b 1
    )
    cd ..
)

REM 创建日志目录
if not exist "logs" mkdir logs

echo 🚀 启动服务器...
echo 🚀 Starting server...

REM 启动后端服务器 (后台运行)
cd server
start /b cmd /c "npm run dev > ..\logs\server.log 2>&1"
cd ..

REM 等待服务器启动
echo ⏳ 等待服务器启动...
echo ⏳ Waiting for server to start...
timeout /t 3 /nobreak >nul

echo ✅ 服务器启动中...
echo ✅ Server starting...
echo 🌐 服务器地址: http://localhost:3001
echo 🌐 Server URL: http://localhost:3001

echo 🚀 启动前端...
echo 🚀 Starting frontend...

REM 启动前端开发服务器 (后台运行)
start /b cmd /c "npm run dev > logs\client.log 2>&1"

REM 等待前端启动
echo ⏳ 等待前端启动...
echo ⏳ Waiting for frontend to start...
timeout /t 5 /nobreak >nul

echo ✅ 前端启动中...
echo ✅ Frontend starting...
echo 🌐 游戏地址: http://localhost:5173
echo 🌐 Game URL: http://localhost:5173

echo.
echo 🎉 游戏启动成功！
echo 🎉 Game started successfully!
echo.
echo 📖 使用说明:
echo 📖 Instructions:
echo    • 在浏览器中打开: http://localhost:5173
echo    • Open in browser: http://localhost:5173
echo    • 使用 stop-game.bat 停止游戏
echo    • Use stop-game.bat to stop the game
echo    • 查看日志: type logs\server.log 或 logs\client.log
echo    • View logs: type logs\server.log or logs\client.log
echo.

REM 尝试自动打开浏览器
echo 🌐 正在打开浏览器...
echo 🌐 Opening browser...
timeout /t 2 /nobreak >nul
start http://localhost:5173

echo 🐱 爆炸小猫游戏正在运行中...
echo 🐱 Exploding Kittens Game is running...
echo 💡 按任意键或运行 stop-game.bat 来停止游戏
echo 💡 Press any key or run stop-game.bat to stop the game

REM 等待用户按键
pause >nul

REM 用户按键后停止游戏
echo.
echo 🛑 正在停止游戏...
echo 🛑 Stopping game...

REM 调用停止脚本
call stop-game.bat

echo ✅ 游戏已停止
echo ✅ Game stopped
pause
