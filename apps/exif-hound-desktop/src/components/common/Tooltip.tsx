import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { placeTooltip, type TooltipPosition } from './tooltipPlacement';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: TooltipPosition;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [ready, setReady] = useState(false);
  const tooltipId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!isVisible) {
      setReady(false);
      return;
    }
    if (!triggerRef.current || !tooltipRef.current) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      const tooltip = tooltipRef.current;
      if (!trigger || !tooltip) return;
      const placed = placeTooltip(
        trigger.getBoundingClientRect(),
        { width: tooltip.offsetWidth, height: tooltip.offsetHeight },
        position,
        { width: window.innerWidth, height: window.innerHeight },
      );
      setCoords({ top: placed.top, left: placed.left });
      setReady(true);
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isVisible, content, position]);

  const hide = () => {
    setIsVisible(false);
    setReady(false);
  };

  return (
    <span
      ref={triggerRef}
      className={`inline-flex max-w-full ${className}`.trim()}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={hide}
      onFocusCapture={() => setIsVisible(true)}
      onBlurCapture={hide}
      onKeyDown={(event) => { if (event.key === 'Escape') hide(); }}
    >
      {React.isValidElement(children) ? React.cloneElement(children as React.ReactElement<{ 'aria-describedby'?: string }>, {
        'aria-describedby': isVisible ? tooltipId : undefined,
      }) : children}
      {isVisible && createPortal(
        <span
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          style={{ top: coords.top, left: coords.left }}
          className={`pointer-events-none fixed z-[80] max-w-64 rounded border border-app-gray-light bg-app-gray px-2 py-1 text-left text-xs leading-relaxed text-app-white shadow-lg ${ready ? '' : 'invisible'}`}
        >
          {content}
        </span>,
        document.body,
      )}
    </span>
  );
};
