import { Alert, Text, Code, List, ListItem } from "@ui";
import { ValidationErrorDetail } from "@lib/schemas/commonSchema";
import { useI18n } from "@context/I18nContext";

export interface SchemaValidationAlertProps {
  errors: ValidationErrorDetail[];
  title?: string;
  className?: string;
}

/**
 * Composite validation alert displaying schema validation issues using the design system Alert primitive.
 */
export const SchemaValidationAlert: React.FC<SchemaValidationAlertProps> = ({
  errors,
  title,
  className = "",
}) => {
  const { t } = useI18n();
  if (errors.length === 0) return null;

  return (
    <Alert
      variant="danger"
      title={title ?? t("dataStudioValidationErrors")}
      role="alert"
      aria-live="polite"
      className={className}
    >
      <List variant="none" spacing="dense" className="pl-1 m-0">
        {errors.map((err, idx) => (
          <ListItem key={`${err.path}-${idx}`} className="text-2xs leading-snug">
            <span className="text-rose-400/70 select-none mr-1">•</span>
            <Code variant="amber" size="2xs">{err.path}</Code>
            <Text as="span" variant="danger" size="2xs" className="text-rose-200/90">: {err.message}</Text>
          </ListItem>
        ))}
      </List>
    </Alert>
  );
};
