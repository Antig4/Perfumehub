import React from 'react';

export default function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="bg-navy-900 rounded-lg shadow-lg p-6 z-10 w-full max-w-md">
        {title && <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>}
        <div>{children}</div>
      </div>
    </div>
  );
}
