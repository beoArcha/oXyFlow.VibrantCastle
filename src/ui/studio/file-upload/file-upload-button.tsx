import React, { useRef } from "react";
import { Button, ButtonVariant, ButtonSize } from "../../core/button";
import { Upload } from "lucide-react";
import { cn } from "@lib/utils";

export interface FileUploadButtonProps {
  /** Accepted file formats, e.g. "image/png,image/jpeg" or "application/json" */
  accept?: string;
  /** Callback fired when a file is selected */
  onFileSelect?: (file: File) => void;
  /** Backward-compatible standard change event callback */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Button label text or node */
  label: React.ReactNode;
  /** Custom icon on left side */
  icon?: React.ReactNode;
  /** Visual variant matching Button */
  variant?: ButtonVariant;
  /** Size variant matching Button */
  size?: ButtonSize;
  /** Disables file upload */
  disabled?: boolean;
  /** Optional custom CSS classes */
  className?: string;
  /** Tooltip or title attribute */
  title?: string;
  /** ID for accessibility */
  id?: string;
}

/**
 * FileUploadButton
 *
 * Generic accessible button wrapping a hidden native file input.
 * Conforms to WAI-ARIA button pattern and Design System conventions.
 */
export const FileUploadButton: React.FC<FileUploadButtonProps> = React.memo(({
  accept,
  onFileSelect,
  onChange,
  label,
  icon = <Upload size={12} />,
  variant = "secondary",
  size = "sm",
  disabled = false,
  className,
  title,
  id,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect?.(file);
    }
    // Reset value so the user can re-upload the same file if needed
    e.target.value = "";
  };

  return (
    <div className={cn("relative inline-flex", className)}>
      <Button
        id={id}
        type="button"
        variant={variant}
        size={size}
        disabled={disabled}
        onClick={handleClick}
        title={title}
        icon={icon}
        className="font-bold shadow-sm"
      >
        <span>{label}</span>
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={handleInputChange}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
});

FileUploadButton.displayName = "FileUploadButton";
export default FileUploadButton;
