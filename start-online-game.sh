#!/bin/bash

# 爆炸小猫游戏 - 在线模式启动脚本
# 使用ngrok让全世界的朋友都能加入游戏

set -e

echo "🌍 启动爆炸小猫游戏 (在线模式)"
echo "=================================="

# 检查ngrok
if ! command -v ngrok &> /dev/null; then
    echo "❌ 错误: 未找到 ngrok"
    echo "请先安装 ngrok:"
    echo "  brew install ngrok/ngrok/ngrok"
    echo "  或访问 https://ngrok.com/download"
    exit 1
fi

# 检查Node.js和npm
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到 npm"
    exit 1
fi

echo "✅ 环境检查通过"

# 创建日志目录
mkdir -p logs

# 安装依赖
echo "📦 检查并安装依赖..."
if [ ! -d "node_modules" ]; then
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    cd server && npm install && cd ..
fi

# 停止旧进程
echo "🧹 清理旧进程..."
pkill -f "ngrok" || true
pkill -f "vite" || true
pkill -f "tsx.*server" || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# 启动后端服务器
echo "🚀 启动后端服务器..."
cd server
nohup npm run dev > ../logs/server.log 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > ../logs/server.pid
cd ..

# 等待后端启动
sleep 3

# 启动前端服务器
echo "🎮 启动前端服务器..."
nohup npm run dev -- --host 0.0.0.0 > logs/client.log 2>&1 &
CLIENT_PID=$!
echo $CLIENT_PID > logs/client.pid

# 等待前端启动
sleep 3

# 使用配置文件启动所有ngrok隧道
echo "🌐 启动ngrok隧道 (使用配置文件)..."
nohup ngrok start --all --config=ngrok.yml > logs/ngrok.log 2>&1 &
NGROK_PID=$!
echo $NGROK_PID > logs/ngrok.pid

# 等待ngrok启动
sleep 8

# 获取后端ngrok URL
NGROK_URL=""
for i in {1..15}; do
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[] | select(.name=="backend") | .public_url' 2>/dev/null)
    if [ ! -z "$NGROK_URL" ] && [ "$NGROK_URL" != "null" ]; then
        break
    fi
    echo "等待ngrok启动... ($i/15)"
    sleep 2
done

if [ -z "$NGROK_URL" ] || [ "$NGROK_URL" = "null" ]; then
    echo "❌ 无法获取后端ngrok URL，请检查ngrok是否正常启动"
    echo "📋 检查ngrok日志: cat logs/ngrok.log"
    exit 1
fi

echo "✅ 后端ngrok URL: $NGROK_URL"

# 设置服务器URL环境变量
echo "⚙️ 配置前端连接地址..."
echo "window.__SERVER_URL__ = '$NGROK_URL';" > public/server-config.js

# 获取前端ngrok URL
FRONTEND_URL=""
for i in {1..10}; do
    FRONTEND_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[] | select(.name=="frontend") | .public_url' 2>/dev/null)
    if [ ! -z "$FRONTEND_URL" ] && [ "$FRONTEND_URL" != "null" ]; then
        break
    fi
    echo "等待前端ngrok启动... ($i/10)"
    sleep 2
done

if [ -z "$FRONTEND_URL" ] || [ "$FRONTEND_URL" = "null" ]; then
    echo "⚠️  无法获取前端ngrok URL，使用localhost"
    FRONTEND_URL="http://localhost:5173"
fi

echo ""
echo "🎉 游戏启动成功！"
echo "=================================="
echo "🌍 在线游戏地址:"
echo "   $FRONTEND_URL"
echo ""
echo "📱 分享给朋友们的地址:"
echo "   $FRONTEND_URL"
echo ""
echo "📊 管理面板:"
echo "   ngrok状态: http://localhost:4040"
echo ""
echo "📊 日志文件:"
echo "   后端日志: logs/server.log"
echo "   前端日志: logs/client.log"
echo "   ngrok日志: logs/ngrok.log"
echo ""
echo "🛑 停止游戏请运行: ./stop-game.sh"
echo ""

# 自动打开浏览器
if command -v open &> /dev/null; then
    echo "🌐 正在打开浏览器..."
    open "$FRONTEND_URL"
elif command -v xdg-open &> /dev/null; then
    echo "🌐 正在打开浏览器..."
    xdg-open "$FRONTEND_URL"
fi

echo "✨ 享受在线游戏乐趣！朋友们可以从世界任何地方加入~ 🐱💥"
