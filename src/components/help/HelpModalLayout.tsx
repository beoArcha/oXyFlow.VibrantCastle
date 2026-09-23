import React from "react";

export interface HelpModalLayoutProps {
  children: React.ReactNode;
}

/**
 * Presentation container layout for HelpModal content.
 * Manages scrolling, spacing, and theme-conforming colors.
 */
export const HelpModalLayout: React.FC<HelpModalLayoutProps> = ({ children }) => {
  return (
    <div
      className="flex flex-col gap-5 text-stone-200 text-sm select-none"
      role="region"
      aria-label="Help and Guide Content"
    >
      {children}
    </div>
  );
};

export default HelpModalLayout;
