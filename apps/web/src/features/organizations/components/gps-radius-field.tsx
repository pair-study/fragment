"use client";

import { MapPin, MapPinOff } from "lucide-react";

import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type GpsRadiusFieldProps = {
  value: number;
  hasAddress: boolean;
  onChange: (value: number) => void;
};

export function GpsRadiusField({ value, hasAddress, onChange }: GpsRadiusFieldProps) {
  const radiusSize = `${5 + ((value - 50) / 250) * 10}rem`;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface-secondary">
      <div className="relative flex h-72 items-center justify-center overflow-hidden bg-surface-tertiary">
        {hasAddress ? (
          <>
            <div className="absolute inset-0 grid grid-cols-8 grid-rows-5 opacity-60">
              {Array.from({ length: 40 }).map((_, index) => (
                <span key={index} className="border border-border" />
              ))}
            </div>
            <div className="absolute inset-x-0 top-1/2 h-4 -translate-y-1/2 bg-card" />
            <div className="absolute inset-y-0 left-1/3 w-4 bg-card" />
            <div
              className="absolute rounded-full border-2 border-primary bg-primary/15 transition-[width,height]"
              style={{ width: radiusSize, height: radiusSize }}
            />
            <MapPin className="relative size-8 text-primary drop-shadow-sm" />
            <span className="absolute bottom-4 right-4 rounded-md bg-card/80 px-2 py-1 text-xs text-muted-foreground">
              지도 · 와이어프레임
            </span>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <MapPinOff className="size-8" />
            <p className="text-sm">주소를 선택하면 지도가 표시돼요</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-5 border-t border-border bg-card px-5 py-4">
        <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-text-body">
          반경
        </span>
        <Slider
          min={50}
          max={300}
          step={10}
          value={[value]}
          onValueChange={(next) => onChange(next[0] ?? 100)}
          className={cn(!hasAddress && "opacity-60")}
        />
        <span className="w-16 text-right text-lg font-bold tabular-nums text-primary">
          {value}m
        </span>
      </div>
    </div>
  );
}
