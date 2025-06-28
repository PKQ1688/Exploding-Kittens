#!/bin/bash

# 爆炸小猫游戏 - 一键停止脚本 (macOS/Linux)
# Exploding Kittens Game - One-click Stop Script

echo "🛑 停止爆炸小猫游戏..."
echo "🛑 Stopping Exploding Kittens Game..."

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 检查是否有运行中的进程
if [ ! -d "logs" ]; then
    echo "📁 未找到日志目录，游戏可能未运行"
    echo "📁 Logs directory not found, game might not be running"
    exit 0
fi

STOPPED_COUNT=0

# 停止服务器
if [ -f "logs/server.pid" ]; then
    SERVER_PID=$(cat logs/server.pid)
    echo "🔍 检查服务器进程 (PID: $SERVER_PID)..."
    echo "🔍 Checking server process (PID: $SERVER_PID)..."
    
    if kill -0 $SERVER_PID 2>/dev/null; then
        echo "🛑 停止服务器进程..."
        echo "🛑 Stopping server process..."
        kill $SERVER_PID
        sleep 2
        
        # 如果进程仍在运行，强制终止
        if kill -0 $SERVER_PID 2>/dev/null; then
            echo "⚡ 强制终止服务器进程..."
            echo "⚡ Force killing server process..."
            kill -9 $SERVER_PID 2>/dev/null
        fi
        
        echo "✅ 服务器已停止"
        echo "✅ Server stopped"
        STOPPED_COUNT=$((STOPPED_COUNT + 1))
    else
        echo "ℹ️  服务器进程未运行"
        echo "ℹ️  Server process not running"
    fi
    
    rm -f logs/server.pid
else
    echo "ℹ️  未找到服务器进程ID文件"
    echo "ℹ️  Server PID file not found"
fi

# 停止前端
if [ -f "logs/client.pid" ]; then
    CLIENT_PID=$(cat logs/client.pid)
    echo "🔍 检查前端进程 (PID: $CLIENT_PID)..."
    echo "🔍 Checking client process (PID: $CLIENT_PID)..."
    
    if kill -0 $CLIENT_PID 2>/dev/null; then
        echo "🛑 停止前端进程..."
        echo "🛑 Stopping client process..."
        kill $CLIENT_PID
        sleep 2
        
        # 如果进程仍在运行，强制终止
        if kill -0 $CLIENT_PID 2>/dev/null; then
            echo "⚡ 强制终止前端进程..."
            echo "⚡ Force killing client process..."
            kill -9 $CLIENT_PID 2>/dev/null
        fi
        
        echo "✅ 前端已停止"
        echo "✅ Client stopped"
        STOPPED_COUNT=$((STOPPED_COUNT + 1))
    else
        echo "ℹ️  前端进程未运行"
        echo "ℹ️  Client process not running"
    fi
    
    rm -f logs/client.pid
else
    echo "ℹ️  未找到前端进程ID文件"
    echo "ℹ️  Client PID file not found"
fi

# 清理可能残留的 Node.js 进程
echo "🧹 清理残留进程..."
echo "🧹 Cleaning up remaining processes..."

# 查找并终止可能的 Vite 进程
VITE_PIDS=$(pgrep -f "vite" 2>/dev/null)
if [ ! -z "$VITE_PIDS" ]; then
    echo "🔍 发现 Vite 进程: $VITE_PIDS"
    echo "🔍 Found Vite processes: $VITE_PIDS"
    echo $VITE_PIDS | xargs kill 2>/dev/null
    sleep 1
    echo $VITE_PIDS | xargs kill -9 2>/dev/null
fi

# 查找并终止可能的 ts-node 进程
TS_NODE_PIDS=$(pgrep -f "ts-node.*server" 2>/dev/null)
if [ ! -z "$TS_NODE_PIDS" ]; then
    echo "🔍 发现 ts-node 服务器进程: $TS_NODE_PIDS"
    echo "🔍 Found ts-node server processes: $TS_NODE_PIDS"
    echo $TS_NODE_PIDS | xargs kill 2>/dev/null
    sleep 1
    echo $TS_NODE_PIDS | xargs kill -9 2>/dev/null
fi

# 查找并终止占用端口的进程
echo "🔍 检查端口占用..."
echo "🔍 Checking port usage..."

# 检查 3001 端口 (服务器)
PORT_3001_PID=$(lsof -ti:3001 2>/dev/null)
if [ ! -z "$PORT_3001_PID" ]; then
    echo "🔍 端口 3001 被进程 $PORT_3001_PID 占用，正在终止..."
    echo "🔍 Port 3001 is used by process $PORT_3001_PID, terminating..."
    kill $PORT_3001_PID 2>/dev/null
    sleep 1
    kill -9 $PORT_3001_PID 2>/dev/null
fi

# 检查 5173 端口 (前端)
PORT_5173_PID=$(lsof -ti:5173 2>/dev/null)
if [ ! -z "$PORT_5173_PID" ]; then
    echo "🔍 端口 5173 被进程 $PORT_5173_PID 占用，正在终止..."
    echo "🔍 Port 5173 is used by process $PORT_5173_PID, terminating..."
    kill $PORT_5173_PID 2>/dev/null
    sleep 1
    kill -9 $PORT_5173_PID 2>/dev/null
fi

echo ""
if [ $STOPPED_COUNT -gt 0 ]; then
    echo "✅ 游戏已完全停止！"
    echo "✅ Game completely stopped!"
else
    echo "ℹ️  没有发现运行中的游戏进程"
    echo "ℹ️  No running game processes found"
fi

echo ""
echo "📊 清理完成统计:"
echo "📊 Cleanup summary:"
echo "   • 停止的进程数: $STOPPED_COUNT"
echo "   • Stopped processes: $STOPPED_COUNT"
echo "   • 日志文件保留在 logs/ 目录"
echo "   • Log files preserved in logs/ directory"
echo ""
echo "💡 提示: 使用 ./start-game.sh 重新启动游戏"
echo "💡 Tip: Use ./start-game.sh to restart the game"
