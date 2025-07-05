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

# 停止ngrok进程
if [ -f "logs/ngrok.pid" ]; then
    NGROK_PID=$(cat logs/ngrok.pid)
    if kill -0 $NGROK_PID 2>/dev/null; then
        echo "🛑 停止ngrok隧道 (PID: $NGROK_PID)..."
        kill $NGROK_PID
        sleep 1
        kill -9 $NGROK_PID 2>/dev/null
        echo "✅ ngrok隧道已停止"
        STOPPED_COUNT=$((STOPPED_COUNT + 1))
    fi
    rm -f logs/ngrok.pid
fi

if [ -f "logs/ngrok-client.pid" ]; then
    NGROK_CLIENT_PID=$(cat logs/ngrok-client.pid)
    if kill -0 $NGROK_CLIENT_PID 2>/dev/null; then
        echo "🛑 停止前端ngrok隧道 (PID: $NGROK_CLIENT_PID)..."
        kill $NGROK_CLIENT_PID
        sleep 1
        kill -9 $NGROK_CLIENT_PID 2>/dev/null
        echo "✅ 前端ngrok隧道已停止"
        STOPPED_COUNT=$((STOPPED_COUNT + 1))
    fi
    rm -f logs/ngrok-client.pid
fi

# 清理所有ngrok进程
NGROK_PIDS=$(pgrep -f "ngrok" || true)
if [ ! -z "$NGROK_PIDS" ]; then
    echo "🧹 清理残留ngrok进程..."
    echo "$NGROK_PIDS" | xargs kill -TERM 2>/dev/null || true
    sleep 1
    echo "$NGROK_PIDS" | xargs kill -KILL 2>/dev/null || true
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

# 验证ngrok是否完全停止
echo "🔍 验证网络隧道是否完全关闭..."
REMAINING_NGROK=$(pgrep -f "ngrok" || true)
if [ ! -z "$REMAINING_NGROK" ]; then
    echo "⚠️  发现残留ngrok进程，强制清理..."
    echo "$REMAINING_NGROK" | xargs kill -KILL 2>/dev/null || true
    sleep 1
fi

# 最终验证
FINAL_CHECK=$(pgrep -f "ngrok" || true)
if [ -z "$FINAL_CHECK" ]; then
    echo "🔒 网络隧道已完全关闭，您的电脑网络安全"
else
    echo "⚠️  警告：仍有ngrok进程运行，请手动检查"
fi

# 检查关键端口是否已释放
echo "🔍 检查端口释放状态..."
PORT_CHECK=$(lsof -i :3001 -i :5173 -i :4040 -i :4041 2>/dev/null || true)
if [ -z "$PORT_CHECK" ]; then
    echo "🔒 所有游戏端口已释放"
else
    echo "⚠️  以下端口仍被占用："
    echo "$PORT_CHECK"
fi

echo ""
if [ $STOPPED_COUNT -gt 0 ]; then
    echo "✅ 游戏已停止！停止了 $STOPPED_COUNT 个进程"
else
    echo "ℹ️  没有发现运行中的游戏进程"
fi

echo ""
echo "🔒 网络安全状态："
echo "   ✅ ngrok隧道已关闭"
echo "   ✅ 本地服务器已停止"
echo "   ✅ 外部访问已断开"
echo ""
echo "💡 使用 ./start-game.sh 重新启动游戏"
