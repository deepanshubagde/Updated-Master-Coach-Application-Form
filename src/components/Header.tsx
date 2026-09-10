import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="w-full px-2 sm:px-3 pt-2 sm:pt-3 pb-1">
      <div className="w-full bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-sm py-2.5 sm:py-3.5 flex justify-center items-center select-none">
        <div className="w-full flex justify-center items-center px-4">
          <img
            src="/monkhood-banner.png"
            alt="Monkhood Master Coach"
            className="h-[135px] sm:h-[150px] w-auto max-w-full object-contain block select-none rounded-lg sm:rounded-xl pointer-events-none"
            loading="eager"
            draggable={false}
          />
        </div>
      </div>
    </header>
  );
};

