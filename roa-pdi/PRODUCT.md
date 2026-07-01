# ROA PDI

A pre-delivery inspection tool for the RVs of America service shop. Technicians work through manufacturer-specific checklists on each new RV before it goes to the customer. Service writers open the inspection, assign it, and track completion. Admins maintain the master checklist and watch the failure data to spot recurring manufacturing defects.

## Register

product

This is a working tool, not a marketing surface. The design serves the inspection workflow; it does not advertise the company.

## Users

Three roles, each using the app in a meaningfully different physical context:

- **Technicians.** On a phone or tablet, in a service bay, often with greasy hands or gloves, often with the RV's interior lights as the only good light source. They are checking a real unit against a real list and recording pass / fail / not-applicable on each line, sometimes attaching photos of damage. Speed and tap-target size matter more than density. They only see PDIs assigned to them.
- **Service writers.** At a desk, on a laptop, in a busy shop office. They open new PDIs when a unit arrives, assign the right tech, monitor progress, and produce the final report when the inspection is done. Density and keyboard speed matter; they do this dozens of times a week.
- **Admins.** Same desk environment. They tune the master checklist, approve technician-suggested items, manage user access, and look at the analytics page to find checklist items that fail often per manufacturer (a quality-control feedback loop back to PAUSE and MDC).

Everybody is internal. Everybody signs in with `@rvsofamerica.com` Google accounts. Nobody is a guest, a customer, or a casual visitor.

## Manufacturers

The shop currently sells two RV brands: **PAUSE** and **MDC**. Each PDI is tagged to one of them, and the master checklist is filtered per manufacturer. The analytics page surfaces failure rates per manufacturer so the shop can hold the builders accountable. Color treatment differs per manufacturer (PAUSE blue, MDC green) and is already established in `utils/manufacturers.js`; do not repaint without reason.

## Brand and tone

- **ROA** is the parent: RVs of America. Trade business, family-run feel, not a tech company.
- **Tone:** plain, terse, trade-professional. The technician opening the app at 7 AM does not want greetings, gradients, or "Welcome back!" hero sections. Labels read like a clipboard, not a marketing site. Empty states say what to do, not how nice the app is.
- **Voice:** active, present-tense, second-person where it makes sense ("Pick a manufacturer," "No PDIs assigned to you yet"). Never "We" speaking on behalf of the app. Never apologies for empty states.
- **No emoji in product copy.** Status is communicated by chip color, position, and weight, not by symbols.

## Visual language already in place

This is a refinement project, not a from-scratch one. Honor the language unless there is a specific reason to break it:

- **Accent:** amber `#F59E0B` (`AMBER` / `NAV_ACCENT`). Used for primary actions and active-nav indication. Keep it sparing; it is the loudest color in the system.
- **Nav:** always dark (`NAV_BG #0B0C0F`), regardless of the user's light / dark preference. Single source of vertical brand presence.
- **Surface:** light mode default `#F4F4F5`, dark mode default `#0D0E12`. Both are tinted neutrals, not pure white or black.
- **Typography:** Inter, with `letter-spacing: -0.3` on h5 and `-0.2` on h6. Headings are bold (700); body weights stay normal.
- **Shape:** `borderRadius: 2`. Near-square. Cards, dialogs, drawers, and accordions are all flat-bordered with no shadow. Do not introduce rounded-2xl card stacks, soft shadows, or glassmorphism. The aesthetic is closer to industrial-utility than to consumer-app.
- **No elevation.** Cards and papers ship with `elevation: 0` and a 1px border. If a surface needs to feel separate, use the border, not a shadow.

## Strategic principles

1. **Phone-first for technicians, desk-first for everyone else.** The bottom-nav mobile shell is not a fallback; it is the primary form factor for the role that matters most. Any new feature must work on a phone in portrait before it ships.
2. **Density is a virtue at the desk, a liability in the bay.** Tables and dashboards should pack information for the service writer. Inspection items, item cards, and image-upload affordances should be larger and looser for the technician.
3. **Status is the first thing the eye finds.** PDI state (`not_started`, `in_progress`, `paused`, `completed`, `unable_to_complete`) and item result (`pass`, `fail`, `n/a`, `untested`) are the two most important pieces of data in the app. Treat them with consistent color and typography across every surface.
4. **Photos are evidence, not decoration.** When a technician attaches an image to a failed item, that image is a record for warranty claims. It must be easy to capture, easy to remove if wrong, easy to view full-size, and never compressed past usefulness.
5. **The tool stays out of the way.** No nudges, no streaks, no "great job!" toasts. The reward for finishing a PDI is that it is finished.

## Anti-references

What this should explicitly **not** look like, and why:

- **Generic SaaS dashboards** (Linear, Vercel, Stripe lookalikes). Wrong audience. The technician is not a designer. We can borrow craft from these references but must avoid the reflex of "another tasteful B2B tool."
- **Dealer management systems** (CDK, Reynolds & Reynolds, Tekion). The opposite trap: dense, ugly, modal-heavy, 1998-era forms. We are reacting against this lineage, not joining it.
- **Garage / automotive cliché aesthetics.** No carbon fiber. No brushed metal gradients. No chrome. No checkered flags. No tachometer-gauge progress widgets. The amber accent is the only nod to "warm industrial" the system needs.
- **Touch-screen kiosk apps.** Oversized round buttons, cartoony icons, big bold-color cards. We are mobile-friendly, not toddler-friendly.
- **The hero-metric template.** Big number, supporting stats, gradient accent. The dashboard already mostly avoids this; do not regress.

## Out of scope for design decisions

- The Firebase auth domain restriction (`@rvsofamerica.com`) is a security choice, not a design one. Do not redesign around onboarding flows for outside users without an explicit product change first.
- The role permission model is fixed (admin / service_writer / technician). Do not invent a fourth role surface.
