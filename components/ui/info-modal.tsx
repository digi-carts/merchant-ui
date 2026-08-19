'use client';

import { ReactNode } from 'react';

interface InfoModalProps { title: string; children: ReactNode; onClose: () => void }

export function InfoModal({ title, children, onClose }: Readonly<InfoModalProps>) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-semibold text-base">{title}</h3>
          <button type="button" onClick={onClose}
            className="text-neutral-400 hover:text-black text-xl leading-none ml-4 shrink-0"
            aria-label="Close">×</button>
        </div>
        <div className="text-sm text-neutral-700 space-y-3">{children}</div>
      </div>
    </div>
  );
}
