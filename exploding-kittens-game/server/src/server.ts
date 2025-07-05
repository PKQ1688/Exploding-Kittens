import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from './types';
import { RoomManager } from './managers/RoomManager';
import { drawCard, playCard, endTurn } from './game/gameLogic';

const app = express();
const server = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174", 
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/,
      /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
      /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[01])\.\d+\.\d+:\d+$/,
      /^http:\/\/198\.18\.\d+\.\d+:\d+$/
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

const roomManager = new RoomManager();

// 执行待确认行动
function executePendingAction(roomId: string, io: any, roomManager: RoomManager) {
  const room = roomManager.getRoom(roomId);
  if (!room || !room.gameState || !room.gameState.pendingAction) return;

  const { playerId, cardId, targetPlayerId } = room.gameState.pendingAction;
  
  try {
    const newGameState = playCard(room.gameState, playerId, cardId, targetPlayerId);
    newGameState.pendingAction = undefined; // 清除待确认行动
    roomManager.updateGameState(roomId, newGameState);

    io.to(roomId).emit('action_resolved');
    io.to(roomId).emit('card_played', playerId, cardId, targetPlayerId);
    io.to(roomId).emit('game_state_update', newGameState);
  } catch (error) {
    // console.error('执行待确认行动失败:', error);
  }
}

// 定期清理空房间
setInterval(() => {
  roomManager.cleanupEmptyRooms();
}, 5 * 60 * 1000); // 每5分钟清理一次

