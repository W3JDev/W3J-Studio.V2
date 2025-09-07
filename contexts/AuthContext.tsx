/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isSignedIn: boolean;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);

  useEffect(() => {
    // Check for a session on initial load
    const storedSession = localStorage.getItem('w3j-studio-session');
    if (storedSession === 'true') {
      setIsSignedIn(true);
    }
  }, []);

  const signIn = () => {
    localStorage.setItem('w3j-studio-session', 'true');
    setIsSignedIn(true);
  };

  const signOut = () => {
    localStorage.removeItem('w3j-studio-session');
    setIsSignedIn(false);
    // Optional: Force a reload to clear application state on sign out for a cleaner experience
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ isSignedIn, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
