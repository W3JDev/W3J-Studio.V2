/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { UploadIcon } from './icons';
import BeforeAfterSlider from './BeforeAfterSlider';
import { useAuth } from '../contexts/AuthContext';

interface StartScreenProps {
  onFileSelect: (files: FileList | null) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onFileSelect }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const { isSignedIn, signIn } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSignedIn) return;
    onFileSelect(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isSignedIn) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (isSignedIn) {
        onFileSelect(e.dataTransfer.files);
    }
  };

  const ctaButtonClasses = "relative inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white bg-[var(--brand-gradient)] rounded-full cursor-pointer group transition-all duration-300 ease-in-out shadow-lg shadow-purple-500/20 hover:shadow-2xl hover:shadow-cyan-500/30 hover:-translate-y-1";


  return (
    <div 
      className={`w-full max-w-5xl mx-auto text-center p-8 transition-all duration-300 rounded-3xl border-2 ${isDraggingOver ? 'bg-cyan-500/10 border-dashed border-cyan-400 scale-[1.02]' : 'border-transparent'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <h1 className="text-5xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-6xl md:text-7xl">
          Your Personal <span className="animated-gradient-text">AI Photo Studio</span>
        </h1>
        <p className="max-w-3xl text-lg text-[var(--text-secondary)] md:text-xl">
          Transform your photos in seconds. Restore memories, create professional headshots, and generate stunning visuals with one-click AI.
        </p>

        <div className="mt-6 flex flex-col items-center gap-4">
            {isSignedIn ? (
                <label htmlFor="image-upload-start" className={ctaButtonClasses}>
                    <UploadIcon className="w-6 h-6 mr-3 transition-transform duration-300 ease-in-out group-hover:animate-bounce" />
                    Upload Image
                </label>
            ) : (
                <button type="button" onClick={signIn} className={ctaButtonClasses}>
                    <UploadIcon className="w-6 h-6 mr-3" />
                    Upload Image to Get Started
                </button>
            )}

            <input id="image-upload-start" type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={!isSignedIn} />
            <p className="text-sm text-gray-500">{isSignedIn ? 'or drag and drop a file' : 'Please sign in to upload an image'}</p>
        </div>

        <BeforeAfterSlider />

      </div>
    </div>
  );
};

export default StartScreen;