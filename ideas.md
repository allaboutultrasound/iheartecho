# iHeartEcho Design Brainstorm

## App Context
Clinical cardiac echo companion for sonographers, cardiologists, and ACS students.
Needs to feel precise, trustworthy, and professional — like a medical instrument.

---

<response>
<text>
## Idea A — "Clinical Dark Precision"
**Design Movement:** Medical Instrument / Dark UI / Data-Dense Dashboard

**Core Principles:**
- Dark navy/charcoal background evoking ultrasound machine displays
- Crisp white data readouts with color-coded severity (green/yellow/red)
- Monospace numbers for measurements, sans-serif for labels
- Dense information layout — sonographers are experts, not novices

**Color Philosophy:**
- Background: Deep navy #0B1120
- Surface: Slate #1A2540
- Primary accent: Electric cyan #00D4FF (echoes ultrasound waveforms)
- Severity: Green #22C55E / Amber #F59E0B / Red #EF4444
- Text: White #F8FAFC / Muted #94A3B8

**Layout Paradigm:**
- Left sidebar navigation (icon + label)
- Main content: two-column — input panel left, result/interpretation right
- Top bar with breadcrumb and module name
- Card-based module grid on dashboard

**Signature Elements:**
- Waveform SVG decoration (ECG/Doppler trace motif)
- Severity badge pills with glow effect
- Pulsing animation on active calculation results

**Interaction Philosophy:**
- Instant feedback on input — results update live
- Color transitions on severity change
- Smooth panel slide-ins

**Animation:**
- Result cards fade+scale in on calculation
- Severity color transitions: 300ms ease
- Sidebar hover: subtle left-border accent

**Typography System:**
- Display: Space Grotesk Bold (module titles, results)
- Body: Inter Regular (labels, descriptions)
- Numbers: JetBrains Mono (measurements, values)
</text>
<probability>0.08</probability>
</response>

<response>
<text>
## Idea B — "Warm Clinical White"
**Design Movement:** Modern Medical SaaS / Apple Health aesthetic

**Core Principles:**
- Clean white with warm off-white cards
- Generous whitespace, breathable layout
- Soft red/coral accent (heart brand color)
- Friendly but authoritative

**Color Philosophy:**
- Background: Warm white #FAFAF8
- Cards: Pure white #FFFFFF with soft shadow
- Primary: Deep crimson #C0392B
- Accent: Rose #F87171
- Text: Charcoal #1C1C1E / Muted #6B7280

**Layout Paradigm:**
- Top navigation bar with module tabs
- Full-width content area
- Split-pane for calculator: form left, output right
- Floating result summary card

**Signature Elements:**
- Heart icon motif in logo and accents
- Gradient severity bars (green→yellow→red)
- Subtle dot-grid background texture

**Interaction Philosophy:**
- Progressive disclosure — show advanced options on demand
- Smooth accordion expansions
- Toast notifications for calculated results

**Animation:**
- Result reveal: slide up + fade
- Severity bar: animated fill on calculate
- Page transitions: fade

**Typography System:**
- Display: Playfair Display (hero titles)
- Body: DM Sans (all UI text)
- Numbers: DM Mono (measurements)
</text>
<probability>0.07</probability>
</response>

<response>
<text>
## Idea C — "Deep Navy Medical Command Center" ← SELECTED
**Design Movement:** Clinical Command Center / Dark Precision Instrument

**Core Principles:**
- Deep navy background with structured sidebar — feels like an echo workstation
- High-contrast data display: white text on dark, colored severity indicators
- Modular card system — each clinical tool is a self-contained workspace
- Professional density: information-rich without clutter

**Color Philosophy:**
- Background: #0D1B2A (deep navy — ultrasound machine aesthetic)
- Surface cards: #1B2B3B (slightly lighter navy)
- Primary accent: #38BDF8 (sky blue — echoes ultrasound beam color)
- Secondary accent: #818CF8 (indigo — for fetal echo module)
- Severity: #22C55E / #F59E0B / #EF4444
- Text: #F1F5F9 / Muted #94A3B8

**Layout Paradigm:**
- Fixed left sidebar with icon navigation (collapsed on mobile)
- Main area: module-specific layouts (calculator split-pane, protocol steps, etc.)
- Top header with module title and breadcrumb
- Dashboard: 3-column card grid

**Signature Elements:**
- ECG/Doppler waveform SVG as decorative header element
- Glowing severity badges (box-shadow pulse)
- Gradient border on active module cards

**Interaction Philosophy:**
- Real-time calculation — no submit button needed for calculators
- Color-coded output panels that animate on severity change
- Keyboard-friendly inputs for clinical workflow

**Animation:**
- Result panels: fade + translateY(8px) → 0 on appear
- Severity badge: 400ms color transition
- Sidebar active state: left accent border slide

**Typography System:**
- Display: Space Grotesk 700 (module names, result headings)
- Body: Inter 400/500 (labels, descriptions, body text)
- Data: JetBrains Mono (all numeric measurements and values)
</text>
<probability>0.09</probability>
</response>

## Selected: Idea C — Deep Navy Medical Command Center
