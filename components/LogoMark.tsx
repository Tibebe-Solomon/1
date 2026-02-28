import React from "react";

interface LogoMarkProps {
  className?: string;
  interactive?: boolean;
}

export const LogoMark: React.FC<LogoMarkProps> = ({ className, interactive = false }) => {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} overflow-visible`}
      aria-hidden="true"
    >
      <path
        d="M 4 6 H 12 L 16 14 L 20 6 H 28 L 18 26 Q 16 30 14 26 Z"
        fill="currentColor"
        className={interactive ? 'hover:drop-shadow-[0_0_8px_currentColor] transition-all duration-300' : ''}
      />
    </svg>
  );
};
