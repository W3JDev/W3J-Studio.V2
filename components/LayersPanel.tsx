/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { TrashIcon, LayersIcon } from './icons';

interface Layer {
  id: string;
  imageUrl: string;
  prompt: string;
}

interface LayersPanelProps {
  layers: Layer[];
  activeLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
}

const LayersPanel: React.FC<LayersPanelProps> = ({ layers, activeLayerId, onSelectLayer, onDeleteLayer }) => {
  return (
    <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col gap-4 backdrop-blur-xl animate-fade-in">
      <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3">
        <LayersIcon className="w-6 h-6 text-cyan-400" />
        <h3 className="text-lg font-bold text-[var(--text-primary)]">Layers</h3>
      </div>
      <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-2">
        {layers.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] text-center py-4">No layers yet.</p>
        ) : (
          [...layers].reverse().map(layer => (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                activeLayerId === layer.id
                  ? 'bg-cyan-500/20 border-cyan-500'
                  : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-[var(--text-secondary)] group-hover:text-white flex-grow break-words">{layer.prompt}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteLayer(layer.id);
                  }}
                  className="p-1 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                  aria-label="Delete layer"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LayersPanel;