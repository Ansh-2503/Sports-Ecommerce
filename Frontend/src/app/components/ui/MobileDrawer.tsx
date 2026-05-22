import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  children: React.ReactNode;
  side?: 'left' | 'right' | 'bottom';
}

export function MobileDrawer({ isOpen, onClose, title, children, side = 'left' }: MobileDrawerProps) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const sideClasses = {
    left: 'inset-y-0 left-0 w-3/4 max-w-sm border-r',
    right: 'inset-y-0 right-0 w-3/4 max-w-sm border-l',
    bottom: 'inset-x-0 bottom-0 h-3/4 border-t rounded-t-xl',
  };

  const transformClasses = {
    left: isOpen ? 'translate-x-0' : '-translate-x-full',
    right: isOpen ? 'translate-x-0' : 'translate-x-full',
    bottom: isOpen ? 'translate-y-0' : 'translate-y-full',
  };

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* Overlay */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div 
        className={`absolute bg-card shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${sideClasses[side]} ${transformClasses[side]}`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="font-bold text-lg">{title}</div>
          <button 
            onClick={onClose}
            className="p-2 rounded-md hover:bg-secondary transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
