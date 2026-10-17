import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface AdminOverlayModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/** Fullskjerm-modal over admin (unngår clipping i sticky header). */
export const AdminOverlayModal: React.FC<AdminOverlayModalProps> = ({ title, onClose, children }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl border border-stone-200 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-stone-200">
          <h3 className="text-base font-serif font-bold text-stone-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 cursor-pointer"
            aria-label="Lukk"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3 text-sm text-stone-800">{children}</div>
      </div>
    </div>,
    document.body
  );
};
