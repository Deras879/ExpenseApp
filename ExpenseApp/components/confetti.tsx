import { MotiView } from "moti";
import React from "react";
import { Dimensions, View } from "react-native";
import { Easing } from "react-native-reanimated";

const COLORS = [
  "#1457f6",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#facc15",
];

type Piece = {
  id: number;
  left: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  rotateStart: number;
  rotateEnd: number;
  drift: number;
  shape: "square" | "circle" | "rect";
};

const buildPieces = (count: number, width: number): Piece[] => {
  const arr: Piece[] = [];
  for (let i = 0; i < count; i++) {
    const size = 6 + Math.random() * 8;
    arr.push({
      id: i,
      left: Math.random() * width,
      size,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 600,
      duration: 1800 + Math.random() * 1400,
      rotateStart: Math.random() * 360,
      rotateEnd: Math.random() * 720 - 360,
      drift: (Math.random() - 0.5) * 160,
      shape:
        Math.random() < 0.33
          ? "circle"
          : Math.random() < 0.66
            ? "rect"
            : "square",
    });
  }
  return arr;
};

type ConfettiProps = {
  active: boolean;
  count?: number;
  onDone?: () => void;
};

export const Confetti: React.FC<ConfettiProps> = ({
  active,
  count = 80,
  onDone,
}) => {
  const { width, height } = Dimensions.get("window");
  const pieces = React.useMemo(() => buildPieces(count, width), [count, width]);

  React.useEffect(() => {
    if (!active || !onDone) return;
    const maxLife = Math.max(...pieces.map((p) => p.delay + p.duration));
    const t = setTimeout(onDone, maxLife + 100);
    return () => clearTimeout(t);
  }, [active, onDone, pieces]);

  if (!active) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        zIndex: 9999,
      }}
    >
      {pieces.map((p) => (
        <MotiView
          key={p.id}
          from={{
            translateY: -40,
            translateX: 0,
            rotate: `${p.rotateStart}deg`,
            opacity: 1,
          }}
          animate={{
            translateY: height + 60,
            translateX: p.drift,
            rotate: `${p.rotateStart + p.rotateEnd}deg`,
            opacity: 0,
          }}
          transition={{
            type: "timing",
            duration: p.duration,
            delay: p.delay,
            easing: Easing.in(Easing.quad),
          }}
          style={{
            position: "absolute",
            top: 0,
            left: p.left,
            width: p.shape === "rect" ? p.size * 0.5 : p.size,
            height: p.shape === "rect" ? p.size * 1.4 : p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === "circle" ? p.size : 2,
          }}
        />
      ))}
    </View>
  );
};

export default Confetti;
