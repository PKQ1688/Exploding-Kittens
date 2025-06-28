#!/bin/bash

# 爆炸小猫游戏 - 一键启动脚本
# Exploding Kittens Game - One-click Start Script

echo "🐱 启动爆炸小猫游戏..."

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js 16.0+"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到 npm，请先安装 npm"
    exit 1
fi

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install || { echo "❌ 前端依赖安装失败"; exit 1; }
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 安装后端依赖..."
    cd server
    npm install || { echo "❌ 后端依赖安装失败"; exit 1; }
    cd ..
fi

# 创建日志目录
mkdir -p logs

echo "🚀 启动服务器..."

# 启动后端服务器 (后台运行)
cd server
npm run dev > ../logs/server.log 2>&1 &
SERVER_PID=$!
cd ..

# 保存服务器进程ID
echo $SERVER_PID > logs/server.pid

# 等待服务器启动
sleep 3

# 检查服务器是否正常启动
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "❌ 服务器启动失败，请检查日志: logs/server.log"
    exit 1
fi

echo "✅ 服务器已启动 (PID: $SERVER_PID)"

echo "🚀 启动前端..."

# 启动前端开发服务器 (后台运行)
npm run dev > logs/client.log 2>&1 &
CLIENT_PID=$!

# 保存前端进程ID
echo $CLIENT_PID > logs/client.pid

# 等待前端启动
sleep 5

# 检查前端是否正常启动
if ! kill -0 $CLIENT_PID 2>/dev/null; then
    echo "❌ 前端启动失败，请检查日志: logs/client.log"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "✅ 前端已启动 (PID: $CLIENT_PID)"
echo ""
echo "🎉 游戏启动成功！"
echo "🌐 游戏地址: http://localhost:5173"
echo "💡 使用 ./stop-game.sh 停止游戏"
echo ""

# 尝试自动打开浏览器
if command -v open &> /dev/null; then
    sleep 2 && open http://localhost:5173
elif command -v xdg-open &> /dev/null; then
    sleep 2 && xdg-open http://localhost:5173
fi

echo "🐱 游戏正在运行中... (按 Ctrl+C 停止)"

# 等待用户中断
trap 'echo ""; echo "🛑 正在停止游戏..."; kill $SERVER_PID $CLIENT_PID 2>/dev/null; rm -f logs/*.pid; echo "✅ 游戏已停止"; exit 0' INT

# 保持脚本运行
while true; do
    sleep 1
done
