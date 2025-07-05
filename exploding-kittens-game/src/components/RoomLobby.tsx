import React, { useState, useEffect } from 'react';
import { socketService } from '../services/socket';
import type { GameState, Player } from '../types/game';
import './RoomLobby.css';

interface Room {
  id: string;
  name: string;
  players: Player[];
  maxPlayers: number;
  isGameStarted: boolean;
}

interface RoomLobbyProps {
  room: Room;
  currentPlayerId: string;
  onGameStarted: (gameState: GameState) => void;
  onLeaveRoom: () => void;
}

const RoomLobby: React.FC<RoomLobbyProps> = ({ 
  room: initialRoom, 
  currentPlayerId, 
  onGameStarted, 
  onLeaveRoom 
}) => {
  const [room, setRoom] = useState<Room>(initialRoom);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRoomOwner = room.players[0]?.id === currentPlayerId;
  const allPlayersReady = room.players.length >= 2 && room.players.every(p => (p as any).isReady);

  useEffect(() => {
    // 监听玩家加入
    socketService.on('player_joined', (player: Player) => {
      setRoom(prev => {
        // 检查玩家是否已经存在，避免重复添加
        if (prev.players.some(p => p.id === player.id)) {
          return prev;
        }
        return {
          ...prev,
          players: [...prev.players, player]
        };
      });
    });

    // 监听玩家离开
    socketService.on('player_left', (playerId: string) => {
      setRoom(prev => ({
        ...prev,
        players: prev.players.filter(p => p.id !== playerId)
      }));
    });

    // 监听玩家准备状态
    socketService.on('player_ready', (playerId: string, ready: boolean) => {
      setRoom(prev => ({
        ...prev,
        players: prev.players.map(p => 
          p.id === playerId ? { ...p, isReady: ready } : p
        )
      }));
    });

    // 监听游戏开始
    socketService.on('game_started', (gameState: GameState) => {
      onGameStarted(gameState);
    });

    // 监听错误
    socketService.on('error', (message: string) => {
      setError(message);
    });

    return () => {
      socketService.off('player_joined', () => {});
      socketService.off('player_left', () => {});
      socketService.off('player_ready', () => {});
      socketService.off('game_started', onGameStarted);
      socketService.off('error', setError);
    };
  }, [currentPlayerId, onGameStarted]);

  const handleReadyToggle = () => {
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    socketService.setPlayerReady(newReadyState);
  };

  const handleStartGame = () => {
    if (isRoomOwner && allPlayersReady) {
      socketService.startGame();
    }
  };

  const handleLeaveRoom = () => {
    socketService.leaveRoom();
    onLeaveRoom();
  };

  return (
    <div className="room-lobby">
      <div className="room-lobby__header">
        <h1>房间: {room.name}</h1>
        <button className="leave-btn" onClick={handleLeaveRoom}>
          离开房间
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="room-lobby__content">
        <div className="players-section">
          <h2>玩家列表 ({room.players.length}/{room.maxPlayers})</h2>
          
          <div className="players-grid">
            {room.players.map((player, index) => (
              <div 
                key={player.id} 
                className={`player-card ${player.id === currentPlayerId ? 'current-player' : ''}`}
              >
                <div className="player-info">
                  <div className="player-name">
                    {player.name}
                    {index === 0 && <span className="owner-badge">👑</span>}
                    {player.id === currentPlayerId && <span className="you-badge">(你)</span>}
                  </div>
                  
                  <div className="player-status">
                    {(player as any).isReady ? (
                      <span className="ready-status">✅ 已准备</span>
                    ) : (
                      <span className="not-ready-status">⏳ 未准备</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* 显示空位 */}
            {Array.from({ length: room.maxPlayers - room.players.length }).map((_, index) => (
              <div key={`empty-${index}`} className="player-card empty-slot">
                <div className="empty-slot-content">
                  <span>等待玩家加入...</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="game-controls">
          <div className="ready-section">
            <button
              className={`ready-btn ${isReady ? 'ready' : 'not-ready'}`}
              onClick={handleReadyToggle}
            >
              {isReady ? '✅ 已准备' : '⏳ 点击准备'}
            </button>
          </div>

          {isRoomOwner && (
            <div className="start-section">
              <button
                className="start-game-btn"
                onClick={handleStartGame}
                disabled={!allPlayersReady}
              >
                {allPlayersReady ? '🚀 开始游戏' : '等待所有玩家准备'}
              </button>
              
              {!allPlayersReady && (
                <p className="start-hint">
                  需要至少2名玩家且所有玩家都准备就绪才能开始游戏
                </p>
              )}
            </div>
          )}

          {!isRoomOwner && (
            <div className="waiting-section">
              <p>等待房主开始游戏...</p>
              {!allPlayersReady && (
                <p className="start-hint">
                  还有玩家未准备就绪
                </p>
              )}
            </div>
          )}
        </div>

        <div className="game-rules">
          <h3>游戏规则</h3>
          <ul>
            <li>🎯 目标：成为最后存活的玩家</li>
            <li>💥 避免抽到爆炸小猫卡，否则你就出局了</li>
            <li>🛡️ 使用拆弹卡来拆除爆炸小猫</li>
            <li>🎴 每回合先打牌（可选），然后必须抽牌结束回合</li>
            <li>⚔️ 使用攻击卡让下一个玩家连续行动2回合</li>
            <li>🔮 使用预知未来卡查看顶部3张牌</li>
            <li>🐱 使用成对的猫咪卡偷取其他玩家的牌</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RoomLobby;
