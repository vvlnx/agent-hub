import type { Locale } from "@/lib/i18n/types";

interface BilingualTextProps {
  locale: Locale;
  en: string;
  zh?: string;
  className?: string;
  referenceClassName?: string;
}

/** Render the selected language only. English remains the source-of-truth engine language. */
export function BilingualText({
  locale,
  en,
  zh,
  className,
}: BilingualTextProps) {
  return <span className={className}>{locale === "zh" && zh ? zh : en}</span>;
}
