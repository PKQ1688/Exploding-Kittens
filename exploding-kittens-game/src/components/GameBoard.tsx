import React from 'react';
import type { GameState } from '../types/game';
import Card from './Card';
import './GameBoard.css';

interface GameBoardProps {
  gameState: GameState;
  onDrawCard: () => void;
  onEndTurn: () => void;
  canDrawCard: boolean;
  canEndTurn: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onDrawCard,
  onEndTurn,
  canDrawCard,
  canEndTurn
}) => {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const topDiscardCard = gameState.discardPile[gameState.discardPile.length - 1];

  return (
    <div className="game-board">
      <div className="game-board__header">
        <h2 className="game-board__title">Exploding Kittens</h2>
        <div className="game-board__status">
          <div className="game-board__turn-info">
            回合 {gameState.turnCount} - {currentPlayer?.name} 的回合
          </div>
          {gameState.attackTurnsRemaining > 0 && (
            <div className="game-board__attack-warning">
              ⚔️ 攻击回合剩余: {gameState.attackTurnsRemaining}
            </div>
          )}
        </div>
      </div>

      <div className="game-board__center">
        <div className="game-board__piles">
          {/* 抽牌堆 */}
          <div className="game-board__draw-pile">
            <div className="pile-header">
              <h3>抽牌堆</h3>
              <div className="pile-count">{gameState.drawPile.length} 张</div>
            </div>
            <div 
              className={`card-back ${canDrawCard ? 'card-back--clickable' : ''}`}
              onClick={canDrawCard ? onDrawCard : undefined}
            >
              <div className="card-back__content">
                <div className="card-back__emoji">🃏</div>
                <div className="card-back__text">抽牌</div>
              </div>
            </div>
          </div>

          {/* 弃牌堆 */}
          <div className="game-board__discard-pile">
            <div className="pile-header">
              <h3>弃牌堆</h3>
              <div className="pile-count">{gameState.discardPile.length} 张</div>
            </div>
            <div className="discard-pile-container">
              {topDiscardCard ? (
                <Card card={topDiscardCard} size="medium" />
              ) : (
                <div className="empty-pile">
                  <div className="empty-pile__text">空</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="game-board__actions">
          <button
            className={`action-button ${canDrawCard ? 'action-button--primary' : 'action-button--disabled'}`}
            onClick={onDrawCard}
            disabled={!canDrawCard}
          >
            🎴 抽牌
          </button>
          
          <button
            className={`action-button ${canEndTurn ? 'action-button--secondary' : 'action-button--disabled'}`}
            onClick={onEndTurn}
            disabled={!canEndTurn}
          >
            ⏭️ 结束回合
          </button>
        </div>
      </div>

      <div className="game-board__info">
        <div className="game-board__last-action">
          <strong>最后动作:</strong> {gameState.lastAction}
        </div>
        
        <div className="game-board__players-alive">
          存活玩家: {gameState.players.filter(p => p.isAlive).length} / {gameState.players.length}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
