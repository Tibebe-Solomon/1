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
      {/* V letterform */}
      <path
        d="M 8 9 L 12.5 9 L 16 19 L 19.5 9 L 24 9 L 17.5 24 Q 16 27 14.5 24 Z"
        fill="currentColor"
        className={interactive ? 'hover:drop-shadow-[0_0_8px_currentColor] transition-all duration-300' : ''}
      />
    </svg>
  );
};
