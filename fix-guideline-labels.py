#!/usr/bin/env python3
"""
Clean up guideline org/year references from subtitle, badge, label, and section header text.
Leaves body text, clinical notes, algorithm comments, and reference sections untouched.
"""

import re

files_and_replacements = {
    # ── EchoCalculator.tsx ────────────────────────────────────────────────────
    "client/src/pages/EchoCalculator.tsx": [
        # Tab sub-labels (visible UI text)
        ('{ id: "as", label: "Aortic Stenosis", sub: "ASE/ACC/AHA 2021" }',
         '{ id: "as", label: "Aortic Stenosis", sub: "Guideline-Based Grading" }'),
        ('{ id: "tr", label: "Tricuspid Regurgitation", sub: "ASE 2021" }',
         '{ id: "tr", label: "Tricuspid Regurgitation", sub: "Guideline-Based Grading" }'),
        # Badge in ResultPanel header
        ('<span className="text-xs font-bold uppercase tracking-wider text-[#4ad9e0]">ASE 2025</span>',
         '<span className="text-xs font-bold uppercase tracking-wider text-[#4ad9e0]">Guideline-Based</span>'),
    ],

    # ── EchoAssist.tsx ────────────────────────────────────────────────────────
    "client/src/pages/EchoAssist.tsx": [
        # Description text in the intro panel (visible to users)
        (
            'Enter raw measurements — get instant ASE/AHA/ACC guideline-based severity classifications, calculated values, and the specific criteria met. Domains: LV, Diastology, Strain, Stress Echo, AS, MS, AR, MR, TR, RV, PA Pressure, SV/CO, LAP Estimation, Frank-Starling.',
            'Enter raw measurements — get instant guideline-based severity classifications, calculated values, and the specific criteria met. Domains: LV, Diastology, Strain, Stress Echo, AS, MS, AR, MR, TR, RV, PA Pressure, SV/CO, LAP Estimation, Frank-Starling.'
        ),
        (
            '<strong>Clinical tool — not a substitute for physician judgment.</strong> All classifications are based on published ASE, AHA/ACC, and ESC guidelines. Results update in real time as you type. Each section can be used independently.',
            '<strong>Clinical tool — not a substitute for physician judgment.</strong> All classifications are based on current published guidelines. Results update in real time as you type. Each section can be used independently.'
        ),
        # ACHD description badge in Home.tsx modules array
        ('ACHD lesion-specific protocols for ASD, VSD, ToF, CoA, TGA, and Fontan with ASE/AHA thresholds.',
         'ACHD lesion-specific protocols for ASD, VSD, ToF, CoA, TGA, and Fontan with guideline-based thresholds.'),
    ],

    # ── Home.tsx ──────────────────────────────────────────────────────────────
    "client/src/pages/Home.tsx": [
        # Module badge
        ('badge: "ASE 2025"', 'badge: "Guideline-Based"'),
        ('badge: "ASE Guidelines"', 'badge: "Guideline-Based"'),
        # Module description
        ('Guideline-based interpretation for AS, MR, TR, AR, diastology with LARS, LV GLS, and RV strain.',
         'Guideline-based interpretation for AS, MR, TR, AR, diastology with LARS, LV GLS, and RV strain.'),
        # ACHD description
        ('ACHD lesion-specific protocols for ASD, VSD, ToF, CoA, TGA, and Fontan with ASE/AHA thresholds.',
         'ACHD lesion-specific protocols for ASD, VSD, ToF, CoA, TGA, and Fontan with guideline-based thresholds.'),
    ],

    # ── DiastolicNavigator.tsx ────────────────────────────────────────────────
    "client/src/pages/DiastolicNavigator.tsx": [
        # Section card titles
        ('title="ASE 2025 Two-Step Algorithm"', 'title="Diastolic Assessment Algorithm"'),
        ('title="ASE 2025 Diastolic Grading"', 'title="Diastolic Function Grading"'),
        ('title="ASE 2025 Special Populations"', 'title="Special Populations"'),
        ('subtitle="ASE 2025"', 'subtitle="Guideline-Based"'),
        ('subtitle="ASE/EACVI 2016"', 'subtitle="Guideline-Based"'),
        ('subtitle="ASE 2025 Algorithm"', 'subtitle="Diastolic Algorithm"'),
    ],

    # ── StrainNavigator.tsx ───────────────────────────────────────────────────
    "client/src/pages/StrainNavigator.tsx": [
        ('subtitle="ASE 2025 Strain Guideline"', 'subtitle="Guideline-Based Strain Assessment"'),
        ('subtitle="ASE 2025"', 'subtitle="Guideline-Based"'),
        ('subtitle="ASE/EACVI 2015"', 'subtitle="Guideline-Based"'),
    ],

    # ── StrainScanCoach.tsx ───────────────────────────────────────────────────
    "client/src/pages/StrainScanCoach.tsx": [
        # Section/card subtitles only — leave body text
        ('subtitle="ASE 2025 Strain Guideline"', 'subtitle="Guideline-Based Strain Assessment"'),
        ('subtitle="ASE 2025"', 'subtitle="Guideline-Based"'),
    ],

    # ── ScanCoach.tsx ─────────────────────────────────────────────────────────
    "client/src/pages/ScanCoach.tsx": [
        # h3 headings
        ('<h3 className="font-semibold text-gray-800">ASE 2025 Normal Reference Values</h3>',
         '<h3 className="font-semibold text-gray-800">Normal Reference Values</h3>'),
        ('<h3 className="font-semibold text-gray-800">ASE 2021 Diastolic Function</h3>',
         '<h3 className="font-semibold text-gray-800">Diastolic Function Assessment</h3>'),
        # Any remaining subtitle= with guideline refs
        ('subtitle="ASE 2025 Normal Values"', 'subtitle="Normal Reference Values"'),
        ('subtitle="ASE 2021 Diastolic"', 'subtitle="Diastolic Assessment"'),
    ],

    # ── PulmHTNNavigator.tsx ──────────────────────────────────────────────────
    "client/src/pages/PulmHTNNavigator.tsx": [
        ('<h3 className="font-semibold text-gray-800">ESC/ERS 2022 PH Guidelines</h3>',
         '<h3 className="font-semibold text-gray-800">Pulmonary Hypertension Guidelines</h3>'),
        ('<h3 className="font-semibold text-gray-800">AHA/ACC 2022 Right Heart Failure</h3>',
         '<h3 className="font-semibold text-gray-800">Right Heart Failure Assessment</h3>'),
        ('subtitle="ESC/ERS 2022"', 'subtitle="Guideline-Based"'),
        ('subtitle="AHA/ACC 2022"', 'subtitle="Guideline-Based"'),
    ],
}

import os

base = "/home/ubuntu/iheartecho"
changed = 0

for rel_path, replacements in files_and_replacements.items():
    full_path = os.path.join(base, rel_path)
    if not os.path.exists(full_path):
        print(f"SKIP (not found): {rel_path}")
        continue
    with open(full_path, "r", encoding="utf-8") as f:
        content = f.read()
    original = content
    for old, new in replacements:
        if old in content:
            content = content.replace(old, new)
            print(f"  ✓ {rel_path}: replaced '{old[:60]}...'")
            changed += 1
        # else:
        #     print(f"  - {rel_path}: NOT FOUND '{old[:60]}...'")
    if content != original:
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)

print(f"\nDone. {changed} replacements made.")
