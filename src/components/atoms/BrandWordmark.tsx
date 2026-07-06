import React from "react";

interface BrandWordmarkProps {
  /** Font size (any CSS length). Defaults to inheriting the surrounding text size. */
  size?: number | string;
  /** Extra styles applied to the wrapping element. */
  style?: React.CSSProperties;
  className?: string;
}

/**
 * The "MY BigDay" wordmark, styled to match the logo:
 *   - "MY"     — champagne gold, uppercase
 *   - "BigDay" — dusty rose, title case
 * Uses the display serif so it reads as the brand mark, not body copy.
 * Render this anywhere the brand name appears as text (footer, headings, etc.).
 */
export function BrandWordmark({ size, style, className }: BrandWordmarkProps) {
  return (
    <span
      className={className}
      style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        letterSpacing: '0.01em',
        textTransform: 'none',
        whiteSpace: 'nowrap',
        ...(size ? { fontSize: size } : null),
        ...style,
      }}
    >
      <span style={{ color: 'var(--color-gold, #A9895A)' }}>MY</span>
      <span style={{ color: 'var(--color-terracotta, #B4543A)' }}>&nbsp;BigDay</span>
    </span>
  );
}
