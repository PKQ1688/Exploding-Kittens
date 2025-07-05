import type { Card } from '../types/game';
import { CardType } from '../types/game';
import { v4 as uuidv4 } from 'uuid';

// 创建卡牌的工厂函数
function createCard(type: CardType, name: string, description: string, count: number): Card {
  return {
    id: uuidv4(),
    type,
    name,
    description,
    count
  };
}

// 所有卡牌的定义
export const CARD_DEFINITIONS: Record<CardType, Omit<Card, 'id'>> = {
  [CardType.EXPLODING_KITTEN]: {
    type: CardType.EXPLODING_KITTEN,
    name: '爆炸小猫',
    description: '你必须立即展示这张卡。除非你有拆弹卡，否则你就死了。',
    count: 4
  },
  [CardType.DEFUSE]: {
    type: CardType.DEFUSE,
    name: '拆弹',
    description: '如果你抽到爆炸小猫，可以打出这张卡来拆除炸弹。然后将爆炸小猫重新放入牌堆的任意位置。',
    count: 6
  },
  [CardType.NOPE]: {
    type: CardType.NOPE,
    name: '否定',
    description: '阻止任何行动，除了爆炸小猫或拆弹卡。你可以在任何时候打出这张卡，即使不是你的回合。',
    count: 5
  },
  [CardType.ATTACK]: {
    type: CardType.ATTACK,
    name: '攻击',
    description: '结束你的回合而不抽牌，强制下一个玩家连续进行2个回合。',
    count: 4
  },
  [CardType.SKIP]: {
    type: CardType.SKIP,
    name: '跳过',
    description: '立即结束你的回合而不抽牌。',
    count: 4
  },
  [CardType.FAVOR]: {
    type: CardType.FAVOR,
    name: '恩惠',
    description: '强制任何其他玩家给你一张他们选择的手牌。',
    count: 4
  },
  [CardType.SHUFFLE]: {
    type: CardType.SHUFFLE,
    name: '洗牌',
    description: '洗牌抽牌堆而不查看卡牌。',
    count: 4
  },
  [CardType.SEE_THE_FUTURE]: {
    type: CardType.SEE_THE_FUTURE,
    name: '预知未来',
    description: '偷看抽牌堆顶部的3张卡，然后按相同顺序放回。',
    count: 5
  },
  [CardType.CAT_TACOCAT]: {
    type: CardType.CAT_TACOCAT,
    name: '塔可猫',
    description: '这些卡本身没有作用，但可以成对使用来偷取其他玩家的随机卡牌。',
    count: 4
  },
  [CardType.CAT_CATTERMELON]: {
    type: CardType.CAT_CATTERMELON,
    name: '猫瓜',
    description: '这些卡本身没有作用，但可以成对使用来偷取其他玩家的随机卡牌。',
    count: 4
  },
  [CardType.CAT_HAIRY_POTATO]: {
    type: CardType.CAT_HAIRY_POTATO,
    name: '毛土豆猫',
    description: '这些卡本身没有作用，但可以成对使用来偷取其他玩家的随机卡牌。',
    count: 4
  },
  [CardType.CAT_RAINBOW_RALPHING]: {
    type: CardType.CAT_RAINBOW_RALPHING,
    name: '彩虹呕吐猫',
    description: '这些卡本身没有作用，但可以成对使用来偷取其他玩家的随机卡牌。',
    count: 4
  },
  [CardType.CAT_BEARD]: {
    type: CardType.CAT_BEARD,
    name: '胡须猫',
    description: '这些卡本身没有作用，但可以成对使用来偷取其他玩家的随机卡牌。',
    count: 4
  }
};

// 创建完整的卡牌组
export function createDeck(): Card[] {
  const deck: Card[] = [];
  
  Object.values(CARD_DEFINITIONS).forEach(cardDef => {
    for (let i = 0; i < cardDef.count; i++) {
      deck.push(createCard(cardDef.type, cardDef.name, cardDef.description, cardDef.count));
    }
  });
  
  return deck;
}

// 洗牌函数
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 检查是否为猫咪卡
export function isCatCard(cardType: CardType): boolean {
  const catTypes = [
    CardType.CAT_TACOCAT,
    CardType.CAT_CATTERMELON,
    CardType.CAT_HAIRY_POTATO,
    CardType.CAT_RAINBOW_RALPHING,
    CardType.CAT_BEARD
  ];
  return catTypes.includes(cardType as any);
}
