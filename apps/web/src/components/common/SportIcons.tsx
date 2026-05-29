import React from 'react';

export const PadelIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M14 2C9.58172 2 6 5.58172 6 10C6 13.9168 8.81605 17.1751 12.5 17.8844V21.5C12.5 22.3284 13.1716 23 14 23C14.8284 23 15.5 22.3284 15.5 21.5V17.8844C19.1839 17.1751 22 13.9168 22 10C22 5.58172 18.4183 2 14 2Z" fill="url(#padel-grad)" />
    <circle cx="10" cy="8" r="1" fill="white" fillOpacity="0.4" />
    <circle cx="10" cy="12" r="1" fill="white" fillOpacity="0.4" />
    <circle cx="14" cy="6" r="1" fill="white" fillOpacity="0.4" />
    <circle cx="14" cy="10" r="1" fill="white" fillOpacity="0.4" />
    <circle cx="14" cy="14" r="1" fill="white" fillOpacity="0.4" />
    <circle cx="18" cy="8" r="1" fill="white" fillOpacity="0.4" />
    <circle cx="18" cy="12" r="1" fill="white" fillOpacity="0.4" />
    <defs>
      <linearGradient id="padel-grad" x1="6" y1="2" x2="22" y2="23" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3b82f6" />
        <stop offset="1" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
  </svg>
);

export const TennisIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="10" fill="url(#tennis-grad)" />
    <path d="M6 3.5C8 6 9 9 9 12C9 15 8 18 6 20.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <path d="M18 3.5C16 6 15 9 15 12C15 15 16 18 18 20.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <defs>
      <linearGradient id="tennis-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#10b981" />
        <stop offset="1" stopColor="#059669" />
      </linearGradient>
    </defs>
  </svg>
);

export const BadmintonIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 22C14.2091 22 16 20.2091 16 18H8C8 20.2091 9.79086 22 12 22Z" fill="url(#badminton-base)" />
    <path d="M8 17L4 5C6 4 9 7 12 7C15 7 18 4 20 5L16 17H8Z" fill="url(#badminton-feathers)" />
    <path d="M12 7V17" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
    <path d="M9 6.5L10.5 17" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
    <path d="M15 6.5L13.5 17" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
    <defs>
      <linearGradient id="badminton-base" x1="8" y1="18" x2="16" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f43f5e" />
        <stop offset="1" stopColor="#e11d48" />
      </linearGradient>
      <linearGradient id="badminton-feathers" x1="4" y1="5" x2="20" y2="17" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ffffff" />
        <stop offset="1" stopColor="#cbd5e1" />
      </linearGradient>
    </defs>
  </svg>
);

export const TableTennisIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M15 3C10.5817 3 7 6.58172 7 11C7 13.0645 7.78187 14.9463 9.0622 16.3686L6.16641 19.2644C5.58062 19.8502 5.58062 20.8001 6.16641 21.3858C6.75219 21.9716 7.7021 21.9716 8.28789 21.3858L11.1837 18.4901C12.6059 19.7704 14.4878 20.5523 16.5523 20.5523C20.9705 20.5523 24.5523 16.9705 24.5523 12.5523C24.5523 8.13401 20.9705 3 16.5523 3H15Z" fill="url(#tt-grad)" />
    <circle cx="5" cy="7" r="3" fill="#facc15" />
    <defs>
      <linearGradient id="tt-grad" x1="6" y1="3" x2="24" y2="21" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ef4444" />
        <stop offset="1" stopColor="#b91c1c" />
      </linearGradient>
    </defs>
  </svg>
);
