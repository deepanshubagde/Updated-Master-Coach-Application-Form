import React from 'react';
import { Lock } from 'lucide-react';

interface HeaderProps {
  onOpenCoachModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCoachModal }) => {
  return (
    <header className="w-full px-2 sm:px-3 pt-2 sm:pt-3 pb-1">
      <div className="w-full bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-sm py-2.5 sm:py-3.5 flex justify-center items-center relative">
        <div className="w-full flex justify-center items-center px-4">
          <img
            src="/monkhood-banner.png"
            alt="Monkhood Master Coach"
            className="h-[135px] sm:h-[150px] w-auto max-w-full object-contain block select-none rounded-lg sm:rounded-xl"
            loading="eager"
          />
        </div>
        {onOpenCoachModal && (
          <button
            type="button"
            onClick={onOpenCoachModal}
            title="Coach Data & Google Sheet Portal"
            className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-amber-400 transition cursor-pointer border border-neutral-800"
            aria-label="Coach Portal"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
};

