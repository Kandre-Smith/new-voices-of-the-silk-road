/**
 * 西安真实地理要素（自 OpenStreetMap Overpass 抓取并简化烘焙的静态数据）。
 * 数据来源：OpenStreetMap（© OpenStreetMap contributors, ODbL）。
 * 离线烘焙、随包打包，无运行时联网 / key 依赖。需要重新抓取时，用 Overpass API 按
 * 本文件同款 bbox 拉取 waterway/natural=water/leisure=park/landuse/highway/building
 * 等要素，做 Douglas-Peucker 简化 + 坐标量化后写回 mapFeatures.json 即可。
 */
import raw from './mapFeatures.json';

export type LonLat = [number, number];

export interface MapFeatures {
  /** 封闭水面（湖泊 / 护城河段） */
  waterAreas: LonLat[][];
  /** 河流 / 水渠 / 溪流（折线） */
  rivers: { kind: 'river' | 'canal' | 'stream'; line: LonLat[] }[];
  /** 公园绿地 */
  parks: LonLat[][];
  /** 城区块（landuse 肌理） */
  blocks: LonLat[][];
  /** 兵马俑博物馆建筑（含具名馆体） */
  buildings: { ring: LonLat[]; name: string }[];
  /** 主干道路网 */
  roads: LonLat[][];
  /** 城墙（线 / 城门塔楼，碎片化，当前底图以手绘为准） */
  wall: { type: string; ring: LonLat[] }[];
}

export const MAP_FEATURES = raw as MapFeatures;
