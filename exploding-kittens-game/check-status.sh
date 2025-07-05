#!/bin/bash

# 检查游戏服务状态的脚本

echo "🎮 爆炸小猫游戏 - 状态检查"
echo "=========================="

# 检查进程
echo "📊 检查运行进程..."
SERVER_PID=$(pgrep -f "tsx.*server" || echo "")
CLIENT_PID=$(pgrep -f "vite" || echo "")
NGROK_BACKEND_PID=$(pgrep -f "ngrok http 3001" || echo "")
NGROK_FRONTEND_PID=$(pgrep -f "ngrok http 5173" || echo "")

if [ ! -z "$SERVER_PID" ]; then
    echo "✅ 后端服务器运行中 (PID: $SERVER_PID)"
else
    echo "❌ 后端服务器未运行"
fi

if [ ! -z "$CLIENT_PID" ]; then
    echo "✅ 前端服务器运行中 (PID: $CLIENT_PID)"
else
    echo "❌ 前端服务器未运行"
fi

if [ ! -z "$NGROK_BACKEND_PID" ]; then
    echo "✅ 后端ngrok隧道运行中 (PID: $NGROK_BACKEND_PID)"
else
    echo "❌ 后端ngrok隧道未运行"
fi

if [ ! -z "$NGROK_FRONTEND_PID" ]; then
    echo "✅ 前端ngrok隧道运行中 (PID: $NGROK_FRONTEND_PID)"
else
    echo "❌ 前端ngrok隧道未运行"
fi

echo ""

# 检查端口
echo "🔌 检查端口占用..."
if lsof -i:3001 > /dev/null 2>&1; then
    echo "✅ 端口 3001 (后端) 已占用"
else
    echo "❌ 端口 3001 (后端) 未占用"
fi

if lsof -i:5173 > /dev/null 2>&1; then
    echo "✅ 端口 5173 (前端) 已占用"
else
    echo "❌ 端口 5173 (前端) 未占用"
fi

echo ""

# 检查ngrok URL
echo "🌐 检查ngrok地址..."
BACKEND_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o 'https://[^"]*\.ngrok[^"]*' | head -1)
FRONTEND_URL=$(curl -s http://localhost:4041/api/tunnels 2>/dev/null | grep -o 'https://[^"]*\.ngrok[^"]*' | head -1)

if [ ! -z "$BACKEND_URL" ]; then
    echo "✅ 后端地址: $BACKEND_URL"
else
    echo "❌ 无法获取后端ngrok地址"
fi

if [ ! -z "$FRONTEND_URL" ]; then
    echo "✅ 前端地址: $FRONTEND_URL"
else
    echo "❌ 无法获取前端ngrok地址"
fi

echo ""

# 检查配置文件
echo "⚙️ 检查配置文件..."
if [ -f "public/server-config.js" ]; then
    CONFIG_URL=$(grep -o 'https://[^"]*' public/server-config.js || echo "")
    if [ ! -z "$CONFIG_URL" ]; then
        echo "✅ 配置文件存在: $CONFIG_URL"
        if [ "$CONFIG_URL" = "$BACKEND_URL" ]; then
            echo "✅ 配置地址与后端地址匹配"
        else
            echo "⚠️  配置地址与后端地址不匹配"
            echo "   配置: $CONFIG_URL"
            echo "   后端: $BACKEND_URL"
        fi
    else
        echo "❌ 配置文件格式错误"
    fi
else
    echo "❌ 配置文件不存在"
fi

echo ""

# 测试连接
echo "🧪 测试连接..."
if [ ! -z "$BACKEND_URL" ]; then
    if curl -s "$BACKEND_URL/socket.io/" | grep -q "Transport unknown"; then
        echo "✅ 后端连接测试通过"
    else
        echo "❌ 后端连接测试失败"
    fi
fi

if [ ! -z "$FRONTEND_URL" ]; then
    if curl -s "$FRONTEND_URL" | grep -q "Exploding Kittens"; then
        echo "✅ 前端连接测试通过"
    else
        echo "❌ 前端连接测试失败"
    fi
fi

echo ""
echo "=========================="

# 给出建议
if [ -z "$SERVER_PID" ] || [ -z "$CLIENT_PID" ] || [ -z "$NGROK_BACKEND_PID" ] || [ -z "$NGROK_FRONTEND_PID" ]; then
    echo "💡 建议: 运行 ./start-online-game.sh 启动所有服务"
elif [ ! -z "$BACKEND_URL" ] && [ ! -z "$CONFIG_URL" ] && [ "$CONFIG_URL" != "$BACKEND_URL" ]; then
    echo "💡 建议: 运行 ./fix-online-connection.sh 修复配置"
else
    echo "🎉 所有服务运行正常！"
    if [ ! -z "$FRONTEND_URL" ]; then
        echo "🌍 游戏地址: $FRONTEND_URL"
    fi
fi
