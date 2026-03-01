import React from 'react';
import Link from 'next/link';
import { TERMS_OF_SERVICE } from '../../lib/LegalTexts';

export const metadata = {
    title: 'Terms of Service | Vynthen AI',
    description: 'Terms of Service for Vynthen AI.',
};

export default function TermsOfServicePage() {
    return (
        <div className="min-h-[100dvh] flex items-center justify-center p-4 sm:p-6 bg-[color:var(--vynthen-bg)]">
            <div className="w-full max-w-2xl max-h-[85vh] bg-[color:var(--vynthen-bg)] border border-[color:var(--vynthen-border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[color:var(--vynthen-border)] bg-[color:var(--vynthen-bg-secondary)]">
                    <h2 className="text-lg font-semibold text-[color:var(--vynthen-fg)]">
                        Terms of Service
                    </h2>
                    <Link href="/" className="w-8 h-8 flex items-center justify-center rounded-full text-[color:var(--vynthen-fg-muted)] hover:bg-[color:var(--vynthen-border)] hover:text-[color:var(--vynthen-fg)] transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </Link>
                </div>
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 text-[14px] leading-relaxed text-[color:var(--vynthen-fg)] whitespace-pre-wrap">
                    {TERMS_OF_SERVICE}
                </div>
                {/* Footer */}
                <div className="px-6 py-4 border-t border-[color:var(--vynthen-border)] bg-[color:var(--vynthen-bg-secondary)] flex justify-end">
                    <Link href="/" className="px-5 py-2 rounded-xl bg-[color:var(--vynthen-fg)] text-[color:var(--vynthen-bg)] font-medium hover:opacity-90 transition-opacity">
                        Close
                    </Link>
                </div>
            </div>
        </div>
    );
}
