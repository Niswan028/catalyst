// Reusable Card component
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export default function Card({ children, className = '', title }: CardProps) {
  return (
    <div className={`bg-white dark:bg-stone-900 rounded-2xl border border-[#e6dfd3] dark:border-stone-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-6 sm:p-7 ${className}`}>
      {title && <h3 className="font-serif text-2xl font-normal tracking-tight mb-4 text-stone-900 dark:text-stone-100">{title}</h3>}
      {children}
    </div>
  );
}

