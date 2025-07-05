import { useState, useCallback, useEffect } from 'react';
import type { GameState } from './types/game';
import { socketService } from './services/socket';
import RoomList from './components/RoomList';
import RoomLobby from './components/RoomLobby';
import MultiplayerGame from './components/MultiplayerGame';
import './App.css';

// 应用状态常量
const AppState = {
  CONNECTING: 'connecting',
  ROOM_LIST: 'room_list',
  ROOM_LOBBY: 'room_lobby',
  MULTIPLAYER_GAME: 'multiplayer_game'
} as const;

type AppState = typeof AppState[keyof typeof AppState];

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.CONNECTING);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // 连接到服务器
  useEffect(() => {
    const connectToServer = async () => {
      try {
        // console.log('App: 尝试连接到服务器...');
        await socketService.connect();
        // console.log('App: 连接成功，切换到房间列表');
        setAppState(AppState.ROOM_LIST);
        setConnectionError(null);
      } catch (error) {
        // console.error('App: 连接服务器失败:', error);
        setConnectionError('无法连接到服务器，请检查网络连接或稍后重试');
      }
    };

    connectToServer();

    return () => {
      socketService.disconnect();
    };
  }, []);

  // Socket事件监听
  useEffect(() => {
    if (appState === AppState.CONNECTING) return;

    // 定义事件处理函数
    const handleRoomJoined = (room: any) => {
      setCurrentRoom(room);
      // 找到当前玩家ID
      const socketId = socketService.getSocketId();
      const player = room.players.find((p: any) => p.socketId === socketId);
      if (player) {
        setCurrentPlayerId(player.id);
      }
      setAppState(AppState.ROOM_LOBBY);
    };

    const handleGameStarted = (gameState: GameState) => {
      setGameState(gameState);
      setAppState(AppState.MULTIPLAYER_GAME);
    };

    // 监听房间加入成功
    socketService.on('room_joined', handleRoomJoined);

    // 监听游戏开始
    socketService.on('game_started', handleGameStarted);

    return () => {
      socketService.off('room_joined', handleRoomJoined);
      socketService.off('game_started', handleGameStarted);
    };
  }, [appState]);



  // 处理多人游戏回调
  const handleRoomJoined = useCallback(() => {
    // 房间加入成功，状态已在useEffect中处理
  }, []);

  const handleGameStarted = useCallback((gameState: GameState) => {
    setGameState(gameState);
    setAppState(AppState.MULTIPLAYER_GAME);
  }, []);

  const handleLeaveRoom = useCallback(() => {
    setCurrentRoom(null);
    setCurrentPlayerId('');
    setAppState(AppState.ROOM_LIST);
  }, []);

  const handleGameEnd = useCallback(() => {
    setGameState(null);
    setAppState(AppState.ROOM_LIST);
  }, []);

  const handleBackToRoomList = useCallback(() => {
    setAppState(AppState.ROOM_LIST);
  }, []);

  // 渲染不同的应用状态
  if (appState === AppState.CONNECTING || connectionError) {
    return (
      <div className="app">
        <div className="connecting-screen">
          <h1>Exploding Kittens</h1>
          {connectionError ? (
            <div className="connection-error">
              <p>{connectionError}</p>
              <button onClick={() => window.location.reload()}>
                重新连接
              </button>
            </div>
          ) : (
            <p>正在连接服务器...</p>
          )}
        </div>
      </div>
    );
  }

  if (appState === AppState.ROOM_LIST) {
    return (
      <div className="app">
        <RoomList onRoomJoined={handleRoomJoined} />
      </div>
    );
  }

  if (appState === AppState.ROOM_LOBBY && currentRoom) {
    return (
      <div className="app">
        <RoomLobby
          room={currentRoom}
          currentPlayerId={currentPlayerId}
          onGameStarted={handleGameStarted}
          onLeaveRoom={handleLeaveRoom}
        />
      </div>
    );
  }

  if (appState === AppState.MULTIPLAYER_GAME && gameState) {
    return (
      <div className="app">
        <MultiplayerGame
          initialGameState={gameState}
          currentPlayerId={currentPlayerId}
          onGameEnd={handleGameEnd}
        />
      </div>
    );
  }



  // 默认返回连接界面
  return (
    <div className="app">
      <div className="connecting-screen">
        <h1>Exploding Kittens</h1>
        <p>初始化中...</p>
      </div>
    </div>
  );
}

export default App;
