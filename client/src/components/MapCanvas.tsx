import { useMemo, useRef, useState } from 'react';
import type { Attraction } from '../api';
import { MAP_FEATURES as MAP } from '../lib/mapFeatures';

interface Props {
  attractions: Attraction[];
  selectedSlug?: string;
  /** 路线起点 / 终点（slug），两者都设置时绘制连线 */
  routeFrom?: string;
  routeTo?: string;
  onSelect: (slug: string) => void;
}

const VB_W = 1000;
const VB_H = 660;

/* 经纬度投影范围：覆盖三大景点 + 周边城市要素 */
const BOUNDS = { minLng: 108.88, maxLng: 109.32, minLat: 34.18, maxLat: 34.42 };

function project(lng: number, lat: number) {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * VB_W;
  const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * VB_H;
  return { x, y };
}

/** 西安明城墙（真实坐标）：约 4.4km 东西 × 2.9km 南北 */
const WALL = { west: 108.9228, east: 108.9633, north: 34.2749, south: 34.2489 };
/** 四座主城门 */
const GATES = [
  { name: '永宁门', lng: 108.9417, lat: 34.2513 },
  { name: '安远门', lng: 108.9436, lat: 34.2745 },
  { name: '长乐门', lng: 108.9622, lat: 34.2636 },
  { name: '安定门', lng: 108.9226, lat: 34.2623 },
];

/** 地铁线（示意走向，含主要换乘站） */
const METRO: { id: string; color: string; pts: [number, number][] }[] = [
  { id: '1', color: '#d8453c', pts: [[108.895, 34.269], [108.94, 34.269], [108.99, 34.269], [109.05, 34.267], [109.10, 34.261]] },
  { id: '2', color: '#d8453c', pts: [[108.939, 34.335], [108.939, 34.30], [108.939, 34.262], [108.939, 34.22], [108.939, 34.19]] },
  { id: '3', color: '#e05a9a', pts: [[108.895, 34.219], [108.94, 34.219], [108.962, 34.219], [109.02, 34.219], [109.08, 34.219]] },
  { id: '4', color: '#3fa0a0', pts: [[108.962, 34.335], [108.962, 34.28], [108.962, 34.219], [108.962, 34.19]] },
  { id: '9', color: '#8a63d2', pts: [[109.07, 34.27], [109.12, 34.31], [109.17, 34.35], [109.22, 34.375], [109.25, 34.385]] },
];
const STATIONS: { name: string; lng: number; lat: number; major?: boolean }[] = [
  { name: '钟楼', lng: 108.939, lat: 34.262, major: true },
  { name: '北大街', lng: 108.939, lat: 34.269 },
  { name: '大雁塔', lng: 108.962, lat: 34.219, major: true },
  { name: '纺织城', lng: 109.07, lat: 34.27 },
  { name: '秦陵西', lng: 109.25, lat: 34.385, major: true },
];

