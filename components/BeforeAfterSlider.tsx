/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useCallback, useEffect } from 'react';

const BeforeSVG = () => (
    <svg width="100%" height="100%" viewBox="0 0 500 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="fade">
                <feColorMatrix in="SourceGraphic" type="matrix" values="0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0 0 0 1 0" />
            </filter>
        </defs>
        <rect width="500" height="300" fill="#888" style={{filter: 'url(#fade)'}} />
        <text x="250" y="150" fontFamily="Inter, sans-serif" fontSize="24" fill="#fff" textAnchor="middle" alignmentBaseline="middle">Old Photo</text>
        {/* Scratches */}
        <line x1="50" y1="20" x2="450" y2="280" stroke="#fff" strokeWidth="1" opacity="0.4" />
        <line x1="10" y1="150" x2="490" y2="150" stroke="#fff" strokeWidth="0.5" opacity="0.3" />
        <line x1="480" y1="10" x2="20" y2="290" stroke="#000" strokeWidth="1" opacity="0.3" />
        <circle cx="100" cy="80" r="10" fill="white" opacity="0.1" />
        <rect x="300" y="200" width="80" height="15" fill="black" opacity="0.2" transform="rotate(15, 340, 207.5)" />
    </svg>
);

const AfterSVG = () => (
    <svg width="100%" height="100%" viewBox="0 0 500 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="afterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8A2BE2" />
                <stop offset="100%" stopColor="#00BFFF" />
            </linearGradient>
        </defs>
        <rect width="500" height="300" fill="url(#afterGradient)" />
        <text x="250" y="150" fontFamily="Inter, sans-serif" fontSize="24" fill="#fff" textAnchor="middle" alignmentBaseline="middle">Restored Photo</text>
    </svg>
);


const BeforeAfterSlider: React.FC = () => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleMove = useCallback((clientX: number) => {
        if (!isDragging.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percent = (x / rect.width) * 100;
        setSliderPosition(percent);
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        isDragging.current = true;
    };

    const handleUp = useCallback(() => {
        isDragging.current = false;
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        handleMove(e.clientX);
    }, [handleMove]);
    
    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (e.touches[0]) {
            handleMove(e.touches[0].clientX);
        }
    }, [handleMove]);


    useEffect(() => {
        const currentRef = containerRef.current;
        
        currentRef?.addEventListener('mousedown', handleMouseDown as any);
        currentRef?.addEventListener('touchstart', handleTouchStart as any, { passive: true });
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchend', handleUp);
        
        return () => {
            currentRef?.removeEventListener('mousedown', handleMouseDown as any);
            currentRef?.removeEventListener('touchstart', handleTouchStart as any);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchend', handleUp);
        };
    }, [handleMouseMove, handleTouchMove, handleUp, handleMouseDown, handleTouchStart]);


    return (
        <div className="mt-16 w-full max-w-3xl mx-auto flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold text-center text-[var(--text-primary)] tracking-tight">See the Magic in Action</h2>
             <p className="text-md text-center text-[var(--text-secondary)] -mt-2">Drag the slider to see the power of AI photo restoration.</p>

            <div
                ref={containerRef}
                className="relative w-full aspect-[5/3] rounded-2xl overflow-hidden select-none cursor-ew-resize border-2 border-[var(--border-color)] shadow-2xl shadow-black/50"
            >
                <div 
                    className="absolute inset-0 bg-cover bg-center"
                    aria-hidden="true"
                >
                    <AfterSVG />
                </div>
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                    aria-hidden="true"
                >
                    <BeforeSVG />
                </div>
                <div
                    className="absolute top-0 bottom-0 w-1 bg-white/50 backdrop-blur-sm cursor-ew-resize"
                    style={{ left: `calc(${sliderPosition}% - 2px)` }}
                    aria-hidden="true"
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 shadow-lg border-2 border-white flex items-center justify-center backdrop-blur-md">
                        <svg className="w-6 h-6 text-gray-700 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                    </div>
                </div>
                 <div className="absolute top-4 left-4 text-white font-bold text-lg bg-black/50 px-3 py-1 rounded-md pointer-events-none" aria-hidden="true">BEFORE</div>
                 <div className="absolute top-4 right-4 text-white font-bold text-lg bg-black/50 px-3 py-1 rounded-md pointer-events-none" aria-hidden="true">AFTER</div>
            </div>
        </div>
    );
};

export default BeforeAfterSlider;