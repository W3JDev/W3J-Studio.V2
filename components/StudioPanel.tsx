/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { SunIcon } from './icons';

interface StudioPanelProps {
  onApplyAdjustment: (prompt: string) => void;
  isLoading: boolean;
}

const StudioPanel: React.FC<StudioPanelProps> = ({ onApplyAdjustment, isLoading }) => {
  const [scenePrompt, setScenePrompt] = useState('');
  const [lightingPrompt, setLightingPrompt] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const lightingPresets = [
    { name: 'Golden Hour', prompt: 'Warm, soft, low-angle sunlight as if during the golden hour just after sunrise or before sunset.' },
    { name: 'Studio Portrait', prompt: 'Clean, professional three-point studio lighting with a key light, fill light, and backlight to create depth.' },
    { name: 'Neon Noir', prompt: 'Moody, dramatic lighting from colorful urban neon signs, with deep shadows and vibrant highlights.' },
    { name: 'Overcast Day', prompt: 'Soft, diffused, even lighting from an overcast sky, with minimal shadows.' },
  ];

  const handlePresetClick = (preset: { name: string, prompt: string }) => {
    setLightingPrompt(preset.prompt);
    setActivePreset(preset.name);
  };

  const handleCustomLightingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLightingPrompt(e.target.value);
    setActivePreset(null);
  };

  const handleApply = () => {
    if (scenePrompt) {
      const finalLightingPrompt = lightingPrompt.trim() || "Natural lighting that perfectly matches the time of day and environment of the new scene.";

      const fullPrompt = `You are a professional photo compositor and virtual photographer. Your task is to expertly cut out the main subject(s) from the foreground of the image and place them into a new, photorealistic scene, paying meticulous attention to the lighting.

1.  **New Scene Description:** Place the subject(s) in the following environment: "${scenePrompt}".
2.  **Lighting Style:** The scene must be lit according to this description: "${finalLightingPrompt}".

Your primary goal is to create a seamless and believable composite. You must realistically render shadows, reflections, and color casts on the subject(s) so they perfectly match the new background and its specified lighting conditions.
Output only the final, fully composited image.`;
      
      onApplyAdjustment(fullPrompt);
    }
  };

  return (
    <div className="w-full bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-6 flex flex-col gap-6 animate-fade-in backdrop-blur-xl">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Scene & Lighting Studio</h3>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Describe a new scene, then choose a lighting style to create a perfect composite.</p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="scene-prompt" className="font-semibold text-[var(--text-primary)]">1. Describe the New Scene</label>
        <textarea
          id="scene-prompt"
          value={scenePrompt}
          onChange={(e) => setScenePrompt(e.target.value)}
          placeholder="e.g., 'a serene beach at sunset with dramatic clouds', 'a bustling futuristic city street at night with neon lights', 'a quiet library with tall bookshelves'"
          className="flex-grow bg-black/30 border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg p-4 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base min-h-[100px] resize-y"
          disabled={isLoading}
        />
      </div>
      
      <div className="flex flex-col gap-4">
        <label className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <SunIcon className="w-5 h-5 text-yellow-300" />
          2. Set the Lighting Style (Optional)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {lightingPresets.map(preset => (
            <button
                key={preset.name}
                onClick={() => handlePresetClick(preset)}
                disabled={isLoading}
                className={`w-full text-center bg-black/20 border border-white/10 text-[var(--text-secondary)] font-semibold py-3 px-4 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/30 hover:text-white active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${activePreset === preset.name ? 'ring-2 ring-offset-2 ring-offset-[var(--surface-color-solid)] ring-yellow-500 text-white' : ''}`}
            >
                {preset.name}
            </button>
            ))}
        </div>
        <input
            type="text"
            value={lightingPrompt}
            onChange={handleCustomLightingChange}
            placeholder="Or describe custom lighting (e.g., 'harsh, direct overhead spotlight')"
            className="flex-grow bg-black/30 border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg p-4 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base"
            disabled={isLoading}
        />
      </div>

      <button
          onClick={handleApply}
          className="w-full bg-[var(--brand-gradient)] text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-cyan-500/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:opacity-60 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
          disabled={isLoading || !scenePrompt.trim()}
      >
          Generate Scene
      </button>
    </div>
  );
};

export default StudioPanel;
