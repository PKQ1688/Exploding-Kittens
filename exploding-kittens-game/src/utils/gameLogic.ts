import type { GameState, Player } from '../types/game';
import { CardType, GamePhase } from '../types/game';
import { createDeck, shuffleDeck, isCatCard } from '../data/cards';

// 初始化游戏
export function initializeGame(playerNames: string[]): GameState {
  if (playerNames.length < 2 || playerNames.length > 5) {
    throw new Error('游戏需要2-5名玩家');
  }

  // 创建完整牌组
  const fullDeck = createDeck();
  
  // 分离爆炸小猫卡和拆弹卡
  const explodingKittens = fullDeck.filter(card => card.type === CardType.EXPLODING_KITTEN);
  const defuseCards = fullDeck.filter(card => card.type === CardType.DEFUSE);
  const otherCards = fullDeck.filter(card => 
    card.type !== CardType.EXPLODING_KITTEN && card.type !== CardType.DEFUSE
  );

  // 洗牌其他卡牌
  const shuffledOtherCards = shuffleDeck(otherCards);

  // 创建玩家
  const players: Player[] = playerNames.map((name, index) => ({
    id: `player_${index}`,
    name,
    hand: [],
    isAlive: true,
    isCurrentPlayer: index === 0
  }));

  // 给每个玩家发4张牌
  players.forEach(player => {
    for (let i = 0; i < 4; i++) {
      const card = shuffledOtherCards.pop();
      if (card) {
        player.hand.push(card);
      }
    }
  });

  // 给每个玩家一张拆弹卡
  players.forEach((player, index) => {
    if (defuseCards[index]) {
      player.hand.push(defuseCards[index]);
    }
  });

  // 将剩余的拆弹卡放回牌堆
  const remainingDefuseCards = defuseCards.slice(players.length);
  shuffledOtherCards.push(...remainingDefuseCards);

  // 添加比玩家数量少1张的爆炸小猫卡
  const explodingKittensToAdd = explodingKittens.slice(0, players.length - 1);
  shuffledOtherCards.push(...explodingKittensToAdd);

  // 最终洗牌
  const finalDeck = shuffleDeck(shuffledOtherCards);

  return {
    phase: GamePhase.PLAYING,
    players,
    currentPlayerIndex: 0,
    drawPile: finalDeck,
    discardPile: [],
    winner: null,
    turnCount: 1,
    attackTurnsRemaining: 0,
    lastAction: '游戏开始！'
  };
}

// 抽牌
export function drawCard(gameState: GameState, playerId: string): GameState {
  const newState = { ...gameState };
  const player = newState.players.find(p => p.id === playerId);
  
  if (!player || !player.isAlive || newState.drawPile.length === 0) {
    return newState;
  }

  const drawnCard = newState.drawPile.pop()!;
  
  if (drawnCard.type === CardType.EXPLODING_KITTEN) {
    // 检查玩家是否有拆弹卡
    const defuseCardIndex = player.hand.findIndex(card => card.type === CardType.DEFUSE);
    
    if (defuseCardIndex !== -1) {
      // 使用拆弹卡
      const defuseCard = player.hand.splice(defuseCardIndex, 1)[0];
      newState.discardPile.push(defuseCard);
      newState.lastAction = `${player.name} 使用拆弹卡拆除了爆炸小猫！`;
      
      // 玩家需要将爆炸小猫放回牌堆的任意位置
      // 这里暂时放回顶部，实际游戏中应该让玩家选择位置
      newState.drawPile.push(drawnCard);
      newState.drawPile = shuffleDeck(newState.drawPile);
    } else {
      // 玩家爆炸
      player.isAlive = false;
      player.hand = [];
      newState.discardPile.push(drawnCard);
      newState.lastAction = `${player.name} 爆炸了！`;
      
      // 检查游戏是否结束
      const alivePlayers = newState.players.filter(p => p.isAlive);
      if (alivePlayers.length === 1) {
        newState.phase = GamePhase.GAME_OVER;
        newState.winner = alivePlayers[0];
      }
    }
  } else {
    // 正常抽牌
    player.hand.push(drawnCard);
    newState.lastAction = `${player.name} 抽了一张牌`;
  }

  return newState;
}

