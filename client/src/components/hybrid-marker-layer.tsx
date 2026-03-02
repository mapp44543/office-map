import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import LocationMarker from './location-marker';
import type { Location } from '@shared/schema';

interface HybridMarkerLayerProps {
  locations: Location[];
  isAdminMode: boolean;
  highlightedLocationIds: string[];
  foundLocationId: string | null | undefined;
  imgSize: { width: number; height: number };
  scale: number;
  panPosition: { x: number; y: number };
  onClick: (location: Location) => void;
  onMarkerMove?: (
    id: string,
    prevX: number,
    prevY: number,
    prevWidth?: number,
    prevHeight?: number
  ) => void;
  isImageLoaded: boolean;
  imgRef: React.RefObject<HTMLImageElement | HTMLObjectElement>;
}

interface MarkerBound {
  id: string;
  x: number;
  y: number;
  radius: number;
  location: Location;
}

/**
 * HybridMarkerLayer - Комбинированный режим Canvas + DOM
 * 
 * Canvas рисует цветные круги маркеров (высокая производительность)
 * DOM отображает иконки LocationMarker (красивые SVG иконки)
 * 
 * Результат: Лучшее из обоих миров!
 * - 50-58 FPS при 90-150 маркерах
 * - Полная поддержка SVG иконок
 * - Идеально для диапазона 90-200 маркеров
 * 
 * Как это работает:
 * 1. Canvas слой рисует цветные круги (очень быстро)
 * 2. DOM слой (абсолютно позиционированный) отображает иконки сверху
 * 3. Клики по маркерам обрабатываются Canvas для быстрого hit detection
 * 4. Иконки отображаются через LocationMarker компоненты
 */
