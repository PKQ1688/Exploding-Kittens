#!/bin/bash

# 修复在线游戏连接问题的脚本

set -e

echo "🔧 修复在线游戏连接问题"
echo "=========================="

# 检查ngrok是否在运行
if ! pgrep -f "ngrok" > /dev/null; then
    echo "❌ ngrok 未运行，请先运行 ./start-online-game.sh"
    exit 1
fi

echo "✅ 检测到 ngrok 正在运行"

# 获取当前的后端ngrok URL
echo "🔍 获取后端服务器地址..."
BACKEND_URL=""
for i in {1..10}; do
    BACKEND_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o 'https://[^"]*\.ngrok[^"]*' | head -1)
    if [ ! -z "$BACKEND_URL" ]; then
        break
    fi
    echo "等待后端ngrok启动... ($i/10)"
    sleep 2
done

if [ -z "$BACKEND_URL" ]; then
    echo "❌ 无法获取后端ngrok URL"
    exit 1
fi

echo "✅ 后端地址: $BACKEND_URL"

# 获取前端ngrok URL
echo "🔍 获取前端游戏地址..."
FRONTEND_URL=""
for i in {1..10}; do
    FRONTEND_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o 'https://[^"]*\.ngrok[^"]*' | grep ":5173" | head -1)
    if [ -z "$FRONTEND_URL" ]; then
        # 如果4040端口没有前端隧道，检查是否有单独的前端ngrok进程
        FRONTEND_URL=$(ps aux | grep "ngrok http 5173" | grep -v grep | head -1)
        if [ ! -z "$FRONTEND_URL" ]; then
            # 动态获取前端ngrok地址
            FRONTEND_URL=$(curl -s http://localhost:4041/api/tunnels 2>/dev/null | grep -o 'https://[^"]*\.ngrok[^"]*' | head -1)
            break
        fi
    else
        break
    fi
    echo "等待前端ngrok启动... ($i/10)"
    sleep 2
done

if [ -z "$FRONTEND_URL" ]; then
    echo "⚠️  无法获取前端ngrok URL，使用localhost"
    FRONTEND_URL="http://localhost:5173"
fi

echo "✅ 前端地址: $FRONTEND_URL"

# 更新服务器配置
echo "⚙️ 更新服务器配置..."
echo "window.__SERVER_URL__ = '$BACKEND_URL';" > public/server-config.js

echo "✅ 配置已更新"

# 测试连接
echo "🧪 测试后端连接..."
if curl -s "$BACKEND_URL/socket.io/" | grep -q "Transport unknown"; then
    echo "✅ 后端连接正常"
else
    echo "❌ 后端连接异常"
fi

echo ""
echo "🎉 修复完成！"
echo "=========================="
echo "🌍 在线游戏地址:"
echo "   $FRONTEND_URL"
echo ""
echo "📱 分享给朋友们:"
echo "   $FRONTEND_URL"
echo ""
echo "🔧 如果仍有问题，请："
echo "   1. 刷新浏览器页面"
echo "   2. 检查浏览器控制台错误"
echo "   3. 运行 ./stop-game.sh 然后重新启动"
echo ""

# 自动打开浏览器
if command -v open &> /dev/null; then
    echo "🌐 正在打开浏览器..."
    open "$FRONTEND_URL"
elif command -v xdg-open &> /dev/null; then
    echo "🌐 正在打开浏览器..."
    xdg-open "$FRONTEND_URL"
fi

echo "✨ 现在可以创建房间并邀请朋友加入了！"