// 打出卡牌
export function playCard(gameState: GameState, playerId: string, cardId: string, targetPlayerId?: string): GameState {
  const newState = { ...gameState };
  const player = newState.players.find(p => p.id === playerId);
  
  if (!player || !player.isAlive) {
    return newState;
  }

  const cardIndex = player.hand.findIndex(card => card.id === cardId);
  if (cardIndex === -1) {
    return newState;
  }

  const card = player.hand[cardIndex];
  
  // 执行卡牌效果
  switch (card.type) {
    case CardType.SKIP:
      player.hand.splice(cardIndex, 1);
      newState.discardPile.push(card);
      newState.lastAction = `${player.name} 使用了跳过卡`;
      if (newState.attackTurnsRemaining > 0) {
        newState.attackTurnsRemaining--;
      }
      break;
      
    case CardType.ATTACK:
      player.hand.splice(cardIndex, 1);
      newState.discardPile.push(card);
      newState.attackTurnsRemaining = 2;
      newState.lastAction = `${player.name} 使用了攻击卡`;
      break;
      
    case CardType.SHUFFLE:
      player.hand.splice(cardIndex, 1);
      newState.discardPile.push(card);
      newState.drawPile = shuffleDeck(newState.drawPile);
      newState.lastAction = `${player.name} 洗牌了`;
      break;
      
    case CardType.SEE_THE_FUTURE:
      player.hand.splice(cardIndex, 1);
      newState.discardPile.push(card);
      newState.lastAction = `${player.name} 查看了未来`;
      // 实际实现中需要显示顶部3张牌给玩家
      break;
      
    case CardType.FAVOR:
      if (targetPlayerId) {
        const targetPlayer = newState.players.find(p => p.id === targetPlayerId);
        if (targetPlayer && targetPlayer.isAlive && targetPlayer.hand.length > 0) {
          player.hand.splice(cardIndex, 1);
          newState.discardPile.push(card);
          
          // 随机选择目标玩家的一张牌
          const randomIndex = Math.floor(Math.random() * targetPlayer.hand.length);
          const stolenCard = targetPlayer.hand.splice(randomIndex, 1)[0];
          player.hand.push(stolenCard);
          
          newState.lastAction = `${player.name} 从 ${targetPlayer.name} 那里获得了一张牌`;
        }
      }
      break;
      
    default:
      // 猫咪卡等其他卡牌的处理
      if (isCatCard(card.type)) {
        // 检查是否有相同类型的卡牌来组成对子
        const matchingCards = player.hand.filter(c => c.type === card.type);
        if (matchingCards.length >= 2 && targetPlayerId) {
          const targetPlayer = newState.players.find(p => p.id === targetPlayerId);
          if (targetPlayer && targetPlayer.isAlive && targetPlayer.hand.length > 0) {
            // 移除两张相同的猫咪卡
            player.hand.splice(cardIndex, 1);
            const secondCardIndex = player.hand.findIndex(c => c.type === card.type);
            const secondCard = player.hand.splice(secondCardIndex, 1)[0];
            
            newState.discardPile.push(card, secondCard);
            
            // 偷取目标玩家的随机卡牌
            const randomIndex = Math.floor(Math.random() * targetPlayer.hand.length);
            const stolenCard = targetPlayer.hand.splice(randomIndex, 1)[0];
            player.hand.push(stolenCard);
            
            newState.lastAction = `${player.name} 使用一对 ${card.name} 从 ${targetPlayer.name} 那里偷了一张牌`;
          }
        }
      }
      break;
  }

  return newState;
}

// 结束回合
export function endTurn(gameState: GameState): GameState {
  const newState = { ...gameState };
  
  // 如果有攻击回合剩余，减少计数
  if (newState.attackTurnsRemaining > 0) {
    newState.attackTurnsRemaining--;
    if (newState.attackTurnsRemaining > 0) {
      return newState; // 当前玩家继续
    }
  }
  
  // 切换到下一个活着的玩家
  newState.players[newState.currentPlayerIndex].isCurrentPlayer = false;
  
  do {
    newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length;
  } while (!newState.players[newState.currentPlayerIndex].isAlive);
  
  newState.players[newState.currentPlayerIndex].isCurrentPlayer = true;
  newState.turnCount++;
  
  return newState;
}
