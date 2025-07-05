import React from 'react';
import type { Player, Card as CardType } from '../types/game';
import { CardType as CardTypeEnum } from '../types/game';
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
    if (onCardClick && isCurrentPlayer && canPlayCards) {
      onCardClick(card.id);
    }
  };

  const isCardPlayable = (card: CardType): boolean => {
    if (!isCurrentPlayer || !canPlayCards) return false;

    // 检查特殊卡牌的可玩性
    const catCardTypes = [
      CardTypeEnum.CAT_TACOCAT, 
      CardTypeEnum.CAT_CATTERMELON, 
      CardTypeEnum.CAT_HAIRY_POTATO, 
      CardTypeEnum.CAT_RAINBOW_RALPHING, 
      CardTypeEnum.CAT_BEARD
    ];
    if (catCardTypes.includes(card.type)) {
      // 猫咪卡需要成对才能打出
      const matchingCards = player.hand.filter(c => c.type === card.type);
      return matchingCards.length >= 2;
    }

    return true;
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
        {isCurrentPlayer
          ? player.hand.map((card) => (
              <Card
                key={card.id}
                card={card}
                isPlayable={isCardPlayable(card)}
                isSelected={selectedCardId === card.id}
                onClick={() => handleCardClick(card)}
                size="medium"
              />
            ))
          : Array.from({ length: player.hand.length }).map((_, idx) => (
              <div
                key={idx}
                className="card card--back"
                style={{ width: 60, height: 90, margin: '0 4px', display: 'inline-block', background: '#444', borderRadius: 8 }}
                title="未知手牌"
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
