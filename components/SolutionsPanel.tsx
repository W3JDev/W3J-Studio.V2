/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { WandSparklesIcon, DocumentIcon, UserCircleIcon, MagicWandIcon } from './icons';

interface SolutionsPanelProps {
  onApplyTool: (prompt: string, name: string) => void;
  isLoading: boolean;
}

const tools = [
  {
    name: 'Auto Enhance',
    description: 'One-click enhancement for contrast, brightness, and color balance.',
    icon: MagicWandIcon,
    prompt: "Automatically enhance the photo by adjusting contrast, brightness, and saturation for a more balanced and appealing look."
  },
  {
    name: 'Photo Restoration',
    description: 'Repair old, scratched, or faded photos and bring them back to life.',
    icon: WandSparklesIcon,
    prompt: "Restore this old photo. Remove scratches, creases, and artifacts. Enhance faded colors and improve the overall sharpness and detail, bringing the photo back to life while preserving its vintage character."
  },
  {
    name: 'Social Profile Enhancer',
    description: 'Generate a professional profile picture with a clean background and studio lighting.',
    icon: UserCircleIcon,
    prompt: "This is for a professional social media profile. Expertly cut out the main subject, place them on a subtle, out-of-focus modern office background, and apply flattering, professional studio lighting to their face. The final image should look like a high-quality corporate headshot."
  },
  {
    name: 'Passport Photo',
    description: 'Create a compliant passport/ID photo with a neutral background and proper lighting.',
    icon: DocumentIcon,
    prompt: "Convert this photo into a professional passport photo for official documents. Replace the background with a solid, off-white color (standard for US passports). Apply even, neutral lighting to the face, removing any harsh shadows. The subject should be centered and looking directly at the camera with a neutral expression. Ensure the final image meets typical biometric photo requirements."
  },
];

const SolutionsPanel: React.FC<SolutionsPanelProps> = ({ onApplyTool, isLoading }) => {
  return (
    <div className="w-full bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-6 flex flex-col gap-4 animate-fade-in backdrop-blur-xl">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">AI Solutions</h3>
        <p className="text-sm text-[var(--text-secondary)] mt-1">One-click solutions for your personal and professional photo needs.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
        {tools.map(tool => (
          <button
            key={tool.name}
            onClick={() => onApplyTool(tool.prompt, tool.name)}
            disabled={isLoading}
            className="flex flex-col items-center text-center p-6 bg-black/20 rounded-xl border border-white/10 hover:bg-white/5 hover:border-cyan-500/50 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black/20 disabled:hover:border-white/10 group hover:-translate-y-1 shadow-lg hover:shadow-cyan-900/50"
          >
            <tool.icon className="w-8 h-8 mb-4 text-cyan-400 transition-transform group-hover:scale-110" />
            <h4 className="font-semibold text-[var(--text-primary)] text-base">{tool.name}</h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1">{tool.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SolutionsPanel;
