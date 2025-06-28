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

  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
  const isCurrentTurn = gameState.players[gameState.currentPlayerIndex]?.id === currentPlayerId;

  useEffect(() => {
    // 监听游戏状态更新
    socketService.on('game_state_update', (newGameState: GameState) => {
      setGameState(newGameState);
      setSelectedCardId(null);
      setShowTargetSelection(false);
      setPendingCardId(null);
    });

    // 监听卡牌打出
    socketService.on('card_played', (playerId: string, cardId: string, targetPlayerId?: string) => {
      console.log(`玩家 ${playerId} 打出了卡牌 ${cardId}`, targetPlayerId ? `目标: ${targetPlayerId}` : '');
    });

    // 监听抽牌
    socketService.on('card_drawn', (playerId: string) => {
      console.log(`玩家 ${playerId} 抽了一张牌`);
    });

    // 监听回合结束
    socketService.on('turn_ended', (playerId: string) => {
      console.log(`玩家 ${playerId} 结束了回合`);
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
    socketService.drawCard();
  }, [isCurrentTurn]);

  const handleEndTurn = useCallback(() => {
    if (!isCurrentTurn) return;
    socketService.endTurn();
  }, [isCurrentTurn]);

  const handleCardClick = useCallback((cardId: string) => {
    if (!isCurrentTurn) return;
    
    const card = currentPlayer?.hand.find(c => c.id === cardId);
    if (!card) return;

    // 检查是否需要选择目标
    const needsTarget = card.type === CardType.FAVOR || 
                       [CardType.CAT_TACOCAT, CardType.CAT_CATTERMELON, CardType.CAT_HAIRY_POTATO, 
                        CardType.CAT_RAINBOW_RALPHING, CardType.CAT_BEARD].includes(card.type as any);

    if (needsTarget) {
      // 检查是否有其他活着的玩家
      const otherPlayers = gameState.players.filter(p => p.id !== currentPlayerId && p.isAlive);
      if (otherPlayers.length === 0) {
        return; // 没有目标玩家
      }

      // 对于猫咪卡，检查是否有成对的卡牌
      const isCatCard = [CardType.CAT_TACOCAT, CardType.CAT_CATTERMELON, CardType.CAT_HAIRY_POTATO, 
                        CardType.CAT_RAINBOW_RALPHING, CardType.CAT_BEARD].includes(card.type as any);
      
      if (isCatCard) {
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

  const handleCardSelect = useCallback((cardId: string) => {
    setSelectedCardId(selectedCardId === cardId ? null : cardId);
  }, [selectedCardId]);

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

  const canDrawCard = isCurrentTurn && !selectedCardId && gameState.attackTurnsRemaining === 0;
  const canEndTurn = isCurrentTurn && (selectedCardId !== null || gameState.attackTurnsRemaining > 0);

  return (
    <div className="multiplayer-game">
      <GameBoard
        gameState={gameState}
        onDrawCard={handleDrawCard}
        onEndTurn={handleEndTurn}
        canDrawCard={canDrawCard}
        canEndTurn={canEndTurn}
      />
      
      {selectedCardId && (
        <div className="selected-card-actions">
          <button onClick={() => handleCardClick(selectedCardId)}>
            打出选中的卡牌
          </button>
          <button onClick={() => setSelectedCardId(null)}>
            取消选择
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
        {gameState.players.map((player) => (
          <PlayerHand
            key={player.id}
            player={player}
            isCurrentPlayer={player.id === currentPlayerId}
            selectedCardId={selectedCardId || undefined}
            onCardClick={handleCardSelect}
            canPlayCards={player.id === currentPlayerId && isCurrentTurn}
          />
        ))}
      </div>

      {!isCurrentTurn && (
        <div className="waiting-indicator">
          等待 {gameState.players[gameState.currentPlayerIndex]?.name} 行动...
        </div>
      )}
    </div>
  );
};

export default MultiplayerGame;