/** 环 -> SVG polygon points */
function polyPoints(ring: [number, number][]): string {
  return ring.map(([lng, lat]) => {
    const p = project(lng, lat);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(' ');
}

/** 折线 -> SVG path d */
function linePath(line: [number, number][]): string {
  return line.map(([lng, lat], i) => {
    const p = project(lng, lat);
    return `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }).join(' ');
}

function buildPoints(attractions: Attraction[]) {
  return attractions.map((a) => ({ ...a, ...project(a.coords.lng, a.coords.lat) }));
}

export default function MapCanvas({ attractions, selectedSlug, routeFrom, routeTo, onSelect }: Props) {
  const points = useMemo(() => buildPoints(attractions), [attractions]);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const drag = useRef<{ x: number; y: number; tx: number; ty: number; moved: boolean } | null>(null);
  const press = useRef<{ slug: string; x: number; y: number } | null>(null);

  const from = points.find((p) => p.slug === routeFrom);
  const to = points.find((p) => p.slug === routeTo);

  const wallX = project(WALL.west, WALL.north);
  const wallE = project(WALL.east, WALL.south);
  const wallW = wallE.x - wallX.x;
  const wallH = wallE.y - wallX.y;

  function zoom(delta: number) {
    setScale((s) => Math.min(3, Math.max(1, +(s + delta).toFixed(2))));
  }

  /* 路线连线：起点 → 终点，二次贝塞尔轻微弯曲 */
  const routePath = useMemo(() => {
    if (!from || !to) return null;
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const off = Math.min(60, len * 0.12);
    const cx = mx + (-dy / len) * off;
    const cy = my + (dx / len) * off;
    return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
  }, [from, to]);

  return (
    <div className="map-wrap">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="map-svg"
        onPointerDown={(e) => {
          (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, tx, ty, moved: false };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const dx = e.clientX - drag.current.x;
          const dy = e.clientY - drag.current.y;
          if (!drag.current.moved && Math.hypot(dx, dy) > 6) drag.current.moved = true;
          if (drag.current.moved) {
            setTx(drag.current.tx + dx);
            setTy(drag.current.ty + dy);
          }
        }}
        onPointerUp={() => {
          if (drag.current && !drag.current.moved && press.current) {
            onSelect(press.current.slug);
          }
          drag.current = null;
          press.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
          press.current = null;
        }}
        onPointerLeave={() => {
          if (!drag.current?.moved) {
            drag.current = null;
            press.current = null;
          }
        }}
      >
        <defs>
          <clipPath id="map-pin-clip" clipPathUnits="objectBoundingBox">
            <circle cx="0.5" cy="0.5" r="0.5" />
          </clipPath>
          <linearGradient id="map-land" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f6f0e2" />
            <stop offset="100%" stopColor="#f0e8d4" />
          </linearGradient>
          <linearGradient id="map-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b9d9e9" />
            <stop offset="100%" stopColor="#cfe5f0" />
          </linearGradient>
          <filter id="map-pin-shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#3a2f22" floodOpacity="0.28" />
          </filter>
          <filter id="map-label-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#3a2f22" floodOpacity="0.25" />
          </filter>
        </defs>

        <g transform={`translate(${tx} ${ty}) scale(${scale})`}>
          {/* 底图：土地 */}
          <rect x="0" y="0" width={VB_W} height={VB_H} rx="18" fill="url(#map-land)" />

          {/* 城区块（landuse 肌理） */}
          <g fill="#eadfc6" opacity="0.75">
            {MAP.blocks.map((ring, i) => <polygon key={`b${i}`} points={polyPoints(ring)} />)}
          </g>

          {/* 公园绿地 */}
          <g fill="#cde0b8" opacity="0.9">
            {MAP.parks.map((ring, i) => <polygon key={`p${i}`} points={polyPoints(ring)} />)}
          </g>

          {/* 水系（面）：湖泊 / 护城河段 */}
          <g fill="url(#map-water)" stroke="#9ec6d8" strokeWidth="1" strokeOpacity="0.6">
            {MAP.waterAreas.map((ring, i) => <polygon key={`w${i}`} points={polyPoints(ring)} />)}
          </g>

          {/* 水系（线）：渭河 / 浐河 / 灞河等 */}
          <g fill="none" stroke="#9ec6d8" strokeLinecap="round" opacity="0.8">
            {MAP.rivers.map((r, i) => {
              const w = r.kind === 'stream' ? 1.4 : r.kind === 'canal' ? 2.6 : 4;
              return <path key={`r${i}`} d={linePath(r.line)} strokeWidth={w} />;
            })}
          </g>

          {/* 主干道路网 */}
          <g fill="none" stroke="#e3d5b8" strokeWidth="1.3" strokeLinecap="round" opacity="0.9">
            {MAP.roads.map((line, i) => <path key={`rd${i}`} d={linePath(line)} />)}
          </g>

          {/* 地铁线 + 站点 */}
          <g fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.65">
            {METRO.map((m) => (
              <path key={m.id} d={linePath(m.pts)} stroke={m.color} strokeWidth="4" />
            ))}
          </g>
          <g>
            {STATIONS.map((s) => (
              <g key={s.name}>
                <circle cx={project(s.lng, s.lat).x} cy={project(s.lng, s.lat).y} r={s.major ? 5 : 3} fill="#fff" stroke="#8a6130" strokeWidth="1.6" />
                {s.major && (
                  <text x={project(s.lng, s.lat).x + 8} y={project(s.lng, s.lat).y - 6} fontSize="13" fill="#6b5a42" fontWeight="600" stroke="#fff" strokeWidth="3" paintOrder="stroke">
                    {s.name}
                  </text>
                )}
              </g>
            ))}
          </g>

          {/* 护城河（环绕城墙的水带） */}
          <rect x={wallX.x - 8} y={wallX.y - 8} width={wallW + 16} height={wallH + 16} rx="30" fill="none" stroke="#a9cfe0" strokeWidth="9" opacity="0.7" />
          {/* 明城墙 */}
          <rect x={wallX.x} y={wallX.y} width={wallW} height={wallH} rx="18" fill="#c9a06a" opacity="0.32" stroke="#8a6130" strokeWidth="3.2" />
          <rect x={wallX.x + 5} y={wallX.y + 5} width={wallW - 10} height={wallH - 10} rx="13" fill="none" stroke="#8a6130" strokeWidth="1.4" opacity="0.35" />
          {/* 城门 */}
          {GATES.map((g) => (
            <circle key={g.name} cx={project(g.lng, g.lat).x} cy={project(g.lng, g.lat).y} r="4" fill="#8a6130" />
          ))}

          {/* 兵马俑博物馆建筑（3D 挤出效果） */}
          <g>
            {MAP.buildings.map((b, i) => {
              const named = b.name;
              const ring = b.ring;
              const isHall = !!named;
              return (
                <g key={`bd${i}`}>
                  {/* 投影 */}
                  <polygon points={polyPoints(ring)} transform="translate(2.5 3)" fill="#8a6130" opacity="0.22" />
                  {/* 主体 */}
                  <polygon points={polyPoints(ring)} fill={isHall ? '#c98a4b' : '#cbb48d'} stroke={isHall ? '#8a6130' : '#b09a70'} strokeWidth="1" />
                  {/* 屋顶（偏移高光，营造高度感） */}
                  <polygon points={polyPoints(ring)} transform="translate(-1.2 -2)" fill={isHall ? '#e0a86a' : '#dcc9a6'} opacity="0.85" />
                </g>
              );
            })}
          </g>

          {/* 地名标注 */}
          <g fill="#6b5a42" fontSize="19" opacity="0.8" fontStyle="italic">
            <text x={project(108.90, 34.41).x} y={project(108.90, 34.41).y} textAnchor="middle">渭河</text>
            <text x={wallX.x + wallW / 2} y={wallX.y - 14} textAnchor="middle">西安老城</text>
            <text x={project(109.2785, 34.355).x} y={project(109.2785, 34.355).y} textAnchor="middle">临潼区</text>
          </g>

          {/* 路线连线 */}
          {routePath && (
            <>
              <path d={routePath} fill="none" stroke="var(--brand)" strokeWidth="6" strokeDasharray="1 16" strokeLinecap="round" opacity="0.9" />
              <circle cx={from!.x} cy={from!.y} r="10" fill="var(--brand)" />
              <circle cx={to!.x} cy={to!.y} r="10" fill="var(--accent)" />
            </>
          )}

          {/* 景点标记：3D 图钉（照片 + 专属配色 + 投影） */}
          {points.map((p) => {
            const isSel = p.slug === selectedSlug;
            const isFrom = p.slug === routeFrom;
            const isTo = p.slug === routeTo;
            return (
              <g
                key={p.slug}
                className={`map-marker${isSel ? ' selected' : ''}`}
                onPointerDown={(e) => {
                  press.current = { slug: p.slug, x: e.clientX, y: e.clientY };
                }}
                transform={`translate(${p.x} ${p.y})`}
              >
                {/* 落地投影 */}
                <ellipse cx="0" cy="38" rx="19" ry="5.5" fill="#3a2f22" opacity="0.22" />
                {/* 图钉尾部 */}
                <path d="M -11 21 L 11 21 L 0 36 Z" fill={p.accent} filter="url(#map-pin-shadow)" />
                {/* 照片圆头 */}
                <circle r="23" fill="#fff" filter="url(#map-pin-shadow)" />
                <circle r="23" fill="none" stroke={p.accent} strokeWidth="3.5" />
                {p.image ? (
                  <image
                    href={p.image}
                    xlinkHref={p.image}
                    x="-19"
                    y="-19"
                    width="38"
                    height="38"
                    preserveAspectRatio="xMidYMid slice"
                    clipPath="url(#map-pin-clip)"
                  />
                ) : (
                  <text y="8" fontSize="22" textAnchor="middle">{p.emoji}</text>
                )}
                {/* 高光 */}
                <path d="M -14 -9 A 19 19 0 0 1 14 -9" fill="none" stroke="#fff" strokeWidth="2.5" opacity="0.5" />
                {/* emoji 徽标 */}
                <g transform="translate(14 14)">
                  <circle r="11" fill="#fff" stroke={p.accent} strokeWidth="1.5" />
                  <text y="4.5" fontSize="13" textAnchor="middle">{p.emoji}</text>
                </g>

                {/* 起/终点徽标 */}
                {isFrom && (
                  <g transform="translate(-20 -20)">
                    <circle r="13" fill="var(--brand)" />
                    <text y="4.5" fontSize="14" textAnchor="middle" fill="#fff" fontWeight="700">A</text>
                  </g>
                )}
                {isTo && (
                  <g transform="translate(-20 -20)">
                    <circle r="13" fill="var(--accent)" />
                    <text y="4.5" fontSize="14" textAnchor="middle" fill="#fff" fontWeight="700">B</text>
                  </g>
                )}

                {/* 选中外圈 */}
                {(isFrom || isTo || isSel) && (
                  <circle r="29" fill="none" stroke={isTo ? 'var(--accent)' : isFrom ? 'var(--brand)' : 'var(--brand-deep)'} strokeWidth="3.5" strokeDasharray="4 4" />
                )}

                {/* 名称标签 */}
                <text
                  y="53"
                  fontSize="19"
                  textAnchor="middle"
                  fill="#4a3a26"
                  fontWeight="700"
                  stroke="#fffdf8"
                  strokeWidth="5"
                  paintOrder="stroke"
                  filter="url(#map-label-shadow)"
                >
                  {p.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      <div className="map-controls">
        <button className="icon-btn" onClick={() => zoom(0.3)} aria-label="zoom in">＋</button>
        <button className="icon-btn" onClick={() => zoom(-0.3)} aria-label="zoom out">－</button>
      </div>
    </div>
  );
}
