import React from "react";
import { AspectRatioSection, GraphicsQualitySection } from "./display";
import { cn } from "@lib/utils";

export interface DisplaySettingsSectionProps {
  readonly className?: string;
}

export const DisplaySettingsSection = ({
  className,
}: DisplaySettingsSectionProps = {}): React.ReactElement => {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <AspectRatioSection />
      <GraphicsQualitySection />
    </div>
  );
};

export default DisplaySettingsSection;
