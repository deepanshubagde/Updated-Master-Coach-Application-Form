import React from 'react';
import { Star } from 'lucide-react';

interface RatingInputProps {
  value: number | null;
  onChange: (val: number) => void;
  error?: string;
  id?: string;
}

export const RatingInput: React.FC<RatingInputProps> = ({
  value,
  onChange,
  error,
  id = 'q9_interest_rate',
}) => {
  const [hovered, setHovered] = React.useState<number | null>(null);

  const ratings = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div id={id} className="space-y-3">
      {/* 1 to 10 Button Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2">
        {ratings.map((num) => {
          const isSelected = value === num;
          const isHoveredOrBelow = hovered !== null && num <= hovered;
          const isSelectedOrBelow = value !== null && num <= value;

          return (
            <button
              key={num}
              type="button"
              id={`rating-btn-${num}`}
              onClick={() => onChange(num)}
              onMouseEnter={() => setHovered(num)}
              onMouseLeave={() => setHovered(null)}
              className={`group flex flex-col items-center justify-center py-2.5 sm:py-3 px-1 rounded-xl transition-all duration-150 border text-center ${
                isSelected
                  ? 'bg-amber-500 border-amber-600 text-white font-bold shadow-md ring-2 ring-amber-400/40 scale-105'
                  : isHoveredOrBelow
                  ? 'bg-amber-50 border-amber-400 text-amber-900'
                  : 'bg-white border-neutral-300 text-neutral-800 hover:bg-amber-50/50 hover:border-neutral-400'
              }`}
            >
              <Star
                className={`w-3.5 h-3.5 mb-1 transition-colors ${
                  isSelected
                    ? 'fill-white text-white'
                    : isSelectedOrBelow || isHoveredOrBelow
                    ? 'fill-amber-500 text-amber-500'
                    : 'fill-transparent text-neutral-400 group-hover:text-amber-500'
                }`}
              />
              <span className="text-sm sm:text-base font-semibold">{num}</span>
            </button>
          );
        })}
      </div>

      {/* Scale Legend */}
      <div className="flex justify-between items-center text-xs text-neutral-600 px-1 font-medium">
        <span className="flex items-center gap-1 text-neutral-600">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
          1 = Not Interested
        </span>
        {value !== null && (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold border border-amber-300 text-xs">
            Selected: {value} / 10
          </span>
        )}
        <span className="flex items-center gap-1 text-amber-700">
          10 = Very Interested
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
        </span>
      </div>

      {error && <p className="text-xs text-red-600 font-medium mt-1">{error}</p>}
    </div>
  );
};
