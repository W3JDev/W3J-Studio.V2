/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserCircleIcon } from './icons';


const W3JLogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor: 'var(--brand-cyan)', stopOpacity: 1}} />
        <stop offset="100%" style={{stopColor: 'var(--brand-purple)', stopOpacity: 1}} />
      </linearGradient>
    </defs>
    <path d="M 20 20 L 20 80 L 50 50 L 80 80 L 80 20 L 50 50 Z" fill="url(#logoGradient)" />
    <path d="M 20 20 L 50 50 L 80 20 M 20 80 L 50 50 L 80 80" fill="none" stroke="url(#logoGradient)" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" />
  </svg>
);


const Header: React.FC = () => {
  const { isSignedIn, signIn, signOut } = useAuth();
  
  return (
    <header className="w-full py-3 px-4 sm:px-8 border-b border-[var(--border-color)] bg-[var(--surface-color)] backdrop-blur-xl sticky top-0 z-50">
      <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
              <W3JLogoIcon className="w-8 h-8" />
              <div className="flex flex-col items-start">
                <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  W3J Studio
                </h1>
                <p className="text-xs text-[var(--text-secondary)] -mt-1 tracking-wider">AI Photo Studio</p>
              </div>
          </div>
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <div className="flex items-center gap-3">
                <UserCircleIcon className="w-9 h-9 text-[var(--text-secondary)]" />
                <button 
                  onClick={signOut}
                  className="text-center bg-white/10 border border-white/20 text-[var(--text-primary)] font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-sm"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={signIn}
                className="text-center bg-white/10 border border-white/20 text-[var(--text-primary)] font-semibold py-2 px-4 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/20 hover:border-white/30 active:scale-95 text-sm"
              >
                Sign In
              </button>
            )}
          </div>
      </div>
    </header>
  );
};

export default Header;