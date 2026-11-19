import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const c = ref.current!;
    const ratio = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * ratio;
    c.height = c.offsetHeight * ratio;
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = getComputedStyle(c).color;
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={ref}
        aria-label="ช่องวาดลายเซ็น"
        className="h-48 w-full touch-none rounded-md border-2 border-dashed border-border bg-card text-primary"
        onPointerDown={(e) => {
          drawing.current = true;
          ref.current!.setPointerCapture(e.pointerId);
          const ctx = ref.current!.getContext("2d")!;
          const p = pos(e);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = ref.current!.getContext("2d")!;
          const p = pos(e);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          if (empty) setEmpty(false);
        }}
        onPointerUp={() => {
          drawing.current = false;
          if (!empty) onChange(ref.current!.toDataURL("image/png"));
        }}
      />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>วาดลายเซ็นในกรอบด้านบน</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const c = ref.current!;
            c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
            setEmpty(true);
            onChange(null);
          }}
        >
          ล้าง
        </Button>
      </div>
    </div>
  );
}
