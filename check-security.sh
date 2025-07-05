#!/bin/bash

# 爆炸小猫游戏 - 网络安全检查脚本
# 检查是否有残留的网络隧道或开放端口

echo "🔍 网络安全检查..."
echo "=================================="

# 检查ngrok进程
echo "📡 检查ngrok隧道状态..."
NGROK_PROCESSES=$(pgrep -f "ngrok" || true)
if [ -z "$NGROK_PROCESSES" ]; then
    echo "✅ 没有发现ngrok进程"
else
    echo "⚠️  发现ngrok进程："
    ps aux | grep ngrok | grep -v grep
    echo ""
    echo "🛠️  建议运行: ./stop-game.sh 来清理"
fi

# 检查游戏相关端口
echo ""
echo "🔌 检查游戏端口占用..."
GAME_PORTS="3001 5173 4040 4041"
PORT_ISSUES=0

for port in $GAME_PORTS; do
    PORT_USAGE=$(lsof -i :$port 2>/dev/null || true)
    if [ ! -z "$PORT_USAGE" ]; then
        echo "⚠️  端口 $port 被占用："
        echo "$PORT_USAGE"
        PORT_ISSUES=$((PORT_ISSUES + 1))
    else
        echo "✅ 端口 $port 空闲"
    fi
done

# 检查网络连接
echo ""
echo "🌐 检查外部网络连接..."
EXTERNAL_CONNECTIONS=$(netstat -an 2>/dev/null | grep -E ":(3001|5173|4040|4041)" | grep ESTABLISHED || true)
if [ -z "$EXTERNAL_CONNECTIONS" ]; then
    echo "✅ 没有外部连接到游戏端口"
else
    echo "⚠️  发现外部连接："
    echo "$EXTERNAL_CONNECTIONS"
fi

# 总结
echo ""
echo "📋 安全检查总结"
echo "=================================="

if [ -z "$NGROK_PROCESSES" ] && [ $PORT_ISSUES -eq 0 ] && [ -z "$EXTERNAL_CONNECTIONS" ]; then
    echo "🔒 您的电脑网络安全状态良好"
    echo "   ✅ 没有活跃的ngrok隧道"
    echo "   ✅ 游戏端口已关闭"
    echo "   ✅ 没有外部连接"
else
    echo "⚠️  发现潜在安全问题："
    [ ! -z "$NGROK_PROCESSES" ] && echo "   🔴 有ngrok进程在运行"
    [ $PORT_ISSUES -gt 0 ] && echo "   🔴 有游戏端口被占用"
    [ ! -z "$EXTERNAL_CONNECTIONS" ] && echo "   🔴 有外部连接"
    echo ""
    echo "🛠️  建议操作："
    echo "   1. 运行 ./stop-game.sh 停止所有游戏进程"
    echo "   2. 如果问题持续，重启电脑"
fi

echo ""
echo "💡 提示："
echo "   - 使用 ./stop-game.sh 安全停止游戏"
echo "   - 定期运行此脚本检查安全状态"
echo "   - ngrok隧道只在游戏运行时开启"
