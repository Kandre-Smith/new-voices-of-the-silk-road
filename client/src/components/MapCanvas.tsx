import { useMemo, useRef, useState } from 'react';
import type { Attraction } from '../api';

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

/** 西安老城（明城墙）四角，用于绘制城墙示意图 */
const WALL = {
  west: project(108.925, 34.277),
  east: project(108.968, 34.247),
};

/** 渭河（西安北部）折线，用于河带底图 */
const RIVER_POINTS = [108.88, 108.96, 109.04, 109.14, 109.24, 109.32].map((lng) =>
  project(lng, 34.375),
);

function buildPoints(attractions: Attraction[]) {
  return attractions.map((a) => ({ ...a, ...project(a.coords.lng, a.coords.lat) }));
}

export default function MapCanvas({
  attractions,
  selectedSlug,
  routeFrom,
  routeTo,
  onSelect,
}: Props) {
  const points = useMemo(() => buildPoints(attractions), [attractions]);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const drag = useRef<{ x: number; y: number; tx: number; ty: number; moved: boolean } | null>(null);
  const press = useRef<{ slug: string; x: number; y: number } | null>(null);

  const from = points.find((p) => p.slug === routeFrom);
  const to = points.find((p) => p.slug === routeTo);

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
    // 法向偏移，让曲线微微拱起
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
          // 位移小于阈值视为「点击」而非拖拽：若有按下的标记则触发选择
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
          {points.map((p) => (
            <clipPath key={p.slug} id={`map-clip-${p.slug}`}>
              <circle cx={p.x} cy={p.y} r={26} />
            </clipPath>
          ))}
          <linearGradient id="map-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bfe0ec" />
            <stop offset="100%" stopColor="#d9ecf3" />
          </linearGradient>
          <linearGradient id="map-land" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f3ecdd" />
            <stop offset="100%" stopColor="#efe6d2" />
          </linearGradient>
        </defs>

        <g transform={`translate(${tx} ${ty}) scale(${scale})`}>
          {/* 底图：土地 + 水域 */}
          <rect x="0" y="0" width={VB_W} height={VB_H} rx="18" fill="url(#map-land)" />
          <path
            d={`M 0 ${RIVER_POINTS[0].y - 26} ${RIVER_POINTS.map((p, i) => `${i === 0 ? 'L' : 'L'} ${p.x} ${p.y - 14}`).join(' ')} L ${VB_W} ${RIVER_POINTS[RIVER_POINTS.length - 1].y - 34} L ${VB_W} 0 L 0 0 Z`}
            fill="url(#map-water)"
            opacity="0.85"
          />
          {/* 渭河河岸线 */}
          <path
            d={RIVER_POINTS.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
            fill="none"
            stroke="#9ec6d8"
            strokeWidth="2.5"
            opacity="0.6"
            strokeLinecap="round"
          />

          {/* 城市主干路网（示意） */}
          <g stroke="var(--line)" strokeWidth="1.6" opacity="0.65">
            {[0.12, 0.2, 0.28, 0.36, 0.44].map((r) => {
              const p1 = project(BOUNDS.minLng + (BOUNDS.maxLng - BOUNDS.minLng) * r, BOUNDS.minLat);
              const p2 = project(BOUNDS.minLng + (BOUNDS.maxLng - BOUNDS.minLng) * r, BOUNDS.maxLat);
              return <line key={`v${r}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} />;
            })}
            {[0.25, 0.4, 0.55, 0.7, 0.85].map((r) => {
              const p1 = project(BOUNDS.minLng, BOUNDS.maxLat - (BOUNDS.maxLat - BOUNDS.minLat) * r);
              const p2 = project(BOUNDS.maxLng, BOUNDS.maxLat - (BOUNDS.maxLat - BOUNDS.minLat) * r);
              return <line key={`h${r}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} />;
            })}
          </g>

          {/* 地铁线（示意）：2 号线纵贯钟楼，3 号线横穿大雁塔 */}
          <g fill="none" strokeLinecap="round">
            <path
              d={`M ${project(108.9398, 34.34).x} ${project(108.9398, 34.34).y} L ${project(108.9398, 34.24).x} ${project(108.9398, 34.24).y}`}
              stroke="#e23b3b"
              strokeWidth="4"
              opacity="0.55"
            />
            <path
              d={`M ${project(108.90, 34.2189).x} ${project(108.90, 34.2189).y} L ${project(109.05, 34.2189).x} ${project(109.05, 34.2189).y}`}
              stroke="#e05a9a"
              strokeWidth="4"
              opacity="0.55"
            />
          </g>

          {/* 明城墙（西安老城） */}
          <rect
            x={WALL.west.x}
            y={WALL.west.y}
            width={WALL.east.x - WALL.west.x}
            height={WALL.east.y - WALL.west.y}
            rx="16"
            fill="none"
            stroke="#8a6130"
            strokeWidth="3.5"
            opacity="0.5"
          />
          <rect
            x={WALL.west.x + 6}
            y={WALL.west.y + 6}
            width={WALL.east.x - WALL.west.x - 12}
            height={WALL.east.y - WALL.west.y - 12}
            rx="12"
            fill="none"
            stroke="#8a6130"
            strokeWidth="1.5"
            opacity="0.35"
          />

          {/* 地名标注 */}
          <g fill="var(--ink-soft)" fontSize="20" opacity="0.75" style={{ fontStyle: 'italic' }}>
            <text x={project(108.90, 34.41).x} y={project(108.90, 34.41).y} textAnchor="middle">
              渭河
            </text>
            <text x={WALL.west.x + (WALL.east.x - WALL.west.x) / 2} y={WALL.west.y - 14} textAnchor="middle">
              西安老城
            </text>
            <text x={project(109.2785, 34.355).x} y={project(109.2785, 34.355).y} textAnchor="middle">
              临潼区
            </text>
          </g>

          {/* 路线连线 */}
          {routePath && (
            <>
              <path
                d={routePath}
                fill="none"
                stroke="var(--brand)"
                strokeWidth="6"
                strokeDasharray="1 16"
                strokeLinecap="round"
                opacity="0.9"
              />
              <circle cx={from!.x} cy={from!.y} r="10" fill="var(--brand)" />
              <circle cx={to!.x} cy={to!.y} r="10" fill="var(--accent)" />
            </>
          )}

          {/* 景点标记：真实照片 + 白色描边 + 名称 */}
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
                {/* 照片底衬（缺图时露出 emoji 渐变） */}
                <circle r="26" fill={p.accent} />
                {p.image ? (
                  <image
                    href={p.image}
                    xlinkHref={p.image}
                    x="-26"
                    y="-26"
                    width="52"
                    height="52"
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#map-clip-${p.slug})`}
                  />
                ) : (
                  <text y="9" fontSize="26" textAnchor="middle">
                    {p.emoji}
                  </text>
                )}
                <circle r="26" fill="none" stroke="#fff" strokeWidth="3" />
                <circle
                  r="30"
                  fill="none"
                  stroke={isTo ? 'var(--accent)' : isFrom ? 'var(--brand)' : isSel ? 'var(--brand-deep)' : 'var(--line)'}
                  strokeWidth={isFrom || isTo || isSel ? 4 : 2}
                />

                {/* 起/终点徽标 */}
                {isFrom && (
                  <g transform="translate(22 -22)">
                    <circle r="13" fill="var(--brand)" />
                    <text y="4.5" fontSize="15" textAnchor="middle" fill="#fff" fontWeight="700">
                      A
                    </text>
                  </g>
                )}
                {isTo && (
                  <g transform="translate(22 -22)">
                    <circle r="13" fill="var(--accent)" />
                    <text y="4.5" fontSize="15" textAnchor="middle" fill="#fff" fontWeight="700">
                      B
                    </text>
                  </g>
                )}

                {/* 名称标签 */}
                <text
                  y="50"
                  fontSize="19"
                  textAnchor="middle"
                  fill="var(--ink)"
                  fontWeight="600"
                  stroke="var(--card)"
                  strokeWidth="5"
                  paintOrder="stroke"
                >
                  {p.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      <div className="map-controls">
        <button className="icon-btn" onClick={() => zoom(0.3)} aria-label="zoom in">
          ＋
        </button>
        <button className="icon-btn" onClick={() => zoom(-0.3)} aria-label="zoom out">
          －
        </button>
      </div>
    </div>
  );
}
