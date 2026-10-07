# Relaydesk brand kit

> Sample project. Relaydesk is a fictional product.

## Design read

A B2B SaaS for small creative agencies (design-literate buyers who judge taste) and their non-technical clients (who open links on phones). The language is the print studio's sign-off: proofs, ink, the stamp that says a job can go to print. Confident and crafted, never cute.

Dials (Taste skill): **marketing 9 / 7 / 5**, **app 5 / 3 / 6** (variance / motion / density).

**Marketing direction: the proofing desk.** The page is a studio's desk the week a job goes to print: full-bleed process-colour fields (yellow, magenta, cyan), real proofs taped down at angles, a binder clip, and the client's red pen circling what's wrong and scribbling notes in the margin. The app stays calm; the marketing is where the brand gets loud.

## Name and voice

**Relaydesk:** work relays between the studio and the client until it's signed off.

Voice: **plain, exact, unhurried.** Say what happens, in the user's words.

| Moment | Copy |
|---|---|
| Empty client space | "Nothing shared with Northwind yet. Upload the first version and ask for sign-off." |
| Approved | "Approved. Kestrel Studio can see it now." |
| Changes requested | "Sent your notes to Kestrel Studio." |
| Error | "That upload didn't go through. Check your connection and try again." |
| Pricing | "Clients never pay and never count as seats." |

Banned: elevate, seamless, unleash, supercharge, next-gen, "streamline your workflow".

## Mark

**The sign-off:** a stamp ring with a check that passes out of it (approved, and handed back). Ink ring, proof-magenta check. Built on a 32 grid from one circle and one polyline, so it holds at 16 px. Files: `src/components/brand/logo.tsx`, `src/app/icon.svg`.

## Signature element: the approval stamp

A round ink stamp in the approved green with "APPROVED" set around the ring, "OK" in the center and the version and date beneath. An SVG turbulence filter gives it a real ink edge.

- It appears **only when work is approved**: on the deliverable when a client approves (a short press-and-settle animation), on approved items, in the landing hero, and in the OG image.
- It is never decoration elsewhere. That restraint is what keeps it meaningful.

## Color (OKLCH tokens in `src/app/globals.css`)

| Role | Hex | Use |
|---|---|---|
| Paper | `#F4F5F7` | Page background (cool, not cream) |
| Sheet | `#FFFFFF` | Surfaces |
| Ink | `#15171A` | Text, primary buttons |
| Graphite | `#5B616B` | Secondary text |
| Hairline | `#E3E5EA` | Borders (hairlines over shadows) |
| **Proof magenta** | `#D12D7F` | The single brand accent: mark, focus, selection, links, key highlights |
| Approved | `#1F8F55` | Status only, and the stamp |
| In review | `#2F6FEB` | Status only |
| Changes | `#C97A0A` | Status only |

Primary buttons are **ink**, not magenta. In the app, magenta is rationed so it still means something.

**Marketing-only print palette** (the desk):

| Role | Hex | Use |
|---|---|---|
| Process yellow | `#FFE14A` | Hero field, pen notes on magenta |
| Process magenta | `#D12D7F` | Client section field, top tape strip |
| Process cyan | `#3CC3F2` | Final CTA field |
| Red pen | `#E0312B` | Client markup only: circles, arrows, underlines, handwritten notes |

Each colour gets a whole section, never a gradient. Halftone dots (`.halftone`) and masking tape (`.tape`) are the only textures.

**In the app** the print world shows up in a few deliberate places only, so work stays the loudest thing on screen:

- An ink sidebar frames the studio, with a process-yellow tick on the active item and yellow badges for work that came back.
- Work is reviewed as a proof on the cutting mat, and the approval stamp lands on the proof itself.
- What's waiting on a client gets an ink edge with a process-yellow offset.
- Client change notes carry the red-pen rule.

## Type

**Funnel Display** for headlines (tight tracking, -0.035em), **Funnel Sans** for everything else. Both are Google Fonts (OFL) loaded with `next/font`. Tabular figures for dates, counts, prices and versions. No monospace labels.

**Caveat Brush** is the client's red pen, and only that: short lowercase notes in `text-pen` (`PenNote`). Never for headings, buttons or anything the studio says.

## Shape and depth

One radius scale: **10 px** controls, **14 px** panels, full pill only for status chips. Hairline borders define surfaces. Shadows only on things that float (menus, dialogs, the phone frame), tinted toward ink.

## Icons

**Phosphor** (`@phosphor-icons/react`), regular weight in the app, duotone sparingly on marketing.

## Motion personality

**Firm and settled.** Things land like a stamp: a quick press, then still.

- App: Motion for state changes only, 150-250 ms, no bounce except the stamp.
- Marketing: one hero moment (proofs drop, the red pen circles the tiny prices, v3 lands, the stamp slams and the desk shakes) and one pinned scroll story (v1, red pen, v2, another note, v3 stamped) with GSAP DrawSVG + Lenis. Pen strokes draw like a marker; notes reveal left to right as if written.
- Earlier versions fan out under later ones so every round of markup stays visible.
- Components: `src/components/marketing/desk.tsx` (Proof, BinderClip, PenCircle, PenArrow, PenUnderline, PenNote, TapeMarquee).
- Reduced motion always shows the final state.
