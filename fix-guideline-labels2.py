#!/usr/bin/env python3
"""
Second pass: clean up remaining guideline org/year references from visible UI labels.
"""
import os

base = "/home/ubuntu/iheartecho"
changed = 0

files_and_replacements = {
    "client/src/pages/EchoCalculator.tsx": [
        ('{ id: "ar", label: "Aortic Regurgitation", sub: "ASE 2021" }',
         '{ id: "ar", label: "Aortic Regurgitation", sub: "Guideline-Based Grading" }'),
        ('{ id: "diastology", label: "Diastology", sub: "ASE 2025" }',
         '{ id: "diastology", label: "Diastology", sub: "Guideline-Based Assessment" }'),
        ('{ id: "lap_estimation", label: "LAP Estimation", sub: "ASE 2025 · Premium" }',
         '{ id: "lap_estimation", label: "LAP Estimation", sub: "Guideline-Based · Premium" }'),
        ('{ id: "diastology_special", label: "Diastology — Special Populations", sub: "ASE 2025 · Premium" }',
         '{ id: "diastology_special", label: "Diastology — Special Populations", sub: "Guideline-Based · Premium" }'),
        ('{ id: "lv", label: "LV Function + GLS", sub: "ASE 2025 Strain" }',
         '{ id: "lv", label: "LV Function + GLS", sub: "Guideline-Based Strain Assessment" }'),
        ('{ id: "rv", label: "RV Function + Strain", sub: "ASE 2025 Strain" }',
         '{ id: "rv", label: "RV Function + Strain", sub: "Guideline-Based Strain Assessment" }'),
    ],
    "client/src/pages/DiastolicNavigator.tsx": [
        ('<p className="text-xs font-semibold text-blue-800 mb-1">ASE 2025 Age-Specific e\' Cutoffs — Step 1 Positive Threshold (Table 6)</p>',
         '<p className="text-xs font-semibold text-blue-800 mb-1">Age-Specific e\' Cutoffs — Step 1 Positive Threshold</p>'),
        ('<span className="text-sm font-semibold text-[#4ad9e0] uppercase tracking-wider">ASE 2025 Two-Step Algorithm (Figure 3)</span>',
         '<span className="text-sm font-semibold text-[#4ad9e0] uppercase tracking-wider">Diastolic Two-Step Algorithm</span>'),
    ],
    "client/src/pages/PulmHTNNavigator.tsx": [
        ('<span className="text-xs text-white/80 font-medium">ASE 2025 · ESC/ERS 2022 Guidelines</span>',
         '<span className="text-xs text-white/80 font-medium">Guideline-Based Assessment</span>'),
    ],
    "client/src/pages/StrainNavigator.tsx": [
        ('<div className="text-xs font-bold mb-1" style={{ color: "#7c3aed" }}>ASE 2025 — Mid-Wall GLS</div>',
         '<div className="text-xs font-bold mb-1" style={{ color: "#7c3aed" }}>Mid-Wall GLS</div>'),
    ],
    "client/src/pages/StrainScanCoach.tsx": [
        ('<div className="text-xs font-bold mb-1" style={{ color: "#7c3aed" }}>ASE 2025 — Mid-Wall GLS</div>',
         '<div className="text-xs font-bold mb-1" style={{ color: "#7c3aed" }}>Mid-Wall GLS</div>'),
        ('<div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#7c3aed" }}>ASE 2025 Updates</div>',
         '<div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#7c3aed" }}>Guideline Updates</div>'),
    ],
    "client/src/pages/StressNavigator.tsx": [
        ('<span className="text-xs text-white/80 font-medium">ASE 2025 · Stress Echo Protocol</span>',
         '<span className="text-xs text-white/80 font-medium">Guideline-Based Stress Echo Protocol</span>'),
        ('<p className="text-xs text-white/70 mt-0.5">ASE 2007 Stress Echo Guidelines · ASE 2025 Strain</p>',
         '<p className="text-xs text-white/70 mt-0.5">Guideline-Based Stress Echo · Strain Assessment</p>'),
    ],
    "client/src/pages/TEENavigator.tsx": [
        ('<span className="text-xs text-white/80 font-medium">ASE 2025 · TEE Protocol</span>',
         '<span className="text-xs text-white/80 font-medium">Guideline-Based TEE Protocol</span>'),
    ],
    "client/src/pages/TTENavigator.tsx": [
        ('<span className="text-xs text-white/80 font-medium">ASE 2025 · Adult TTE Protocol</span>',
         '<span className="text-xs text-white/80 font-medium">Guideline-Based Adult TTE Protocol</span>'),
    ],
    "client/src/pages/UEANavigator.tsx": [
        ('<span className="text-xs text-white/80 font-medium">ASE 2018 Contrast Echo Guidelines</span>',
         '<span className="text-xs text-white/80 font-medium">Guideline-Based Contrast Echo</span>'),
    ],
    "client/src/pages/PediatricEchoAssist.tsx": [
        ('<span className="text-xs text-white/80 font-medium">ASE 2016 Pediatric Echo Guidelines + AHA Kawasaki 2017</span>',
         '<span className="text-xs text-white/80 font-medium">Guideline-Based Pediatric Echo Assessment</span>'),
    ],
}

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
            print(f"  ✓ {rel_path}: replaced '{old[:70]}'")
            changed += 1
        else:
            print(f"  - {rel_path}: NOT FOUND '{old[:70]}'")
    if content != original:
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)

print(f"\nDone. {changed} replacements made.")
