/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { LightBulbIcon } from './icons';
import Spinner from './Spinner';
import type { AiSuggestion } from '../services/geminiService';

interface SuggestionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    suggestions: AiSuggestion[] | null;
    onApplySuggestion: (prompt: string, title: string) => void;
}

const SuggestionsModal: React.FC<SuggestionsModalProps> = ({ isOpen, onClose, isLoading, suggestions, onApplySuggestion }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-md"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="suggestions-title"
        >
            <div 
                className="bg-[var(--surface-color-solid)] border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-lg p-6 relative flex flex-col gap-4"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-3">
                    <LightBulbIcon className="w-6 h-6 text-yellow-300" />
                    <h2 id="suggestions-title" className="text-xl font-bold text-white">AI Art Director</h2>
                </div>
                
                {isLoading && (
                    <div className="flex flex-col items-center justify-center gap-4 py-8">
                        <Spinner className="w-16 h-16 text-white" />
                        <p className="text-[var(--text-secondary)]">Analyzing your image...</p>
                    </div>
                )}
                
                {!isLoading && suggestions && (
                    <div className="flex flex-col gap-3 mt-2">
                        <p className="text-[var(--text-secondary)] text-sm">Here are a few ideas to enhance your photo. Click one to apply it.</p>
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => onApplySuggestion(suggestion.prompt, suggestion.title)}
                                className="w-full text-left p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-[var(--border-color)] transition-all duration-200 ease-in-out group"
                            >
                                <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-cyan-400">{suggestion.title}</h3>
                                <p className="text-sm text-gray-500 mt-1">{suggestion.prompt}</p>
                            </button>
                        ))}
                    </div>
                )}

                {!isLoading && !suggestions && (
                     <div className="text-center py-8">
                        <p className="text-red-400">Could not generate suggestions for this image.</p>
                     </div>
                )}

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                    aria-label="Close suggestions"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default SuggestionsModal;
