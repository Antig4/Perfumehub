import React from 'react';

export default function LoadingSpinner({ size = 4 }) {
  const s = `${size}rem`;
  return (
    <svg className="animate-spin" style={{ width: s, height: s }} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="3" stroke="#cbd5e1" strokeOpacity="0.25" fill="none" />
      <path d="M22 12a10 10 0 00-10-10" strokeWidth="3" stroke="#60a5fa" strokeLinecap="round" fill="none" />
    </svg>
  );
}
