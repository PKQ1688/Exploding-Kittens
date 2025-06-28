import { useState, useCallback, useEffect } from 'react';
import type { GameState } from './types/game';
import { GamePhase, CardType } from './types/game';
import { initializeGame, drawCard, playCard, endTurn } from './utils/gameLogic';
import { socketService } from './services/socket';
import GameBoard from './components/GameBoard';
import PlayerHand from './components/PlayerHand';
import RoomList from './components/RoomList';
import RoomLobby from './components/RoomLobby';
import MultiplayerGame from './components/MultiplayerGame';
import './App.css';

// 应用状态常量
const AppState = {
  CONNECTING: 'connecting',
  ROOM_LIST: 'room_list',
  ROOM_LOBBY: 'room_lobby',
  MULTIPLAYER_GAME: 'multiplayer_game',
  LOCAL_SETUP: 'local_setup',
  LOCAL_GAME: 'local_game'
} as const;

type AppState = typeof AppState[keyof typeof AppState];

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.CONNECTING);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [playerNames, setPlayerNames] = useState<string[]>(['玩家1', '玩家2']);
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // 连接到服务器
  useEffect(() => {
    const connectToServer = async () => {
      try {
        await socketService.connect();
        setAppState(AppState.ROOM_LIST);
        setConnectionError(null);
      } catch (error) {
        console.error('连接服务器失败:', error);
        setConnectionError('无法连接到服务器，将使用本地模式');
        setAppState(AppState.LOCAL_SETUP);
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

    // 监听房间加入成功
    socketService.on('room_joined', (room: any) => {
      setCurrentRoom(room);
      // 找到当前玩家ID
      const player = room.players.find((p: any) => p.socketId === socketService.isConnected());
      if (player) {
        setCurrentPlayerId(player.id);
      }
      setAppState(AppState.ROOM_LOBBY);
    });

    // 监听游戏开始
    socketService.on('game_started', (gameState: GameState) => {
      setGameState(gameState);
      setAppState(AppState.MULTIPLAYER_GAME);
    });

    return () => {
      socketService.off('room_joined', () => {});
      socketService.off('game_started', () => {});
    };
  }, [appState]);

  const startLocalGame = useCallback(() => {
    try {
      const newGameState = initializeGame(playerNames);
      setGameState(newGameState);
      setAppState(AppState.LOCAL_GAME);
      setSelectedCardId(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : '游戏初始化失败');
    }
  }, [playerNames]);

  const handleDrawCard = useCallback(() => {
    if (!gameState) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const newGameState = drawCard(gameState, currentPlayer.id);
    setGameState(newGameState);

    // 如果抽到爆炸小猫且没有拆弹卡，或者正常抽牌，结束回合
    if (newGameState.phase === GamePhase.PLAYING) {
      const updatedGameState = endTurn(newGameState);
      setGameState(updatedGameState);
    }
  }, [gameState]);

  const handlePlayCard = useCallback((_cardId: string) => {
    if (!gameState || !selectedCardId) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const card = currentPlayer.hand.find(c => c.id === selectedCardId);

    if (!card) return;

    // 对于需要目标的卡牌，这里简化处理
    let targetPlayerId: string | undefined;
    const catCardTypes = [CardType.CAT_TACOCAT, CardType.CAT_CATTERMELON, CardType.CAT_HAIRY_POTATO,
                         CardType.CAT_RAINBOW_RALPHING, CardType.CAT_BEARD];
    if (card.type === CardType.FAVOR || catCardTypes.includes(card.type as any)) {
      // 选择第一个其他活着的玩家作为目标
      const otherPlayers = gameState.players.filter(p => p.id !== currentPlayer.id && p.isAlive);
      if (otherPlayers.length > 0) {
        targetPlayerId = otherPlayers[0].id;
      }
    }

    const newGameState = playCard(gameState, currentPlayer.id, selectedCardId, targetPlayerId);
    setGameState(newGameState);
    setSelectedCardId(null);
  }, [gameState, selectedCardId]);

  const handleEndTurn = useCallback(() => {
    if (!gameState) return;

    const newGameState = endTurn(gameState);
    setGameState(newGameState);
    setSelectedCardId(null);
  }, [gameState]);

  const handleCardClick = useCallback((cardId: string) => {
    setSelectedCardId(selectedCardId === cardId ? null : cardId);
  }, [selectedCardId]);

  const addPlayer = () => {
    if (playerNames.length < 5) {
      setPlayerNames([...playerNames, `玩家${playerNames.length + 1}`]);
    }
  };

  const removePlayer = (index: number) => {
    if (playerNames.length > 2) {
      setPlayerNames(playerNames.filter((_, i) => i !== index));
    }
  };

  const updatePlayerName = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

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
  if (appState === AppState.CONNECTING) {
    return (
      <div className="app">
        <div className="connecting-screen">
          <h1>Exploding Kittens</h1>
          <p>正在连接服务器...</p>
          {connectionError && (
            <div className="connection-error">
              <p>{connectionError}</p>
              <button onClick={() => setAppState(AppState.LOCAL_SETUP)}>
                使用本地模式
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (appState === AppState.ROOM_LIST) {
    return (
      <div className="app">
        <RoomList onRoomJoined={handleRoomJoined} />
        <div className="local-mode-option">
          <button onClick={() => setAppState(AppState.LOCAL_SETUP)}>
            本地游戏模式
          </button>
        </div>
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

  if (appState === AppState.LOCAL_SETUP) {
    return (
      <div className="app">
        <div className="setup-screen">
          <h1>Exploding Kittens - 本地模式</h1>
          <div className="setup-form">
            <h2>设置游戏</h2>
            <div className="players-setup">
              <h3>玩家 (2-5人)</h3>
              {playerNames.map((name, index) => (
                <div key={index} className="player-input">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => updatePlayerName(index, e.target.value)}
                    placeholder={`玩家 ${index + 1}`}
                  />
                  {playerNames.length > 2 && (
                    <button onClick={() => removePlayer(index)}>删除</button>
                  )}
                </div>
              ))}
              {playerNames.length < 5 && (
                <button onClick={addPlayer}>添加玩家</button>
              )}
            </div>
            <button className="start-button" onClick={startLocalGame}>
              开始本地游戏
            </button>
            <button className="back-button" onClick={handleBackToRoomList}>
              返回多人模式
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (appState === AppState.LOCAL_GAME) {
    if (!gameState) {
      return <div className="app">加载中...</div>;
    }

    if (gameState.phase === GamePhase.GAME_OVER) {
      return (
        <div className="app">
          <div className="game-over-screen">
            <h1>游戏结束！</h1>
            <h2>🎉 {gameState.winner?.name} 获胜！ 🎉</h2>
            <button onClick={() => setAppState(AppState.LOCAL_SETUP)}>重新开始</button>
            <button onClick={handleBackToRoomList}>返回多人模式</button>
          </div>
        </div>
      );
    }

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const canDrawCard = !selectedCardId && gameState.attackTurnsRemaining === 0;
    const canEndTurn = selectedCardId !== null || gameState.attackTurnsRemaining > 0;

    return (
      <div className="app">
        <GameBoard
          gameState={gameState}
          onDrawCard={handleDrawCard}
          onEndTurn={handleEndTurn}
          canDrawCard={canDrawCard}
          canEndTurn={canEndTurn}
        />

        {selectedCardId && (
          <div className="selected-card-actions">
            <button onClick={() => handlePlayCard(selectedCardId)}>
              打出选中的卡牌
            </button>
            <button onClick={() => setSelectedCardId(null)}>
              取消选择
            </button>
          </div>
        )}

        <div className="players-container">
          {gameState.players.map((player) => (
            <PlayerHand
              key={player.id}
              player={player}
              isCurrentPlayer={player.id === currentPlayer.id}
              selectedCardId={selectedCardId || undefined}
              onCardClick={handleCardClick}
              canPlayCards={player.id === currentPlayer.id}
            />
          ))}
        </div>
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
