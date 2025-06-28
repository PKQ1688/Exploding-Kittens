# 🐱 Exploding Kittens 游戏

一个基于 React + TypeScript + Socket.IO 的在线多人版爆炸小猫（Exploding Kittens）卡牌游戏。

## 🎮 游戏简介

爆炸小猫是一款策略卡牌游戏，玩家需要避免抽到爆炸小猫卡片，同时通过各种功能卡片来获得优势。最后存活的玩家获胜！

## ✨ 功能特点

- 🌐 **多人在线游戏** - 通过 Socket.IO 实现实时多人游戏
- 🏠 **房间系统** - 创建/加入房间，支持最多4人游戏
- 🎯 **本地游戏模式** - 离线时自动切换到本地游戏
- 🎨 **现代化UI** - 响应式设计，支持移动端
- ⚡ **实时同步** - 游戏状态实时同步到所有玩家
- 🔄 **自动重连** - 网络断开时自动重连

## 🚀 快速开始

### 🎯 一键启动 (推荐)

我们提供了简单的一键启动脚本，让您轻松启动游戏：

```bash
# 启动游戏
./start-game.sh

# 停止游戏
./stop-game.sh
```

**一键脚本功能：**
- ✅ 自动检查环境依赖
- ✅ 自动安装 npm 包
- ✅ 同时启动前后端服务
- ✅ 自动打开浏览器
- ✅ 智能进程管理

> 📖 详细使用说明请查看 [QUICK_START.md](QUICK_START.md)

### 🛠️ 手动启动 (开发者模式)

#### 环境要求

- Node.js 16.0+
- npm 或 yarn

#### 安装依赖

```bash
# 安装客户端依赖
npm install

# 安装服务端依赖
cd server
npm install
cd ..
```

#### 开发模式

1. **启动服务端**
```bash
cd server
npm run dev
```
服务端将在 http://localhost:3001 启动

2. **启动客户端**
```bash
npm run dev
```
客户端将在 http://localhost:5173 启动

### 生产构建

```bash
# 构建客户端
npm run build

# 构建服务端
cd server
npm run build
```

### 生产部署

```bash
# 启动服务端
cd server
npm start

# 客户端静态文件部署到 dist/ 目录
```

## 🏗️ 项目结构

```
exploding-kittens-game/
├── src/                    # 前端源码
│   ├── components/         # React 组件
│   │   ├── GameBoard.tsx   # 游戏主界面
│   │   ├── PlayerHand.tsx  # 玩家手牌
│   │   ├── RoomList.tsx    # 房间列表
│   │   └── ...
│   ├── services/           # 服务层
│   │   └── socket.ts       # Socket.IO 客户端
│   ├── types/              # TypeScript 类型定义
│   ├── utils/              # 工具函数
│   └── data/               # 游戏数据
│
├── server/                 # 后端源码
│   ├── src/
│   │   ├── server.ts       # 服务器入口
│   │   ├── managers/       # 管理器
│   │   │   └── RoomManager.ts
│   │   ├── game/           # 游戏逻辑
│   │   │   ├── gameLogic.ts
│   │   │   └── cards.ts
│   │   └── types/          # 类型定义
│   └── package.json
│
├── public/                 # 静态资源
├── package.json            # 项目配置
└── README.md               # 项目说明
```

## 🎯 游戏规则

1. **游戏开始** - 每位玩家获得7张手牌，牌库中有爆炸小猫卡片
2. **回合流程** - 玩家轮流行动，可以出牌或直接结束回合
3. **卡片类型**：
   - 🧨 **爆炸小猫** - 抽到即死亡（除非有拆弹猫）
   - 🛡️ **拆弹猫** - 可以拆除爆炸小猫
   - 👀 **透视未来** - 查看牌库顶部3张牌
   - 🔀 **洗牌** - 重新洗牌
   - ⏭️ **跳过** - 结束回合不抽牌
   - 🎯 **攻击** - 强制下一位玩家抽2张牌
4. **胜利条件** - 最后存活的玩家获胜

## 🛠️ 技术栈

### 前端
- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Socket.IO Client** - 实时通信
- **CSS3** - 样式和动画

### 后端
- **Node.js** - 运行时环境
- **Express** - Web 框架
- **Socket.IO** - WebSocket 通信
- **TypeScript** - 类型安全
- **UUID** - 唯一标识符生成

## 🔧 开发说明

### 添加新卡片类型

1. 在 `src/types/game.ts` 中定义新的卡片类型
2. 在 `src/data/cards.ts` 中添加卡片数据
3. 在 `src/utils/gameLogic.ts` 中实现卡片逻辑
4. 更新服务端的 `server/src/game/gameLogic.ts`

### 扩展房间功能

房间相关逻辑在 `server/src/managers/RoomManager.ts` 中管理：
- 创建/删除房间
- 玩家加入/离开
- 房间状态管理

### 自定义游戏规则

游戏核心逻辑在以下文件中：
- `src/utils/gameLogic.ts` (客户端)
- `server/src/game/gameLogic.ts` (服务端)

## 🚀 部署指南

### Docker 部署

```dockerfile
# Dockerfile 示例
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5173 3001
CMD ["npm", "start"]
```

### 环境变量

创建 `.env` 文件：
```env
NODE_ENV=production
PORT=3001
CLIENT_URL=http://localhost:5173
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

## 📝 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🆘 常见问题

**Q: 游戏无法连接服务器怎么办？**
A: 请检查服务端是否正常运行，或使用本地游戏模式。

**Q: 如何修改游戏人数限制？**
A: 在 `server/src/managers/RoomManager.ts` 中修改 `MAX_PLAYERS` 常量。

**Q: 如何添加新的卡片效果？**
A: 参考开发说明中的"添加新卡片类型"部分。

## 📞 联系方式

如有问题或建议，请创建 Issue 或联系开发者。

---

🎉 享受游戏乐趣！记住，不要被爆炸小猫炸到哦~ 🐱💥
