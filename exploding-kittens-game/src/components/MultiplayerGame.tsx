import React, { useState, useEffect, useCallback } from 'react';
import { socketService } from '../services/socket';
import type { GameState } from '../types/game';
import { GamePhase, CardType } from '../types/game';
import GameBoard from './GameBoard';
import PlayerHand from './PlayerHand';
import './MultiplayerGame.css';

interface MultiplayerGameProps {
  initialGameState: GameState;
  currentPlayerId: string;
  onGameEnd: () => void;
}

const MultiplayerGame: React.FC<MultiplayerGameProps> = ({
  initialGameState,
  currentPlayerId,
  onGameEnd
}) => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showTargetSelection, setShowTargetSelection] = useState(false);
  const [pendingCardId, setPendingCardId] = useState<string | null>(null);
  const [hasDrawnThisTurn, setHasDrawnThisTurn] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    playerId: string;
    cardId: string;
    targetPlayerId?: string;
    timeRemaining: number;
  } | null>(null);

  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
  const isCurrentTurn = gameState.players[gameState.currentPlayerIndex]?.id === currentPlayerId;

  useEffect(() => {
    // 监听游戏状态更新
    socketService.on('game_state_update', (newGameState: GameState) => {
      const currentPlayerChanged = gameState.currentPlayerIndex !== newGameState.currentPlayerIndex;
      
      // 检测洗牌事件 - 如果最后动作包含"洗牌"
      if (newGameState.lastAction.includes('洗牌了')) {
        setIsShuffling(true);
        // 2秒后停止洗牌动画
        setTimeout(() => {
          setIsShuffling(false);
        }, 2000);
      }
      
      setGameState(newGameState);
      setSelectedCardId(null);
      setShowTargetSelection(false);
      setPendingCardId(null);
      
      // 如果当前玩家变了，重置抽牌状态
      if (currentPlayerChanged) {
        setHasDrawnThisTurn(false);
      }
    });

    // 监听卡牌打出
    socketService.on('card_played', (playerId: string, cardId: string, targetPlayerId?: string) => {
      console.log(`玩家 ${playerId} 打出了卡牌 ${cardId}`, targetPlayerId ? `目标: ${targetPlayerId}` : '');
    });

    // 监听抽牌
    socketService.on('card_drawn', (playerId: string) => {
      console.log(`玩家 ${playerId} 抽了一张牌`);
      // 如果是当前玩家抽牌，设置抽牌状态
      if (playerId === currentPlayerId) {
        setHasDrawnThisTurn(true);
      }
    });

    // 监听回合结束
    socketService.on('turn_ended', (playerId: string) => {
      console.log(`玩家 ${playerId} 结束了回合`);
    });

    // 监听行动待确认
    socketService.on('action_pending', (action: { playerId: string; cardId: string; targetPlayerId?: string; timeRemaining: number }) => {
      setPendingAction(action);
      // 开始倒计时
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, action.timeRemaining - elapsed);
        
        if (remaining <= 0) {
          clearInterval(interval);
          setPendingAction(null);
        } else {
          setPendingAction(prev => prev ? { ...prev, timeRemaining: remaining } : null);
        }
      }, 100);
    });

    // 监听行动被否定
    socketService.on('action_noped', (nopedBy: string) => {
      setPendingAction(null);
      console.log(`行动被 ${nopedBy} 否定了`);
    });

    // 监听行动确认
    socketService.on('action_resolved', () => {
      setPendingAction(null);
      console.log('行动已确认执行');
    });

    return () => {
      socketService.off('game_state_update', () => {});
      socketService.off('card_played', () => {});
      socketService.off('card_drawn', () => {});
      socketService.off('turn_ended', () => {});
    };
  }, []);

  const handleDrawCard = useCallback(() => {
    if (!isCurrentTurn) return;
    setGameState({ ...gameState, futureCards: undefined });
    socketService.drawCard();
  }, [isCurrentTurn]);

  const handleEndTurn = useCallback(() => {
    if (!isCurrentTurn) return;
    setGameState({ ...gameState, futureCards: undefined });
    socketService.endTurn();
  }, [isCurrentTurn]);

  const handleCardClick = useCallback((cardId: string) => {
    if (!isCurrentTurn) return;

    const card = currentPlayer?.hand.find(c => c.id === cardId);
    if (!card) return;

    // 检查是否需要选择目标
    const catCardTypes = [
      CardType.CAT_TACOCAT, 
      CardType.CAT_CATTERMELON, 
      CardType.CAT_HAIRY_POTATO,
      CardType.CAT_RAINBOW_RALPHING, 
      CardType.CAT_BEARD
    ];
    const needsTarget = card.type === CardType.FAVOR || catCardTypes.includes(card.type as any);

    if (needsTarget) {
      // 检查是否有其他活着的玩家
      const otherPlayers = gameState.players.filter(p => p.id !== currentPlayerId && p.isAlive);
      if (otherPlayers.length === 0) {
        return; // 没有目标玩家
      }

      // 对于猫咪卡，检查是否有成对的卡牌
      if (catCardTypes.includes(card.type as any)) {
        const matchingCards = currentPlayer?.hand.filter(c => c.type === card.type) || [];
        if (matchingCards.length < 2) {
          return; // 没有成对的猫咪卡
        }
      }

      setPendingCardId(cardId);
      setShowTargetSelection(true);
    } else {
      // 直接打出卡牌
      socketService.playCard(cardId);
    }

    setSelectedCardId(null);
  }, [isCurrentTurn, currentPlayer, currentPlayerId, gameState.players]);

  const handleTargetSelect = (targetPlayerId: string) => {
    if (pendingCardId) {
      socketService.playCard(pendingCardId, targetPlayerId);
    }
    setShowTargetSelection(false);
    setPendingCardId(null);
  };

  const handleExitGame = useCallback(() => {
    // 离开房间
    socketService.leaveRoom();
    onGameEnd();
  }, [onGameEnd]);

  const handleCardSelect = useCallback((cardId: string) => {
    // 直接调用handleCardClick来处理卡牌点击
    handleCardClick(cardId);
  }, [handleCardClick]);

  const handlePlayNope = useCallback(() => {
    // 查找玩家手中的否定卡
    const nopeCard = currentPlayer?.hand.find(card => card.type === CardType.NOPE);
    if (nopeCard) {
      socketService.playNope(nopeCard.id);
    }
  }, [currentPlayer]);

  if (gameState.phase === GamePhase.GAME_OVER) {
    return (
      <div className="multiplayer-game">
        <div className="game-over-screen">
          <h1>游戏结束！</h1>
          <h2>🎉 {gameState.winner?.name} 获胜！ 🎉</h2>
          <button onClick={onGameEnd}>返回房间列表</button>
        </div>
      </div>
    );
  }

  const canDrawCard = isCurrentTurn && !selectedCardId && !hasDrawnThisTurn;
  const canEndTurn = false; // 抽牌后自动结束回合，不需要手动结束

  return (
    <div className="multiplayer-game">
      <GameBoard
        gameState={gameState}
        onDrawCard={handleDrawCard}
        onEndTurn={handleEndTurn}
        canDrawCard={canDrawCard}
        canEndTurn={canEndTurn}
        onExitGame={handleExitGame}
        onCloseFutureCards={() => setGameState({ ...gameState, futureCards: undefined })}
        isShuffling={isShuffling}
      />
      
      {pendingCardId && showTargetSelection && (
        <div className="target-selection">
          <h3>选择目标玩家</h3>
          <div className="target-players">
            {gameState.players
              .filter(p => p.id !== currentPlayerId && p.isAlive)
              .map(player => (
                <button
                  key={player.id}
                  onClick={() => handleTargetSelect(player.id)}
                  className="target-player-button"
                >
                  {player.name} ({player.hand.length} 张牌)
                </button>
              ))}
          </div>
          <button onClick={() => {
            setShowTargetSelection(false);
            setPendingCardId(null);
          }}>
            取消
          </button>
        </div>
      )}

      {showTargetSelection && (
        <div className="target-selection-modal">
          <div className="target-selection-content">
            <h3>选择目标玩家</h3>
            <div className="target-players">
              {gameState.players
                .filter(p => p.id !== currentPlayerId && p.isAlive)
                .map(player => (
                  <button
                    key={player.id}
                    className="target-player-btn"
                    onClick={() => handleTargetSelect(player.id)}
                  >
                    {player.name} ({player.hand.length} 张牌)
                  </button>
                ))}
            </div>
            <button 
              className="cancel-target-btn"
              onClick={() => {
                setShowTargetSelection(false);
                setPendingCardId(null);
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}
      
      <div className="players-container">
        {gameState.players
          .filter(player => player.id === currentPlayerId)
          .map(player => (
            <PlayerHand
              key={player.id}
              player={player}
              isCurrentPlayer={true}
              selectedCardId={selectedCardId || undefined}
              onCardClick={handleCardSelect}
              canPlayCards={isCurrentTurn}
            />
          ))}
      </div>

      {!isCurrentTurn && (
        <div className="waiting-indicator">
          等待 {gameState.players[gameState.currentPlayerIndex]?.name} 行动...
        </div>
      )}

      {/* 否定卡提示 */}
      {pendingAction && pendingAction.playerId !== currentPlayerId && (
        <div className="nope-modal">
          <div className="nope-content">
            <h3>🚫 有玩家即将使用卡牌！</h3>
            <p>
              {gameState.players.find(p => p.id === pendingAction.playerId)?.name} 即将使用卡牌
            </p>
            <div className="nope-timer">
              {Math.ceil(pendingAction.timeRemaining / 1000)} 秒后自动执行
            </div>
            {currentPlayer?.hand.some(card => card.type === CardType.NOPE) && (
              <button 
                className="nope-btn"
                onClick={handlePlayNope}
              >
                🚫 使用否定卡阻止
              </button>
            )}
            <div className="nope-hint">
              {currentPlayer?.hand.some(card => card.type === CardType.NOPE) 
                ? '点击按钮使用否定卡阻止此行动'
                : '你没有否定卡'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiplayerGame;
