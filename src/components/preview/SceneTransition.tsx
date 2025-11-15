import { ReactNode } from "react";

interface SceneTransitionProps {
  isActive: boolean;
  children: ReactNode;
}

export const SceneTransition = ({ isActive, children }: SceneTransitionProps) => {
  return (
    <div 
      className={`w-full h-full transition-opacity duration-500 ${
        isActive ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {children}
    </div>
  );
};
