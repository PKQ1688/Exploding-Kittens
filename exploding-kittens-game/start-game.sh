#!/bin/bash

# 爆炸小猫游戏 - 一键启动脚本 (macOS/Linux)
# Exploding Kittens Game - One-click Start Script

echo "🐱 启动爆炸小猫游戏..."
echo "🐱 Starting Exploding Kittens Game..."

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js 16.0+"
    echo "❌ Error: Node.js not found, please install Node.js 16.0+"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到 npm，请先安装 npm"
    echo "❌ Error: npm not found, please install npm"
    exit 1
fi

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📁 当前目录: $SCRIPT_DIR"
echo "📁 Current directory: $SCRIPT_DIR"

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    echo "📦 Installing frontend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 前端依赖安装失败"
        echo "❌ Frontend dependencies installation failed"
        exit 1
    fi
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 安装后端依赖..."
    echo "📦 Installing backend dependencies..."
    cd server
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 后端依赖安装失败"
        echo "❌ Backend dependencies installation failed"
        exit 1
    fi
    cd ..
fi

# 创建日志目录
mkdir -p logs

echo "🚀 启动服务器..."
echo "🚀 Starting server..."

# 启动后端服务器 (后台运行)
cd server
npm run dev > ../logs/server.log 2>&1 &
SERVER_PID=$!
cd ..

# 保存服务器进程ID
echo $SERVER_PID > logs/server.pid
echo "📝 服务器进程ID: $SERVER_PID"
echo "📝 Server PID: $SERVER_PID"

# 等待服务器启动
echo "⏳ 等待服务器启动..."
echo "⏳ Waiting for server to start..."
sleep 3

# 检查服务器是否正常启动
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "❌ 服务器启动失败，请检查日志: logs/server.log"
    echo "❌ Server failed to start, check logs: logs/server.log"
    exit 1
fi

echo "✅ 服务器已启动 (PID: $SERVER_PID)"
echo "✅ Server started (PID: $SERVER_PID)"
echo "🌐 服务器地址: http://localhost:3001"
echo "🌐 Server URL: http://localhost:3001"

echo "🚀 启动前端..."
echo "🚀 Starting frontend..."

# 启动前端开发服务器 (后台运行)
npm run dev > logs/client.log 2>&1 &
CLIENT_PID=$!

# 保存前端进程ID
echo $CLIENT_PID > logs/client.pid
echo "📝 前端进程ID: $CLIENT_PID"
echo "📝 Client PID: $CLIENT_PID"

# 等待前端启动
echo "⏳ 等待前端启动..."
echo "⏳ Waiting for frontend to start..."
sleep 5

# 检查前端是否正常启动
if ! kill -0 $CLIENT_PID 2>/dev/null; then
    echo "❌ 前端启动失败，请检查日志: logs/client.log"
    echo "❌ Frontend failed to start, check logs: logs/client.log"
    # 清理服务器进程
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "✅ 前端已启动 (PID: $CLIENT_PID)"
echo "✅ Frontend started (PID: $CLIENT_PID)"
echo "🌐 游戏地址: http://localhost:5173"
echo "🌐 Game URL: http://localhost:5173"

echo ""
echo "🎉 游戏启动成功！"
echo "🎉 Game started successfully!"
echo ""
echo "📖 使用说明:"
echo "📖 Instructions:"
echo "   • 在浏览器中打开: http://localhost:5173"
echo "   • Open in browser: http://localhost:5173"
echo "   • 使用 ./stop-game.sh 停止游戏"
echo "   • Use ./stop-game.sh to stop the game"
echo "   • 查看日志: tail -f logs/server.log 或 logs/client.log"
echo "   • View logs: tail -f logs/server.log or logs/client.log"
echo ""

# 尝试自动打开浏览器
if command -v open &> /dev/null; then
    echo "🌐 正在打开浏览器..."
    echo "🌐 Opening browser..."
    sleep 2
    open http://localhost:5173
elif command -v xdg-open &> /dev/null; then
    echo "🌐 正在打开浏览器..."
    echo "🌐 Opening browser..."
    sleep 2
    xdg-open http://localhost:5173
fi

echo "🐱 爆炸小猫游戏正在运行中..."
echo "🐱 Exploding Kittens Game is running..."
echo "💡 按 Ctrl+C 或运行 ./stop-game.sh 来停止游戏"
echo "💡 Press Ctrl+C or run ./stop-game.sh to stop the game"

# 等待用户中断
trap 'echo ""; echo "🛑 正在停止游戏..."; echo "🛑 Stopping game..."; kill $SERVER_PID $CLIENT_PID 2>/dev/null; rm -f logs/*.pid; echo "✅ 游戏已停止"; echo "✅ Game stopped"; exit 0' INT

# 保持脚本运行
while true; do
    sleep 1
done
