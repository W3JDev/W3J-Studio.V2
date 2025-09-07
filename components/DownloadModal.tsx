/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { CrownIcon } from './icons';

export interface DownloadOptions {
    format: 'png' | 'jpeg';
    quality: number; // 1-100 for jpeg
    upscale: boolean;
    addWatermark: boolean;
}

interface DownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (options: DownloadOptions) => void;
}

const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [format, setFormat] = useState<'png' | 'jpeg'>('png');
    const [quality, setQuality] = useState(90);
    const [upscale, setUpscale] = useState(false);
    const [addWatermark, setAddWatermark] = useState(true);

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm({ format, quality, upscale, addWatermark });
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-md"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="download-title"
        >
            <div
                className="bg-[var(--surface-color-solid)] border border-[var(--border-color)] rounded-2xl shadow-2xl w-full max-w-md p-8 relative flex flex-col gap-6"
                onClick={e => e.stopPropagation()}
            >
                <div className="text-center">
                    <h2 id="download-title" className="text-2xl font-bold text-white">Download Options</h2>
                    <p className="text-[var(--text-secondary)] mt-1">Choose your export settings.</p>
                </div>

                {/* File Format */}
                <div className="flex flex-col gap-2">
                    <label className="font-semibold text-[var(--text-primary)]">File Format</label>
                    <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-lg">
                        <button
                            onClick={() => setFormat('png')}
                            className={`w-full py-2 rounded-md text-base font-semibold transition-all duration-200 ${format === 'png' ? 'bg-white/10 text-white shadow-md' : 'bg-transparent text-[var(--text-secondary)] hover:text-white hover:bg-white/5'}`}
                        >PNG</button>
                        <button
                            onClick={() => setFormat('jpeg')}
                            className={`w-full py-2 rounded-md text-base font-semibold transition-all duration-200 ${format === 'jpeg' ? 'bg-white/10 text-white shadow-md' : 'bg-transparent text-[var(--text-secondary)] hover:text-white hover:bg-white/5'}`}
                        >JPEG</button>
                    </div>
                </div>

                {/* Quality Slider for JPEG */}
                {format === 'jpeg' && (
                    <div className="flex flex-col gap-2 animate-fade-in">
                        <label htmlFor="quality-slider" className="font-semibold text-[var(--text-primary)]">Quality: <span className="text-cyan-400">{quality}%</span></label>
                        <input
                            id="quality-slider"
                            type="range"
                            min="10"
                            max="100"
                            step="1"
                            value={quality}
                            onChange={e => setQuality(Number(e.target.value))}
                            className="w-full h-2 bg-black/30 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>
                )}
                
                {/* AI Upscaling */}
                <div className="flex flex-col gap-2">
                     <div className="flex items-center justify-between">
                         <label className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                             Resolution
                         </label>
                         <span className="text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CrownIcon className="w-3 h-3"/> PRO
                         </span>
                     </div>
                     <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-lg">
                         <button
                             onClick={() => setUpscale(false)}
                             className={`w-full py-2 rounded-md text-base font-semibold transition-all duration-200 ${!upscale ? 'bg-white/10 text-white shadow-md' : 'bg-transparent text-[var(--text-secondary)] hover:text-white hover:bg-white/5'}`}
                         >Standard (1x)</button>
                         <button
                             onClick={() => setUpscale(true)}
                             className={`w-full py-2 rounded-md text-base font-semibold transition-all duration-200 ${upscale ? 'bg-white/10 text-white shadow-md' : 'bg-transparent text-[var(--text-secondary)] hover:text-white hover:bg-white/5'}`}
                         >High-Res (2x Upscale)</button>
                     </div>
                </div>

                {/* Watermark */}
                 <div className="flex items-center justify-between bg-black/20 p-3 rounded-lg">
                     <label htmlFor="watermark-toggle" className="font-semibold text-[var(--text-primary)] cursor-pointer">Add Watermark</label>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            id="watermark-toggle"
                            type="checkbox" 
                            checked={addWatermark}
                            onChange={() => setAddWatermark(!addWatermark)}
                            className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-cyan-500/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                    </label>
                 </div>
                
                {/* Action Button */}
                <button
                    onClick={handleConfirm}
                    className="w-full mt-2 bg-green-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base"
                >
                    Download Image
                </button>
                
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                    aria-label="Close download options"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default DownloadModal;
