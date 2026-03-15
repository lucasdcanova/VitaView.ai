import { cn } from "@/lib/utils";
import { normalizeClinicalContent } from "@shared/clinical-rich-text";

type ClinicalRichTextProps = {
  content?: string | null;
  className?: string;
};

export function ClinicalRichText({ content, className }: ClinicalRichTextProps) {
  const html = normalizeClinicalContent(content);

  if (!html) return null;

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none text-current dark:prose-invert",
        "prose-p:my-1 prose-p:text-current",
        "prose-strong:text-current prose-em:text-current",
        "prose-ul:my-2 prose-ol:my-2",
        "prose-li:my-0 prose-li:text-current",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
