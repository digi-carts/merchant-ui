'use client';

import { useEffect, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Input } from './input';

interface ColorInputProps {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  className?: string;
}

export function ColorInput({ value, onChange, label, className }: Readonly<ColorInputProps>) {
  const [open, setOpen] = useState(false);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const safeVal = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(value) ? value : '#000000';

  const handleToggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const pickerH = 260;
      const pickerW = 220;
      const top = rect.bottom + pickerH + 8 > window.innerHeight
        ? rect.top - pickerH - 8
        : rect.bottom + 8;
      const left = rect.left + pickerW > window.innerWidth
        ? window.innerWidth - pickerW - 8
        : rect.left;
      setPickerPos({ top, left });
    }
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={`relative flex items-center gap-2 ${className ?? ''}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="w-9 h-9 rounded-lg border-2 border-neutral-200 hover:border-neutral-400 active:scale-95 cursor-pointer shrink-0 transition-all shadow-sm"
        style={{ backgroundColor: safeVal }}
        title="Open color picker"
        aria-label={label ? `Pick color for ${label}` : 'Pick color'}
      />

      {open && (
        <div
          className="fixed z-[200] rounded-xl shadow-xl border border-neutral-200 bg-white p-3 space-y-2"
          style={{ top: pickerPos.top, left: pickerPos.left, maxWidth: 'calc(100vw - 2rem)', touchAction: 'none' }}>
          <HexColorPicker color={safeVal} onChange={onChange} style={{ width: '100%', minWidth: 180 }} />
          <Input
            value={value}
            onChange={e => onChange(e.target.value)}
            className="font-mono h-8 text-sm w-full"
            maxLength={7}
            placeholder="#000000"
          />
        </div>
      )}

      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="font-mono h-9 text-sm w-28"
        maxLength={7}
        placeholder="#000000"
      />
      {label && <span className="text-sm text-neutral-500 flex-1">{label}</span>}
    </div>
  );
}
