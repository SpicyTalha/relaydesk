# Relaydesk brand kit

> Sample project. Relaydesk is a fictional product.

## Design read

A B2B SaaS for small creative agencies (design-literate buyers who judge taste) and their non-technical clients (who open links on phones). The language is the print studio's sign-off: proofs, ink, the stamp that says a job can go to print. Confident and crafted, never cute.

Dials (Taste skill): **marketing 8 / 6 / 4**, **app 5 / 3 / 6** (variance / motion / density).

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

Primary buttons are **ink**, not magenta. Magenta is rationed so it still means something.

## Type

**Funnel Display** for headlines (tight tracking, -0.035em), **Funnel Sans** for everything else. Both are Google Fonts (OFL) loaded with `next/font`. Tabular figures for dates, counts, prices and versions. No monospace labels.

## Shape and depth

One radius scale: **10 px** controls, **14 px** panels, full pill only for status chips. Hairline borders define surfaces. Shadows only on things that float (menus, dialogs, the phone frame), tinted toward ink.

## Icons

**Phosphor** (`@phosphor-icons/react`), regular weight in the app, duotone sparingly on marketing.

## Motion personality

**Firm and settled.** Things land like a stamp: a quick press, then still.

- App: Motion for state changes only, 150-250 ms, no bounce except the stamp.
- Marketing: one hero moment (the stamp lands on the real menu board) and one pinned scroll story (v1 → notes → v2 → approved) with GSAP + Lenis.
- Reduced motion always shows the final state.
