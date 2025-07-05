import React from 'react';
import type { GameState } from '../types/game';
import Card from './Card';
import './GameBoard.css';
import { CardType } from '../types/game';

interface GameBoardProps {
  gameState: GameState;
  onDrawCard: () => void;
  onEndTurn: () => void;
  canDrawCard: boolean;
  canEndTurn: boolean;
  onExitGame?: () => void;
  onCloseFutureCards?: () => void;
  isShuffling?: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onDrawCard,
  onEndTurn,
  canDrawCard,
  canEndTurn,
  onExitGame,
  onCloseFutureCards,
  isShuffling = false
}) => {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const topDiscardCard = gameState.discardPile[gameState.discardPile.length - 1];

  return (
    <div className="game-board">
      <div className="game-board__header">
        <div className="game-board__header-top">
          <h2 className="game-board__title">Exploding Kittens</h2>
          {onExitGame && (
            <button className="exit-game-button" onClick={onExitGame}>
              ❌ 退出游戏
            </button>
          )}
        </div>
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
              className={`card-back ${canDrawCard ? 'card-back--clickable' : ''} ${isShuffling ? 'card-back--shuffling' : ''}`}
              onClick={canDrawCard ? onDrawCard : undefined}
            >
              <div className="card-back__content">
                <div className="card-back__emoji">{isShuffling ? '🌪️' : '🃏'}</div>
                <div className="card-back__text">{isShuffling ? '洗牌中...' : '抽牌'}</div>
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
          
          {/* 移除结束回合按钮，抽牌后自动结束回合 */}
        </div>

        {gameState.futureCards && gameState.futureCards.length > 0 && (
          <div className="future-cards-display">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>🔮 未来3张牌（从上到下）</h3>
              {onCloseFutureCards && (
                <button
                  className="future-cards-close-btn"
                  style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={onCloseFutureCards}
                  aria-label="关闭"
                >❌</button>
              )}
            </div>
            <div className="future-cards">
              {gameState.futureCards.map((card, index) => (
                <div key={`future-${index}`} className="future-card">
                  <div className="future-card-order">第{index + 1}张</div>
                  <div className="future-card-name">{card.name}</div>
                  <div className="future-card-emoji">
                    {card.type === CardType.EXPLODING_KITTEN ? '💥🐱' :
                     card.type === CardType.DEFUSE ? '🛡️' :
                     card.type === CardType.ATTACK ? '⚔️' :
                     card.type === CardType.SKIP ? '⏭️' :
                     card.type === CardType.SHUFFLE ? '🔀' :
                     card.type === CardType.SEE_THE_FUTURE ? '🔮' :
                     card.type === CardType.FAVOR ? '🤝' : '🐱'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="game-board__info">
        <div className="game-board__last-action">
          <strong>最后动作:</strong> {gameState.lastAction}
        </div>

        <div className="game-board__players-alive">
          存活玩家: {gameState.players.filter(p => p.isAlive).length} / {gameState.players.length}
        </div>

        {gameState.attackTurnsRemaining > 0 && (
          <div className="game-board__attack-status">
            <strong>⚔️ 攻击状态:</strong> {currentPlayer.name} 需要连续进行 {gameState.attackTurnsRemaining} 个回合
          </div>
        )}

        <div className="game-board__turn-info">
          <strong>当前回合:</strong> {currentPlayer.name}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