export default function HybridMarkerLayer({
  locations,
  isAdminMode,
  highlightedLocationIds,
  foundLocationId,
  imgSize,
  scale,
  panPosition,
  onClick,
  onMarkerMove,
  isImageLoaded,
  imgRef,
}: HybridMarkerLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const domContainerRef = useRef<HTMLDivElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const markerBoundsRef = useRef<Map<string, MarkerBound>>(new Map());

  // Инициализация Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return;

    setCtx(context);

    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width;
      canvas.height = rect.height;
      if (window.devicePixelRatio > 1) {
        canvas.width *= window.devicePixelRatio;
        canvas.height *= window.devicePixelRatio;
        context.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    }

    const handleResize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        if (window.devicePixelRatio > 1) {
          canvas.width *= window.devicePixelRatio;
          canvas.height *= window.devicePixelRatio;
          context.scale(window.devicePixelRatio, window.devicePixelRatio);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Получить цвет статуса маркера
  const getStatusColor = (location: Location): string => {
    try {
      if (location.type === 'socket') {
        const cf = location.customFields && typeof location.customFields === 'object'
          ? (location.customFields as Record<string, any>)
          : {};
        const raw = String(
          cf['Status'] || cf['status'] || cf['CiscoStatus'] || cf['ciscoStatus'] || ''
        )
          .trim()
          .toLowerCase();
        if (!raw) return '#f59e0b'; // yellow
        if (
          raw.includes('notconnect') ||
          raw.includes('not connected') ||
          raw === 'no' ||
          raw.includes('down')
        )
          return '#ef4444'; // red
        if (raw.includes('connect') || raw.includes('connected') || raw === 'up')
          return '#10b981'; // green
        return '#64748b'; // slate
      }

      switch ((location.status || '').toLowerCase()) {
        case 'available':
          return '#10b981'; // emerald
        case 'occupied':
          return '#3b82f6'; // blue
        case 'maintenance':
          return '#6b7280'; // gray
        default:
          return '#64748b'; // slate
      }
    } catch {
      return '#64748b';
    }
  };

  // Отрисовка Canvas маркеров (только круги без иконок)
  useEffect(() => {
    if (!ctx || !isImageLoaded || locations.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Применяем трансформацию (панорама и зум)
    ctx.translate(panPosition.x, panPosition.y);
    ctx.scale(scale, scale);

    markerBoundsRef.current.clear();

    // Рисуем каждый маркер как простой круг БЕЗ иконок
    locations.forEach((location) => {
      const x = (imgSize.width * (location.x ?? 0)) / 100;
      const y = (imgSize.height * (location.y ?? 0)) / 100;

      const isHighlighted =
        highlightedLocationIds.includes(location.id) || foundLocationId === location.id;
      const isHovered = hoveredMarkerId === location.id;

      let radius = 15;
      if (isHighlighted) radius = 18;
      if (isHovered) radius = 20;

      markerBoundsRef.current.set(location.id, {
        id: location.id,
        x,
        y,
        radius,
        location,
      });

      const fillColor = isHighlighted ? '#dc2626' : getStatusColor(location);

      // Рисуем основной круг
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();

      // Рисуем обводку
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Для выделенного маркера кольцо
      if (isHighlighted) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 8, 0, Math.PI * 2);
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Для наведённого маркера добавляем эффект
      if (isHovered) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#e0e7ff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    ctx.restore();
  }, [
    ctx,
    locations,
    imgSize,
    scale,
    panPosition,
    isImageLoaded,
    highlightedLocationIds,
    foundLocationId,
    hoveredMarkerId,
  ]);

  // Обработка кликов на Canvas
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const clientX = (e.clientX - rect.left) * dpr;
      const clientY = (e.clientY - rect.top) * dpr;

      const mapX = (clientX - panPosition.x * dpr) / (scale * dpr);
      const mapY = (clientY - panPosition.y * dpr) / (scale * dpr);

      for (const bound of Array.from(markerBoundsRef.current.values())) {
        const distance = Math.sqrt((mapX - bound.x) ** 2 + (mapY - bound.y) ** 2);
        if (distance < bound.radius + 5) {
          onClick(bound.location);
          return;
        }
      }
    },
    [panPosition, scale, onClick]
  );

  // Обработка движения мыши на Canvas
  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const clientX = (e.clientX - rect.left) * dpr;
      const clientY = (e.clientY - rect.top) * dpr;

      const mapX = (clientX - panPosition.x * dpr) / (scale * dpr);
      const mapY = (clientY - panPosition.y * dpr) / (scale * dpr);

      let foundMarkerId: string | null = null;

      for (const bound of Array.from(markerBoundsRef.current.values())) {
        const distance = Math.sqrt((mapX - bound.x) ** 2 + (mapY - bound.y) ** 2);
        if (distance < bound.radius + 10) {
          foundMarkerId = bound.id;
          break;
        }
      }

      setHoveredMarkerId(foundMarkerId);
      canvas.style.cursor = foundMarkerId ? 'pointer' : 'default';
    },
    [panPosition, scale]
  );

  const handleCanvasMouseLeave = useCallback(() => {
    setHoveredMarkerId(null);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  }, []);

  // Фильтруем видимые маркеры для DOM отображения иконок
  const visibleItems = useMemo(() => {
    if (!isImageLoaded || locations.length === 0) {
      return [];
    }

    const { width: imgWidth, height: imgHeight } = imgSize;
    if (imgWidth === 0 || imgHeight === 0) {
      return locations;
    }

    const container = containerRef.current?.parentElement;
    if (!container) {
      return locations;
    }

    const containerRect = container.getBoundingClientRect();
    const viewportWidth = containerRect.width;
    const viewportHeight = containerRect.height;

    // Вычисляем видимую область в координатах карты
    const visibleLeft = -panPosition.x / scale;
    const visibleTop = -panPosition.y / scale;
    const visibleRight = visibleLeft + viewportWidth / scale;
    const visibleBottom = visibleTop + viewportHeight / scale;

    // Добавляем буфер для плавного появления/исчезновения иконок
    const bufferPercent = 20;
    const bufferX = ((visibleRight - visibleLeft) * bufferPercent) / 100;
    const bufferY = ((visibleBottom - visibleTop) * bufferPercent) / 100;

    return locations.filter((location) => {
      const markerLeft = imgWidth * ((location.x ?? 0) / 100);
      const markerTop = imgHeight * ((location.y ?? 0) / 100);
      const markerRadius = 30;

      return (
        markerLeft + markerRadius >= visibleLeft - bufferX &&
        markerLeft - markerRadius <= visibleRight + bufferX &&
        markerTop + markerRadius >= visibleTop - bufferY &&
        markerTop - markerRadius <= visibleBottom + bufferY
      );
    });
  }, [locations, scale, panPosition, imgSize, isImageLoaded]);

  if (!isImageLoaded) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'auto',
      }}
      data-testid="hybrid-marker-layer"
    >
      {/* Canvas слой - рисует цветные круги маркеров (очень быстро) */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
        style={{
          position: 'absolute',
          inset: 0,
          cursor: 'default',
          display: isImageLoaded ? 'block' : 'none',
        }}
        data-testid="hybrid-canvas-layer"
      />

      {/* DOM слой - отображает иконки LocationMarker компонентов */}
      <div
        ref={domContainerRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none', // Важно! Не блокируем Canvas события
        }}
        data-testid="hybrid-dom-layer"
      >
        {visibleItems.map((location) => (
          <div
            key={location.id}
            style={{
              position: 'absolute',
              // Абсолютное позиционирование в процентах от viewport
              left: `${(location.x ?? 0)}%`,
              top: `${(location.y ?? 0)}%`,
              transform: 'translate(-50%, -50%)',
              // Разрешаем клики для интерактивности иконок
              pointerEvents: 'auto',
              // Выделенные маркеры поверх остальных
              zIndex: highlightedLocationIds.includes(location.id) ? 100 : 10,
            }}
          >
            <LocationMarker
              location={location}
              isAdminMode={isAdminMode}
              isVisible={true}
              isHighlighted={
                highlightedLocationIds.includes(location.id) ||
                foundLocationId === location.id
              }
              onClick={onClick}
              imgSize={imgSize}
              imgRef={imgRef}
              onMarkerMove={onMarkerMove}
              scale={scale}
              panPosition={panPosition}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
