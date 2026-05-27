import { useCallback, useRef } from "react";

interface UseLongPressOptions {
  delay?: number;
  moveThreshold?: number;
}

export function useLongPress(
  onLongPress: (clientX: number, clientY: number) => void,
  options: UseLongPressOptions = {}
) {
  const { delay = 420, moveThreshold = 8 } = options;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPos.current = null;
    fired.current = false;
  }, []);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      startPos.current = { x: touch.clientX, y: touch.clientY };
      fired.current = false;
      timerRef.current = setTimeout(() => {
        if (startPos.current) {
          fired.current = true;
          onLongPress(startPos.current.x, startPos.current.y);
        }
        timerRef.current = null;
      }, delay);
    },
    [delay, onLongPress]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!startPos.current) return;
      const touch = e.touches[0];
      const dx = touch.clientX - startPos.current.x;
      const dy = touch.clientY - startPos.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > moveThreshold) {
        cancel();
      }
    },
    [cancel, moveThreshold]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (fired.current) {
        // Prevent the subsequent tap from firing after long press
        e.preventDefault();
      }
      cancel();
    },
    [cancel]
  );

  const onTouchCancel = useCallback(() => {
    cancel();
  }, [cancel]);

  return { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel };
}
