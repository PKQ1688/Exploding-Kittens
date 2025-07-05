#!/bin/bash

# 爆炸小猫游戏 - 局域网启动脚本
# 允许同一WiFi网络下的朋友一起游戏

set -e

echo "🐱 启动爆炸小猫游戏 (局域网模式)"
echo "=================================="

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到 npm"
    echo "请先安装 npm"
    exit 1
fi

echo "✅ Node.js 和 npm 已安装"

# 获取本机IP地址
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
if [ -z "$LOCAL_IP" ]; then
    echo "❌ 无法获取本机IP地址"
    exit 1
fi

echo "🌐 本机IP地址: $LOCAL_IP"

# 创建日志目录
mkdir -p logs

# 安装依赖
echo "📦 检查并安装依赖..."

if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "安装后端依赖..."
    cd server && npm install && cd ..
fi

echo "✅ 依赖安装完成"

# 停止可能运行的进程
echo "🧹 清理旧进程..."
pkill -f "vite" || true
pkill -f "tsx.*server" || true

# 清理端口
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

# 前端会自动检测服务器地址，无需修改配置
echo "⚙️ 前端将自动检测服务器地址..."

# 启动前端服务器
echo "🎮 启动前端服务器..."
nohup npm run dev -- --host 0.0.0.0 > logs/client.log 2>&1 &
CLIENT_PID=$!
echo $CLIENT_PID > logs/client.pid

echo ""
echo "🎉 游戏启动成功！"
echo "=================================="
echo "🌐 游戏访问地址:"
echo "   本机访问: http://localhost:5173"
echo "   局域网访问: http://$LOCAL_IP:5173"
echo ""
echo "📱 朋友们可以通过以下地址加入游戏:"
echo "   http://$LOCAL_IP:5173"
echo "   后端联机端口: http://$LOCAL_IP:3001"
echo ""
echo "📢 请将上方“局域网访问”或“后端联机端口”地址发给同一WiFi下的朋友，他们可通过浏览器访问该地址加入游戏房间。"
echo ""
echo "� 日志文件:"
echo "   后端日志: logs/server.log"
echo "   前端日志: logs/client.log"
echo ""
echo "🛑 停止游戏请运行: ./stop-game.sh"
echo ""

# 等待一下确保服务启动
sleep 2

# 自动打开浏览器
if command -v open &> /dev/null; then
    echo "🌐 正在打开浏览器..."
    open "http://localhost:5173"
elif command -v xdg-open &> /dev/null; then
    echo "🌐 正在打开浏览器..."
    xdg-open "http://localhost:5173"
fi

echo "✨ 享受游戏乐趣！记住不要被爆炸小猫炸到哦~ 🐱💥"
