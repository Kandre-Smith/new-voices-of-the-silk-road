import { useEffect, useState } from 'react';

interface Props {
  src: string;
  alt: string;
  emoji: string;
  accent: string;
  className?: string;
}

/**
 * 封面图：优先显示真实照片，加载失败或未提供时回退为渐变 + emoji。
 * 图片约定：景点 `/images/attractions/{slug}.jpg`，子景点 `/images/spots/{slug}.jpg`。
 */
export default function CoverImage({ src, alt, emoji, accent, className }: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showFallback = !src || failed;

  return (
    <div
      className={`cover-img${className ? ` ${className}` : ''}`}
      style={showFallback ? { background: `linear-gradient(150deg, ${accent}, #5f3d1e)` } : undefined}
    >
      {showFallback ? (
        <span className="cover-img-emoji">{emoji}</span>
      ) : (
        <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
      )}
    </div>
  );
}
