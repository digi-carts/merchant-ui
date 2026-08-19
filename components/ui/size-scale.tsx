'use client';

import { Label } from '@/components/ui/label';

const LABELS = ['XS', 'S', 'M', 'L', 'XL'] as const;

export function parseSizeScale(value: unknown): number {
  if (value === 'sm') return 2;
  if (value === 'lg') return 4;
  if (value === 'md') return 3;
  const n = Number(value);
  if (n >= 1 && n <= 5) return n;
  return 3;
}

export function SizeScale({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const n = parseSizeScale(value);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Item Size</Label>
        <span className="text-xs font-medium tabular-nums">{LABELS[n - 1]}</span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={n}
        onChange={e => onChange(e.target.value)}
        className="w-full h-8 accent-black cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-neutral-400 px-0.5">
        <span>Small</span>
        <span>Large</span>
      </div>
    </div>
  );
}
