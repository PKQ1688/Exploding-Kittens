import { GameState, Player, Card, CardType, GamePhase } from '../types';
import { createDeck, shuffleDeck, isCatCard } from './cards';

// 初始化游戏
export function initializeGame(players: Player[]): GameState {
  if (players.length < 2 || players.length > 5) {
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

  // 重置玩家状态
  const gamePlayers: Player[] = players.map((player, index) => ({
    ...player,
    hand: [] as Card[],
    isAlive: true,
    isCurrentPlayer: index === 0,
    isReady: false
  }));

  // 给每个玩家发4张牌
  gamePlayers.forEach(player => {
    for (let i = 0; i < 4; i++) {
      const card = shuffledOtherCards.pop();
      if (card) {
        player.hand.push(card);
      }
    }
  });

  // 给每个玩家一张拆弹卡
  gamePlayers.forEach((player, index) => {
    if (defuseCards[index]) {
      player.hand.push(defuseCards[index]);
    }
  });

  // 将剩余的拆弹卡放回牌堆
  const remainingDefuseCards = defuseCards.slice(gamePlayers.length);
  shuffledOtherCards.push(...remainingDefuseCards);

  // 添加比玩家数量少1张的爆炸小猫卡
  const explodingKittensToAdd = explodingKittens.slice(0, gamePlayers.length - 1);
  shuffledOtherCards.push(...explodingKittensToAdd);

  // 最终洗牌
  const finalDeck = shuffleDeck(shuffledOtherCards);

  return {
    phase: GamePhase.PLAYING,
    players: gamePlayers,
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
  const newState = {
    ...gameState,
    players: gameState.players.map(p => ({
      ...p,
      hand: [...p.hand]
    })),
    drawPile: [...gameState.drawPile],
    discardPile: [...gameState.discardPile]
  };
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
      
      // 使用拆弹卡后也要结束回合
      return endTurn(newState);
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

  // 抽牌后自动结束回合（除非玩家爆炸了）
  if (player.isAlive) {
    return endTurn(newState);
  }

  return newState;
}

// 打出卡牌
export function playCard(gameState: GameState, playerId: string, cardId: string, targetPlayerId?: string): GameState {
  const newState = {
    ...gameState,
    players: gameState.players.map(p => ({
      ...p,
      hand: [...p.hand]
    })),
    drawPile: [...gameState.drawPile],
    discardPile: [...gameState.discardPile]
  };
  const player = newState.players.find(p => p.id === playerId);
  
  if (!player || !player.isAlive) {
    return newState;
  }

  // 只有轮到该玩家时才能出牌（NOPE 例外，可在任何时机打出）
  const isPlayersTurn = newState.players[newState.currentPlayerIndex].id === playerId;
  if (!isPlayersTurn && cardId) {
    // 查找对应卡牌类型
    const tempCard = player.hand.find(c => c.id === cardId);
    if (tempCard && tempCard.type !== CardType.NOPE) {
      return newState;
    }
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
      // 计算当前尚未执行完的额外回合数 (如果为正)
      const outstandingTurns = newState.attackTurnsRemaining > 0 ? newState.attackTurnsRemaining : 0;
      // 下一玩家需要执行 (未完成+2) 回合，使用负值标记
      newState.attackTurnsRemaining = -(outstandingTurns + 2);
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
      // 显示牌堆顶部3张牌
      newState.futureCards = newState.drawPile.slice(-3).reverse(); // 取顶部3张牌
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
      
    case CardType.NOPE:
      // 简化实现：目前仅记录行为，不改变其他效果；高级逻辑可在事件层面处理
      player.hand.splice(cardIndex, 1);
      newState.discardPile.push(card);
      newState.lastAction = `${player.name} 打出了否定卡 (NOPE)`;
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

  newState.futureCards = undefined;
  return newState;
}

// 结束回合
export function endTurn(gameState: GameState): GameState {
  const newState = {
    ...gameState,
    players: gameState.players.map(p => ({ ...p }))
  };
  
  // 如果当前玩家因 ATTACK 需要执行多次回合，先减少计数
  if (newState.attackTurnsRemaining > 0) {
    newState.attackTurnsRemaining--;
    if (newState.attackTurnsRemaining > 0) {
      return newState; // 仍需继续其额外回合
    }
  }
  
  // 切换到下一个活着的玩家
  newState.players[newState.currentPlayerIndex].isCurrentPlayer = false;
  
  do {
    newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length;
  } while (!newState.players[newState.currentPlayerIndex].isAlive);
  
  newState.players[newState.currentPlayerIndex].isCurrentPlayer = true;
  newState.turnCount++;
  
  // 如果上一位玩家打出了 ATTACK, 此时 attackTurnsRemaining 为负值
  // 将其转为正值, 代表新玩家需要进行对应的额外回合数
  if (newState.attackTurnsRemaining < 0) {
    newState.attackTurnsRemaining = Math.abs(newState.attackTurnsRemaining);
  }

  return newState;
}
