/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { CubeIcon } from './icons';

interface ProductStudioPanelProps {
  onApplyProductScene: (prompt: string, name: string) => void;
  isLoading: boolean;
}

const scenes = [
  {
    name: 'Marble Podium',
    description: 'Clean, elegant, and modern.',
    promptFragment: 'on a clean, white marble podium against a soft grey background with professional, soft-cast studio lighting.',
    bgClasses: 'bg-gradient-to-br from-gray-100 to-gray-300',
  },
  {
    name: 'Jungle Floor',
    description: 'Natural, earthy, and vibrant.',
    promptFragment: 'on a lush jungle floor with mossy rocks, with dappled sunlight filtering through the canopy creating a natural, organic feel.',
    bgClasses: 'bg-gradient-to-br from-emerald-800 to-green-600',
  },
  {
    name: 'Wooden Table',
    description: 'Warm, rustic, and cozy.',
    promptFragment: 'on a rustic dark wood table in a warmly lit cafe setting, with the background slightly blurred to create depth.',
    bgClasses: 'bg-gradient-to-br from-amber-900 to-yellow-800',
  },
  {
    name: 'Sand Dune',
    description: 'Minimalist, dry, and bright.',
    promptFragment: 'on a windswept sand dune under a bright, clear sky, with a single, sharp shadow cast by the hard sun.',
    bgClasses: 'bg-gradient-to-br from-yellow-300 to-orange-200',
  },
  {
    name: 'Gradient Pop',
    description: 'Bold, colorful, and graphic.',
    promptFragment: 'floating in front of a vibrant, colorful studio gradient background, with bold, graphic lighting.',
    bgClasses: 'bg-gradient-to-br from-purple-500 to-cyan-500',
  },
  {
    name: 'Dark Stone',
    description: 'Luxurious, moody, and premium.',
    promptFragment: 'on a rough, dark slate stone surface with dramatic, low-key lighting that highlights the product\'s texture.',
    bgClasses: 'bg-gradient-to-br from-gray-800 to-gray-900',
  },
  {
    name: 'Poolside',
    description: 'Fresh, sunny, and relaxed.',
    promptFragment: 'next to the clear blue water of a swimming pool on a bright sunny day, with realistic water reflections on the product.',
    bgClasses: 'bg-gradient-to-br from-sky-400 to-blue-500',
  },
  {
    name: 'Cloudscape',
    description: 'Dreamy, soft, and ethereal.',
    promptFragment: 'as if floating on a soft, fluffy cloud in a dreamy sky during a beautiful sunset.',
    bgClasses: 'bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-400',
  }
];

const ProductStudioPanel: React.FC<ProductStudioPanelProps> = ({ onApplyProductScene, isLoading }) => {

    const handleApply = (scenePromptFragment: string, sceneName: string) => {
        const fullPrompt = `You are an expert e-commerce product photographer AI. Your task is to take the primary product from the user's image and create a professional, commercial-grade product shot suitable for a high-end online store.

1.  **Isolate & Clean:** Perfectly and cleanly cut out the main product, removing its original background. Automatically clean up any minor dust, scratches, or imperfections on the product's surface to make it look pristine and new.
2.  **Place in Scene:** Place the cleaned product into the following new scene: ${scenePromptFragment}
3.  **Composite Realistically:** This is the most critical step. The composite must be photorealistic. You MUST add realistic shadows, highlights, and reflections on the product that perfectly match the lighting and environment of the new scene. The final image must be indistinguishable from a real, high-budget commercial photograph.

Output only the final, fully composited, commercial-grade product shot. Do not return text.`;
        onApplyProductScene(fullPrompt, sceneName);
    };

    return (
        <div className="w-full bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-6 flex flex-col gap-4 animate-fade-in backdrop-blur-xl">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">AI Product Photo Studio</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Select a scene to instantly create a professional product shot.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                {scenes.map(scene => (
                    <button
                        key={scene.name}
                        onClick={() => handleApply(scene.promptFragment, scene.name)}
                        disabled={isLoading}
                        className="flex flex-col items-center text-center p-4 bg-black/20 rounded-xl border border-white/10 hover:bg-white/5 hover:border-cyan-500/50 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black/20 disabled:hover:border-white/10 group hover:-translate-y-1 shadow-lg hover:shadow-cyan-900/50"
                    >
                        <div className={`w-full h-16 rounded-lg mb-4 flex items-center justify-center ${scene.bgClasses} border border-white/10 transition-transform group-hover:scale-105`}>
                            <CubeIcon className="w-8 h-8 text-white/50" />
                        </div>
                        <h4 className="font-semibold text-[var(--text-primary)] text-base">{scene.name}</h4>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">{scene.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ProductStudioPanel;
