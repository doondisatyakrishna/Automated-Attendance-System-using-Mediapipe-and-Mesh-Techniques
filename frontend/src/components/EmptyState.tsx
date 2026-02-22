import React from 'react';
import { PlusIcon } from '@heroicons/react/24/solid';

// Define the props the component will accept
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  ctaText?: string; // Optional call-to-action button text
  onCtaClick?: () => void; // Optional function for the button
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, ctaText, onCtaClick }) => {
  return (
    <div className="text-center bg-slate-50 p-8 rounded-lg border-2 border-dashed border-slate-200">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-200">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-800">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{message}</p>
      {ctaText && onCtaClick && (
        <div className="mt-6">
          <button
            type="button"
            onClick={onCtaClick}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            {ctaText}
          </button>
        </div>
      )}
    </div>
  );
};