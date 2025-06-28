import { v4 as uuidv4 } from 'uuid';
import { Room, Player, GamePhase } from '../types';
import { initializeGame } from '../game/gameLogic';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();

  // 创建房间
  createRoom(roomName: string, creatorName: string, creatorSocketId: string): Room {
    const roomId = uuidv4();
    const creator: Player = {
      id: uuidv4(),
      name: creatorName,
      socketId: creatorSocketId,
      hand: [],
      isAlive: true,
      isCurrentPlayer: false,
      isReady: false
    };

    const room: Room = {
      id: roomId,
      name: roomName,
      players: [creator],
      gameState: null,
      maxPlayers: 5,
      isGameStarted: false,
      createdAt: new Date()
    };

    this.rooms.set(roomId, room);
    return room;
  }

  // 加入房间
  joinRoom(roomId: string, playerName: string, socketId: string): { room: Room; player: Player } | null {
    const room = this.rooms.get(roomId);
    if (!room) {
      return null;
    }

    if (room.players.length >= room.maxPlayers) {
      throw new Error('房间已满');
    }

    if (room.isGameStarted) {
      throw new Error('游戏已开始');
    }

    // 检查玩家名是否重复
    if (room.players.some(p => p.name === playerName)) {
      throw new Error('玩家名已存在');
    }

    const player: Player = {
      id: uuidv4(),
      name: playerName,
      socketId: socketId,
      hand: [],
      isAlive: true,
      isCurrentPlayer: false,
      isReady: false
    };

    room.players.push(player);
    return { room, player };
  }

  // 离开房间
  leaveRoom(roomId: string, socketId: string): { room: Room | null; playerId: string | null } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { room: null, playerId: null };
    }

    const playerIndex = room.players.findIndex(p => p.socketId === socketId);
    if (playerIndex === -1) {
      return { room: null, playerId: null };
    }

    const playerId = room.players[playerIndex].id;
    room.players.splice(playerIndex, 1);

    // 如果房间空了，删除房间
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      return { room: null, playerId };
    }

    // 如果游戏正在进行中，需要处理玩家离开的逻辑
    if (room.isGameStarted && room.gameState) {
      // 标记玩家为死亡
      const gamePlayer = room.gameState.players.find(p => p.id === playerId);
      if (gamePlayer) {
        gamePlayer.isAlive = false;
        gamePlayer.hand = [];
      }

      // 检查游戏是否结束
      const alivePlayers = room.gameState.players.filter(p => p.isAlive);
      if (alivePlayers.length === 1) {
        room.gameState.phase = GamePhase.GAME_OVER;
        room.gameState.winner = alivePlayers[0];
      }
    }

    return { room, playerId };
  }

  // 设置玩家准备状态
  setPlayerReady(roomId: string, socketId: string, isReady: boolean): { room: Room; player: Player } | null {
    const room = this.rooms.get(roomId);
    if (!room) {
      return null;
    }

    const player = room.players.find(p => p.socketId === socketId);
    if (!player) {
      return null;
    }

    player.isReady = isReady;
    return { room, player };
  }

  // 开始游戏
  startGame(roomId: string, socketId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) {
      return null;
    }

    // 检查是否是房主
    if (room.players[0].socketId !== socketId) {
      throw new Error('只有房主可以开始游戏');
    }

    // 检查玩家数量
    if (room.players.length < 2) {
      throw new Error('至少需要2名玩家');
    }

    // 检查所有玩家是否准备
    if (!room.players.every(p => p.isReady)) {
      throw new Error('所有玩家必须准备就绪');
    }

    // 初始化游戏
    room.gameState = initializeGame(room.players);
    room.isGameStarted = true;

    return room;
  }

  // 获取房间
  getRoom(roomId: string): Room | null {
    return this.rooms.get(roomId) || null;
  }

  // 获取所有房间
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values()).filter(room => !room.isGameStarted);
  }

  // 通过socket ID查找玩家所在的房间
  findRoomBySocketId(socketId: string): { room: Room; player: Player } | null {
    for (const room of this.rooms.values()) {
      const player = room.players.find(p => p.socketId === socketId);
      if (player) {
        return { room, player };
      }
    }
    return null;
  }

  // 更新游戏状态
  updateGameState(roomId: string, gameState: any): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) {
      return null;
    }

    room.gameState = gameState;
    return room;
  }

  // 清理空房间（定期调用）
  cleanupEmptyRooms(): void {
    const now = new Date();
    for (const [roomId, room] of this.rooms.entries()) {
      // 删除超过1小时的空房间
      if (room.players.length === 0 && 
          now.getTime() - room.createdAt.getTime() > 60 * 60 * 1000) {
        this.rooms.delete(roomId);
      }
    }
  }
}
