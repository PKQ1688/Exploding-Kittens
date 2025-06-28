import { io, Socket } from 'socket.io-client';
import type { GameState, Player } from '../types/game';

// 服务器事件类型
interface ServerToClientEvents {
  room_list: (rooms: any[]) => void;
  room_joined: (room: any) => void;
  room_left: () => void;
  player_joined: (player: Player) => void;
  player_left: (playerId: string) => void;
  player_ready: (playerId: string, isReady: boolean) => void;
  game_started: (gameState: GameState) => void;
  game_state_update: (gameState: GameState) => void;
  error: (message: string) => void;
  card_played: (playerId: string, cardId: string, targetPlayerId?: string) => void;
  card_drawn: (playerId: string) => void;
  turn_ended: (playerId: string) => void;
}

// 客户端事件类型
interface ClientToServerEvents {
  create_room: (roomName: string, playerName: string) => void;
  join_room: (roomId: string, playerName: string) => void;
  leave_room: () => void;
  get_rooms: () => void;
  player_ready: (isReady: boolean) => void;
  start_game: () => void;
  play_card: (cardId: string, targetPlayerId?: string) => void;
  draw_card: () => void;
  end_turn: () => void;
}

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io('http://localhost:3001');
      
      this.socket.on('connect', () => {
        console.log('连接到服务器');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('连接失败:', error);
        reject(error);
      });

      // 设置事件监听器
      this.setupEventListeners();
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // 转发所有服务器事件到注册的监听器
    const events: (keyof ServerToClientEvents)[] = [
      'room_list', 'room_joined', 'room_left', 'player_joined', 'player_left',
      'player_ready', 'game_started', 'game_state_update', 'error',
      'card_played', 'card_drawn', 'turn_ended'
    ];

    events.forEach(event => {
      this.socket!.on(event, (...args: any[]) => {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
          eventListeners.forEach(listener => listener(...args));
        }
      });
    });
  }

  // 事件监听器管理
  on<K extends keyof ServerToClientEvents>(event: K, listener: ServerToClientEvents[K]) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off<K extends keyof ServerToClientEvents>(event: K, listener: ServerToClientEvents[K]) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  // 发送事件到服务器
  emit<K extends keyof ClientToServerEvents>(event: K, ...args: Parameters<ClientToServerEvents[K]>) {
    if (this.socket) {
      (this.socket.emit as any)(event, ...args);
    }
  }

  // 便捷方法
  getRooms() {
    this.emit('get_rooms');
  }

  createRoom(roomName: string, playerName: string) {
    this.emit('create_room', roomName, playerName);
  }

  joinRoom(roomId: string, playerName: string) {
    this.emit('join_room', roomId, playerName);
  }

  leaveRoom() {
    this.emit('leave_room');
  }

  setPlayerReady(isReady: boolean) {
    this.emit('player_ready', isReady);
  }

  startGame() {
    this.emit('start_game');
  }

  playCard(cardId: string, targetPlayerId?: string) {
    this.emit('play_card', cardId, targetPlayerId);
  }

  drawCard() {
    this.emit('draw_card');
  }

  endTurn() {
    this.emit('end_turn');
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
