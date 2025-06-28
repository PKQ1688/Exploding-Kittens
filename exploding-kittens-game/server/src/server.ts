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
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const roomManager = new RoomManager();

// 定期清理空房间
setInterval(() => {
  roomManager.cleanupEmptyRooms();
}, 5 * 60 * 1000); // 每5分钟清理一次

io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  // 获取房间列表
  socket.on('get_rooms', () => {
    const rooms = roomManager.getAllRooms();
    socket.emit('room_list', rooms);
  });

  // 创建房间
  socket.on('create_room', (roomName, playerName) => {
    try {
      const room = roomManager.createRoom(roomName, playerName, socket.id);
      socket.data.roomId = room.id;
      socket.data.playerId = room.players[0].id;
      
      socket.join(room.id);
      socket.emit('room_joined', room);
      
      // 广播房间列表更新
      io.emit('room_list', roomManager.getAllRooms());
    } catch (error) {
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
      const newGameState = playCard(room.gameState, playerId, cardId, targetPlayerId);
      roomManager.updateGameState(roomId, newGameState);

      io.to(roomId).emit('card_played', playerId, cardId, targetPlayerId);
      io.to(roomId).emit('game_state_update', newGameState);
    } catch (error) {
      socket.emit('error', error instanceof Error ? error.message : '打出卡牌失败');
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
    console.log('用户断开连接:', socket.id);

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

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
