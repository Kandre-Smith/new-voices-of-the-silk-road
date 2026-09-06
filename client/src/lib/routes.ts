import type { Lang } from '../store';

/**
 * 景点间通行路线建议（三语静态数据）。
 * 用户点击两个景点标记后，按 (from → to) 精确匹配，返回 1–2 条通行方案。
 * 三大景点：terracotta-army（兵马俑）/ muslim-quarter（回民街）/ big-wild-goose-pagoda（大雁塔）。
 */

export type RouteMode = 'metro' | 'bus' | 'taxi' | 'walk' | 'bike' | 'mixed';

export interface RouteStep {
  mode: RouteMode;
  text: Record<Lang, string>;
}

export interface RouteOption {
  id: string;
  mode: RouteMode;
  title: Record<Lang, string>;
  /** 一行概述：时长 · 费用 */
  meta: Record<Lang, string>;
  steps: RouteStep[];
}

export interface RoutePair {
  from: string;
  to: string;
  options: RouteOption[];
}

const L = (zh: string, ms: string, en: string): Record<Lang, string> => ({
  'zh-CN': zh,
  'ms-MY': ms,
  'en-US': en,
});

const PAIRS: RoutePair[] = [
  // ── 兵马俑 ↔ 回民街 ──────────────────────────────
  {
    from: 'terracotta-army',
    to: 'muslim-quarter',
    options: [
      {
        id: 'ta-mq-metro',
        mode: 'metro',
        title: L('地铁优先', 'Keutamaan Metro', 'Metro first'),
        meta: L('约 1 小时 30 分 · 约 8 元', '±1 jam 30 minit · kira-kira 8 yuan', 'About 1 h 30 min · about 8 yuan'),
        steps: [
          {
            mode: 'metro',
            text: L(
              '地铁9号线「秦陵西站」上车 → 纺织城站 换乘1号线 → 北大街站 换乘2号线 → 钟楼站下车。',
              'Naiki Laluan Metro 9 di Stesen Qinling West → tukar ke Laluan 1 di Stesen Fangzhicheng → tukar ke Laluan 2 di Stesen Beidajie → turun di Stesen Menara Loceng.',
              'Take Metro Line 9 from Qinling West Station → transfer to Line 1 at Fangzhicheng → transfer to Line 2 at Beidajie → get off at Bell Tower Station.',
            ),
          },
          {
            mode: 'walk',
            text: L(
              '出钟楼站步行约 5 分钟，从鼓楼旁拐进北院门即到回民街。',
              'Keluar dari Stesen Menara Loceng, berjalan kira-kira 5 minit, belok ke Beiyuanmen di tepi Menara Gendang untuk sampai ke Jalan Huimin.',
              'Walk about 5 minutes from Bell Tower Station; turn into Beiyuanmen beside the Drum Tower to reach the Muslim Quarter.',
            ),
          },
        ],
      },
      {
        id: 'ta-mq-taxi',
        mode: 'taxi',
        title: L('打车直达', 'Teksi Terus', 'Direct taxi'),
        meta: L('约 50 分钟 · 约 80–100 元', '±50 minit · kira-kira 80–100 yuan', 'About 50 min · about 80–100 yuan'),
        steps: [
          {
            mode: 'taxi',
            text: L(
              '从兵马俑停车场打车，经西临快速干道、绕城高速前往钟楼，全程约 40 公里。',
              'Naiki teksi dari tempat letak kereta Tentera Terakota, melalui Xilin Expressway dan Lebuhraya Lingkaran ke Menara Loceng, kira-kira 40 km.',
              'Take a taxi from the Terracotta Army car park via the Xilin Expressway and Ring Expressway to the Bell Tower, about 40 km.',
            ),
          },
          {
            mode: 'walk',
            text: L(
              '到钟楼后，从鼓楼旁拐进北院门即达回民街。',
              'Sampai di Menara Loceng, belok ke Beiyuanmen di tepi Menara Gendang untuk sampai ke Jalan Huimin.',
              'At the Bell Tower, turn into Beiyuanmen beside the Drum Tower to reach the Muslim Quarter.',
            ),
          },
        ],
      },
    ],
  },
  {
    from: 'muslim-quarter',
    to: 'terracotta-army',
    options: [
      {
        id: 'mq-ta-metro',
        mode: 'metro',
        title: L('地铁 + 公交', 'Metro + Bas', 'Metro + bus'),
        meta: L('约 1 小时 30 分 · 约 9 元', '±1 jam 30 minit · kira-kira 9 yuan', 'About 1 h 30 min · about 9 yuan'),
        steps: [
          {
            mode: 'metro',
            text: L(
              '在钟楼站乘2号线 → 北大街站 换乘1号线 → 纺织城站 换乘9号线 → 秦陵西站下车。',
              'Naiki Laluan 2 di Stesen Menara Loceng → tukar ke Laluan 1 di Beidajie → tukar ke Laluan 9 di Fangzhicheng → turun di Stesen Qinling West.',
              'Take Line 2 at Bell Tower Station → transfer to Line 1 at Beidajie → transfer to Line 9 at Fangzhicheng → get off at Qinling West Station.',
            ),
          },
          {
            mode: 'bus',
            text: L(
              '出站换乘游5（306路）公交，直达兵马俑景区。',
              'Keluar stesen dan tukar ke bas pelancongan 5 (laluan 306) terus ke kawasan Tentera Terakota.',
              'Exit the station and take Tourist Bus 5 (route 306) directly to the Terracotta Army.',
            ),
          },
        ],
      },
      {
        id: 'mq-ta-taxi',
        mode: 'taxi',
        title: L('打车直达', 'Teksi Terus', 'Direct taxi'),
        meta: L('约 50 分钟 · 约 80–100 元', '±50 minit · kira-kira 80–100 yuan', 'About 50 min · about 80–100 yuan'),
        steps: [
          {
            mode: 'taxi',
            text: L(
              '从钟楼打车，经绕城高速、西临快速干道前往临潼兵马俑，全程约 40 公里。',
              'Naiki teksi dari Menara Loceng, melalui Lebuhraya Lingkaran dan Xilin Expressway ke Tentera Terakota di Lintong, kira-kira 40 km.',
              'Take a taxi from the Bell Tower via the Ring Expressway and Xilin Expressway to the Terracotta Army in Lintong, about 40 km.',
            ),
          },
        ],
      },
    ],
  },

  // ── 兵马俑 ↔ 大雁塔 ──────────────────────────────
  {
    from: 'terracotta-army',
    to: 'big-wild-goose-pagoda',
    options: [
      {
        id: 'ta-pagoda-metro',
        mode: 'metro',
        title: L('地铁优先', 'Keutamaan Metro', 'Metro first'),
        meta: L('约 1 小时 40 分 · 约 9 元', '±1 jam 40 minit · kira-kira 9 yuan', 'About 1 h 40 min · about 9 yuan'),
        steps: [
          {
            mode: 'metro',
            text: L(
              '地铁9号线「秦陵西站」→ 纺织城站 换乘1号线 → 通化门站 换乘3号线 → 大雁塔站下车。',
              'Naiki Laluan Metro 9 di Stesen Qinling West → tukar ke Laluan 1 di Fangzhicheng → tukar ke Laluan 3 di Tonghuamen → turun di Stesen Dayanta.',
              'Take Metro Line 9 from Qinling West Station → transfer to Line 1 at Fangzhicheng → transfer to Line 3 at Tonghuamen → get off at Dayanta Station.',
            ),
          },
          {
            mode: 'walk',
            text: L(
              '出大雁塔站步行几分钟即达大慈恩寺与大雁塔。',
              'Keluar dari Stesen Dayanta, berjalan beberapa minit ke Kuil Da Ci’en dan Pagoda Angsa Liar.',
              'Walk a few minutes from Dayanta Station to Da Ci’en Temple and the Big Wild Goose Pagoda.',
            ),
          },
        ],
      },
      {
        id: 'ta-pagoda-taxi',
        mode: 'taxi',
        title: L('打车直达', 'Teksi Terus', 'Direct taxi'),
        meta: L('约 55 分钟 · 约 100 元', '±55 minit · kira-kira 100 yuan', 'About 55 min · about 100 yuan'),
        steps: [
          {
            mode: 'taxi',
            text: L(
              '从兵马俑打车，经西临快速干道、东三环前往大雁塔，全程约 45 公里。',
              'Naiki teksi dari Tentera Terakota, melalui Xilin Expressway dan East 3rd Ring ke Pagoda Angsa Liar, kira-kira 45 km.',
              'Take a taxi from the Terracotta Army via the Xilin Expressway and East 3rd Ring Road to the Big Wild Goose Pagoda, about 45 km.',
            ),
          },
        ],
      },
    ],
  },
  {
    from: 'big-wild-goose-pagoda',
    to: 'terracotta-army',
    options: [
      {
        id: 'pagoda-ta-metro',
        mode: 'metro',
        title: L('地铁优先', 'Keutamaan Metro', 'Metro first'),
        meta: L('约 1 小时 40 分 · 约 9 元', '±1 jam 40 minit · kira-kira 9 yuan', 'About 1 h 40 min · about 9 yuan'),
        steps: [
          {
            mode: 'metro',
            text: L(
              '在大雁塔站乘3号线 → 通化门站 换乘1号线 → 纺织城站 换乘9号线 → 秦陵西站下车。',
              'Naiki Laluan 3 di Stesen Dayanta → tukar ke Laluan 1 di Tonghuamen → tukar ke Laluan 9 di Fangzhicheng → turun di Stesen Qinling West.',
              'Take Line 3 at Dayanta Station → transfer to Line 1 at Tonghuamen → transfer to Line 9 at Fangzhicheng → get off at Qinling West Station.',
            ),
          },
          {
            mode: 'bus',
            text: L(
              '出站换乘游5（306路）公交，直达兵马俑景区。',
              'Keluar stesen dan tukar ke bas pelancongan 5 (laluan 306) terus ke kawasan Tentera Terakota.',
              'Exit the station and take Tourist Bus 5 (route 306) directly to the Terracotta Army.',
            ),
          },
        ],
      },
      {
        id: 'pagoda-ta-taxi',
        mode: 'taxi',
        title: L('打车直达', 'Teksi Terus', 'Direct taxi'),
        meta: L('约 55 分钟 · 约 100 元', '±55 minit · kira-kira 100 yuan', 'About 55 min · about 100 yuan'),
        steps: [
          {
            mode: 'taxi',
            text: L(
              '从大雁塔打车，经东三环、西临快速干道前往临潼兵马俑，全程约 45 公里。',
              'Naiki teksi dari Pagoda Angsa Liar, melalui East 3rd Ring dan Xilin Expressway ke Tentera Terakota di Lintong, kira-kira 45 km.',
              'Take a taxi from the Big Wild Goose Pagoda via the East 3rd Ring Road and Xilin Expressway to the Terracotta Army in Lintong, about 45 km.',
            ),
          },
        ],
      },
    ],
  },

  // ── 回民街 ↔ 大雁塔 ──────────────────────────────
  {
    from: 'muslim-quarter',
    to: 'big-wild-goose-pagoda',
    options: [
      {
        id: 'mq-pagoda-metro',
        mode: 'metro',
        title: L('地铁优先', 'Keutamaan Metro', 'Metro first'),
        meta: L('约 25 分钟 · 约 3 元', '±25 minit · kira-kira 3 yuan', 'About 25 min · about 3 yuan'),
        steps: [
          {
            mode: 'metro',
            text: L(
              '从钟楼站乘2号线 → 小寨站 换乘3号线 → 大雁塔站下车，出站即达。',
              'Naiki Laluan 2 di Stesen Menara Loceng → tukar ke Laluan 3 di Stesen Xiaozhai → turun di Stesen Dayanta, keluar sahaja sampai.',
              'Take Line 2 at Bell Tower Station → transfer to Line 3 at Xiaozhai → get off at Dayanta Station, right at the gate.',
            ),
          },
        ],
      },
      {
        id: 'mq-pagoda-taxi',
        mode: 'taxi',
        title: L('打车 / 骑行', 'Teksi / Basikal', 'Taxi / cycling'),
        meta: L('打车约 15 分钟 · 约 15 元', 'Teksi ±15 minit · kira-kira 15 yuan', 'Taxi about 15 min · about 15 yuan'),
        steps: [
          {
            mode: 'taxi',
            text: L(
              '打车沿南大街、雁塔路南下，约 15 分钟即达。',
              'Naiki teksi menyusuri Jalan Selatan dan Jalan Yanta ke selatan, kira-kira 15 minit.',
              'Take a taxi south along South Street and Yanta Road, about 15 minutes.',
            ),
          },
          {
            mode: 'bike',
            text: L(
              '也可骑共享单车，沿南大街向南骑行约 30 分钟。',
              'Boleh juga menunggang basikal sewa, ke selatan di sepanjang Jalan Selatan kira-kira 30 minit.',
              'You can also ride a shared bike south along South Street for about 30 minutes.',
            ),
          },
        ],
      },
    ],
  },
  {
    from: 'big-wild-goose-pagoda',
    to: 'muslim-quarter',
    options: [
      {
        id: 'pagoda-mq-metro',
        mode: 'metro',
        title: L('地铁优先', 'Keutamaan Metro', 'Metro first'),
        meta: L('约 25 分钟 · 约 3 元', '±25 minit · kira-kira 3 yuan', 'About 25 min · about 3 yuan'),
        steps: [
          {
            mode: 'metro',
            text: L(
              '从大雁塔站乘3号线 → 小寨站 换乘2号线 → 钟楼站下车，步行即到回民街。',
              'Naiki Laluan 3 di Stesen Dayanta → tukar ke Laluan 2 di Stesen Xiaozhai → turun di Stesen Menara Loceng, berjalan sahaja ke Jalan Huimin.',
              'Take Line 3 at Dayanta Station → transfer to Line 2 at Xiaozhai → get off at Bell Tower Station, then walk to the Muslim Quarter.',
            ),
          },
        ],
      },
      {
        id: 'pagoda-mq-taxi',
        mode: 'taxi',
        title: L('打车 / 骑行', 'Teksi / Basikal', 'Taxi / cycling'),
        meta: L('打车约 15 分钟 · 约 15 元', 'Teksi ±15 minit · kira-kira 15 yuan', 'Taxi about 15 min · about 15 yuan'),
        steps: [
          {
            mode: 'taxi',
            text: L(
              '打车沿雁塔路、南大街北上，约 15 分钟即达。',
              'Naiki teksi menyusuri Jalan Yanta dan Jalan Selatan ke utara, kira-kira 15 minit.',
              'Take a taxi north along Yanta Road and South Street, about 15 minutes.',
            ),
          },
          {
            mode: 'bike',
            text: L(
              '也可骑共享单车，沿雁塔路向北骑行约 30 分钟。',
              'Boleh juga menunggang basikal sewa, ke utara di sepanjang Jalan Yanta kira-kira 30 minit.',
              'You can also ride a shared bike north along Yanta Road for about 30 minutes.',
            ),
          },
        ],
      },
    ],
  },
];

/** 按 (from → to) 精确匹配路线；找不到返回 null。 */
export function findRoute(from: string, to: string): RoutePair | null {
  return PAIRS.find((p) => p.from === from && p.to === to) ?? null;
}

/** 路线图标（模式 → emoji） */
export const MODE_ICON: Record<RouteMode, string> = {
  metro: '🚇',
  bus: '🚌',
  taxi: '🚕',
  walk: '🚶',
  bike: '🚲',
  mixed: '🔀',
};
