import React from 'react';
import type { Player, Card as CardType } from '../types/game';
import Card from './Card';
import './PlayerHand.css';

interface PlayerHandProps {
  player: Player;
  isCurrentPlayer: boolean;
  selectedCardId?: string;
  onCardClick?: (cardId: string) => void;
  canPlayCards?: boolean;
}

const PlayerHand: React.FC<PlayerHandProps> = ({
  player,
  isCurrentPlayer,
  selectedCardId,
  onCardClick,
  canPlayCards = false
}) => {
  const handleCardClick = (card: CardType) => {
    if (onCardClick && canPlayCards && isCurrentPlayer) {
      onCardClick(card.id);
    }
  };

  const playerHandClasses = [
    'player-hand',
    isCurrentPlayer ? 'player-hand--current' : '',
    !player.isAlive ? 'player-hand--dead' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={playerHandClasses}>
      <div className="player-hand__header">
        <h3 className="player-hand__name">
          {player.name}
          {isCurrentPlayer && <span className="player-hand__current-indicator">👑</span>}
          {!player.isAlive && <span className="player-hand__dead-indicator">💀</span>}
        </h3>
        <div className="player-hand__card-count">
          {player.hand.length} 张牌
        </div>
      </div>
      
      <div className="player-hand__cards">
        {player.hand.map((card) => (
          <Card
            key={card.id}
            card={card}
            isPlayable={canPlayCards && isCurrentPlayer}
            isSelected={selectedCardId === card.id}
            onClick={() => handleCardClick(card)}
            size="medium"
          />
        ))}
        
        {player.hand.length === 0 && player.isAlive && (
          <div className="player-hand__empty">
            没有手牌
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerHand;
