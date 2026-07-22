# Corvioz Sidebar Icon System — B+ Handoff

Status: **Geometry final.** All four sidebar icons (Quote, Invoice, Clients, Client Portal)
are locked. This document is the handoff record for the B+ set — it does not itself
constitute production implementation, which still requires separate explicit approval
per the project's standing restriction against modifying `public/` or production code.

## Final files

All shipped as standalone SVGs (no `<symbol>`/`<use>`, no masks/clips), at 16px and 20px,
in `design/icon-direction-exploration/candidates-bplus/`:

| Module | 16px | 20px |
|---|---|---|
| Quote | `quote-16.svg` | `quote-20.svg` |
| Invoice | `invoice-16.svg` | `invoice-20.svg` |
| Clients | `clients-16.svg` | `clients-20.svg` |
| Client Portal | `portal-16.svg` | `portal-20.svg` |

Historical/comparison-only files (Clients alternates from earlier rounds, not shipped):
`clients-alt1-touching-*.svg`, `clients-alt2-openarc-*.svg` in the same folder, plus the
full round-by-round record in `candidates-clients-redo/`, `candidates-clients-c2refine/`,
and `candidates-clients-final/`.

## Shared conventions

- Color: `#59677c` (default / muted), `#4F46E5` (active / accent).
- Stroke width: 1.7px @16 / 1.8px @20 (default), 1.8px @16 / 1.9px @20 (active).
- Active state changes color and stroke-width only — geometry is byte-identical between
  default and active for every icon (verified programmatically each round).
- `fill="none"` throughout; every icon is a pure stroke drawing.

## Per-icon summary

**Quote** — document body with an asymmetric soft/firm corner treatment (soft left corner,
crisp top-right cut) and two flat-capped internal content lines. Locked since the B+ round.

**Invoice** — receipt body with limited softness in the upper-left structure, a firm angular
two-notch tear along the lower edge, and one flat-capped internal content line. Locked since
the B+ round.

**Client Portal** — doorway bracket with a decisive angular arrow aligned to the bracket's
vertical center. Locked since the B+ round.

**Clients** — two separate, complete, non-overlapping busts (primary larger/lower-left,
secondary smaller/upper-right). This is the icon that went through the most iteration:

1. An occlusion-based construction (secondary partially hidden behind primary via mask/clip)
   was tried in multiple forms and rejected at every pass — at 16-20px with the stroke
   weights this system uses, any real geometric overlap between two circles/strokes fused
   into an illegible blob, and any mask trimmed cleanly enough to avoid that instead left
   the secondary's exposed remainder reading as a floating hook or tail. This was a
   structural limit of the approach, not a tuning problem, and every masked variant
   (Construction 2, 2A/2B/2C) was ultimately rejected for it.
2. The shipped construction instead uses two fully independent busts with a new, shorter
   shoulder-arc proportion (so shoulders read as shoulders, not an inverted-U torso arch),
   primary head ~1.6x secondary's radius, matching ~1.6x shoulder-width ratio, and the same
   stroke weight for both figures — hierarchy comes entirely from scale, position, and
   negative space.
3. A final positional-only pass moved the secondary slightly left and down and shortened
   its shoulder arc ~5%, to read as one client-group composition rather than two unrelated
   icons, while keeping both figures fully separate. Primary figure is byte-identical to the
   prior round (unchanged). Measured negative space: 1.71 units at 16px (stroke 1.7) and
   2.31 units at 20px (stroke 1.8) — both at or above one stroke width, confirmed via
   pixel-distance measurement, not eyeballing.

## Validation performed on the final set

- All 8 files (4 icons x 2 sizes) parse and rasterize cleanly via CairoSVG.
- No `<symbol>`, `<use>`, or `<mask>` in any shipped file.
- Balanced `<svg>`/`</svg>` tags in every file.
- Default vs. active geometry confirmed byte-identical (color/stroke-width only differ)
  for all four icons.
- Clients negative space and canvas margins confirmed via pixel-level measurement
  (distance transform + bounding-box), not visual estimation.

## Production integration

The B+ set was approved for a controlled production integration test. Implementation details
(component locations, files touched, validation results, and screenshots) are tracked
separately from this design handoff — see the session's implementation report rather than
this document for that record.
