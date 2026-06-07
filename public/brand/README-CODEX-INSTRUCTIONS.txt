FUADFX logo implementation notes for Codex

Use the supplied SVG assets as the source of truth. The logo is monochrome only and must work on both light and dark themes.

Recommended files:
- fuadfx-logo-horizontal-currentColor.svg for the website header/navigation.
- fuadfx-logo-stacked-currentColor.svg for hero sections, loading screens, and large brand placements.
- fuadfx-icon-currentColor.svg for favicon, app icon, sidebar collapsed logo, and small UI use.

Theme behavior:
- On light background: render the logo in black (#000000 or current text color).
- On dark background: render the logo in white (#FFFFFF).
- Do not add gradients, blue accents, shadows, glow, bevels, or gaming-style effects.

Design direction:
- Brand name must be uppercase: FUADFX.
- Keep the custom A shape; do not replace it with a normal font A.
- Keep the icon as the sleek diagonal two-stroke mark from option 3.
- Keep spacing generous and corporate/fintech, not esports/gaming.

Suggested React/Next usage:
<img src="/brand/fuadfx-logo-horizontal-currentColor.svg" alt="FUADFX" className="h-8 w-auto text-black dark:text-white" />

If inline SVG is needed, paste the SVG directly and set the wrapper color using CSS:
.logo { color: #000; }
.dark .logo { color: #fff; }

Place files in:
/public/brand/

Favicon:
Use favicon-32.png, favicon-48.png, favicon-180.png, and favicon-512.png.
