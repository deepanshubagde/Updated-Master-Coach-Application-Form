import React from 'react';
import { Check } from 'lucide-react';

interface OptionItem {
  label: string;
  value: string;
}

interface RadioGroupProps {
  name: string;
  options: (string | OptionItem)[];
  value: string;
  onChange: (val: string) => void;
  error?: string;
  columns?: 1 | 2 | 4;
  id?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  options,
  value,
  onChange,
  error,
  columns = 1,
  id,
}) => {
  const normalizedOptions: OptionItem[] = options.map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  const getGridClass = () => {
    if (columns === 4) return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5';
    if (columns === 2) return 'grid grid-cols-1 sm:grid-cols-2 gap-2.5';
    return 'flex flex-col gap-2.5';
  };

  return (
    <div id={id || `group-${name}`} className="space-y-2">
      <div className={getGridClass()} role="radiogroup" aria-label={name}>
        {normalizedOptions.map((option, idx) => {
          const isSelected = value === option.value;
          const optionId = `${name}-opt-${idx}`;

          return (
            <label
              key={option.value}
              htmlFor={optionId}
              id={`label-${optionId}`}
              className={`relative flex items-center justify-between p-3.5 sm:p-4 rounded-xl cursor-pointer border text-left transition-all duration-150 select-none ${
                isSelected
                  ? 'bg-amber-50/70 border-amber-600 shadow-sm ring-1 ring-amber-500'
                  : 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-50 hover:border-neutral-400'
              }`}
            >
              <div className="flex items-center gap-3 pr-2 min-w-0">
                {/* Visual radio indicator */}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border transition-all ${
                    isSelected
                      ? 'bg-amber-600 border-amber-600 text-white shadow-sm'
                      : 'border-neutral-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>

                <span
                  className={`text-sm sm:text-base leading-snug break-words ${
                    isSelected ? 'text-neutral-950 font-semibold' : 'text-neutral-800'
                  }`}
                >
                  {option.label}
                </span>
              </div>

              {/* Hidden real radio for accessibility */}
              <input
                type="radio"
                id={optionId}
                name={name}
                value={option.value}
                checked={isSelected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
            </label>
          );
        })}
      </div>

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
};
