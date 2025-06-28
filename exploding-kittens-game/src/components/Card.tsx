import React from 'react';
import type { Card as CardType } from '../types/game';
import { CardType as CardTypeEnum } from '../types/game';
import './Card.css';

interface CardProps {
  card: CardType;
  isPlayable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const Card: React.FC<CardProps> = ({ 
  card, 
  isPlayable = false, 
  isSelected = false, 
  onClick, 
  size = 'medium' 
}) => {
  const getCardEmoji = (cardType: CardTypeEnum): string => {
    switch (cardType) {
      case CardTypeEnum.EXPLODING_KITTEN:
        return '💥🐱';
      case CardTypeEnum.DEFUSE:
        return '🛡️';
      case CardTypeEnum.NOPE:
        return '🚫';
      case CardTypeEnum.ATTACK:
        return '⚔️';
      case CardTypeEnum.SKIP:
        return '⏭️';
      case CardTypeEnum.FAVOR:
        return '🤝';
      case CardTypeEnum.SHUFFLE:
        return '🔀';
      case CardTypeEnum.SEE_THE_FUTURE:
        return '🔮';
      case CardTypeEnum.CAT_TACOCAT:
        return '🌮🐱';
      case CardTypeEnum.CAT_CATTERMELON:
        return '🍉🐱';
      case CardTypeEnum.CAT_HAIRY_POTATO:
        return '🥔🐱';
      case CardTypeEnum.CAT_RAINBOW_RALPHING:
        return '🌈🐱';
      case CardTypeEnum.CAT_BEARD:
        return '🧔🐱';
      default:
        return '🃏';
    }
  };

  const getCardColor = (cardType: CardTypeEnum): string => {
    switch (cardType) {
      case CardTypeEnum.EXPLODING_KITTEN:
        return '#ff4444';
      case CardTypeEnum.DEFUSE:
        return '#44ff44';
      case CardTypeEnum.NOPE:
        return '#ff8844';
      case CardTypeEnum.ATTACK:
        return '#ff4488';
      case CardTypeEnum.SKIP:
        return '#4488ff';
      case CardTypeEnum.FAVOR:
        return '#8844ff';
      case CardTypeEnum.SHUFFLE:
        return '#44ffff';
      case CardTypeEnum.SEE_THE_FUTURE:
        return '#ffff44';
      default:
        return '#888888';
    }
  };

  const cardClasses = [
    'card',
    `card--${size}`,
    isPlayable ? 'card--playable' : '',
    isSelected ? 'card--selected' : '',
    onClick ? 'card--clickable' : ''
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={cardClasses}
      onClick={onClick}
      style={{ borderColor: getCardColor(card.type) }}
    >
      <div className="card__header">
        <div className="card__emoji">{getCardEmoji(card.type)}</div>
        <div className="card__name">{card.name}</div>
      </div>
      <div className="card__description">
        {card.description}
      </div>
    </div>
  );
};

export default Card;
