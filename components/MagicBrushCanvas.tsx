/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useEffect, useState, useCallback } from 'react';

type EditTool = 'brush' | 'erase';

interface MagicBrushCanvasProps {
    imageDimensions: { width: number; height: number; naturalWidth: number, naturalHeight: number };
    tool: EditTool;
    brushSize: number;
    onMaskChange: (mask: string | null) => void;
    initialMask: string | null;
}

const MagicBrushCanvas: React.FC<MagicBrushCanvasProps> = ({ imageDimensions, tool, brushSize, onMaskChange, initialMask }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cursorRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const lastPos = useRef({ x: 0, y: 0 });

    const scaleX = imageDimensions.naturalWidth / imageDimensions.width;
    const scaleY = imageDimensions.naturalHeight / imageDimensions.height;
    
    // Effect to synchronize the canvas with the parent component's mask state
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (initialMask) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
            };
            img.src = initialMask;
        }
    }, [initialMask]);


    const getMousePos = useCallback((e: MouseEvent | React.MouseEvent | TouchEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    }, []);

    const draw = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDrawing) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        const pos = getMousePos(e);
        
        ctx.globalCompositeOperation = tool === 'brush' ? 'source-over' : 'destination-out';
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = brushSize * scaleX;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(lastPos.current.x * scaleX, lastPos.current.y * scaleY);
        ctx.lineTo(pos.x * scaleX, pos.y * scaleY);
        ctx.stroke();
        
        lastPos.current = pos;

    }, [isDrawing, tool, brushSize, getMousePos, scaleX, scaleY]);


    const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        lastPos.current = getMousePos(e);
    }, [getMousePos]);
    
    const handleMouseUp = useCallback(() => {
        if (isDrawing) {
            setIsDrawing(false);
            const canvas = canvasRef.current;
            if (!canvas) {
                onMaskChange(null);
                return;
            }

            // Check if the canvas is empty
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const hasContent = imageData.data.some(channel => channel !== 0);
                if (hasContent) {
                    onMaskChange(canvas.toDataURL('image/png'));
                } else {
                    onMaskChange(null);
                }
            } else {
                onMaskChange(canvas.toDataURL('image/png'));
            }
        }
    }, [isDrawing, onMaskChange]);
    
    const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
        draw(e);
         if (cursorRef.current) {
            const pos = getMousePos(e);
            cursorRef.current.style.left = `${pos.x}px`;
            cursorRef.current.style.top = `${pos.y}px`;
        }
    }, [draw, getMousePos]);
    
    useEffect(() => {
        const handleMove = (e: MouseEvent) => handleMouseMove(e);
        const handleTouchMove = (e: TouchEvent) => handleMouseMove(e);

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('touchend', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);


    return (
        <>
            <canvas
                ref={canvasRef}
                width={imageDimensions.naturalWidth}
                height={imageDimensions.naturalHeight}
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
                className="absolute top-0 left-0 w-full h-full pointer-events-auto z-20"
                style={{ imageRendering: 'pixelated' }}
            />
            <div
                ref={cursorRef}
                className="absolute rounded-full border-2 bg-transparent pointer-events-none -translate-x-1/2 -translate-y-1/2 z-30 transition-colors duration-100"
                style={{
                    width: `${brushSize}px`,
                    height: `${brushSize}px`,
                    borderColor: tool === 'brush' ? 'white' : 'red',
                    boxShadow: '0 0 0 2px black',
                }}
            />
        </>
    );
};

export default MagicBrushCanvas;