io.on('connection', (socket) => {
  // console.log('用户连接:', socket.id);

  // 获取房间列表
  socket.on('get_rooms', () => {
    const rooms = roomManager.getAllRooms();
    socket.emit('room_list', rooms);
  });

  // 创建房间
  socket.on('create_room', (roomName, playerName) => {
    // console.log('收到创建房间请求:', { socketId: socket.id, roomName, playerName });
    try {
      const room = roomManager.createRoom(roomName, playerName, socket.id);
      socket.data.roomId = room.id;
      socket.data.playerId = room.players[0].id;
      
      socket.join(room.id);
      // console.log('房间创建成功:', { roomId: room.id, roomName: room.name });
      socket.emit('room_joined', room);
      
      // 广播房间列表更新
      io.emit('room_list', roomManager.getAllRooms());
    } catch (error) {
      // console.error('创建房间失败:', error);
      socket.emit('error', error instanceof Error ? error.message : '创建房间失败');
    }
  });

  // 加入房间
  socket.on('join_room', (roomId, playerName) => {
    try {
      const result = roomManager.joinRoom(roomId, playerName, socket.id);
      if (!result) {
        socket.emit('error', '房间不存在');
        return;
      }

      const { room, player } = result;
      socket.data.roomId = room.id;
      socket.data.playerId = player.id;
      
      socket.join(room.id);
      socket.emit('room_joined', room);
      socket.to(room.id).emit('player_joined', player);
      
      // 广播房间列表更新
      io.emit('room_list', roomManager.getAllRooms());
    } catch (error) {
      socket.emit('error', error instanceof Error ? error.message : '加入房间失败');
    }
  });

  // 离开房间
  socket.on('leave_room', () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const result = roomManager.leaveRoom(roomId, socket.id);
    if (result.room && result.playerId) {
      socket.to(roomId).emit('player_left', result.playerId);
      socket.leave(roomId);
      
      // 如果游戏正在进行，广播游戏状态更新
      if (result.room.gameState) {
        socket.to(roomId).emit('game_state_update', result.room.gameState);
      }
    }
    
    socket.data.roomId = undefined;
    socket.data.playerId = undefined;
    socket.emit('room_left');
    
    // 广播房间列表更新
    io.emit('room_list', roomManager.getAllRooms());
  });

  // 玩家准备
  socket.on('player_ready', (isReady) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const result = roomManager.setPlayerReady(roomId, socket.id, isReady);
    if (result) {
      io.to(roomId).emit('player_ready', result.player.id, isReady);
    }
  });

  // 开始游戏
  socket.on('start_game', () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    try {
      const room = roomManager.startGame(roomId, socket.id);
      if (room && room.gameState) {
        io.to(roomId).emit('game_started', room.gameState);

        // 从房间列表中移除（游戏已开始）
        io.emit('room_list', roomManager.getAllRooms());
      }
    } catch (error) {
      socket.emit('error', error instanceof Error ? error.message : '开始游戏失败');
    }
  });

  // 打出卡牌
  socket.on('play_card', (cardId, targetPlayerId) => {
    const roomId = socket.data.roomId;
    const playerId = socket.data.playerId;
    if (!roomId || !playerId) return;

    const room = roomManager.getRoom(roomId);
    if (!room || !room.gameState) return;

    try {
      // 检查是否是可以被否定的卡牌
      const player = room.gameState.players.find(p => p.id === playerId);
      const card = player?.hand.find(c => c.id === cardId);
      
      if (!card) {
        socket.emit('error', '卡牌不存在');
        return;
      }

      // 可以被否定的卡牌类型（除了否定卡和拆弹卡）
      const nopableCardTypes = [
        'attack', 'skip', 'favor', 'shuffle', 'see_the_future',
        'cat_tacocat', 'cat_cattermelon', 'cat_hairy_potato',
        'cat_rainbow_ralphing', 'cat_beard'
      ];

      if (nopableCardTypes.includes(card.type) && card.type !== 'nope') {
        // 设置待确认行动
        const pendingAction = {
          playerId,
          cardId,
          targetPlayerId,
          timeoutAt: Date.now() + 5000 // 5秒超时
        };
        
        room.gameState.pendingAction = pendingAction;
        roomManager.updateGameState(roomId, room.gameState);

        // 通知所有玩家有待确认行动
        io.to(roomId).emit('action_pending', {
          playerId,
          cardId,
          targetPlayerId,
          timeRemaining: 5000
        });

        // 5秒后自动执行（如果没有被否定）
        setTimeout(() => {
          const currentRoom = roomManager.getRoom(roomId);
          if (currentRoom?.gameState?.pendingAction?.cardId === cardId) {
            executePendingAction(roomId, io, roomManager);
          }
        }, 5000);

      } else {
        // 直接执行（否定卡、拆弹卡等不能被否定的卡牌）
        const newGameState = playCard(room.gameState, playerId, cardId, targetPlayerId);
        roomManager.updateGameState(roomId, newGameState);

        io.to(roomId).emit('card_played', playerId, cardId, targetPlayerId);
        io.to(roomId).emit('game_state_update', newGameState);
      }
    } catch (error) {
      socket.emit('error', error instanceof Error ? error.message : '打出卡牌失败');
    }
  });

  // 打出否定卡
  socket.on('play_nope', (cardId) => {
    const roomId = socket.data.roomId;
    const playerId = socket.data.playerId;
    if (!roomId || !playerId) return;

    const room = roomManager.getRoom(roomId);
    if (!room || !room.gameState || !room.gameState.pendingAction) return;

    try {
      // 验证玩家有否定卡
      const player = room.gameState.players.find(p => p.id === playerId);
      if (!player) {
        socket.emit('error', '玩家不存在');
        return;
      }

      const nopeCard = player.hand.find(c => c.id === cardId && c.type === 'nope');
      
      if (!nopeCard) {
        socket.emit('error', '没有否定卡');
        return;
      }

      // 移除否定卡
      const cardIndex = player.hand.findIndex(c => c.id === cardId);
      player.hand.splice(cardIndex, 1);
      room.gameState.discardPile.push(nopeCard);

      // 清除待确认行动
      room.gameState.pendingAction = undefined;
      room.gameState.lastAction = `${player.name} 使用否定卡阻止了行动`;

      roomManager.updateGameState(roomId, room.gameState);

      // 通知所有玩家行动被否定
      io.to(roomId).emit('action_noped', playerId);
      io.to(roomId).emit('game_state_update', room.gameState);
    } catch (error) {
      socket.emit('error', error instanceof Error ? error.message : '使用否定卡失败');
    }
  });

  // 抽牌
  socket.on('draw_card', () => {
    const roomId = socket.data.roomId;
    const playerId = socket.data.playerId;
    if (!roomId || !playerId) return;

    const room = roomManager.getRoom(roomId);
    if (!room || !room.gameState) return;

    try {
      const newGameState = drawCard(room.gameState, playerId);
      roomManager.updateGameState(roomId, newGameState);

      io.to(roomId).emit('card_drawn', playerId);
      io.to(roomId).emit('game_state_update', newGameState);
    } catch (error) {
      socket.emit('error', error instanceof Error ? error.message : '抽牌失败');
    }
  });

  // 结束回合
  socket.on('end_turn', () => {
    const roomId = socket.data.roomId;
    const playerId = socket.data.playerId;
    if (!roomId || !playerId) return;

    const room = roomManager.getRoom(roomId);
    if (!room || !room.gameState) return;

    try {
      const newGameState = endTurn(room.gameState);
      roomManager.updateGameState(roomId, newGameState);

      io.to(roomId).emit('turn_ended', playerId);
      io.to(roomId).emit('game_state_update', newGameState);
    } catch (error) {
      socket.emit('error', error instanceof Error ? error.message : '结束回合失败');
    }
  });

  // 断开连接
  socket.on('disconnect', () => {
    // console.log('用户断开连接:', socket.id);

    const roomId = socket.data.roomId;
    if (roomId) {
      const result = roomManager.leaveRoom(roomId, socket.id);
      if (result.room && result.playerId) {
        socket.to(roomId).emit('player_left', result.playerId);

        // 如果游戏正在进行，广播游戏状态更新
        if (result.room.gameState) {
          socket.to(roomId).emit('game_state_update', result.room.gameState);
        }
      }

      // 广播房间列表更新
      io.emit('room_list', roomManager.getAllRooms());
    }
  });
});

const PORT = parseInt(process.env.PORT || '3001', 10);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`局域网访问地址: http://0.0.0.0:${PORT}`);
});
