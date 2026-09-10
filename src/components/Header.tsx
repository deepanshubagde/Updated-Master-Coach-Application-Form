import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-0">
      <div className="w-full bg-black rounded-2xl overflow-hidden shadow-sm py-3 sm:py-4 flex justify-center items-center select-none">
        <div className="w-full flex justify-center items-center px-3 sm:px-6">
          <img
            src="/monkhood-banner.png"
            alt="Monkhood Master Coach"
            className="h-[125px] sm:h-[140px] w-auto max-w-full object-contain block select-none rounded-xl pointer-events-none"
            loading="eager"
            draggable={false}
          />
        </div>
      </div>
    </header>
  );
};

