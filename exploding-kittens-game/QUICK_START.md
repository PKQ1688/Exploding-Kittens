# 🚀 快速启动指南

## 一键启动/停止脚本

为了方便您快速启动和停止爆炸小猫游戏，我们提供了跨平台的一键脚本。

### 📋 系统要求

- **Node.js** 16.0 或更高版本
- **npm** (通常随 Node.js 一起安装)
- **现代浏览器** (Chrome, Firefox, Safari, Edge)

### 🖥️ macOS / Linux 用户

#### 启动游戏
```bash
./start-game.sh
```

#### 停止游戏
```bash
./stop-game.sh
```

### 🪟 Windows 用户

#### 启动游戏
双击 `start-game.bat` 或在命令行中运行：
```cmd
start-game.bat
```

#### 停止游戏
双击 `stop-game.bat` 或在命令行中运行：
```cmd
stop-game.bat
```

## 🎯 脚本功能

### 启动脚本 (`start-game.sh` / `start-game.bat`)

✅ **自动检查环境**
- 检查 Node.js 和 npm 是否已安装
- 验证版本兼容性

✅ **智能依赖管理**
- 自动安装前端依赖 (如果未安装)
- 自动安装后端依赖 (如果未安装)

✅ **后台服务启动**
- 启动后端服务器 (端口 3001)
- 启动前端开发服务器 (端口 5173)
- 进程管理和监控

✅ **用户友好**
- 自动打开浏览器
- 实时状态反馈
- 详细的启动日志

### 停止脚本 (`stop-game.sh` / `stop-game.bat`)

🛑 **智能进程管理**
- 查找并停止所有相关进程
- 清理端口占用
- 强制终止顽固进程

🧹 **彻底清理**
- 清理 Vite 开发服务器
- 清理 ts-node 后端进程
- 清理端口占用进程

📊 **详细反馈**
- 显示停止的进程数量
- 保留日志文件供调试
- 清理状态报告

## 📁 文件结构

启动后会创建以下文件和目录：

```
exploding-kittens-game/
├── logs/                   # 日志目录
│   ├── server.log         # 后端服务器日志
│   ├── client.log         # 前端开发服务器日志
│   ├── server.pid         # 服务器进程ID (仅 Unix)
│   └── client.pid         # 前端进程ID (仅 Unix)
├── start-game.sh          # Unix 启动脚本
├── stop-game.sh           # Unix 停止脚本
├── start-game.bat         # Windows 启动脚本
└── stop-game.bat          # Windows 停止脚本
```

## 🌐 访问地址

启动成功后，您可以通过以下地址访问：

- **游戏界面**: http://localhost:5173
- **后端API**: http://localhost:3001

## 🔧 故障排除

### 常见问题

**Q: 脚本提示 "Node.js not found"**
A: 请先安装 Node.js 16.0+，下载地址：https://nodejs.org/

**Q: 端口被占用怎么办？**
A: 运行停止脚本会自动清理端口占用，或手动终止占用进程

**Q: 游戏无法连接服务器**
A: 检查后端服务器是否正常启动，查看 `logs/server.log` 日志

**Q: 前端页面无法加载**
A: 检查前端服务器是否正常启动，查看 `logs/client.log` 日志

### 手动启动 (备用方案)

如果脚本无法正常工作，您可以手动启动：

```bash
# 1. 安装依赖
npm install
cd server && npm install && cd ..

# 2. 启动后端 (新终端窗口)
cd server
npm run dev

# 3. 启动前端 (新终端窗口)
npm run dev
```

### 查看日志

```bash
# 查看服务器日志
tail -f logs/server.log

# 查看前端日志
tail -f logs/client.log

# Windows 用户
type logs\server.log
type logs\client.log
```

## 🎮 开始游戏

1. 运行启动脚本
2. 等待浏览器自动打开 (或手动访问 http://localhost:5173)
3. 创建房间或加入现有房间
4. 等待其他玩家加入
5. 开始游戏！

## 💡 提示

- 首次启动可能需要较长时间来安装依赖
- 建议使用现代浏览器以获得最佳体验
- 游戏支持 2-4 人同时游戏
- 可以在本地网络中与朋友一起游戏

---

🎉 享受爆炸小猫游戏的乐趣！记住，不要被爆炸小猫炸到哦~ 🐱💥
