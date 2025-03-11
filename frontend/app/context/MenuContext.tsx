'use client'

import { createContext, useContext, ReactNode, useState } from 'react';

interface MenuContextType {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
}

export const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [activeMenu, setActiveMenu] = useState('home');

  return (
    <MenuContext.Provider value={{ activeMenu, setActiveMenu }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
}
