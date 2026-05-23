"use client";

import { useEffect, useRef, useState } from "react";

const TICK_MS = 4000;
const DELTA_RANGE = 300;

export function useAnimatedRate(realRate: number | null): { displayed: number | null; ticked: number } {
  const [displayed, setDisplayed] = useState<number | null>(realRate);
  const [ticked, setTicked] = useState(0);
  const baseRef = useRef(realRate);

  useEffect(() => {
    baseRef.current = realRate;
    setDisplayed(realRate);
  }, [realRate]);

  useEffect(() => {
    if (!realRate) return;
    const id = setInterval(() => {
      const delta = Math.round((Math.random() * 2 - 1) * DELTA_RANGE);
      setDisplayed((baseRef.current ?? 0) + delta);
      setTicked((n) => n + 1);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [realRate]);

  return { displayed, ticked };
}
