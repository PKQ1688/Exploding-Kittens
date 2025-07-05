#!/bin/bash

# 诊断连接问题的详细脚本

echo "🔍 爆炸小猫游戏 - 连接诊断"
echo "=========================="

# 获取ngrok地址
BACKEND_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o 'https://[^"]*\.ngrok[^"]*' | head -1)
FRONTEND_URL=$(curl -s http://localhost:4041/api/tunnels 2>/dev/null | grep -o 'https://[^"]*\.ngrok[^"]*' | head -1)

echo "🌐 当前地址:"
echo "   后端: $BACKEND_URL"
echo "   前端: $FRONTEND_URL"
echo ""

# 检查配置文件
echo "⚙️ 检查配置文件:"
if [ -f "public/server-config.js" ]; then
    echo "   配置内容:"
    cat public/server-config.js
    echo ""
else
    echo "   ❌ 配置文件不存在"
fi

# 测试后端各个端点
echo "🧪 测试后端连接:"
if [ ! -z "$BACKEND_URL" ]; then
    echo "   测试根路径..."
    curl -s "$BACKEND_URL" | head -3
    echo ""
    
    echo "   测试Socket.IO端点..."
    curl -s "$BACKEND_URL/socket.io/" | head -1
    echo ""
    
    echo "   测试Socket.IO握手..."
    curl -s "$BACKEND_URL/socket.io/?EIO=4&transport=polling" | head -1
    echo ""
else
    echo "   ❌ 无法获取后端地址"
fi

# 检查本地端口
echo "🔌 检查本地端口:"
echo "   端口 3001 (后端):"
if curl -s http://localhost:3001/socket.io/ | grep -q "Transport unknown"; then
    echo "   ✅ 本地后端正常"
else
    echo "   ❌ 本地后端异常"
fi

echo "   端口 5173 (前端):"
if curl -s http://localhost:5173 | grep -q "Exploding Kittens"; then
    echo "   ✅ 本地前端正常"
else
    echo "   ❌ 本地前端异常"
fi

echo ""

# 检查进程状态
echo "📊 检查进程状态:"
SERVER_PID=$(ps aux | grep "ts-node src/server.ts" | grep -v grep | awk '{print $2}')
if [ ! -z "$SERVER_PID" ]; then
    echo "   ✅ 后端服务器运行中 (PID: $SERVER_PID)"
else
    echo "   ❌ 后端服务器未运行"
fi

CLIENT_PID=$(ps aux | grep "vite" | grep -v grep | awk '{print $2}' | head -1)
if [ ! -z "$CLIENT_PID" ]; then
    echo "   ✅ 前端服务器运行中 (PID: $CLIENT_PID)"
else
    echo "   ❌ 前端服务器未运行"
fi

echo ""

# 检查日志文件
echo "📋 检查最新日志:"
if [ -f "logs/server.log" ]; then
    echo "   后端日志 (最后5行):"
    tail -5 logs/server.log | sed 's/^/     /'
    echo ""
fi

if [ -f "logs/client.log" ]; then
    echo "   前端日志 (最后5行):"
    tail -5 logs/client.log | sed 's/^/     /'
    echo ""
fi

# 测试Socket.IO连接
echo "🔗 测试Socket.IO连接:"
if [ ! -z "$BACKEND_URL" ]; then
    echo "   尝试WebSocket连接..."
    # 使用curl测试WebSocket升级
    curl -s -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" -H "Sec-WebSocket-Version: 13" "$BACKEND_URL/socket.io/?EIO=4&transport=websocket" | head -1
    echo ""
fi

echo "=========================="
echo "💡 诊断建议:"

if [ -z "$BACKEND_URL" ] || [ -z "$FRONTEND_URL" ]; then
    echo "   1. ngrok隧道未正常启动，运行 ./start-online-game.sh"
elif [ -z "$SERVER_PID" ]; then
    echo "   1. 后端服务器未运行，检查 logs/server.log"
elif [ -z "$CLIENT_PID" ]; then
    echo "   1. 前端服务器未运行，检查 logs/client.log"
else
    echo "   1. 所有服务看起来正常运行"
    echo "   2. 如果仍有连接问题，请检查浏览器控制台"
    echo "   3. 尝试刷新浏览器页面"
    echo "   4. 确保防火墙没有阻止连接"
fi

echo ""
echo "🌍 游戏地址: $FRONTEND_URL"
