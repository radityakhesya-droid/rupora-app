'use client';

import React from 'react';

export function BrandLogo({ darkText = true }: { darkText?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#172A3A] shadow-sm">
        <svg viewBox="0 0 36 36" className="h-6 w-6" fill="none">
          <rect x="6" y="20" width="3.5" height="8" rx="1.5" fill="#356DFF" />
          <rect x="11.5" y="15" width="3.5" height="13" rx="1.5" fill="#60A5FA" />
          <rect x="17" y="11" width="3.5" height="17" rx="1.5" fill="#FFFFFF" />
          <path
            d="M7 14C12 8 22 7 28 11C31 13 30 19 24 21L29 28H23.5L19.5 22H15"
            stroke="#356DFF"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex flex-col">
        <span
          className={`${
            darkText ? 'text-[#17212B] dark:text-white' : 'text-white'
          } font-display text-lg font-bold tracking-[0.14em] leading-none`}
        >
          RUPORA
        </span>
        <span className="mt-1 text-[9px] font-medium tracking-[0.18em] text-[#8B95A5] uppercase">
          Market Pulse
        </span>
      </div>
    </div>
  );
}
