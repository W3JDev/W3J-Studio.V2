/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import Spinner from './Spinner';
import { MagicWandIcon, PointIcon, BrushIcon, EraserIcon } from './icons';

type EditTool = 'point' | 'brush' | 'erase';

interface EditToolbarProps {
    prompt: string;
    onPromptChange: (value: string) => void;
    onGenerate: () => void;
    onRemove: () => void;
    isLoading: boolean;
    isEnhancing: boolean;
    onEnhance: () => void;
    activeTool: EditTool;
    onToolChange: (tool: EditTool) => void;
    brushSize: number;
    onBrushSizeChange: (size: number) => void;
    canGenerate: boolean;
    canRemove: boolean;
    activeLayer: { id: string, prompt: string } | null;
    maskImage: string | null;
}

const EditToolbar: React.FC<EditToolbarProps> = (props) => {
    const {
        prompt, onPromptChange, onGenerate, onRemove, isLoading, isEnhancing, onEnhance,
        activeTool, onToolChange, brushSize, onBrushSizeChange, canGenerate, canRemove, activeLayer, maskImage
    } = props;
    
    const tools = [
        { id: 'point', name: 'Add Point', icon: PointIcon },
        { id: 'brush', name: 'Brush', icon: BrushIcon },
        { id: 'erase', name: 'Erase', icon: EraserIcon },
    ];
    
    const getHelperText = () => {
        if (activeLayer) return 'Describe your changes to the selected layer below.';
        if (activeTool === 'point') return 'Click the background to add a new element.';
        if (activeTool === 'brush' || activeTool === 'erase') return 'Paint over an area to select it for editing or removal.';
        return '';
    };

    const isToolDisabled = (toolId: string) => {
        if (isLoading) return true;
        // Disable point tool if a layer is being edited (requires a mask).
        if (activeLayer && toolId === 'point') return true;
        // Don't disable brush/erase when layer is active.
        return false;
    }

    return (
        <div className="w-full bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-6 flex flex-col gap-4 animate-fade-in backdrop-blur-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-lg">
                    {tools.map(tool => (
                        <button
                            key={tool.id}
                            onClick={() => onToolChange(tool.id as EditTool)}
                            disabled={isToolDisabled(tool.id)}
                            className={`px-4 py-2 rounded-md text-base font-semibold transition-all duration-200 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                            activeTool === tool.id
                                ? 'bg-white/10 text-white shadow-md'
                                : 'bg-transparent hover:bg-white/5 text-[var(--text-secondary)] hover:text-white'
                            }`}
                        >
                            <tool.icon className="w-5 h-5" />
                            <span className="hidden sm:inline">{tool.name}</span>
                        </button>
                    ))}
                </div>
                {activeTool !== 'point' && (
                    <div className="flex items-center gap-3 w-full md:w-auto md:max-w-xs animate-fade-in">
                        <label htmlFor="brush-size" className="text-sm font-semibold text-[var(--text-secondary)] whitespace-nowrap">Brush Size</label>
                        <input
                            id="brush-size"
                            type="range"
                            min="5"
                            max="100"
                            step="1"
                            value={brushSize}
                            onChange={(e) => onBrushSizeChange(Number(e.target.value))}
                            className="w-full h-2 bg-black/30 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            disabled={isLoading}
                        />
                    </div>
                )}
            </div>
            
            <p className="text-md text-[var(--text-secondary)] text-center">{getHelperText()}</p>
            
            <form onSubmit={(e) => { e.preventDefault(); if (canGenerate) onGenerate(); }} className="w-full flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-grow w-full">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => onPromptChange(e.target.value)}
                        placeholder={activeLayer ? "e.g., 'make it blue'" : "e.g., 'a bird flying' or 'remove the car'"}
                        className="bg-black/30 border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg p-4 text-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 pr-24"
                        disabled={isLoading || isEnhancing}
                    />
                    {activeTool !== 'point' && maskImage && (
                        <BrushIcon className="absolute right-12 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400 pointer-events-none animate-fade-in" aria-hidden="true" />
                    )}
                    <button
                        type="button"
                        onClick={onEnhance}
                        disabled={!prompt.trim() || isEnhancing || isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-400 hover:text-cyan-400 hover:bg-white/10 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Enhance Prompt"
                    >
                        {isEnhancing ? <Spinner className="w-5 h-5 text-white" /> : <MagicWandIcon className="w-5 h-5" />}
                    </button>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        type="submit"
                        className="w-full bg-[var(--brand-gradient)] text-white font-bold py-4 px-6 text-lg rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-cyan-500/30 hover:-translate-y-px active:scale-95 active:shadow-inner disabled:opacity-60 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
                        disabled={isLoading || !canGenerate}
                    >
                        {activeLayer ? 'Update' : 'Generate'}
                    </button>
                    {activeTool !== 'point' && !activeLayer && (
                         <button
                            type="button"
                            onClick={onRemove}
                            className="w-full bg-red-600 text-white font-bold py-4 px-6 text-lg rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 hover:-translate-y-px active:scale-95 active:shadow-inner disabled:opacity-60 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
                            disabled={isLoading || !canRemove}
                        >
                            Remove
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default EditToolbar;