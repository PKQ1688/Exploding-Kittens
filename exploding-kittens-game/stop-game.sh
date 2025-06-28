#!/bin/bash

# 爆炸小猫游戏 - 一键停止脚本
# Exploding Kittens Game - One-click Stop Script

echo "🛑 停止爆炸小猫游戏..."

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

STOPPED_COUNT=0

# 停止服务器
if [ -f "logs/server.pid" ]; then
    SERVER_PID=$(cat logs/server.pid)
    if kill -0 $SERVER_PID 2>/dev/null; then
        echo "🛑 停止服务器进程 (PID: $SERVER_PID)..."
        kill $SERVER_PID
        sleep 2
        kill -9 $SERVER_PID 2>/dev/null
        echo "✅ 服务器已停止"
        STOPPED_COUNT=$((STOPPED_COUNT + 1))
    fi
    rm -f logs/server.pid
fi

# 停止前端
if [ -f "logs/client.pid" ]; then
    CLIENT_PID=$(cat logs/client.pid)
    if kill -0 $CLIENT_PID 2>/dev/null; then
        echo "🛑 停止前端进程 (PID: $CLIENT_PID)..."
        kill $CLIENT_PID
        sleep 2
        kill -9 $CLIENT_PID 2>/dev/null
        echo "✅ 前端已停止"
        STOPPED_COUNT=$((STOPPED_COUNT + 1))
    fi
    rm -f logs/client.pid
fi

# 清理端口占用
echo "🧹 清理端口占用..."

# 清理 3001 端口 (服务器)
PORT_3001_PID=$(lsof -ti:3001 2>/dev/null)
if [ ! -z "$PORT_3001_PID" ]; then
    kill $PORT_3001_PID 2>/dev/null
    sleep 1
    kill -9 $PORT_3001_PID 2>/dev/null
fi

# 清理 5173 端口 (前端)
PORT_5173_PID=$(lsof -ti:5173 2>/dev/null)
if [ ! -z "$PORT_5173_PID" ]; then
    kill $PORT_5173_PID 2>/dev/null
    sleep 1
    kill -9 $PORT_5173_PID 2>/dev/null
fi

echo ""
if [ $STOPPED_COUNT -gt 0 ]; then
    echo "✅ 游戏已停止！停止了 $STOPPED_COUNT 个进程"
else
    echo "ℹ️  没有发现运行中的游戏进程"
fi

echo "💡 使用 ./start-game.sh 重新启动游戏"
