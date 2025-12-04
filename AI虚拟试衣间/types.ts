export interface PresetImage {
  id: string;
  url: string;
  category: 'person' | 'cloth';
}

export interface GenerationHistory {
  id: string;
  personImage: string; // Base64
  clothImage: string; // Base64
  resultImage: string; // Base64
  timestamp: number;
}

export enum AppStep {
  SELECT_PERSON = 0,
  SELECT_CLOTH = 1,
  GENERATING = 2,
  RESULT = 3
}

export const PRESET_PEOPLE: PresetImage[] = [
  { id: 'p1', category: 'person', url: 'https://i.mji.rip/2025/11/19/51362f10bf363524251691516b6323f46.png' },
  { id: 'p2', category: 'person', url: 'https://i.mji.rip/2025/11/19/d42af8d2f41175683d1467bc2c857cbe.png' },
  { id: 'p3', category: 'person', url: 'https://p2.itc.cn/g/images03/20230712/dfb1cb57f0d045db86efe369415877cf.jpeg' },
  { id: 'p4', category: 'person', url: 'https://i.mji.rip/2025/11/19/665c90d26a3ec857c5c440f4f7da5ed2.png' },
  { id: 'p5', category: 'person', url: 'https://i.mji.rip/2025/11/19/15f1393ca6e0215caf51cf0ecdfe0d5c.png' },
  { id: 'p6', category: 'person', url: 'https://img-s.msn.cn/tenant/amp/entityid/AA1GC7a3.img?w=520&h=780&m=6&x=222&y=183&s=140&d=140' }
];

export const PRESET_CLOTHES: PresetImage[] = [
  { id: 'c1', category: 'cloth', url: 'https://i.mji.rip/2025/11/19/17aab709b470423cc3e89772afb7da39.png' },
  { id: 'c2', category: 'cloth', url: 'https://i.mji.rip/2025/11/19/cd8598d0d987b7b5825257924be13bcb.png' },
  { id: 'c3', category: 'cloth', url: 'https://i.mji.rip/2025/11/19/32426d416cb5508300c530a071ebe497.png' },
  { id: 'c4', category: 'cloth', url: 'https://i.mji.rip/2025/11/19/6bd78dd58e04e038e219145822b356e6.png' },
  { id: 'c5', category: 'cloth', url: 'https://i.mji.rip/2025/11/19/e6dccb4533c546cb42fa564b322d8e84.png' },
  { id: 'c6', category: 'cloth', url: 'https://i.mji.rip/2025/11/19/a838237484463bfe6ce45a8245587048.png' }
];
