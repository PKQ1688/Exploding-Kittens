#!/bin/bash

# 简化版在线游戏启动脚本
# 创建一个包含服务器地址的单一在线游戏链接

set -e

echo "🌍 启动简化版在线游戏"
echo "========================"

# 创建日志目录
mkdir -p logs

# 安装依赖
echo "📦 检查依赖..."
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

# 启动后端ngrok隧道
echo "🌐 启动后端ngrok隧道..."
nohup ngrok http 3001 > logs/ngrok-server.log 2>&1 &
NGROK_PID=$!
echo $NGROK_PID > logs/ngrok.pid

# 等待ngrok启动
sleep 5

# 获取ngrok URL
NGROK_URL=""
for i in {1..10}; do
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | cut -d'"' -f4 | head -1)
    if [ ! -z "$NGROK_URL" ]; then
        break
    fi
    echo "等待ngrok启动... ($i/10)"
    sleep 2
done

if [ -z "$NGROK_URL" ]; then
    echo "❌ 无法获取ngrok URL"
    exit 1
fi

echo "✅ 后端URL: $NGROK_URL"

# 修改index.html来包含服务器地址
echo "⚙️ 配置游戏文件..."
cp index.html index.html.backup 2>/dev/null || true

# 创建包含服务器地址的index.html
cat > index.html << EOF
<!DOCTYPE html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Exploding Kittens</title>
    <script>
      window.__SERVER_URL__ = '$NGROK_URL';
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

# 启动前端并创建ngrok隧道
echo "🎮 启动前端服务器..."
nohup npm run dev > logs/client.log 2>&1 &
CLIENT_PID=$!
echo $CLIENT_PID > logs/client.pid

# 等待前端启动
sleep 5

# 创建前端ngrok隧道，使用不同端口
nohup ngrok http 5173 --region=us > logs/ngrok-client.log 2>&1 &
NGROK_CLIENT_PID=$!
echo $NGROK_CLIENT_PID > logs/ngrok-client.pid

# 等待前端ngrok启动
sleep 5

# 获取前端ngrok URL
FRONTEND_URL=""
for i in {1..10}; do
    FRONTEND_URL=$(curl -s http://localhost:4041/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*' | cut -d'"' -f4 | head -1)
    if [ ! -z "$FRONTEND_URL" ]; then
        break
    fi
    echo "等待前端ngrok启动... ($i/10)"
    sleep 2
done

echo ""
echo "🎉 在线游戏启动成功！"
echo "========================"
echo ""
echo "🌍 给朋友的游戏地址："
echo "   $FRONTEND_URL"
echo ""
echo "📋 复制上面的地址发给你的朋友"
echo "   他们只需要在浏览器中打开这个地址就能玩了！"
echo ""
echo "🛑 停止游戏请运行: ./stop-game.sh"

# 自动打开浏览器
if [ ! -z "$FRONTEND_URL" ]; then
    if command -v open &> /dev/null; then
        open "$FRONTEND_URL"
    fi
fi

echo ""
echo "✨ 享受在线游戏乐趣！🐱💥"