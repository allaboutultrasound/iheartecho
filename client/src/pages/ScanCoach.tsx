/*
  iHeartEcho™ — Scan Coach
  Adult TTE (with SVG probe angle diagrams) + Fetal Echo (with CDN clinical images)
  Brand: Teal #189aa1, Aqua #4ad9e0
  Fonts: Merriweather headings, Open Sans body
*/
import { useState, useRef, useEffect, useMemo } from "react";
import { useSearch, Link } from "wouter";
import Layout from "@/components/Layout";
import BackToEchoAssist from "@/components/BackToEchoAssist";
import { Scan, Heart, Info, Eye, AlertTriangle, ChevronRight, Zap, Clock, Activity, TrendingUp, CheckCircle2, XCircle, Wind, Stethoscope, Baby, Users, Wind as WindIcon, Microscope, Crown } from "lucide-react";
import PedCHDCoach from "@/components/PedCHDCoach";
import { HOCMScanCoachContent } from "@/pages/HOCMScanCoach";
import { StrainScanCoachContent } from "@/pages/StrainScanCoach";
import { UEAScanCoachContent } from "@/pages/UEAScanCoach";
import { DiastolicScanCoachContent } from "@/pages/DiastolicNavigator";
import { useScanCoachOverrides } from "@/hooks/useScanCoachOverrides";
import { TEEIceScanCoachContent } from "@/pages/TEEIceScanCoach";
import { ICEScanCoachContent } from "@/pages/ICEScanCoach";
import { BlurredOverlay } from "@/components/BlurredOverlay";
import { PremiumPearlGate } from "@/components/PremiumPearlGate";
import { usePremium } from "@/hooks/usePremium";
import BillingCodesCard from "@/components/BillingCodesCard";
import { TTE_BILLING } from "@/lib/scanCoachBillingCodes";

// ─── Helper: render image or video based on URL extension ───────────────────
function MediaDisplay({ src, alt, className, style }: { src: string; alt: string; className?: string; style?: React.CSSProperties }) {
  const isVideo = /\.(mp4|webm|ogv|mov)(\?|$)/i.test(src);
  if (isVideo) {
    return <video src={src} controls autoPlay loop muted playsInline className={className} style={style} />;
  }
  return <img src={src} alt={alt} className={className} style={style} />;
}

// ─── CDN image URLs (clinical images from iHeartEcho™ curriculum) ───
const CDN = {
  sweep:        "/assets/transferred/pwtXDnxySsEwDrgH-d1ed0f96.png",
  fourChamber:  "/assets/transferred/CLtSxqdZHBcCumkP-3cc8d77c.png",
  lvot:         "/assets/transferred/HGAQPXIReqfTNBKy-7399085d.png",
  rvot:         "/assets/transferred/zkMTTtxmdDbJFPnT-f71758f9.png",
  rvotBifurcation: "/assets/transferred/GJOvhZIPNnIgAQHJ-7f17d891.png",
  threeVVDuctal: "/assets/transferred/tqIbdiftEiCjCtBg-bcb43a8a.png",
  threeVT:      "/assets/transferred/wXdhYtXSmjdILGLY-6a79947c.png",
  bicaval:      "/assets/transferred/BFlsjzXHQURCTgXJ-2e1ccf94.png",
  aorticArch:   "/assets/transferred/TKlJMYtocuCBKwbl-f51d223b.png",
  ductalArch:   "/assets/transferred/bvrodzhIwNApIBbC-453349bc.png",
  bcv:          "/assets/transferred/vRqqlQSitiQuZxSJ-249ff94d.png",
  // New diagram image for Abdominal Situs view
  abdominalSitusDiagram: "/assets/transferred/ZMTandoYWqCfTVQG-5964242d.png",
  // Echo images for each fetal view
  echoAbdominalSitus: "/assets/transferred/oJAqycRWgaGIHUKy-f658e372.png",
  echoFourChamber:    "/assets/transferred/FsCsjnyeqmklIFoo-ebf177e3.mp4",
  echoLvot:           "/assets/transferred/yKTaXDyqcalQLhSz-512f85b9.mp4",
  echoRvot:           "/assets/transferred/mfSQNxAuERDAcTEN-354b0de4.mp4",
  echoRvotBifurcation:"/assets/transferred/kjNujbopvYeXuXRd-6bcee0ba.png",
  echoThreeVVDuctal:  "/assets/transferred/tqrBgqVGzZDYoeXM-db7f19d2.png",
  echoThreeVT:        "/assets/transferred/ViQyJlALqrvWVEph-c7413dde.mp4",
  echoLbvc:           "/assets/transferred/VizJommhsipdzIeA-aa67d05a.png",
  echoBicaval:        "/assets/transferred/XLCPDDlQZLNxHWxC-35a7fec5.mp4",
  echoAorticArch:     "/assets/transferred/UBqhGFAUZIxSaYgz-c1b23441.mp4",
  echoDuctalArch:     "/assets/transferred/niftMrorwLRVixtq-d09e4765.mp4",
  // RVOT Short Axis and LV Short Axis echo images
  echoRvotShortAxis:  "/assets/scan-coach/media-unavailable.svg",
  echoLvShortAxis:    "/assets/transferred/vQTOAothgRTPuaXI-6780aaf2.mp4",
  // TTE clinical echo GIF images
  ttePlaxEcho:       "/assets/transferred/RxzJMuUOSGniiSQV-818c13a9.mp4",
  ttePsaxAvEcho:     "/assets/transferred/wPhrDExHGwzxURqY-55cdded5.mp4",
  ttePsaxMvEcho:     "/assets/transferred/UVPZcUgfHUYSXCkS-cbbd4664.mp4",
  ttePsaxPmEcho:     "/assets/transferred/IdDnAaOhcJglRBMz-ee448043.mp4",
  tteA4cEcho:        "/assets/transferred/IhkfGpYhGzwoxuoO-d4d70174.mp4",
  tteA5cEcho:        "/assets/transferred/sZToAKpLEtwyYOSQ-037ddfab.mp4",
  tteA2cEcho:        "/assets/transferred/sgOhjFxmGVlKnfZy-488ad97d.mp4",
  tteA3cEcho:        "/assets/transferred/MIGFgbsvzdjsvNGr-473623b3.mp4",
  tteSubcostalEcho:  "/assets/transferred/KkKODpDuaQZrummu-01c3f242.mp4",
  tteSsnEcho:        "/assets/transferred/dRuGEIQCWBrFaAkC-f7a8cbb5.mp4",
  // TTE transducer positioning images
  tteApical:     "/assets/transferred/FyGNOhOneNtvyDsb-275e370c.png",
  ttePlax:       "/assets/transferred/EwcEWxGVArmOjolJ-ba063eab.png",
  ttePsax:       "/assets/transferred/kYsNiUnpUbBHWOqB-2cfcedd7.png",
  tteSubcostal:  "/assets/transferred/mMcyBnfausgPNhgt-03f5b3a4.png",
  tteSsn:        "/assets/transferred/GVWCnCTSKZzVPYzd-14f5d503.png",
  // TTE anatomy reference images
  ttePlaxAnatomy:      "/assets/transferred/NCMteqcRpUyXcLmh-13fc4c74.png",
  ttePsaxAvAnatomy:    "/assets/transferred/pliNfvYTTGexOeMu-a74e0490.png",
  fetalRvotSaxAnatomy: "/assets/transferred/eAzSlcLjWuskBlIM-81994f23.png",
  ttePsaxMvAnatomy:    "/assets/transferred/gzlPjPoCsyFPoMRA-33f1c490.png",
  ttePsaxPmAnatomy:    "/assets/transferred/HeHaXZAIPUckSVtG-f71780c9.png",
  tteA4cAnatomy:       "/assets/transferred/YaQraGxDxjxifxMB-b98720fc.png",
  tteA5cAnatomy:       "/assets/transferred/GVQTFSGabOXDCQwQ-43622bbb.png",
  tteA2cAnatomy:       "/assets/transferred/spwUgNjdCmxHkZyI-2e74c9df.png",
  tteA3cAnatomy:       "/assets/transferred/YHeZKOeIAveVKoGs-bd11d65d.png",
  tteSubcostalAnatomy: "/assets/transferred/ntBNuKQcsJpBiLMI-65e3d013.png",
  tteSubcostalIvcAnatomy: "/assets/transferred/CxqiLHETrAjpjSMA-ce0ba63b.png",
  tteSsnAnatomy:       "/assets/transferred/zlgJAvWWvepFqRLx-d2756a14.png",
};

// ─── TTE Views ────────────────────────────────────────────────────────────────
const tteViews = [
  {
    id: "plax", name: "Parasternal Long Axis", abbr: "PLAX",
    probePosition: "Left sternal border, 3rd–4th ICS",
    probeOrientation: "Marker toward right shoulder (2 o'clock)",
    patientPosition: "Left lateral decubitus (left side down); arms across chest to widen intercostal spaces",
    structures: ["Aortic valve", "Mitral valve", "LV", "LA", "LVOT", "Descending aorta (posterior)"],
    doppler: "2D, Color and M-mode assessment",
    anatomyImageUrl: CDN.ttePlaxAnatomy,
    echoImageUrl: CDN.ttePlaxEcho,
    tips: ["Tilt probe to open up LVOT — IVS should be horizontal", "Descending aorta posterior to MV confirms true PLAX"],
    pitfalls: ["Foreshortening underestimates LV size", "Descending aorta mistaken for LA"],
    measurements: ["LVID (d/s)", "IVS (d)", "PW (d)", "Ao root", "LA diameter", "LVOT diameter"],
    color: "#189aa1",
    transducerImageUrl: CDN.ttePlax,
    // SVG: anterior chest, probe at 3rd ICS LSB, notch toward right shoulder
    probeSvg: `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:200px">
      <defs><marker id="ah" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#4ad9e0"/></marker></defs>
      <ellipse cx="100" cy="115" rx="82" ry="98" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="100" y1="28" x2="100" y2="185" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4,3"/>
      <path d="M100,62 Q58,67 42,83" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M100,82 Q56,87 40,103" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M100,102 Q56,107 40,123" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M100,122 Q58,127 44,143" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <!-- Probe at 3rd-4th ICS LSB, tilted ~-15deg -->
      <rect x="68" y="78" width="16" height="30" rx="4" fill="#189aa1" transform="rotate(-15,76,93)"/>
      <!-- Notch dot toward right shoulder -->
      <circle cx="60" cy="72" r="4" fill="#4ad9e0"/>
      <line x1="60" y1="72" x2="43" y2="55" stroke="#4ad9e0" stroke-width="1.8" marker-end="url(#ah)"/>
      <text x="100" y="218" text-anchor="middle" font-size="10" fill="#189aa1" font-family="sans-serif">3rd–4th ICS, LSB → notch 2 o'clock</text>
    </svg>`,
  },
  {
    id: "psax_av", name: "Parasternal Short Axis — AV Level", abbr: "PSAX-AV",
    probePosition: "Left sternal border, 3rd–4th ICS",
    probeOrientation: "Marker toward left shoulder (10 o'clock), rotated 90° from PLAX",
    patientPosition: "Left lateral decubitus; same position as PLAX — rotate probe without moving patient",
    structures: ["Aortic valve (3 cusps)", "RVOT", "Pulmonary valve", "LA", "RA", "Tricuspid valve", "Interatrial septum"],
    doppler: "2D, Color and PW/CW Doppler Valvular assessment",
    anatomyImageUrl: CDN.ttePsaxAvAnatomy,
    echoImageUrl: CDN.ttePsaxAvEcho,
    tips: ["'Mercedes-Benz' sign = normal tricuspid AV", "Bicuspid AV: 2 cusps, fish-mouth opening", "Assess for ASD at this level"],
    pitfalls: ["Bicuspid AV may appear tricuspid if not fully open", "RVOT foreshortening"],
    measurements: ["RVOT diameter", "Pulmonary valve annulus", "AV planimetry (AVA)"],
    color: "#1ba8b0",
    transducerImageUrl: CDN.ttePsax,
    probeSvg: `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:200px">
      <defs><marker id="ah2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#4ad9e0"/></marker></defs>
      <ellipse cx="100" cy="115" rx="82" ry="98" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="100" y1="28" x2="100" y2="185" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4,3"/>
      <path d="M100,62 Q58,67 42,83" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M100,82 Q56,87 40,103" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M100,102 Q56,107 40,123" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <!-- Probe rotated 90° CW — horizontal orientation -->
      <rect x="58" y="85" width="30" height="16" rx="4" fill="#189aa1" transform="rotate(0,73,93)"/>
      <!-- Notch dot toward left shoulder -->
      <circle cx="58" cy="85" r="4" fill="#4ad9e0"/>
      <line x1="58" y1="85" x2="42" y2="68" stroke="#4ad9e0" stroke-width="1.8" marker-end="url(#ah2)"/>
      <text x="100" y="218" text-anchor="middle" font-size="10" fill="#189aa1" font-family="sans-serif">Rotate 90° CW from PLAX → notch 10 o'clock</text>
    </svg>`,
  },
  {
    id: "psax_mv", name: "Parasternal Short Axis — MV Level", abbr: "PSAX-MV",
    probePosition: "Left sternal border, 3rd–4th ICS — tilt inferiorly from AV level",
    probeOrientation: "Marker toward left shoulder (10 o'clock)",
    patientPosition: "Left lateral decubitus; tilt probe inferiorly from PSAX-AV without repositioning patient",
    structures: ["Mitral valve (fish-mouth)", "LV (circular)", "Papillary muscles"],
    doppler: "Color Doppler at MV level, planimetry as indicated",
    anatomyImageUrl: CDN.ttePsaxMvAnatomy,
    echoImageUrl: CDN.ttePsaxMvEcho,
    tips: ["Fish-mouth opening of MV — both leaflets should open symmetrically", "Identify A1/A2/A3 and P1/P2/P3 scallops for MR localization", "Planimetry of MVA in mitral stenosis"],
    pitfalls: ["Oblique cut gives oval LV — reposition for true circle", "Papillary muscle level vs MV level"],
    measurements: ["MVA planimetry", "LV short-axis dimensions"],
    color: "#1db6bf",
    transducerImageUrl: CDN.ttePsax,
    probeSvg: `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:200px">
      <defs><marker id="ah3" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#4ad9e0"/></marker></defs>
      <ellipse cx="100" cy="115" rx="82" ry="98" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="100" y1="28" x2="100" y2="185" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4,3"/>
      <path d="M100,82 Q56,87 40,103" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M100,102 Q56,107 40,123" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M100,122 Q58,127 44,143" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <!-- Probe slightly more inferior, tilted posteriorly -->
      <rect x="58" y="98" width="30" height="16" rx="4" fill="#189aa1" transform="rotate(-5,73,106)"/>
      <circle cx="57" cy="97" r="4" fill="#4ad9e0"/>
      <line x1="57" y1="97" x2="41" y2="80" stroke="#4ad9e0" stroke-width="1.8" marker-end="url(#ah3)"/>
      <text x="100" y="218" text-anchor="middle" font-size="10" fill="#189aa1" font-family="sans-serif">Tilt posteriorly from AV level</text>
    </svg>`,
  },
  {
    id: "psax_pm", name: "Parasternal Short Axis — Papillary Muscle", abbr: "PSAX-PM",
    probePosition: "Left sternal border, 4th–5th ICS — tilt further inferiorly",
    probeOrientation: "Marker toward left shoulder (10 o'clock)",
    patientPosition: "Left lateral decubitus; tilt probe further inferiorly from PSAX-MV to reach papillary muscle level",
    structures: ["LV (circular)", "Anterolateral papillary muscle", "Posteromedial papillary muscle"],
    doppler: "Wall motion assessment in all LV wall segments, sweep through to apex",
    anatomyImageUrl: CDN.ttePsaxPmAnatomy,
    echoImageUrl: CDN.ttePsaxPmEcho,
    tips: ["Best level for regional wall motion assessment (6 segments visible)", "Anterolateral PM: LAD + LCx territory; Posteromedial PM: RCA territory", "Compare systolic thickening anterior vs inferior walls for ischemia"],
    pitfalls: ["Foreshortening makes LV appear oval", "Near-field artifact from ribs"],
    measurements: ["LV EF (visual)", "Wall motion score"],
    color: "#20c4ce",
    transducerImageUrl: CDN.ttePsax,
    probeSvg: `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:200px">
      <defs><marker id="ah4" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#4ad9e0"/></marker></defs>
      <ellipse cx="100" cy="115" rx="82" ry="98" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="100" y1="28" x2="100" y2="185" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4,3"/>
      <path d="M100,102 Q56,107 40,123" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M100,122 Q58,127 44,143" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M100,142 Q60,147 48,160" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <!-- Probe at 4th-5th ICS, more inferior -->
      <rect x="58" y="112" width="30" height="16" rx="4" fill="#059669" transform="rotate(-8,73,120)"/>
      <circle cx="57" cy="110" r="4" fill="#4ad9e0"/>
      <line x1="57" y1="110" x2="41" y2="93" stroke="#4ad9e0" stroke-width="1.8" marker-end="url(#ah4)"/>
      <text x="100" y="218" text-anchor="middle" font-size="10" fill="#189aa1" font-family="sans-serif">4th–5th ICS, more posterior tilt</text>
    </svg>`,
  },
  {
    id: "a4c", name: "Apical 4-Chamber", abbr: "A4C",
    probePosition: "Cardiac apex (5th ICS, midclavicular line)",
    probeOrientation: "Marker toward left (3 o'clock)",
    patientPosition: "Left lateral decubitus; use a cardiac notch pillow if available to drop the apex closer to the chest wall",
    structures: ["LV", "RV", "LA", "RA", "Mitral valve", "Tricuspid valve", "Interatrial septum", "IVS"],
    doppler: "PW Doppler at MV tips (E/A); TDI at annulus (e'); Assess MV/TV inflow; CW for TR (RVSP), TAPSE, EF and chamber sizes",
    transducerImageUrl: CDN.tteApical,
    anatomyImageUrl: CDN.tteA4cAnatomy,
    echoImageUrl: CDN.tteA4cEcho,
    tips: ["Apex must be at TOP of image — rotate patient to left lateral decubitus", "Foreshortening: LV appears round — move probe laterally and/or use lower ICS", "RV should be smaller than LV; RV:LV ratio >0.6 suggests RV dilation"],
    pitfalls: ["Foreshortening is the most common error", "Apex not at top → incorrect volumes"],
    measurements: ["LV volumes (biplane Simpson)", "EF", "GLS", "E, A, DT", "e' septal/lateral", "TAPSE", "RV FAC"],
    color: "#24d2d8",
    probeSvg: `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:200px">
      <defs><marker id="ah5" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#4ad9e0"/></marker></defs>
      <ellipse cx="100" cy="115" rx="82" ry="98" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="100" y1="28" x2="100" y2="185" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4,3"/>
      <path d="M100,122 Q58,127 44,143" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M100,142 Q60,147 48,160" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <!-- Probe at apex, pointing up -->
      <rect x="86" y="155" width="16" height="28" rx="4" fill="#d97706"/>
      <!-- Notch toward left (patient's left = image right) -->
      <circle cx="94" cy="154" r="4" fill="#4ad9e0"/>
      <line x1="94" y1="154" x2="116" y2="143" stroke="#4ad9e0" stroke-width="1.8" marker-end="url(#ah5)"/>
      <text x="100" y="218" text-anchor="middle" font-size="10" fill="#189aa1" font-family="sans-serif">Apex, 5th ICS MCL → notch 3 o'clock</text>
    </svg>`,
  },
  {
    id: "a5c", name: "Apical 5-Chamber", abbr: "A5C",
    probePosition: "Cardiac apex (5th ICS, midclavicular line)",
    probeOrientation: "Marker toward left (3 o'clock) — same as A4C, tilt probe slightly anteriorly",
    patientPosition: "Left lateral decubitus; same position as A4C — tilt probe anteriorly (toward sternum) to open the LVOT/AV into view",
    structures: ["LV", "RV", "LA", "RA", "LVOT", "Aortic valve", "Mitral valve", "Tricuspid valve"],
    doppler: "Assess AV with Color; PW in LVOT (VTI); CW through AV",
    transducerImageUrl: CDN.tteApical,
    anatomyImageUrl: CDN.tteA5cAnatomy,
    echoImageUrl: CDN.tteA5cEcho,
    tips: ["Tilt probe anteriorly from A4C until LVOT and AV come into view", "Ideal for PW Doppler in LVOT — align cursor parallel to LVOT flow", "CW through AV for peak and mean gradients", "Color Doppler to assess AR and AS"],
    pitfalls: ["Over-tilting anteriorly loses the 4-chamber view — find the balance", "Underalignment of Doppler cursor underestimates VTI"],
    measurements: ["LVOT VTI", "AV peak/mean gradient", "AVA (continuity equation)"],
    color: "#22d8de",
    probeSvg: `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:200px">
      <defs><marker id="ah5b" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#4ad9e0"/></marker></defs>
      <ellipse cx="100" cy="115" rx="82" ry="98" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="100" y1="28" x2="100" y2="185" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4,3"/>
      <path d="M100,122 Q58,127 44,143" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M100,142 Q60,147 48,160" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <!-- Probe at apex, tilted anteriorly -->
      <rect x="86" y="155" width="16" height="28" rx="4" fill="#189aa1"/>
      <!-- Notch toward left -->
      <circle cx="94" cy="154" r="4" fill="#4ad9e0"/>
      <line x1="94" y1="154" x2="116" y2="143" stroke="#4ad9e0" stroke-width="1.8" marker-end="url(#ah5b)"/>
      <text x="100" y="218" text-anchor="middle" font-size="10" fill="#189aa1" font-family="sans-serif">A4C position → tilt anteriorly to open LVOT</text>
    </svg>`,
  },
  {
    id: "a2c", name: "Apical 2-Chamber", abbr: "A2C",
    probePosition: "Cardiac apex — rotate 60° CCW from A4C",
    probeOrientation: "Marker toward 12 o'clock (superior)",
    patientPosition: "Left lateral decubitus; same position as A4C — rotate probe counterclockwise without moving patient",
    structures: ["LV (anterior and inferior walls)", "LA", "Mitral valve", "LAA"],
    doppler: "Assess MV with Color, Simpson's EF",
    transducerImageUrl: CDN.tteApical,
    anatomyImageUrl: CDN.tteA2cAnatomy,
    echoImageUrl: CDN.tteA2cEcho,
    tips: ["Rotate CCW from A4C until RV disappears — only LV and LA visible", "Anterior wall (top) and inferior wall (bottom) in this view", "LAA best seen with slight posterior tilt"],
    pitfalls: ["Oblique cut includes RV — rotate further CCW", "Inferior wall foreshortening"],
    measurements: ["LV volume (biplane Simpson)", "LAA assessment"],
    color: "#28dce0",
    probeSvg: `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:200px">
      <defs><marker id="ah6" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#4ad9e0"/></marker></defs>
      <ellipse cx="100" cy="115" rx="82" ry="98" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="100" y1="28" x2="100" y2="185" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4,3"/>
      <path d="M100,122 Q58,127 44,143" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M100,142 Q60,147 48,160" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <!-- Probe at apex, notch toward 12 o'clock -->
      <rect x="86" y="155" width="16" height="28" rx="4" fill="#189aa1"/>
      <circle cx="94" cy="154" r="4" fill="#4ad9e0"/>
      <line x1="94" y1="154" x2="94" y2="135" stroke="#4ad9e0" stroke-width="1.8" marker-end="url(#ah6)"/>
      <text x="100" y="218" text-anchor="middle" font-size="10" fill="#189aa1" font-family="sans-serif">Rotate 60° CCW from A4C → notch 12 o'clock</text>
    </svg>`,
  },
  {
    id: "a3c", name: "Apical 3-Chamber (APLAX)", abbr: "A3C",
    probePosition: "Cardiac apex — rotate 30° CCW from A2C",
    probeOrientation: "Marker toward 10–11 o'clock",
    patientPosition: "Left lateral decubitus; rotate probe counterclockwise from A2C to open the LVOT",
    structures: ["LV", "LA", "LVOT", "Aortic valve", "Ascending aorta"],
    doppler: "Assess with Color and PW/CW as indicated",
    transducerImageUrl: CDN.tteApical,
    anatomyImageUrl: CDN.tteA3cAnatomy,
    echoImageUrl: CDN.tteA3cEcho,
    tips: ["APLAX = apical long axis — shows LVOT and AV from apex", "Align Doppler cursor parallel to LVOT flow for accurate VTI", "Anteroseptal (top) and inferolateral (bottom) walls visible"],
    pitfalls: ["Underalignment of Doppler cursor underestimates VTI by up to 30%", "Confusion with A2C"],
    measurements: ["LVOT VTI", "AVA (continuity equation)", "AV peak/mean gradient"],
    color: "#30e0e4",
    probeSvg: `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:200px">
      <defs><marker id="ah7" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#4ad9e0"/></marker></defs>
      <ellipse cx="100" cy="115" rx="82" ry="98" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="100" y1="28" x2="100" y2="185" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4,3"/>
      <path d="M100,122 Q58,127 44,143" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M100,142 Q60,147 48,160" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <!-- Probe at apex, notch toward 10-11 o'clock -->
      <rect x="86" y="155" width="16" height="28" rx="4" fill="#189aa1"/>
      <circle cx="94" cy="154" r="4" fill="#4ad9e0"/>
      <line x1="94" y1="154" x2="76" y2="138" stroke="#4ad9e0" stroke-width="1.8" marker-end="url(#ah7)"/>
      <text x="100" y="218" text-anchor="middle" font-size="10" fill="#189aa1" font-family="sans-serif">Rotate 120° CCW from A4C → notch 10–11 o'clock</text>
    </svg>`,
  },
  {
    id: "subcostal", name: "Subcostal", abbr: "Sub",
    probePosition: "Subxiphoid, angled toward left shoulder at 45°",
    probeOrientation: "Marker toward patient's left",
    patientPosition: "Supine with knees bent (feet flat on bed) to relax abdominal muscles; ask patient to take a deep breath and hold",
    structures: ["IVC", "RA", "RV", "Atrial septum", "Pericardium", "Liver"],
    doppler: "M-mode IVC for RAP estimation; Hepatic vein PW",
    anatomyImageUrl: CDN.tteSubcostalAnatomy,
    echoImageUrl: CDN.tteSubcostalEcho,
    tips: ["IVC < 2.1 cm + >50% collapse = RAP 0–5 mmHg (normal)", "IVC > 2.1 cm + <50% collapse = RAP 15 mmHg (elevated)", "Best view for pericardial effusion and tamponade", "Ask patient to sniff for IVC collapsibility"],
    pitfalls: ["Hepatic vein mistaken for IVC", "Difficult in obese patients — try lateral decubitus"],
    measurements: ["IVC diameter", "IVC collapsibility index", "RAP estimate"],
    color: "#38e4e8",
    transducerImageUrl: CDN.tteSubcostal,
    probeSvg: `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:200px">
      <defs><marker id="ah8" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#4ad9e0"/></marker></defs>
      <!-- Abdomen outline -->
      <ellipse cx="100" cy="140" rx="85" ry="72" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
      <!-- Xiphoid process -->
      <path d="M100,68 L95,85 L100,95 L105,85 Z" fill="#cbd5e1" opacity="0.5"/>
      <!-- Probe flat on abdomen, angled up -->
      <rect x="72" y="90" width="52" height="14" rx="4" fill="#189aa1" transform="rotate(-15,98,97)"/>
      <!-- Notch toward patient's left -->
      <circle cx="74" cy="88" r="4" fill="#4ad9e0"/>
      <line x1="74" y1="88" x2="54" y2="72" stroke="#4ad9e0" stroke-width="1.8" marker-end="url(#ah8)"/>
      <text x="100" y="218" text-anchor="middle" font-size="10" fill="#189aa1" font-family="sans-serif">Subxiphoid, probe flat, angled superiorly</text>
    </svg>`,
  },
  {
    id: "suprasternal", name: "Suprasternal", abbr: "SSN",
    probePosition: "Suprasternal notch, angled inferiorly",
    probeOrientation: "Marker toward left (sagittal plane)",
    patientPosition: "Supine with neck extended (shoulder roll or pillow under shoulders); head turned slightly to the right",
    structures: ["Aortic arch", "Innominate artery", "Left carotid artery", "Left subclavian artery", "Descending aorta", "RPA (cross-section)"],
    doppler: "CW Doppler in descending aorta (diastolic flow reversal in AR); coarctation gradient",
    anatomyImageUrl: CDN.tteSsnAnatomy,
    echoImageUrl: CDN.tteSsnEcho,
    tips: ["Extend patient's neck with shoulder roll for better access", "Aortic arch visible as 'candy cane' shape", "Diastolic flow reversal in descending aorta = significant AR"],
    pitfalls: ["Difficult in short necks or COPD", "Probe pressure may cause discomfort"],
    measurements: ["Aortic arch diameter", "Descending aorta diastolic flow reversal"],
    color: "#4ad9e0",
    transducerImageUrl: CDN.tteSsn,
    probeSvg: `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:200px">
      <defs><marker id="ah9" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#4ad9e0"/></marker></defs>
      <!-- Neck/chest outline -->
      <path d="M68,42 Q58,22 100,17 Q142,22 132,42 L142,130 Q100,152 58,130 Z" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
      <!-- Clavicles -->
      <line x1="58" y1="85" x2="100" y2="74" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="142" y1="85" x2="100" y2="74" stroke="#cbd5e1" stroke-width="1.5"/>
      <!-- Probe in suprasternal notch -->
      <rect x="82" y="65" width="36" height="14" rx="4" fill="#1d4ed8" transform="rotate(-20,100,72)"/>
      <circle cx="84" cy="63" r="4" fill="#4ad9e0"/>
      <line x1="84" y1="63" x2="65" y2="50" stroke="#4ad9e0" stroke-width="1.8" marker-end="url(#ah9)"/>
      <text x="100" y="218" text-anchor="middle" font-size="10" fill="#189aa1" font-family="sans-serif">Suprasternal notch, neck extended</text>
    </svg>`,
  },
];

// ─── Fetal Echo Viewss ─────────────────────────────────────────────────────────
const fetalViews = [
  {
    id: "abdominal-situs", step: 1,
    name: "Abdominal Situs View", abbr: "Situs",
    description: "The first step in fetal cardiac evaluation. Confirms normal situs solitus — stomach on left, liver on right, aorta left of spine, IVC right of spine. Situs abnormalities are strongly associated with complex congenital heart disease.",
    imageUrl: CDN.abdominalSitusDiagram,
    echoImageUrl: CDN.echoAbdominalSitus,
    structures: ["Stomach (left)", "Liver (right)", "Descending aorta (left of spine)", "IVC (right of spine)", "Umbilical vein", "Spine (posterior)"],
    normalFindings: ["Stomach bubble on LEFT side of fetus", "Aorta to LEFT of spine, IVC to RIGHT", "Liver on right, stomach on left", "Umbilical vein entering liver anteriorly"],
    technique: "Transverse view of fetal abdomen at level of stomach. Identify spine posteriorly. Confirm stomach on left and aorta/IVC positions relative to spine.",
    doppler: "Color Doppler to confirm aorta (pulsatile) vs. IVC (venous) positions relative to spine",
    pitfalls: ["Fetal position may make left/right orientation confusing — always reference spine first", "Absent stomach may indicate esophageal atresia or diaphragmatic hernia"],
    redFlags: ["Stomach on RIGHT (situs inversus or heterotaxy)", "Stomach absent (esophageal atresia, CDH)", "Aorta and IVC on same side (asplenia/polysplenia)", "Midline stomach (heterotaxy)"],
    color: "#189aa1",
  },
  {
    id: "4cv", step: 2,
    name: "Four Chamber View", abbr: "4CV",
    description: "The most important screening view in fetal echo. Obtained from a transverse cross-section of the fetal thorax at the level of the AV valves. The heart should occupy approximately 1/3 of the thoracic area.",
    imageUrl: CDN.fourChamber,
    echoImageUrl: CDN.echoFourChamber,
    structures: ["LV (left, posterior)", "RV (right, anterior)", "LA (posterior left)", "RA (posterior right)", "Mitral valve", "Tricuspid valve", "IVS", "IAS with foramen ovale flap", "Descending aorta (posterior to spine)"],
    normalFindings: ["LV and RV roughly equal in size (RV slightly larger in fetus)", "Foramen ovale flap opens toward LA", "Apex points toward left anterior chest wall (levocardia)", "Descending aorta posterior-left to spine", "Pulmonary veins entering LA (2 on each side)"],
    technique: "Transverse sweep from abdomen (situs view) cranially until 4 chambers are visible. Maintain transverse plane — do not oblique.",
    doppler: "Color Doppler across AV valves for regurgitation. PW at MV and TV tips for E/A ratio.",
    pitfalls: ["Dextrocardia vs dextroposition — check situs first", "Foramen ovale flap mistaken for ASD — flap should bow toward LA", "Oblique cut may make chambers appear unequal"],
    redFlags: ["Cardiomegaly (>1/3 thorax)", "Unequal chamber sizes", "Absent or abnormal foramen ovale flap", "Pericardial effusion", "Echogenic focus (EIF)", "Cardiac axis >60°"],
    patientPosition: "Mother supine or left lateral tilt; obtain true transverse cardiac cut perpendicular to fetal spine",
    color: "#1ba8b0",
  },
  {
    id: "lvot", step: 3,
    name: "LVOT View", abbr: "LVOT",
    description: "Obtained by rotating the transducer slightly from the 4CV to bring the LVOT into view. Confirms the aorta arises from the LV (ventriculo-arterial concordance) and crosses the RVOT.",
    imageUrl: CDN.lvot,
    echoImageUrl: CDN.echoLvot,
    structures: ["LV", "RV", "LA", "Ascending aorta (ASC AO)", "LVOT", "Pulmonary veins (entering LA)", "Descending aorta (DESC AO)"],
    normalFindings: ["Aorta arises from LV — continuity between IVS and anterior aortic wall", "Aorta crosses rightward over the RVOT", "Ascending aorta smaller than MPA in fetus", "Pulmonary veins visible entering LA posteriorly"],
    technique: "From 4CV, rotate transducer slightly clockwise (or tilt anteriorly) until the aortic root comes into view arising from the LV. The LVOT should be parallel to the ultrasound beam.",
    doppler: "PW Doppler in LVOT for velocity. Color Doppler to confirm antegrade flow from LV to aorta.",
    pitfalls: ["Overangulation brings in RVOT instead of LVOT", "Aorta appears to arise from RV in TGA — confirm with RVOT view"],
    redFlags: ["Aorta arising from RV (TGA)", "Overriding aorta (TOF)", "Aortic stenosis — turbulent LVOT flow", "Small ascending aorta (HLHS)"],
    patientPosition: "Mother supine; tilt transducer slightly cephalad from 4CV to bring LVOT into view",
    color: "#1db6bf",
  },
  {
    id: "rvot", step: 4,
    name: "RVOT View", abbr: "RVOT",
    echoImageUrl: CDN.echoRvot,
    description: "Confirms the pulmonary artery arises from the RV. The MPA is normally larger than the ascending aorta in the fetus. The PA bifurcates into LPA and RPA.",
    imageUrl: CDN.rvot,
    structures: ["RV", "Main pulmonary artery (MPA/PA)", "Ascending aorta (ASC AO)", "Superior vena cava (SVC)", "Descending aorta (DESC AO)"],
    normalFindings: ["PA arises from RV — larger than ascending aorta in fetus", "PA bifurcates into LPA and RPA", "ASC AO and SVC visible as smaller circles to the right of PA", "DESC AO visible as small circle in lower left"],
    technique: "From LVOT view, continue rotating/tilting anteriorly until PA comes into view arising from RV. The PA should be seen bifurcating.",
    doppler: "PW Doppler in MPA for velocity. Color Doppler to confirm antegrade flow from RV to PA.",
    pitfalls: ["PA arising from LV in TGA — confirm with LVOT view", "Pulmonary stenosis — turbulent flow in MPA"],
    redFlags: ["PA arising from LV (TGA)", "Small PA (pulmonary atresia/stenosis)", "PA = Ao size (abnormal)", "Absent PA bifurcation"],
    patientPosition: "Mother supine; tilt transducer further cephalad from LVOT view to visualize RVOT crossing over aorta",
    color: "#20c4ce",
  },
  {
    id: "rvot-bifurcation", step: 5,
    name: "RVOT with MPA Bifurcation", abbr: "MPA Bifurc",
    echoImageUrl: CDN.echoRvotBifurcation,
    description: "A slightly superior view from the RVOT showing the main pulmonary artery bifurcating into the right and left pulmonary arteries. Confirms pulmonary artery anatomy and rules out pulmonary atresia.",
    imageUrl: CDN.rvotBifurcation,
    structures: ["RV", "Main PA (MPA)", "Right PA (RPA)", "Left PA (LPA)", "Ascending aorta", "SVC"],
    normalFindings: ["MPA bifurcates into RPA and LPA", "RPA and LPA roughly equal in size", "PA bifurcation visible in same plane"],
    technique: "Slight superior tilt from RVOT view. The PA bifurcation confirms pulmonary artery anatomy and rules out pulmonary atresia.",
    doppler: "Color Doppler at bifurcation; assess RPA and LPA flow",
    pitfalls: ["Absent bifurcation may indicate pulmonary atresia with intact IVS", "Markedly asymmetric branch PAs suggest peripheral PS or absent PA"],
    redFlags: ["Absent bifurcation (pulmonary atresia with intact IVS)", "Markedly asymmetric branch PAs", "Confluent PAs absent (severe TOF with absent PA)"],
    patientPosition: "Mother supine; slight additional cephalad tilt from RVOT view to visualize PA bifurcation into RPA and LPA",
    color: "#24d2d8",
  },
  {
    id: "3vv-ductal", step: 6,
    name: "3-Vessel View (3VV) — Ductal", abbr: "3VV",
    description: "A transverse view at the level of the great vessels showing three vessels in a line from left to right: MPA (largest), ascending aorta (medium), and SVC (smallest). The MPA bifurcates in this view.",
    imageUrl: CDN.threeVVDuctal,
    echoImageUrl: CDN.echoThreeVVDuctal,
    structures: ["MPA/Ductus Arteriosus (DA)", "Ascending aorta (ASC AO)", "SVC", "Descending aorta (DESC AO)"],
    normalFindings: ["Three vessels in a line: PA > Ao > SVC (left to right)", "PA is the largest vessel — normally larger than Ao in fetus", "Vessels align in a straight line (abnormal if offset)", "DESC AO in lower left quadrant"],
    technique: "From RVOT view, slide the transducer slightly cranially. The three vessels should appear in a transverse plane. Maintain transverse orientation.",
    doppler: "Color Doppler across all three vessels to confirm antegrade flow. PW in MPA for velocity.",
    pitfalls: ["Only 2 vessels visible — may be at wrong level", "PA and Ao equal in size — abnormal", "Vessels not in a line — offset suggests abnormality"],
    redFlags: ["PA < Ao (pulmonary stenosis/atresia)", "Absent SVC", "Vessels not in a line", "Reversed flow in PA (pulmonary atresia)"],
    patientPosition: "Mother supine; transverse upper mediastinal view — three vessels must appear in a straight line",
    color: "#28dce0",
  },
  {
    id: "3vt", step: 7,
    name: "3-Vessel Trachea View (3VT)", abbr: "3VT",
    description: "A transverse view at the level of the superior mediastinum showing the relationship of the three vessels to the trachea. Critical for detecting vascular rings and abnormal vessel arrangements.",
    imageUrl: CDN.threeVT,
    echoImageUrl: CDN.echoThreeVT,
    structures: ["MPA / ductal arch", "Transverse aortic arch", "SVC", "Trachea (echogenic ring)", "Descending aorta"],
    normalFindings: ["Aortic arch curves to the left of the trachea (left aortic arch)", "Three vessels form a 'V' shape pointing to the right", "Trachea is a small echogenic ring to the right of the aortic arch", "SVC is the rightmost vessel"],
    technique: "Slide cranially from 3VV until the trachea becomes visible as an echogenic ring. The aortic arch should be seen curving to the left.",
    doppler: "Color Doppler to confirm flow direction in all vessels.",
    pitfalls: ["Right aortic arch: arch curves to the right of trachea — abnormal", "Double aortic arch: vessels on both sides of trachea", "Trachea not identified — may be at wrong level"],
    redFlags: ["Right aortic arch (curves right of trachea)", "Double aortic arch", "Aberrant subclavian artery", "Vascular ring encircling trachea"],
    patientPosition: "Mother supine; transverse upper mediastinal view slightly cephalad to 3VV — trachea ring must be visible to the right of the aortic arch",
    color: "#30e0e4",
  },
  {
    id: "lbvc", step: 8,
    name: "LBVC View", abbr: "LBVC",
    description: "A superior transverse sweep above the 3VT level showing the left brachiocephalic vein (LBVC) crossing from left to right to join the SVC. The thymus is visible anteriorly. This view is obtained immediately after the 3VT by sliding the transducer slightly cranially.",
    imageUrl: CDN.bcv,
    echoImageUrl: CDN.echoLbvc,
    structures: ["Left brachiocephalic vein (LBVC)", "SVC", "Thymus", "Brachiocephalic arteries", "Trachea (T)"],
    normalFindings: ["LBVC crosses midline from left to right to join SVC", "Thymus visible as gray structure anterior to vessels", "3 brachiocephalic arteries visible below LBVC", "Trachea to right side"],
    technique: "Superior transverse sweep above 3VT level. The LBVC appears as a horizontal vessel crossing from left to right, anterior to the aortic arch vessels.",
    doppler: "Color Doppler to confirm LBVC flow direction (left to right into SVC); assess thymic size",
    pitfalls: ["Absent LBVC may drain anomalously — TAPVR, heterotaxy", "Dilated LBVC suggests increased flow — PAPVR, AVM"],
    redFlags: ["Absent LBVC (may drain anomalously — TAPVR, heterotaxy)", "Dilated LBVC (increased flow — PAPVR, AVM)", "Absent thymus (22q11 DiGeorge)", "Persistent LSVC (LBVC absent, vertical vein present instead)"],
    patientPosition: "Mother supine; transverse upper chest view just above 3VT — LBVC crosses horizontally anterior to the great vessels",
    color: "#38e4e8",
  },
  {
    id: "lv-short-axis", step: 9,
    name: "LV Short Axis View", abbr: "LV SAX",
    description: "A transverse view at the mid-ventricular level showing the left ventricle in short axis. The LV appears circular with the RV wrapping around it anteriorly. Used to assess ventricular size, wall thickness, and systolic function.",
    imageUrl: CDN.echoLvShortAxis,
    echoImageUrl: CDN.echoLvShortAxis,
    structures: ["LV (circular)", "RV (crescent-shaped, anterior)", "Interventricular septum (IVS)", "Posterior wall", "Papillary muscles (at mid level)"],
    normalFindings: ["LV appears circular in cross-section", "RV wraps around anterior LV", "Symmetric wall thickness", "Normal papillary muscle position at mid level", "Concentric contraction on M-mode"],
    technique: "Transverse plane at mid-ventricular level. Tilt caudally from 4CV until LV appears circular with papillary muscles visible. Avoid oblique cuts that make LV appear oval.",
    doppler: "Not typically used; M-mode through LV at papillary muscle level for fractional shortening",
    pitfalls: ["Oblique cut makes LV appear oval — foreshortens measurements", "Papillary muscles may be confused for VSD or mass", "Difficult to obtain in late gestation due to fetal position"],
    redFlags: ["Asymmetric wall thickness (hypertrophic cardiomyopathy)", "Dilated LV (cardiomyopathy, severe AR/MR)", "Echogenic foci in LV (normal variant vs. cardiac rhabdomyoma)", "Hypoplastic LV (HLHS)"],
    patientPosition: "Mother supine; transverse cardiac view at papillary muscle level — tilt inferiorly from 4CV",
    color: "#3de8e8",
  },
  {
    id: "rvot-short-axis", step: 10,
    name: "RVOT Short Axis View", abbr: "RVOT SAX",
    description: "A transverse view at the base of the heart showing the RVOT, pulmonary valve, and main pulmonary artery with its bifurcation into RPA and LPA. Also shows the aortic root in cross-section and the ductus arteriosus.",
    imageUrl: CDN.fetalRvotSaxAnatomy,
    echoImageUrl: CDN.echoRvotShortAxis,
    anatomyImageUrl: CDN.fetalRvotSaxAnatomy,
    structures: ["RV", "RVOT", "Pulmonary valve", "Main PA", "RPA", "LPA", "Aortic root (AO, circular)", "RA", "Ductus Arteriosus (DA)"],
    normalFindings: ["Aortic root appears circular (AO) with PA wrapping around it", "PA bifurcates into RPA and LPA", "DA connects PA to descending aorta", "RV and RA visible", "PA diameter ≥ Ao diameter in normal fetus"],
    technique: "Transverse plane at base of heart. Tilt cranially from 3VV level. The aortic root appears as a circle with the RVOT/PA wrapping around it anteriorly — the classic 'circle and sausage' appearance.",
    doppler: "Color/PW Doppler across pulmonary valve; CW for peak velocity; assess DA flow direction",
    pitfalls: ["PA may appear smaller than Ao if oblique — ensure true transverse cut", "DA may be confused with LPA — trace vessel to descending aorta to confirm"],
    redFlags: ["PA smaller than Ao (pulmonary stenosis/atresia, TOF)", "Absent pulmonary valve", "Reversed DA flow (critical pulmonary obstruction)", "Absent LPA or RPA"],
    patientPosition: "Mother supine; transverse upper mediastinal view — same level as 3VV, confirm PA and aortic root cross-sections",
    color: "#42e8e4",
  },
  {
    id: "bicaval", step: 11,
    name: "Bicaval View", abbr: "Bicaval",
    description: "A sagittal or near-sagittal view through the right side of the fetus showing both the SVC and IVC draining into the right atrium. Best view for assessing venous return and foramen ovale.",
    imageUrl: CDN.bicaval,
    echoImageUrl: CDN.echoBicaval,
    structures: ["RA", "SVC (right side)", "IVC (left side)", "LA", "Right pulmonary artery (RPA)", "Aorta (AO)"],
    normalFindings: ["SVC and IVC both drain into RA", "Foramen ovale flap visible in LA", "RPA visible in cross-section", "IVC and SVC enter RA from opposite ends"],
    technique: "Sagittal or near-sagittal plane through right side of fetus. Rotate from transverse to align with IVC/SVC axis.",
    doppler: "Color Doppler to confirm SVC and IVC flow into RA; assess foramen ovale shunting",
    pitfalls: ["SVC absent (left SVC only — persistent LSVC)", "IVC interruption with azygos continuation (polysplenia)", "Dilated coronary sinus (persistent LSVC)"],
    redFlags: ["SVC absent (persistent LSVC only)", "IVC interruption with azygos continuation (polysplenia)", "Dilated coronary sinus (persistent LSVC)", "ASD/sinus venosus defect"],
    patientPosition: "Mother supine; sagittal or oblique view along fetal spine — align with IVC/SVC long axis entering RA",
    color: "#4ad9e0",
  },
  {
    id: "aortic-arch", step: 12,
    name: "Aortic Arch View (Long Axis)", abbr: "Ao Arch",
    description: "A sagittal view through the left side of the fetus showing the aortic arch in long axis. The classic 'candy cane' shape confirms left aortic arch. Three head and neck vessels arise from the arch.",
    imageUrl: CDN.aorticArch,
    echoImageUrl: CDN.echoAorticArch,
    structures: ["Ascending aorta (ASC AO)", "Aortic arch", "Descending aorta (DESC AO)", "RA", "Right pulmonary artery (RPA)"],
    normalFindings: ["Candy-cane shape of aortic arch", "3 head/neck vessels arising from arch (innominate, LCCA, LSCA)", "Aortic isthmus visible between LSCA and ductus", "Left-sided arch (curves to left of trachea)"],
    technique: "Sagittal plane through left side of fetus. Align with aortic arch long axis — should see the classic candy-cane curve.",
    doppler: "CW/PW at aortic isthmus; retrograde or absent diastolic flow = coarctation/critical obstruction",
    pitfalls: ["Ductal arch may be confused with aortic arch — ductal arch is more vertical (hockey stick)", "Only 2 head vessels visible suggests aberrant subclavian artery"],
    redFlags: ["Right aortic arch (mirror image — 22q11, TOF)", "Coarctation — narrowing at isthmus", "Interrupted aortic arch — gap in arch", "Only 2 head vessels (aberrant subclavian)"],
    patientPosition: "Mother supine; sagittal view along fetal left side — rotate transducer to align with aortic arch long axis",
    color: "#3ecfd6",
  },
  {
    id: "ductal-arch", step: 13,
    name: "Long Axis Ductal Arch View", abbr: "Ductal Arch",
    description: "A sagittal view showing the ductus arteriosus connecting the pulmonary artery to the descending aorta. The ductal arch has a characteristic 'hockey stick' shape — more vertical and acute than the aortic arch.",
    imageUrl: CDN.ductalArch,
    echoImageUrl: CDN.echoDuctalArch,
    structures: ["RV", "Pulmonary valve", "Ductus Arteriosus", "Descending aorta (DESC AO)", "Aortic root (LA)"],
    normalFindings: ["Hockey-stick shape (more acute angle than aortic arch)", "Ductus connects PA directly to descending aorta", "No head/neck vessels arising from ductal arch", "RV and pulmonary valve visible at origin"],
    technique: "Sagittal plane through right side of fetus. The ductal arch is more vertical and acute than the aortic arch — hockey-stick vs. candy-cane.",
    doppler: "PW/Color Doppler in ductus; reversed or absent flow = critical right heart obstruction",
    pitfalls: ["Ductal arch confused with aortic arch — DA is more anterior and vertical", "Absent DA may indicate pulmonary hypertension or premature closure"],
    redFlags: ["Absent ductus (isolated ductal absence — rare)", "Constricted ductus (NSAIDs, indomethacin exposure)", "Reversed ductal flow (critical pulmonary stenosis/atresia)", "Aneurysmal ductus"],
    patientPosition: "Mother supine; sagittal view along fetal right side — rotate transducer to align with ductal arch (more vertical than aortic arch)",
    color: "#189aa1",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function TTEViewCard({ view, isSelected, onClick }: { view: typeof tteViews[0]; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-2"
      style={isSelected ? { background: view.color, color: "white" } : { color: "#475569" }}
    >
      <span className="text-xs font-mono font-bold w-14 shrink-0"
        style={isSelected ? { color: "rgba(255,255,255,0.85)" } : { color: view.color }}>
        {view.abbr}
      </span>
      <span className="text-xs leading-tight">{view.name}</span>
    </button>
  );
}

function FetalViewCard({ view, isSelected, onClick }: { view: typeof fetalViews[0]; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-2"
      style={isSelected ? { background: view.color, color: "white" } : { color: "#475569" }}
    >
      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
        style={isSelected ? { background: "rgba(255,255,255,0.25)", color: "white" } : { background: view.color + "20", color: view.color }}>
        {view.step}
      </span>
      <span className="text-xs leading-tight">{view.name}</span>
    </button>
  );
}

// ─── ACHD Scan Coach Component ──────────────────────────────────────────────
const achdLesions = [
  {
    id: "asd",
    label: "ASD / PFO",
    color: "#189aa1",
    views: [
      { name: "Subcostal 4-Chamber", tip: "Best window for ASD. Align beam perpendicular to the IAS. Use color Doppler to detect L→R shunt. Measure defect diameter at widest point.", pearls: ["Rotate probe to subcostal coronal for sinus venosus ASD", "Assess IVC/SVC drainage to confirm sinus venosus type", "Check for associated partial anomalous pulmonary venous return (PAPVR)"] },
      { name: "Parasternal Short Axis", tip: "Identify ASD location relative to AV and MV. Ostium secundum sits mid-IAS; primum is inferior near AV valves.", pearls: ["Primum ASD: look for cleft anterior MV leaflet", "Color Doppler at 0–30° to detect sinus venosus shunt near SVC"] },
      { name: "Apical 4-Chamber", tip: "Measure RA/RV dimensions. RV enlargement (RVD1 >4.2 cm) suggests significant shunt. Assess TR for RVSP estimation.", pearls: ["RV:LV ratio >1 indicates significant volume overload", "Assess for paradoxical septal motion (D-shaped LV in PSAX)"] },
      { name: "Bicaval TEE View (if applicable)", tip: "Gold standard for sinus venosus ASD. Rotate to ~100–110° to see SVC–RA junction and defect rim.", pearls: ["Confirm adequate rims for device closure (>5 mm all rims)", "3D TEE for accurate sizing before device closure"] },
    ]
  },
  {
    id: "vsd",
    label: "VSD",
    color: "#189aa1",
    views: [
      { name: "Parasternal Long Axis", tip: "Perimembranous VSD visible just below the AV. Align color box at the LVOT/IVS junction. Measure peak CW velocity to estimate RV pressure (modified Bernoulli).", pearls: ["RV systolic pressure = SBP − 4V²", "Aneurysm of the membranous septum may partially restrict the defect"] },
      { name: "Parasternal Short Axis", tip: "Rotate through IVS to characterize VSD type: perimembranous (12 o'clock), inlet (7–8 o'clock), muscular (central), outlet/subarterial (10–11 o'clock).", pearls: ["Subarterial VSD: check for AR due to leaflet prolapse", "Multiple muscular VSDs: 'Swiss cheese' — use color Doppler sweep"] },
      { name: "Apical 4-Chamber", tip: "Inlet VSD best seen here. Assess AV valve attachments — inlet VSD may have common AV valve in AVSD.", pearls: ["Measure Qp/Qs if shunt fraction needed (LVOT VTI × LVOT area vs RVOT VTI × RVOT area)"] },
      { name: "Subcostal", tip: "Useful for muscular VSDs in children. Sweep through the IVS in multiple planes with color Doppler.", pearls: ["High-velocity L→R jet confirms restrictive VSD and normal RV pressure", "Low-velocity or bidirectional flow suggests elevated RV pressure"] },
    ]
  },
  {
    id: "tof",
    label: "Repaired ToF",
    color: "#189aa1",
    views: [
      { name: "Parasternal Long Axis", tip: "Assess LVOT for residual obstruction. Measure LV dimensions and function. Check for neo-aortic root dilation (>4.5 cm warrants surveillance).", pearls: ["Aortic root dilation is common in ToF — measure at annulus, sinuses, STJ, and ascending aorta", "LV dysfunction may develop late due to chronic RV-LV interaction"] },
      { name: "Parasternal Short Axis — RVOT", tip: "Key view for RVOT assessment. Measure RVOT diameter and assess PR by color and CW Doppler. PR fraction >40% is severe.", pearls: ["Pressure half-time <100 ms indicates severe PR", "Assess for residual RVOT obstruction: peak gradient >40 mmHg warrants intervention", "Look for patch dehiscence or aneurysmal RVOT"] },
      { name: "Apical 4-Chamber", tip: "Quantify RV size (RVD1, RVD2, RVEDA) and function (FAC, TAPSE, S'). RV dilation is the primary indication for PVR.", pearls: ["RVEDVI >160 mL/m² or RVESVI >80 mL/m² are thresholds for PVR consideration", "Assess TR severity — often worsens with RV dilation"] },
      { name: "Subcostal IVC", tip: "Assess IVC size and collapsibility for RA pressure. Hepatic vein flow reversal suggests severe TR or elevated RA pressure.", pearls: ["Dilated IVC (>2.1 cm, <50% collapse) = RA pressure ≥15 mmHg"] },
    ]
  },
  {
    id: "coa",
    label: "Repaired CoA",
    color: "#189aa1",
    views: [
      { name: "Suprasternal Notch", tip: "Primary window for CoA surveillance. Align CW Doppler with descending aorta flow. Peak velocity >3.5 m/s or mean gradient >20 mmHg suggests re-coarctation.", pearls: ["'Diastolic tail' (persistent antegrade flow in diastole) is a hallmark of significant CoA", "Measure aortic arch dimensions: transverse arch, isthmus, and descending aorta at diaphragm"] },
      { name: "Parasternal Long Axis", tip: "Assess for associated bicuspid AV (present in 50–85% of CoA). Measure aortic root and ascending aorta dimensions.", pearls: ["Bicuspid AV + CoA: high risk for aortic dilation — measure annually", "LV hypertrophy from chronic pressure overload — assess wall thickness and mass"] },
      { name: "Apical 5-Chamber / LVOT", tip: "Quantify LVOT obstruction if BAV with AS is present. Measure peak AV velocity and mean gradient.", pearls: ["Doppler underestimates gradient if beam is not aligned — use multiple windows"] },
      { name: "Abdominal Aorta (subcostal)", tip: "Assess abdominal aortic flow pattern. Tardus parvus waveform (slow upstroke, reduced amplitude) confirms significant proximal obstruction.", pearls: ["Pulsatility index <1.0 in abdominal aorta suggests significant re-coarctation"] },
    ]
  },
  {
    id: "tga",
    label: "TGA (post-Mustard/Senning)",
    color: "#189aa1",
    views: [
      { name: "Apical 4-Chamber", tip: "Identify systemic RV (anterior, trabeculated, moderator band). Assess systemic RV function: FAC <35%, TAPSE <1.6 cm, or S' <10 cm/s indicates dysfunction.", pearls: ["Systemic RV failure is the leading cause of late morbidity in Mustard/Senning", "TR severity directly reflects systemic RV function — quantify with EROA and regurgitant volume"] },
      { name: "Parasternal Short Axis", tip: "Assess baffle anatomy. Look for baffle obstruction (turbulent flow by color Doppler) or baffle leak (color Doppler across baffle).", pearls: ["SVC baffle obstruction: peak velocity >1.5 m/s or gradient >9 mmHg", "IVC baffle obstruction may present with hepatomegaly and ascites"] },
      { name: "Subcostal", tip: "Best view for baffle assessment. Align color Doppler across the atrial baffles. Assess IVC and SVC baffle flow direction and velocity.", pearls: ["Baffle leak: color jet crossing from systemic to pulmonary venous atrium", "Contrast echo (agitated saline) can confirm baffle leak direction"] },
      { name: "RVOT / Pulmonary Artery", tip: "The subpulmonary LV (posterior, smooth-walled) ejects into the PA. Measure LV systolic pressure via TR jet (if present) or PA pressure.", pearls: ["LV systolic pressure <50% systemic pressure = 'unprepared' LV — important if arterial switch conversion considered"] },
    ]
  },
  {
    id: "fontan",
    label: "Fontan Circulation",
    color: "#189aa1",
    views: [
      { name: "Apical 4-Chamber", tip: "Assess single ventricle (SV) size and function. Measure SV EF (biplane Simpson's or 3D). EF <50% or FAC <35% indicates dysfunction.", pearls: ["Assess AV valve regurgitation — even mild-moderate AR/MR significantly impacts Fontan physiology", "Diastolic dysfunction is common — assess E/e' ratio and LAVI"] },
      { name: "Subcostal IVC / Fontan Conduit", tip: "Assess IVC-PA conduit (extracardiac Fontan) or lateral tunnel. Look for obstruction (peak velocity >1.5 m/s) or thrombus.", pearls: ["Fontan pressure estimated as IVC/conduit velocity + RAP", "Low pulsatility in Fontan conduit is normal — do not mistake for obstruction"] },
      { name: "Suprasternal / Pulmonary Arteries", tip: "Assess bilateral PA flow. Asymmetric PA flow suggests branch PA stenosis. Measure peak velocity in each PA.", pearls: ["PA stenosis >50% diameter reduction warrants catheterisation", "Assess for pulmonary AV malformations if hepatic veins excluded from Fontan"] },
      { name: "Hepatic Veins (subcostal)", tip: "Hepatic vein flow pattern reflects Fontan haemodynamics. Blunted or reversed S-wave suggests elevated Fontan pressure or AV valve regurgitation.", pearls: ["Hepatic vein pulsatility correlates with Fontan pressure", "Hepatic vein flow reversal = severe AV valve regurgitation or very elevated Fontan pressure"] },
    ]
  },
];

// ─── PULMONARY HTN & PE SCAN COACH ──────────────────────────────────────────
const pulmViews = [
  {
    id: "psax-av",
    label: "PSAX — Aortic Valve Level",
    color: "#189aa1",
    probe: "Parasternal short-axis, 3rd–4th ICS, left sternal border. Rotate clockwise from PLAX.",
    anatomy: "Aortic valve (center), RVOT (anterior), pulmonary valve (top), left atrium (posterior), tricuspid valve (right).",
    acquisition: "Tilt superiorly to open RVOT. Align PW Doppler sample volume in RVOT just proximal to pulmonic valve for PAAT measurement. Measure PA diameter at end-diastole.",
    measurements: [
      { label: "PA Acceleration Time (PAAT)", normal: "≥105 ms", abnormal: "<105 ms", note: "<60 ms with notch = severe PH" },
      { label: "PA diameter", normal: "≤25 mm", abnormal: ">25 mm", note: "Measure at end-diastole" },
      { label: "RVOT Doppler envelope", normal: "Smooth, symmetric", abnormal: "Mid-systolic notch", note: "Notch = severe PH" },
    ],
    pearls: [
      "Mid-systolic notching of the RVOT Doppler envelope is highly specific for severe PH.",
      "PAAT/RVET ratio <0.33 supports elevated PA pressure.",
      "Measure PA diameter perpendicular to long axis, at the level of the pulmonic valve.",
    ],
  },
  {
    id: "a4ch-rv",
    label: "Apical 4-Chamber (RV-Focused)",
    color: "#189aa1",
    probe: "Apical window, 5th–6th ICS, mid-clavicular line. Rotate probe slightly to open RV.",
    anatomy: "RV (left on screen), LV (right), RA, LA, tricuspid valve, mitral valve. RV-focused view shifts probe toward RV apex.",
    acquisition: "Tilt probe to maximize RV visualization. Measure RV basal, mid, and longitudinal diameters. Use CW Doppler through TR jet for TRV. Measure TAPSE with M-mode at lateral tricuspid annulus.",
    measurements: [
      { label: "RV basal diameter", normal: "≤41 mm", abnormal: ">41 mm", note: "RV-focused view essential" },
      { label: "RV/LV basal ratio", normal: "<1.0", abnormal: "≥1.0", note: "Key PH and PE sign" },
      { label: "TRV (peak)", normal: "≤2.8 m/s", abnormal: ">2.8 m/s", note: ">3.4 m/s = high PH probability" },
      { label: "TAPSE", normal: "≥17 mm", abnormal: "<17 mm", note: "RV longitudinal dysfunction" },
      { label: "RA area", normal: "≤18 cm²", abnormal: ">18 cm²", note: "Measured end-systole" },
    ],
    pearls: [
      "Always use RV-focused apical 4-ch — standard LV-focused view underestimates RV size.",
      "Measure TRV from multiple windows (apical, parasternal, subcostal) and use the highest quality signal.",
      "McConnell's sign in PE: RV free wall hypokinesis with preserved or hyperdynamic apex.",
    ],
  },
  {
    id: "a5ch-cw",
    label: "Apical 5-Chamber / CW Doppler",
    color: "#189aa1",
    probe: "Apical window, tilt anteriorly from A4Ch to open LVOT and aortic valve.",
    anatomy: "LVOT, aortic valve, and RVOT visible. CW cursor aligned with TR jet for highest TRV.",
    acquisition: "Align CW Doppler parallel to TR jet. Optimize gain and reject. Measure peak TRV. Calculate RVSP = 4×TRV² + RAP.",
    measurements: [
      { label: "TRV (peak)", normal: "≤2.8 m/s", abnormal: ">2.8 m/s", note: "Use highest quality from any window" },
      { label: "RVSP (estimated)", normal: "<35 mmHg", abnormal: "≥35 mmHg", note: "Report as estimate + RAP assumption" },
    ],
    pearls: [
      "RVSP is an estimate — always document assumed RAP and note it is not a standalone PH diagnosis.",
      "60/60 sign for PE: PAAT <60 ms AND RVSP <60 mmHg — high specificity for acute PE.",
      "Absent or poor TR signal does NOT exclude PH — document and note limitation.",
    ],
  },
  {
    id: "psax-pap",
    label: "PSAX — Papillary Muscle Level",
    color: "#0e7490",
    probe: "Parasternal short-axis, tilt inferiorly from AV level to visualize papillary muscles.",
    anatomy: "LV circular cross-section with posteromedial and anterolateral papillary muscles. IVS visible between LV and RV.",
    acquisition: "Assess IVS morphology throughout the cardiac cycle. D-sign: flattening in systole = pressure overload (PE/PH); flattening in diastole = volume overload (ASD/TR).",
    measurements: [
      { label: "IVS morphology", normal: "Circular LV", abnormal: "D-shaped LV", note: "Systolic D-sign = pressure overload" },
      { label: "Eccentricity index", normal: "≤1.0", abnormal: ">1.0", note: "D/D ratio at end-systole" },
    ],
    pearls: [
      "Systolic D-sign = RV pressure overload (PH or acute PE).",
      "Diastolic D-sign = RV volume overload (ASD, severe TR).",
      "Both systolic and diastolic flattening = combined pressure and volume overload.",
    ],
  },
  {
    id: "subcostal-ivc",
    label: "Subcostal — IVC & RA",
    color: "#0e7490",
    probe: "Subcostal window, probe pointing toward right shoulder. Rotate to visualize IVC entering RA.",
    anatomy: "IVC entering RA from below. Hepatic veins join IVC 1–2 cm below RA junction.",
    acquisition: "Measure IVC diameter 1–2 cm from RA junction at end-expiration. Perform sniff test: >50% collapse = normal RAP (0–5 mmHg); ≤50% collapse with IVC >21 mm = RAP 15 mmHg.",
    measurements: [
      { label: "IVC diameter", normal: "≤21 mm", abnormal: ">21 mm", note: "Measure 1–2 cm from RA" },
      { label: "IVC collapse (sniff)", normal: ">50%", abnormal: "≤50%", note: "≤50% + IVC >21 mm = RAP 15 mmHg" },
      { label: "Estimated RAP", normal: "3–5 mmHg", abnormal: "≥10 mmHg", note: "Used in RVSP calculation" },
    ],
    pearls: [
      "IVC assessment is mandatory for accurate RVSP estimation — do not assume RAP without measuring.",
      "In ventilated patients, IVC collapsibility is unreliable — use clinical estimate of RAP.",
      "Dilated non-collapsing IVC in acute PE = RV failure and hemodynamic compromise.",
    ],
  },
  {
    id: "subcostal-rv",
    label: "Subcostal — RV Free Wall",
    color: "#0e7490",
    probe: "Subcostal window, rotate to visualize RV free wall in long axis.",
    anatomy: "RV free wall, RV apex, interventricular septum, and LV visible.",
    acquisition: "Measure RV free wall thickness at end-diastole. >5 mm = RV hypertrophy (chronic pressure overload). Assess TR jet with CW Doppler in this window if apical signal is suboptimal.",
    measurements: [
      { label: "RV free wall thickness", normal: "≤5 mm", abnormal: ">5 mm", note: "Hypertrophy = chronic pressure overload" },
    ],
    pearls: [
      "RV wall thickness >5 mm distinguishes chronic PH from acute PE (no time for hypertrophy in acute PE).",
      "Subcostal window often provides the best TR signal in patients with poor apical windows.",
      "Assess for pericardial effusion — any effusion in PH is an adverse prognostic marker.",
    ],
  },
  {
    id: "plax-rv",
    label: "PLAX — RV Inflow",
    color: "#189aa1",
    probe: "Parasternal long-axis, tilt rightward and inferiorly to open RV inflow view.",
    anatomy: "RV, tricuspid valve, RA, and coronary sinus visible.",
    acquisition: "Align CW Doppler with TR jet in this view if other windows are suboptimal. Assess tricuspid valve morphology and TR severity.",
    measurements: [
      { label: "TRV (peak)", normal: "≤2.8 m/s", abnormal: ">2.8 m/s", note: "Alternative window for TR signal" },
      { label: "TR severity", normal: "None / trivial", abnormal: "Moderate–severe", note: "Significant TR worsens RV volume overload" },
    ],
    pearls: [
      "RV inflow view provides an alternative TR signal when apical and parasternal windows are suboptimal.",
      "Assess tricuspid valve for structural abnormality (Ebstein's, carcinoid, rheumatic).",
    ],
  },
  {
    id: "suprasternal",
    label: "Suprasternal — PA Flow",
    color: "#0e7490",
    probe: "Suprasternal notch, patient neck extended. Probe pointing toward left shoulder.",
    anatomy: "Aortic arch, descending aorta, and right PA visible in cross-section beneath aorta.",
    acquisition: "Align PW Doppler in right PA for PA flow assessment. Measure PA diameter if visible. Assess for branch PA stenosis.",
    measurements: [
      { label: "Right PA diameter", normal: "≤15 mm", abnormal: ">15 mm", note: "Dilated in significant PH" },
    ],
    pearls: [
      "Suprasternal window provides direct PA flow assessment and right PA diameter measurement.",
      "Branch PA stenosis causes asymmetric PA flow — compare left and right PA velocities.",
    ],
  },
];

function PulmHTNScanCoach() {
  const [selectedView, setSelectedView] = useState(pulmViews[0]);
  const [activeSection, setActiveSection] = useState<"ph" | "pe">("ph");
  const BRAND_LOCAL = "#189aa1";
  const BRAND_DARK_LOCAL = "#0e7490";
  const { mergeView: mergePulmView } = useScanCoachOverrides("pulm");
  const selectedViewMerged = useMemo(() => mergePulmView(selectedView as any), [selectedView, mergePulmView]);
  return (
    <div>

      <div className="space-y-4">
      {/* Section Toggle */}
      <div className="flex gap-2">
        {(["ph", "pe"] as const).map(s => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: activeSection === s ? BRAND_LOCAL : "#f8fafc",
              color: activeSection === s ? "white" : "#374151",
              border: `1.5px solid ${activeSection === s ? BRAND_LOCAL : "#e5e7eb"}`,
            }}
          >
            {s === "ph" ? "Pulmonary Hypertension" : "Pulmonary Embolism"}
          </button>
        ))}
      </div>

      {/* PH View-by-View Guide */}
      {activeSection === "ph" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
          <div className="lg:col-span-1 lg:sticky lg:top-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Echo Windows</h3>
              {pulmViews.map(v => (
                <button
                  key={v.id}
                  onClick={() => setSelectedView(v)}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold mb-1 transition-all"
                  style={selectedView.id === v.id
                    ? { background: BRAND_LOCAL, color: "white" }
                    : { background: "#f8fffe", color: BRAND_LOCAL, border: "1px solid #e2e8f0" }}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b" style={{ borderColor: BRAND_LOCAL + "30", background: BRAND_LOCAL + "08" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: selectedView.color }}>
                    <Wind className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>{selectedView.label}</h2>
                    <p className="text-xs text-gray-500">Pulmonary HTN Assessment — ScanCoach</p>
                  </div>
                </div>
              </div>
              {/* Admin-uploaded reference images */}
              {((selectedViewMerged as any).echoImageUrl || (selectedViewMerged as any).anatomyImageUrl) && (
                <div className="border-t border-gray-100">
                  <div className={`grid gap-0 bg-gray-950 ${ (selectedViewMerged as any).echoImageUrl && (selectedViewMerged as any).anatomyImageUrl ? 'grid-cols-2' : 'grid-cols-1' }`}>
                    {(selectedViewMerged as any).anatomyImageUrl && (
                      <div className="flex justify-center items-center p-3 border-r border-gray-800">
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-1.5">Anatomy Diagram</p>
                          <MediaDisplay src={(selectedViewMerged as any).anatomyImageUrl} alt={`${selectedView.label} diagram`} className="max-h-56 object-contain rounded" style={{ background: "#030712" }} />
                        </div>
                      </div>
                    )}
                    {(selectedViewMerged as any).echoImageUrl && (
                      <div className="flex justify-center items-center p-3">
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-1.5">Clinical Echo Image</p>
                          <MediaDisplay src={(selectedViewMerged as any).echoImageUrl} alt={`${selectedView.label} echo`} className="max-h-56 object-contain rounded" style={{ background: "#030712" }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="p-5 space-y-5">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND_LOCAL }}>Probe Positioning</h4>
                  <p className="text-sm text-gray-700">{selectedView.probe}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND_LOCAL }}>Key Anatomy</h4>
                  <p className="text-sm text-gray-700">{selectedView.anatomy}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND_DARK_LOCAL }}>Acquisition & Measurements</h4>
                  <p className="text-sm text-gray-700">{selectedView.acquisition}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND_LOCAL }}>Reference Values</h4>
                  <div className="overflow-x-auto rounded-lg border border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Parameter</th>
                          <th className="text-left px-4 py-2.5 font-semibold text-green-600">Normal</th>
                          <th className="text-left px-4 py-2.5 font-semibold text-red-600">Abnormal</th>
                          <th className="text-left px-4 py-2.5 font-semibold text-gray-500">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedView.measurements.map(({ label, normal, abnormal, note }, i) => (
                          <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-4 py-2 font-medium text-gray-700 border-r border-gray-100">{label}</td>
                            <td className="px-4 py-2 text-green-700">{normal}</td>
                            <td className="px-4 py-2 text-red-700 font-semibold">{abnormal}</td>
                            <td className="px-4 py-2 text-gray-500 text-xs">{note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND_LOCAL }}>Clinical Pearls</h4>
                  <ul className="space-y-2">
                    {selectedView.pearls.map((pearl, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: BRAND_LOCAL }} />
                        {pearl}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PE View-by-View Guide */}
      {activeSection === "pe" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b" style={{ borderColor: "#ef444430", background: "#fef2f2" }}>
              <h3 className="font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>PE Echo Assessment — View-by-View Guide</h3>
              <p className="text-xs text-gray-500 mt-0.5">Systematic approach for suspected or confirmed pulmonary embolism</p>
            </div>
            <div className="p-5 space-y-4">
              {[
                {
                  step: "1",
                  view: "Apical 4-Chamber (RV-Focused)",
                  color: "#dc2626",
                  tasks: [
                    "Measure RV/LV basal diameter ratio — ratio >1.0 = RV dilation = RV strain",
                    "Assess McConnell's sign: RV free wall hypokinesis with preserved or hyperdynamic apex",
                    "Measure TAPSE with M-mode at lateral tricuspid annulus — <17 mm = RV dysfunction",
                    "Measure RA area at end-systole — >18 cm² = enlarged",
                    "CW Doppler through TR jet — measure peak TRV for RVSP estimation",
                  ],
                  keySign: "McConnell's Sign + RV/LV >1.0",
                },
                {
                  step: "2",
                  view: "PSAX — Papillary Muscle Level",
                  color: "#d97706",
                  tasks: [
                    "Assess IVS morphology — systolic D-sign = RV pressure overload",
                    "Circular LV = normal; D-shaped LV = RV pressure overload",
                    "Measure eccentricity index if available",
                  ],
                  keySign: "Systolic D-Sign",
                },
                {
                  step: "3",
                  view: "PSAX — Aortic Valve Level (RVOT)",
                  color: "#d97706",
                  tasks: [
                    "PW Doppler in RVOT — measure PAAT",
                    "60/60 sign: PAAT <60 ms AND RVSP <60 mmHg = acute PE (high specificity)",
                    "Assess for mid-systolic notching of RVOT Doppler envelope",
                    "Measure PA diameter at end-diastole",
                  ],
                  keySign: "60/60 Sign",
                },
                {
                  step: "4",
                  view: "Subcostal — IVC & RA",
                  color: BRAND_LOCAL,
                  tasks: [
                    "Measure IVC diameter 1–2 cm from RA junction",
                    "Sniff test — ≤50% collapse with IVC >21 mm = elevated RAP",
                    "Calculate RVSP = 4×TRV² + estimated RAP",
                    "Carefully assess RA and RV for mobile thrombus",
                  ],
                  keySign: "IVC Dilation + Non-Collapse",
                },
                {
                  step: "5",
                  view: "Subcostal — RV Free Wall",
                  color: BRAND_LOCAL,
                  tasks: [
                    "Measure RV free wall thickness — >5 mm = hypertrophy = chronic, not acute PE",
                    "Assess for pericardial effusion — exclude tamponade",
                    "CW Doppler TR jet if apical window is suboptimal",
                  ],
                  keySign: "RV Wall Thickness (Acute vs. Chronic)",
                },
                {
                  step: "6",
                  view: "PLAX — Aorta & Pericardium",
                  color: BRAND_DARK_LOCAL,
                  tasks: [
                    "Assess aortic root and proximal descending aorta — exclude dissection before thrombolysis",
                    "Assess LV size and function — underfilled LV in massive PE",
                    "Assess for pericardial effusion",
                  ],
                  keySign: "Exclude Dissection Before Thrombolysis",
                },
              ].map(({ step, view, color, tasks, keySign }) => (
                <div key={step} className="flex items-start gap-4 p-4 rounded-xl border" style={{ borderColor: color + "30", background: color + "05" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: color }}>{step}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-bold text-gray-800">{view}</h4>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white" style={{ background: color }}>{keySign}</span>
                    </div>
                    <ul className="space-y-1">
                      {tasks.map((task, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h4 className="text-sm font-bold text-gray-700 mb-3" style={{ fontFamily: "Merriweather, serif" }}>PE Echo Quick Reference</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { sign: "McConnell's", detail: "RV free wall hypokinesis, apex spared", color: "#dc2626" },
                { sign: "60/60 Sign", detail: "PAAT <60 ms AND RVSP <60 mmHg", color: "#dc2626" },
                { sign: "D-Sign", detail: "Systolic IVS flattening = pressure overload", color: "#d97706" },
                { sign: "RV/LV >1.0", detail: "RV dilation = RV strain", color: BRAND_LOCAL },
              ].map(({ sign, detail, color }) => (
                <div key={sign} className="p-3 rounded-lg text-center" style={{ background: color + "08", border: `1.5px solid ${color}30` }}>
                  <p className="text-sm font-bold mb-1" style={{ color }}>{sign}</p>
                  <p className="text-xs text-gray-500">{detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="text-xs text-gray-400 text-center py-2">
            Clinical content © All About Ultrasound, Inc. / iHeartEcho™. Educational use only. Based on ASE 2025, ESC/ERS 2022, and ESC 2019 PE guidelines.
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function ACHDScanCoach() {
  const [selectedLesion, setSelectedLesion] = useState(achdLesions[0]);
  const [selectedView, setSelectedView] = useState(achdLesions[0].views[0]);
  const { mergeView: mergeACHDView } = useScanCoachOverrides("achd");
  const selectedLesionMerged = useMemo(() => mergeACHDView({ ...selectedLesion, id: selectedLesion.id } as any), [selectedLesion, mergeACHDView]);
  return (
    <div>

    <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
      {/* Lesion list — sticky sidebar */}
      <div className="lg:col-span-1 lg:sticky lg:top-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">ACHD Lesions</h3>
          {achdLesions.map(lesion => (
            <button
              key={lesion.id}
              onClick={() => { setSelectedLesion(lesion); setSelectedView(lesion.views[0]); }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold mb-1 transition-all"
              style={selectedLesion.id === lesion.id
                ? { background: "#189aa1", color: "white" }
                : { background: "#f8fffe", color: "#189aa1", border: "1px solid #e2e8f0" }}
            >
              {lesion.label}
            </button>
          ))}
        </div>
      </div>
      {/* View detail */}
      <div className="lg:col-span-3 space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b" style={{ borderColor: "#189aa130", background: "#189aa108" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: "#189aa1" }}>
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>{selectedLesion.label}</h2>
                <p className="text-xs text-gray-500">Adult Congenital Heart Disease — ScanCoach</p>
              </div>
            </div>
          </div>
          {/* Admin-uploaded reference images */}
          {((selectedLesionMerged as any).echoImageUrl || (selectedLesionMerged as any).anatomyImageUrl) && (
            <div className="border-t border-gray-100">
              <div className={`grid gap-0 bg-gray-950 ${ (selectedLesionMerged as any).echoImageUrl && (selectedLesionMerged as any).anatomyImageUrl ? 'grid-cols-2' : 'grid-cols-1' }`}>
                {(selectedLesionMerged as any).anatomyImageUrl && (
                  <div className="flex justify-center items-center p-3 border-r border-gray-800">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-1.5">Anatomy Diagram</p>
                      <MediaDisplay src={(selectedLesionMerged as any).anatomyImageUrl} alt={`${selectedLesion.label} diagram`} className="max-h-56 object-contain rounded" style={{ background: "#030712" }} />
                    </div>
                  </div>
                )}
                {(selectedLesionMerged as any).echoImageUrl && (
                  <div className="flex justify-center items-center p-3">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-1.5">Clinical Echo Image</p>
                      <MediaDisplay src={(selectedLesionMerged as any).echoImageUrl} alt={`${selectedLesion.label} echo`} className="max-h-56 object-contain rounded" style={{ background: "#030712" }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* View tabs */}
          <div className="px-5 pt-4 flex flex-wrap gap-2">
            {selectedLesion.views.map(v => (
              <button
                key={v.name}
                onClick={() => setSelectedView(v)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={selectedView.name === v.name
                  ? { background: "#189aa1", color: "white" }
                  : { background: "#f0fbfc", color: "#189aa1", border: "1px solid #189aa130" }}
              >
                {v.name}
              </button>
            ))}
          </div>
          {/* View content */}
          <div className="p-5">
            <h3 className="text-base font-bold text-gray-800 mb-2" style={{ fontFamily: "Merriweather, serif" }}>{selectedView.name}</h3>
            <div className="rounded-lg p-4 mb-4" style={{ background: "#f0fbfc", border: "1px solid #189aa130" }}>
              <div className="flex items-start gap-2 mb-1">
                <Eye className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#189aa1" }} />
                <p className="text-sm text-gray-700 leading-relaxed">{selectedView.tip}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4" style={{ color: "#189aa1" }} />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Clinical Pearls</span>
              </div>
              {selectedView.pearls.map((pearl, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg" style={{ background: "#f8fffe", border: "1px solid #189aa120" }}>
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#189aa1" }} />
                  <p className="text-xs text-gray-600 leading-relaxed">{pearl}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ScanCoach() {
  const { isPremium, isAuthenticated, loading } = usePremium();
  const search = useSearch();
  const _params = new URLSearchParams(search);
  const _initialTab = (_params.get("tab") as "tte" | "fetal" | "chd" | "achd" | "diastolic" | "pulm" | "strain" | "hocm" | "uea") || "tte";
  const [activeTab, setActiveTab] = useState<"tte" | "fetal" | "chd" | "achd" | "diastolic" | "pulm" | "strain" | "hocm" | "uea" | "tee" | "ice">(_initialTab as any);
  // Deep-link to a specific view via ?view=viewId URL param (used by WYSIWYG editor preview)
  const _viewParam = _params.get("view");
  // preview=1: hide hero banner and nav chrome when embedded in the editor iframe
  const _isPreviewMode = _params.get("preview") === "1";
  const [selectedTTE, setSelectedTTE] = useState(() => tteViews.find(v => v.id === _viewParam) ?? tteViews[0]);
  const [selectedFetal, setSelectedFetal] = useState(() => fetalViews.find(v => v.id === _viewParam) ?? fetalViews[0]);
  const [mrExpanded, setMrExpanded] = useState(false);
  const [arExpanded, setArExpanded] = useState(false);
  const { mergeView: mergeTTEView } = useScanCoachOverrides("tte");
  const { mergeView: mergeFetalView, overrideMap: fetalOverrideMap } = useScanCoachOverrides("fetal");
  const { mergeView: mergePulmView, overrideMap: pulmOverrideMap } = useScanCoachOverrides("pulm");
  // Apply DB overrides to the selected TTE view at render time
  const selectedTTEMerged = useMemo(() => mergeTTEView(selectedTTE as any), [selectedTTE, mergeTTEView]);
  // Apply DB overrides to the selected Fetal view at render time
  const selectedFetalMerged = useMemo(() => mergeFetalView(selectedFetal as any), [selectedFetal, mergeFetalView, fetalOverrideMap]);
   const fetalDetailRef = useRef<HTMLDivElement>(null);
  const tteDetailRef = useRef<HTMLDivElement>(null);
  const scrollOnFetalChange = useRef(false);
  const scrollOnTteChange = useRef(false);
  // Scroll detail panel into view only when triggered by view list click (not Next/Prev)
  useEffect(() => {
    if (scrollOnFetalChange.current && fetalDetailRef.current) {
      fetalDetailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    scrollOnFetalChange.current = false;
  }, [selectedFetal]);
  useEffect(() => {
    if (scrollOnTteChange.current && tteDetailRef.current) {
      tteDetailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    scrollOnTteChange.current = false;
  }, [selectedTTE]);

  return (
    <Layout>
      {/* Hero Banner — hidden in editor preview mode */}
      {!_isPreviewMode && (<div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 60%, #189aa1 100%)" }}
      >
        <div className="container py-10 md:py-12">
          <div className="mb-2">
            <BackToEchoAssist href="/scan-coach-hub" label="ScanCoach Hub" />
          </div>
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <Scan className="w-6 h-6 text-[#4ad9e0]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#4ad9e0] animate-pulse" />
                <span className="text-sm text-white/80 font-medium">11 Specialties · View-by-View Probe Guidance</span>
              </div>
              <h1
                className="text-2xl md:text-3xl font-black text-white leading-tight"
                style={{ fontFamily: "Merriweather, serif" }}
              >
                EchoAssist™ — ScanCoach
              </h1>
              <p className="text-[#4ad9e0] font-semibold text-base mt-0.5">Probe Positioning · Anatomy · Clinical Pearls</p>
              <p className="text-white/70 text-sm md:text-base mt-2 max-w-xl leading-relaxed">
                View-by-view scanning guides with transducer positioning, normal anatomy, Doppler setup, and clinical pearls — for every modality and patient population.
              </p>
            </div>
          </div>
        </div>
      </div>)}

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Module Card Grid — hidden in editor preview mode */}
        {!_isPreviewMode && (() => {
          const tabNavMap: Record<string, { path: string; label: string }> = {
            tte: { path: "/tte", label: "TTE Navigator" },
            chd: { path: "/pediatric", label: "Pediatric Navigator" },
            fetal: { path: "/fetal", label: "Fetal Navigator" },
            achd: { path: "/achd", label: "ACHD Navigator" },
            diastolic: { path: "/diastolic", label: "Diastolic Navigator" },
            strain: { path: "/strain", label: "Strain Navigator" },
            uea: { path: "/uea-navigator", label: "UEA Navigator" },
            hocm: { path: "/hocm-navigator", label: "HOCM-Assist™ Navigator" },
            pulm: { path: "/pulm-htn", label: "Pulm HTN Navigator" },
            tee: { path: "/tee", label: "TEE Navigator" },
            ice: { path: "/ice", label: "ICE Navigator" },
          };
          const tabMeta: Array<{ key: typeof activeTab; label: string; shortLabel: string; icon: React.ElementType; views: number; premium?: boolean }> = [
            // ── Free tabs ──
            { key: "tte",      label: "Adult TTE",          shortLabel: "Adult TTE",         icon: Stethoscope, views: 10 },
            { key: "strain",   label: "Strain",             shortLabel: "Strain",            icon: Activity,    views: 4  },
            // ── Premium tabs ──
            { key: "chd",      label: "Pediatric CHD",      shortLabel: "Pediatric CHD",     icon: Users,       views: 14, premium: true },
            { key: "fetal",    label: "Fetal Echo",         shortLabel: "Fetal Echo",        icon: Baby,        views: 13, premium: true },
            { key: "tee",      label: "TEE",                shortLabel: "TEE",               icon: Microscope,  views: 13, premium: true },
            { key: "ice",      label: "ICE",                shortLabel: "ICE",               icon: Scan,        views: 9,  premium: true },
            { key: "uea",      label: "UEA",                shortLabel: "UEA",               icon: Zap,         views: 7,  premium: true },
            { key: "hocm",     label: "HOCM-Assist™",      shortLabel: "HOCM",              icon: Heart,       views: 14, premium: true },
            { key: "achd",     label: "Adult Congenital",   shortLabel: "Adult Congenital",  icon: Heart,       views: 13, premium: true },
            { key: "diastolic",label: "Diastolic Function", shortLabel: "Diastolic",         icon: Wind,        views: 7,  premium: true },
            { key: "pulm",     label: "Pulmonary HTN & PE", shortLabel: "Pulm HTN & PE",     icon: Wind,        views: 8,  premium: true },
          ];
          const nav = tabNavMap[activeTab];
          return (
            <div className="mb-6">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-4">
                {tabMeta.map(({ key, label, icon: Icon, views, premium }) => {
                  const isActive = activeTab === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className="relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center cursor-pointer"
                      style={isActive
                        ? { background: "#189aa1", borderColor: "#189aa1", color: "white" }
                        : { background: "white", borderColor: "#e2e8f0", color: "#374151" }}
                    >
                      {premium && (
                        <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-4 h-4 rounded-full" style={{ background: isActive ? "rgba(255,255,255,0.25)" : "#fef3c7" }}>
                          <Crown className="w-2.5 h-2.5" style={{ color: isActive ? "white" : "#d97706" }} />
                        </span>
                      )}
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={isActive
                          ? { background: "rgba(255,255,255,0.2)" }
                          : { background: "#189aa1" + "15" }}
                      >
                        <Icon className="w-5 h-5" style={{ color: isActive ? "white" : "#189aa1" }} />
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight" style={{ color: isActive ? "white" : "#1f2937" }}>{label}</div>
                        <div className="text-[10px] mt-0.5" style={{ color: isActive ? "rgba(255,255,255,0.8)" : "#9ca3af" }}>{views} views</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {nav && (
                <div className="flex justify-end">
                  <Link href={nav.path}>
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border transition-all hover:bg-[#189aa1]/5 cursor-pointer" style={{ borderColor: "#189aa1" + "40", color: "#189aa1" }}>
                      Go to {nav.label} <Stethoscope className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                </div>
              )}
            </div>
          );
        })()}

        {/* ─── ADULT TTE TAB ─── */}
        {activeTab === "tte" && (
          <BlurredOverlay type="login" featureName="Adult TTE ScanCoach" disabled={loading || isAuthenticated}><div>

           <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
            {/* Detail panel — order-first on mobile so it appears at top */}
            <div ref={tteDetailRef} className="lg:col-span-3 lg:order-2 order-1 space-y-4">
              {/* Header */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b" style={{ borderColor: selectedTTEMerged.color + "30", background: selectedTTEMerged.color + "08" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: selectedTTEMerged.color }}>
                        {selectedTTEMerged.abbr}
                      </div>
                      <div>
                        <h2 className="font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>{selectedTTEMerged.name}</h2>
                        <p className="text-xs text-gray-500">{selectedTTEMerged.doppler}</p>
                      </div>
                    </div>
                    {/* Navigation */}
                    <div className="flex gap-2">
                      {tteViews.indexOf(selectedTTE) > 0 && (
                        <button onClick={() => setSelectedTTE(tteViews[tteViews.indexOf(selectedTTE) - 1])}
                          className="px-3 py-1 rounded text-xs border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                          ← Prev
                        </button>
                      )}
                      {tteViews.indexOf(selectedTTE) < tteViews.length - 1 && (
                        <button onClick={() => setSelectedTTE(tteViews[tteViews.indexOf(selectedTTE) + 1])}
                          className="px-3 py-1 rounded text-xs text-white transition-colors"
                          style={{ background: selectedTTEMerged.color }}>
                          Next →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Probe diagram */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <h3 className="font-bold text-sm text-gray-700 mb-3" style={{ fontFamily: "Merriweather, serif" }}>Transducer Positioning</h3>
                    {(selectedTTEMerged as any).transducerImageUrl ? (
                    <MediaDisplay
                      src={(selectedTTEMerged as any).transducerImageUrl}
                      alt={`${selectedTTEMerged.name} transducer position`}
                      className="w-full rounded-lg object-contain"
                      style={{ maxHeight: "220px" }}
                    />
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: selectedTTEMerged.probeSvg }} />
                  )}
                  <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                    <div><span className="font-semibold text-gray-500">Position: </span>{selectedTTEMerged.probePosition}</div>
                    <div><span className="font-semibold text-gray-500">Notch: </span>{selectedTTEMerged.probeOrientation}</div>
                    {(selectedTTEMerged as any).patientPosition && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <span className="font-semibold text-gray-500">Patient: </span>{(selectedTTEMerged as any).patientPosition}
                      </div>
                    )}
                  </div>
                </div>

                {/* Structures */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="w-4 h-4" style={{ color: selectedTTEMerged.color }} />
                    <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>Structures</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {(selectedTTEMerged as any).structures.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: selectedTTEMerged.color }}></span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Measurements */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4" style={{ color: selectedTTEMerged.color }} />
                    <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>Key Measurements</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedTTEMerged as any).measurements.map((m: string, i: number) => (
                      <span key={i} className="px-2 py-1 rounded text-xs font-mono text-white"
                        style={{ background: selectedTTEMerged.color }}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Echo Image + Anatomy */}
              {((selectedTTEMerged as any).echoImageUrl || (selectedTTEMerged as any).anatomyImageUrl) && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>View Reference Images</h3>
                  </div>
                  <div className={`bg-gray-950 grid gap-2 p-4 ${ (selectedTTEMerged as any).echoImageUrl && (selectedTTEMerged as any).anatomyImageUrl ? 'grid-cols-2' : 'grid-cols-1' }`}>
                    {(selectedTTEMerged as any).echoImageUrl && (
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-xs text-gray-400">Clinical Echo</p>
                        <MediaDisplay
                          src={(selectedTTEMerged as any).echoImageUrl}
                          alt={`${selectedTTEMerged.name} clinical echo`}
                          className="max-h-64 object-contain rounded w-full"
                          style={{ background: "#030712" }}
                        />
                      </div>
                    )}
                    {(selectedTTEMerged as any).anatomyImageUrl && (
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-xs text-gray-400">Anatomy Reference</p>
                        <MediaDisplay
                          src={(selectedTTEMerged as any).anatomyImageUrl}
                          alt={`${selectedTTEMerged.name} anatomy`}
                          className="max-h-64 object-contain rounded w-full"
                          style={{ background: "#030712" }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Tips & Pitfalls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <h3 className="font-bold text-sm text-gray-700 mb-3" style={{ fontFamily: "Merriweather, serif" }}>Scanning Tips</h3>
                  <ul className="space-y-2">
                    {(selectedTTEMerged as any).tips.map((tip: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-500 font-bold mt-0.5">+</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <h3 className="font-bold text-sm text-gray-700 mb-3" style={{ fontFamily: "Merriweather, serif" }}>Common Pitfalls</h3>
                  <ul className="space-y-2">
                    {(selectedTTEMerged as any).pitfalls.map((p: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        {p}
                      </li>
                    ))}
                  </ul>
                 </div>
              </div>
              {/* Billing Codes */}
              {TTE_BILLING[selectedTTEMerged.id] && (
                <BillingCodesCard billing={TTE_BILLING[selectedTTEMerged.id]} accentColor={selectedTTEMerged.color} />
              )}
            </div>
            {/* View list sidebar — sticky on desktop, above content on mobile */}
            <div className="lg:col-span-1 lg:order-1 order-2 lg:sticky lg:top-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>TTE Views</h3>
                  <p className="text-xs text-gray-400 mt-0.5">10 standard acoustic windows</p>
                </div>
                <div className="p-3 space-y-1 max-h-[calc(100vh-180px)] overflow-y-auto">
                  {tteViews.map(v => (
                    <TTEViewCard key={v.id} view={v} isSelected={selectedTTEMerged.id === v.id} onClick={() => setSelectedTTE(v)} />
                  ))}
                </div>
              </div>
            </div>
          </div>{/* end TTE grid */}
          {/* ─── ACUTE vs CHRONIC MR SECTION (collapsible, below TTE grid) ─── */}
          <div className="mt-6 space-y-4">
            {/* Section Header — clickable toggle */}
            <button
              onClick={() => setMrExpanded(e => !e)}
              className="w-full flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 hover:border-[#189aa1]/40 transition-all text-left"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#189aa1" }}>
                <Heart className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>Acute vs Chronic Mitral Regurgitation</h2>
                <p className="text-sm text-gray-500">Echo differentiation guide — haemodynamics, 2D, Doppler, and clinical context</p>
              </div>
              <ChevronRight className={"w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200" + (mrExpanded ? " rotate-90" : "")} />
            </button>
            {mrExpanded && <div className="space-y-4">

            {/* Comparison Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ACUTE MR Card */}
              <div className="bg-white rounded-xl border-2 shadow-sm overflow-hidden" style={{ borderColor: "#ef4444" }}>
                <div className="px-5 py-3 flex items-center gap-2" style={{ background: "#fef2f2" }}>
                  <Zap className="w-4 h-4" style={{ color: "#ef4444" }} />
                  <h3 className="font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>Acute MR</h3>
                  <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#fee2e2", color: "#dc2626" }}>Haemodynamic Emergency</span>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "#ef4444" }}>Common Causes</h4>
                    <ul className="space-y-1">
                      {["Papillary muscle rupture (post-MI — posteromedial PM most common)","Chordae tendineae rupture (myxomatous, endocarditis, trauma)","Infective endocarditis with leaflet perforation","Acute leaflet prolapse (flail leaflet)","Blunt chest trauma"].map((c,i) => (
                        <li key={i} className="flex items-start gap-1.5 text-sm text-gray-600">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#ef4444" }} />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <h4 className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "#ef4444" }}>Haemodynamic Context</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">Normal-sized, non-compliant LA and LV. Sudden volume overload into a non-dilated LA causes <span className="font-semibold text-red-700">acute pulmonary oedema</span> and cardiogenic shock despite a normal or hyperdynamic LV. Systemic BP may be low despite preserved or elevated LVEDP.</p>
                  </div>
                </div>
              </div>

              {/* CHRONIC MR Card */}
              <div className="bg-white rounded-xl border-2 shadow-sm overflow-hidden" style={{ borderColor: "#189aa1" }}>
                <div className="px-5 py-3 flex items-center gap-2" style={{ background: "#f0fbfc" }}>
                  <Clock className="w-4 h-4" style={{ color: "#189aa1" }} />
                  <h3 className="font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>Chronic MR</h3>
                  <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#d0f4f5", color: "#0e7490" }}>Compensated → Decompensated</span>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "#189aa1" }}>Common Causes</h4>
                    <ul className="space-y-1">
                      {["Myxomatous mitral valve disease / MVP (most common in developed world)","Rheumatic heart disease (leaflet thickening, commissural fusion)","Ischaemic MR (annular dilation, tethering of leaflets)","Dilated cardiomyopathy (functional/secondary MR)","Radiation-induced valve disease"].map((c,i) => (
                        <li key={i} className="flex items-start gap-1.5 text-sm text-gray-600">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#189aa1" }} />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <h4 className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "#189aa1" }}>Haemodynamic Context</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">Progressive LA and LV dilation allows accommodation of the regurgitant volume. LV is typically <span className="font-semibold text-teal-700">hyperdynamic with preserved EF</span> in compensation. EF may appear falsely normal even when LV contractility is impaired — EF &lt;60% or LVESD &gt;40 mm signals decompensation.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Echo Findings Comparison Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                <Activity className="w-4 h-4" style={{ color: "#189aa1" }} />
                <h3 className="font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>Echo Findings: Side-by-Side Comparison</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 w-1/3">Parameter</th>
                      <th className="text-left px-4 py-3 font-semibold" style={{ color: "#ef4444" }}>Acute MR</th>
                      <th className="text-left px-4 py-3 font-semibold" style={{ color: "#189aa1" }}>Chronic MR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["LA size", "Normal (non-dilated)", "Dilated (LA volume index >34 mL/m²)"],
                      ["LV size", "Normal or mildly enlarged", "Dilated (LVEDD >60 mm in severe)"],
                      ["LV function (EF)", "Hyperdynamic (EF often >70%)", "Preserved (EF ≥60%) until decompensation"],
                      ["Colour Doppler jet", "Large, eccentric jet — may underestimate severity (wall-hugging)", "Large central or eccentric jet; vena contracta ≥7 mm = severe"],
                      ["Vena contracta", "≥7 mm (severe) but may be underestimated", "≥7 mm = severe; measure in PLAX"],
                      ["EROA (PISA)", "≥0.40 cm² = severe; PISA radius often large", "≥0.40 cm² = severe (primary); ≥0.20 cm² = severe (secondary)"],
                      ["Regurgitant volume", "≥60 mL = severe", "≥60 mL = severe (primary); ≥30 mL = severe (secondary)"],
                      ["Pulmonary veins", "Systolic flow reversal (highly specific for severe acute MR)", "Blunted S wave; systolic reversal in severe chronic MR"],
                      ["Mitral inflow (E wave)", "Elevated E wave (>1.5 m/s) due to high LA pressure", "E-dominant pattern; E/A >2 in severe with elevated filling pressures"],
                      ["CW Doppler MR jet", "Dense, early-peaking, triangular (rapid LA pressure equalisation)", "Dense, holosystolic, plateau-shaped"],
                      ["Pulmonary artery pressure", "Severely elevated (acute pulmonary hypertension)", "Elevated in decompensated; may be normal in compensated"],
                      ["Structural cause visible", "Flail leaflet, ruptured chord, papillary muscle rupture", "Leaflet prolapse, thickening, annular dilation, tethering"],
                    ].map(([param, acute, chronic], i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-2.5 font-medium text-gray-700 border-r border-gray-100">{param}</td>
                        <td className="px-4 py-2.5 text-red-700">{acute}</td>
                        <td className="px-4 py-2.5 text-teal-700">{chronic}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2-column: Key Echo Views + Clinical Red Flags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Key Echo Views */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4" style={{ color: "#189aa1" }} />
                  <h3 className="font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>Key Echo Views for MR Assessment</h3>
                </div>
                <ul className="space-y-2.5">
                  {[
                    { view: "PLAX", tip: "Vena contracta measurement. Assess leaflet morphology, chordal integrity, and posterior leaflet motion. Flail tip visible as systolic whipping motion." },
                    { view: "PSAX (MV level)", tip: "Identify prolapsing or flail scallop (P1/P2/P3, A1/A2/A3). Planimetry of MV area if stenosis coexists. Color Doppler to localise jet origin." },
                    { view: "Apical 4-Chamber", tip: "PISA/EROA calculation. Assess LA size (LAVI). Pulmonary vein Doppler (systolic reversal = severe). Measure LV volumes (biplane Simpson's)." },
                    { view: "Apical 2-Chamber", tip: "Biplane EF. Assess anterior and inferior walls for ischaemic MR. Pulmonary vein Doppler in left upper PV." },
                    { view: "Apical 3-Chamber (APLAX)", tip: "CW Doppler through MR jet — assess jet density, shape (triangular vs plateau), and peak velocity. LVOT VTI for stroke volume." },
                    { view: "Subcostal", tip: "IVC size and collapsibility for RA pressure estimation. Hepatic vein flow reversal suggests elevated RA pressure or severe TR." },
                  ].map(({ view, tip }, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0 font-mono" style={{ background: "#189aa1", color: "white" }}>{view}</span>
                      <span className="text-sm text-gray-600 leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Clinical Pearls + Red Flags */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4" style={{ color: "#189aa1" }} />
                    <h3 className="font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>Clinical Pearls</h3>
                  </div>
                  <ul className="space-y-2">
                    {[
                      "In acute MR, EF appears falsely normal or elevated — the LV is unloading into the low-resistance LA, masking true contractile dysfunction.",
                      "A wall-hugging eccentric jet on colour Doppler significantly underestimates MR severity — always use PISA/EROA and pulmonary vein Doppler.",
                      "Systolic pulmonary vein flow reversal is the most specific colour Doppler sign of severe acute MR.",
                      "In ischaemic MR, severity is dynamic — repeat assessment at rest and with exercise (stress echo) to capture the full haemodynamic burden.",
                      "EF <60% in chronic primary MR represents significant LV dysfunction — normal EF threshold is lower than in other conditions.",
                      "LVESD >40 mm (or >22 mm/m²) is a Class I indication for surgery in asymptomatic severe primary MR regardless of EF.",
                    ].map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#189aa1" }} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-xl border border-red-50 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <h3 className="font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>Red Flags — Urgent Surgical Review</h3>
                  </div>
                  <ul className="space-y-2">
                    {[
                      "Flail leaflet with haemodynamic instability — surgical emergency",
                      "Papillary muscle rupture (post-MI) — mortality >50% without emergent surgery",
                      "Acute MR with pulmonary oedema and cardiogenic shock",
                      "Chronic MR with EF <60% or LVESD >40 mm",
                      "New onset AF or pulmonary hypertension (PASP >50 mmHg) in severe MR",
                      "Infective endocarditis with leaflet perforation or abscess",
                    ].map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                        <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-red-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* ASE 2021 Severity Thresholds */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                <Info className="w-4 h-4" style={{ color: "#189aa1" }} />
                <h3 className="font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>Guideline-Based Severity Thresholds — Primary MR</h3>
                <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#d0f4f5", color: "#0e7490" }}>2021 Guidelines</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Parameter</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500">Mild</th>
                      <th className="text-left px-4 py-3 font-semibold text-amber-600">Moderate</th>
                      <th className="text-left px-4 py-3 font-semibold text-red-600">Severe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Vena contracta (cm)", "<0.3", "0.3–0.69", "≥0.7"],
                      ["EROA — PISA (cm²)", "<0.20", "0.20–0.39", "≥0.40"],
                      ["Regurgitant volume (mL)", "<30", "30–59", "≥60"],
                      ["Regurgitant fraction (%)", "<30", "30–49", "≥50"],
                      ["LA volume index (mL/m²)", "Normal", "Mildly elevated", ">34 (dilated)"],
                      ["LV end-systolic diameter", "Normal", "Mildly enlarged", ">40 mm (surgery threshold)"],
                    ].map(([param, mild, mod, severe], i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-2.5 font-medium text-gray-700 border-r border-gray-100">{param}</td>
                        <td className="px-4 py-2.5 text-gray-500">{mild}</td>
                        <td className="px-4 py-2.5 text-amber-700">{mod}</td>
                        <td className="px-4 py-2.5 text-red-700 font-semibold">{severe}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500"><span className="font-semibold">Secondary (functional) MR thresholds are lower:</span> EROA ≥0.20 cm² and RVol ≥30 mL = severe. These reflect the worse prognosis at lower volumes in the setting of LV dysfunction.</p>
              </div>
            </div>

            {/* Copyright */}
            <div className="text-xs text-gray-400 text-center py-2">
              Clinical content © All About Ultrasound, Inc. / iHeartEcho™. Educational use only. Based on ASE/AHA/ACC 2021 guidelines.
            </div>
            </div>}{/* end mrExpanded */}
          </div>{/* end MR section */}
          {/* ─── ACUTE vs CHRONIC AR SECTION (collapsible, below MR section) ─── */}
          <div className="mt-2 space-y-4">
            {/* Section Header — clickable toggle */}
            <button
              onClick={() => setArExpanded(e => !e)}
              className="w-full flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 hover:border-[#189aa1]/40 transition-all text-left"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#0e7490" }}>
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>Acute vs Chronic Aortic Regurgitation</h2>
                <p className="text-sm text-gray-500">Echo differentiation guide — haemodynamics, 2D, Doppler, and clinical context</p>
              </div>
              <ChevronRight className={"w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200" + (arExpanded ? " rotate-90" : "")} />
            </button>
            {arExpanded && <div className="space-y-4">

            {/* Comparison Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ACUTE AR Card */}
              <div className="bg-white rounded-xl border-2 shadow-sm overflow-hidden" style={{ borderColor: "#ef4444" }}>
                <div className="px-5 py-3 flex items-center gap-2" style={{ background: "#fef2f2" }}>
                  <Zap className="w-4 h-4" style={{ color: "#ef4444" }} />
                  <h3 className="font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>Acute AR</h3>
                  <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#fee2e2", color: "#dc2626" }}>Haemodynamic Emergency</span>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "#ef4444" }}>Common Causes</h4>
                    <ul className="space-y-1">
                      {["Acute aortic dissection (Type A)", "Infective endocarditis with leaflet destruction", "Iatrogenic (post-TAVR, post-balloon valvuloplasty)", "Blunt chest trauma", "Spontaneous leaflet tear (rare)"].map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#ef4444" }} />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "#ef4444" }}>Haemodynamics</h4>
                    <p className="text-sm text-gray-600">Sudden volume overload into a <strong>non-dilated, non-compliant LV</strong>. LVEDP rises sharply → premature mitral valve closure → pulmonary oedema. No compensatory LV dilatation. Narrow pulse pressure. Tachycardia as compensatory mechanism.</p>
                  </div>
                </div>
              </div>

              {/* CHRONIC AR Card */}
              <div className="bg-white rounded-xl border-2 shadow-sm overflow-hidden" style={{ borderColor: "#189aa1" }}>
                <div className="px-5 py-3 flex items-center gap-2" style={{ background: "#f0fbfc" }}>
                  <Clock className="w-4 h-4" style={{ color: "#189aa1" }} />
                  <h3 className="font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>Chronic AR</h3>
                  <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#d0f4f5", color: "#0e7490" }}>Compensated / Decompensated</span>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "#189aa1" }}>Common Causes</h4>
                    <ul className="space-y-1">
                      {["Bicuspid aortic valve", "Aortic root dilatation (Marfan, HTN, idiopathic)", "Rheumatic heart disease", "Degenerative calcific disease", "Previous endocarditis (healed)"].map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#189aa1" }} />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "#189aa1" }}>Haemodynamics</h4>
                    <p className="text-sm text-gray-600">Gradual volume overload → <strong>eccentric LV hypertrophy and dilatation</strong>. LV accommodates large regurgitant volumes. Wide pulse pressure (high SBP, low DBP). Compensated for years; decompensation occurs when EF falls or symptoms develop.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Echo Findings Comparison Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>Echo Findings: Acute vs Chronic AR</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Finding</th>
                      <th className="text-left px-4 py-3 font-semibold" style={{ color: "#ef4444" }}>Acute AR</th>
                      <th className="text-left px-4 py-3 font-semibold" style={{ color: "#189aa1" }}>Chronic AR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["LV size", "Normal or mildly enlarged", "Markedly dilated (LVEDD >65 mm)"],
                      ["LV wall thickness", "Normal", "Eccentric hypertrophy"],
                      ["LV systolic function", "Hyperdynamic initially, then impaired", "Preserved until late decompensation"],
                      ["Aortic valve", "Flail leaflet / vegetation / dissection flap", "Thickened, prolapsing, or bicuspid"],
                      ["Regurgitant jet", "Broad, eccentric, may be difficult to grade", "Central or eccentric; graded by EROA/RVol"],
                      ["Pressure half-time (PHT)", "Very short (<200 ms) — rapid equilibration", "Longer PHT; shortens as severity increases"],
                      ["Diastolic flow reversal (descending aorta)", "Present; holodiastolic in severe", "Present; holodiastolic in severe"],
                      ["Premature MV closure", "Classic sign — MV closes before QRS", "Absent"],
                      ["Austin Flint murmur", "May be present", "May be present in severe"],
                      ["Aortic root / ascending aorta", "Dilated in dissection; assess carefully", "May be dilated (root AR)"],
                      ["Pericardial effusion", "May be present (dissection / endocarditis)", "Uncommon"],
                      ["Pulse pressure", "Narrow (shock physiology)", "Wide (≥60 mmHg in severe)"],
                    ].map(([finding, acute, chronic], i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-2.5 font-medium text-gray-700 border-r border-gray-100">{finding}</td>
                        <td className="px-4 py-2.5 text-red-700">{acute}</td>
                        <td className="px-4 py-2.5 text-teal-700">{chronic}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Per-View Scanning Tips */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>Per-View Scanning Tips for AR Assessment</h3>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { view: "PLAX", tip: "Measure LVEDD/LVESD and aortic root. Look for diastolic fluttering of anterior mitral leaflet (AMVL) — pathognomonic of AR. Premature MV closure in acute AR." },
                  { view: "PSAX (AV level)", tip: "Assess aortic valve morphology (bicuspid, tricuspid, vegetations). Colour Doppler to map jet origin and width at vena contracta." },
                  { view: "Apical 5-chamber", tip: "Align CW Doppler with AR jet. Measure PHT: <200 ms = severe acute AR. Holodiastolic flow reversal in LVOT confirms significant AR." },
                  { view: "Apical 3-chamber (APLAX)", tip: "Best for eccentric jets directed along the AMVL. Measure vena contracta width. Assess AMVL diastolic flutter." },
                  { view: "Suprasternal", tip: "Descending aorta holodiastolic flow reversal: end-diastolic velocity >20 cm/s = severe AR. Essential in all significant AR." },
                  { view: "Abdominal aorta", tip: "Holodiastolic flow reversal in abdominal aorta confirms severe AR. Use PW Doppler with sample volume in proximal abdominal aorta." },
                ].map(({ view, tip }, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "#f8fafc" }}>
                    <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 text-white text-xs font-bold" style={{ background: "#0e7490" }}>{view.slice(0, 2)}</div>
                    <div>
                      <p className="text-xs font-bold text-gray-700 mb-0.5">{view}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Clinical Pearls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#189aa1]" /> Clinical Pearls
                </h4>
                <ul className="space-y-2">
                  {[
                    "Premature MV closure on M-mode is the hallmark of acute severe AR — indicates very high LVEDP.",
                    "PHT <200 ms in acute AR reflects rapid LV-aortic pressure equilibration, not mild AR.",
                    "Holodiastolic flow reversal in the descending aorta is the most specific Doppler sign of severe AR.",
                    "In acute AR, LV size may be near-normal despite severe regurgitation — do not underestimate severity.",
                    "Bicuspid AV is the most common cause of AR in patients under 60 years.",
                    "Aortic root dilatation (>45 mm) with AR may require root replacement regardless of AR severity.",
                  ].map((pearl, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#189aa1" }} />
                      {pearl}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" /> Surgical Triggers (AHA/ACC 2021)
                </h4>
                <ul className="space-y-2">
                  {[
                    "Acute severe AR: urgent surgery regardless of symptoms.",
                    "Chronic severe AR + symptoms (dyspnoea, angina, HF): surgery indicated.",
                    "Asymptomatic severe AR + LVEF <55%: surgery indicated.",
                    "Asymptomatic severe AR + LVEDD >65 mm (or LVESD >50 mm): surgery indicated.",
                    "Aortic root ≥45 mm in Marfan syndrome: prophylactic root replacement.",
                    "Aortic root ≥50 mm in bicuspid AV: surgery indicated.",
                  ].map((trigger, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#ef4444" }} />
                      {trigger}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ASE Severity Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>Guideline-Based Severity Thresholds — Aortic Regurgitation</h3>
                <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#d0f4f5", color: "#0e7490" }}>2021 Guidelines</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Parameter</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500">Mild</th>
                      <th className="text-left px-4 py-3 font-semibold text-amber-600">Moderate</th>
                      <th className="text-left px-4 py-3 font-semibold text-red-600">Severe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Vena contracta (cm)", "<0.3", "0.3–0.59", "\u22650.6"],
                      ["Jet width / LVOT width (%)", "<25%", "25–64%", "\u226565%"],
                      ["EROA — PISA (cm\u00b2)", "<0.10", "0.10–0.29", "\u22650.30"],
                      ["Regurgitant volume (mL)", "<30", "30–59", "\u226560"],
                      ["Regurgitant fraction (%)", "<30", "30–49", "\u226550"],
                      ["PHT (ms)", ">500", "200–500", "<200"],
                      ["Holodiastolic aortic reversal", "Absent", "Brief", "Holodiastolic"],
                    ].map(([param, mild, mod, severe], i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-2.5 font-medium text-gray-700 border-r border-gray-100">{param}</td>
                        <td className="px-4 py-2.5 text-gray-500">{mild}</td>
                        <td className="px-4 py-2.5 text-amber-700">{mod}</td>
                        <td className="px-4 py-2.5 text-red-700 font-semibold">{severe}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Copyright */}
            <div className="text-xs text-gray-400 text-center py-2">
              Clinical content © All About Ultrasound, Inc. / iHeartEcho™. Educational use only. Based on ASE/AHA/ACC 2021 guidelines.
            </div>
            </div>}{/* end arExpanded */}
          </div>{/* end AR section */}
          </div></BlurredOverlay>
        )}

        {/* ─── FETAL ECHO TAB ─── */}
        {activeTab === "fetal" && (
          !loading && !isAuthenticated
            ? <BlurredOverlay type="login" featureName="Fetal Echo ScanCoach">

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
            {/* Fetal detail panel — order-first on mobile so it appears at top */}
            <div ref={fetalDetailRef} className="lg:col-span-3 lg:order-2 order-1 space-y-4">
              {/* Header */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b" style={{ borderColor: selectedFetal.color + "30", background: selectedFetal.color + "08" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: selectedFetal.color }}>
                        {selectedFetal.step}
                      </div>
                      <div>
                        <h2 className="font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>{selectedFetal.name}</h2>
                        <p className="text-xs text-gray-500">Fetal Echocardiography View Guide</p>
                      </div>
                    </div>
                    {/* Navigation */}
                    <div className="flex gap-2">
                      {selectedFetal.step > 1 && (
                        <button onClick={() => setSelectedFetal(fetalViews[selectedFetal.step - 2])}
                          className="px-3 py-1 rounded text-xs border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                          ← Prev
                        </button>
                      )}
                      {selectedFetal.step < fetalViews.length && (
                        <button onClick={() => setSelectedFetal(fetalViews[selectedFetal.step])}
                          className="px-3 py-1 rounded text-xs text-white transition-colors"
                          style={{ background: selectedFetal.color }}>
                          Next →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedFetal.description}</p>
                </div>
              </div>

              {/* Diagram + Echo image */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>View Reference Images</h3>
                  <span className="text-xs text-gray-400">Diagram · Clinical Echo</span>
                </div>
                <div className="grid grid-cols-2 gap-0 bg-gray-950">
                  <div className="flex justify-center items-center p-3 border-r border-gray-800">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-1.5">Anatomy Diagram</p>
                      <MediaDisplay
                        src={(selectedFetalMerged as any).anatomyImageUrl || selectedFetal.imageUrl}
                        alt={`${selectedFetalMerged.name} diagram`}
                        className="max-h-60 object-contain rounded"
                        style={{ background: "#030712" }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-center items-center p-3">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-1.5">Clinical Echo Image</p>
                      <MediaDisplay
                        src={(selectedFetalMerged as any).echoImageUrl || selectedFetal.imageUrl}
                        alt={`${selectedFetalMerged.name} echo`}
                        className="max-h-60 object-contain rounded"
                        style={{ background: "#030712" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Structures */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="w-4 h-4" style={{ color: selectedFetal.color }} />
                    <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>Structures to Identify</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {selectedFetal.structures.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: selectedFetal.color }}></span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Normal Findings */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4" style={{ color: selectedFetal.color }} />
                    <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>Normal Findings</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {selectedFetal.normalFindings.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-500 font-bold mt-0.5 flex-shrink-0">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Technique + Red Flags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <h3 className="font-bold text-sm text-gray-700 mb-2" style={{ fontFamily: "Merriweather, serif" }}>Scanning Technique</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{selectedFetal.technique}</p>
                  {(selectedFetal as any).patientPosition && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <h4 className="font-semibold text-xs text-gray-500 mb-1 uppercase tracking-wide">Patient Positioning</h4>
                      <p className="text-sm text-gray-600">{(selectedFetal as any).patientPosition}</p>
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <h4 className="font-semibold text-xs text-gray-500 mb-1 uppercase tracking-wide">Doppler</h4>
                    <p className="text-sm text-gray-600">{selectedFetal.doppler}</p>
                  </div>
                  <PremiumPearlGate isPremium={isPremium} label="Common Pitfalls" count={selectedFetal.pitfalls.length}>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <h4 className="font-semibold text-xs text-gray-500 mb-1 uppercase tracking-wide">Common Pitfalls</h4>
                    <ul className="space-y-1">
                      {selectedFetal.pitfalls.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-amber-700">
                          <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  </PremiumPearlGate>
                </div>

                {/* Red Flags */}
                <PremiumPearlGate isPremium={isPremium} label="Red Flags" count={selectedFetal.redFlags.length} context="Unlock clinical red flags and abnormal findings for every fetal echo view with Premium.">
                <div className="bg-white rounded-xl border border-red-50 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>Red Flags / Abnormal Findings</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {selectedFetal.redFlags.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                        <span className="text-red-500 font-bold mt-0.5 flex-shrink-0">!</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                </PremiumPearlGate>
              </div>

              {/* Copyright */}
              <div className="text-xs text-gray-400 text-center py-2">
                Clinical images © All About Ultrasound, Inc. / iHeartEcho™. Educational use only.
              </div>
            </div>
            {/* View list sidebar — sticky on desktop */}
            <div className="lg:col-span-1 lg:order-1 order-2 lg:sticky lg:top-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>Fetal Echo Views</h3>
                  <p className="text-xs text-gray-400 mt-0.5">13-view sweep sequence</p>
                </div>
                {/* Sweep overview image */}
                <div className="p-2">
                  <img src={CDN.sweep} alt="Fetal echo sweep overview" className="w-full rounded-lg object-contain bg-gray-900" style={{ maxHeight: "100px" }} />
                </div>
                <div className="p-3 space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {fetalViews.map(v => (
                    <FetalViewCard key={v.id} view={v} isSelected={selectedFetal.id === v.id} onClick={() => setSelectedFetal(v)} />
                  ))}
                </div>
              </div>
            </div>
          </div>
              </BlurredOverlay>
              : !loading && !isPremium
              ? <BlurredOverlay type="premium" featureName="Fetal Echo ScanCoach">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
            <div className="lg:col-span-3 lg:order-2 order-1 space-y-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">Fetal Echo ScanCoach</div>
            </div>
          </div>
              </BlurredOverlay>
              : <>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
            {/* Fetal detail panel — order-first on mobile so it appears at top */}
            <div ref={fetalDetailRef} className="lg:col-span-3 lg:order-2 order-1 space-y-4">
              {/* Header */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b" style={{ borderColor: selectedFetal.color + "30", background: selectedFetal.color + "08" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: selectedFetal.color }}>
                        {selectedFetal.step}
                      </div>
                      <div>
                        <h2 className="font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>{selectedFetal.name}</h2>
                        <p className="text-xs text-gray-500">Fetal Echocardiography View Guide</p>
                      </div>
                    </div>
                    {/* Navigation */}
                    <div className="flex gap-2">
                      {selectedFetal.step > 1 && (
                        <button onClick={() => setSelectedFetal(fetalViews[selectedFetal.step - 2])}
                          className="px-3 py-1 rounded text-xs border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                          ← Prev
                        </button>
                      )}
                      {selectedFetal.step < fetalViews.length && (
                        <button onClick={() => setSelectedFetal(fetalViews[selectedFetal.step])}
                          className="px-3 py-1 rounded text-xs text-white transition-colors"
                          style={{ background: selectedFetal.color }}>
                          Next →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedFetal.description}</p>
                </div>
              </div>

              {/* Diagram + Echo image */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>View Reference Images</h3>
                  <span className="text-xs text-gray-400">Diagram · Clinical Echo</span>
                </div>
                <div className="grid grid-cols-2 gap-0 bg-gray-950">
                  <div className="flex justify-center items-center p-3 border-r border-gray-800">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-1.5">Anatomy Diagram</p>
                      <MediaDisplay
                        src={(selectedFetalMerged as any).anatomyImageUrl || selectedFetal.imageUrl}
                        alt={`${selectedFetalMerged.name} diagram`}
                        className="max-h-60 object-contain rounded"
                        style={{ background: "#030712" }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-center items-center p-3">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-1.5">Clinical Echo Image</p>
                      <MediaDisplay
                        src={(selectedFetalMerged as any).echoImageUrl || selectedFetal.imageUrl}
                        alt={`${selectedFetalMerged.name} echo`}
                        className="max-h-60 object-contain rounded"
                        style={{ background: "#030712" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Structures */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="w-4 h-4" style={{ color: selectedFetal.color }} />
                    <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>Structures to Identify</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {selectedFetal.structures.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: selectedFetal.color }}></span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Normal Findings */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4" style={{ color: selectedFetal.color }} />
                    <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>Normal Findings</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {selectedFetal.normalFindings.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-500 font-bold mt-0.5 flex-shrink-0">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Technique + Red Flags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <h3 className="font-bold text-sm text-gray-700 mb-2" style={{ fontFamily: "Merriweather, serif" }}>Scanning Technique</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{selectedFetal.technique}</p>
                  {(selectedFetal as any).patientPosition && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <h4 className="font-semibold text-xs text-gray-500 mb-1 uppercase tracking-wide">Patient Positioning</h4>
                      <p className="text-sm text-gray-600">{(selectedFetal as any).patientPosition}</p>
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <h4 className="font-semibold text-xs text-gray-500 mb-1 uppercase tracking-wide">Doppler</h4>
                    <p className="text-sm text-gray-600">{selectedFetal.doppler}</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <h4 className="font-semibold text-xs text-gray-500 mb-1 uppercase tracking-wide">Common Pitfalls</h4>
                    <ul className="space-y-1">
                      {selectedFetal.pitfalls.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-amber-700">
                          <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Red Flags */}
                <div className="bg-white rounded-xl border border-red-50 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>Red Flags / Abnormal Findings</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {selectedFetal.redFlags.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                        <span className="text-red-500 font-bold mt-0.5 flex-shrink-0">!</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Copyright */}
              <div className="text-xs text-gray-400 text-center py-2">
                Clinical images © All About Ultrasound, Inc. / iHeartEcho™. Educational use only.
              </div>
            </div>
            {/* View list sidebar — sticky on desktop */}
            <div className="lg:col-span-1 lg:order-1 order-2 lg:sticky lg:top-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>Fetal Echo Views</h3>
                  <p className="text-xs text-gray-400 mt-0.5">13-view sweep sequence</p>
                </div>
                {/* Sweep overview image */}
                <div className="p-2">
                  <img src={CDN.sweep} alt="Fetal echo sweep overview" className="w-full rounded-lg object-contain bg-gray-900" style={{ maxHeight: "100px" }} />
                </div>
                <div className="p-3 space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {fetalViews.map(v => (
                    <FetalViewCard key={v.id} view={v} isSelected={selectedFetal.id === v.id} onClick={() => setSelectedFetal(v)} />
                  ))}
                </div>
              </div>
            </div>
          </div>
              </>
        )}
        {/* ─── PEDIATRIC CHD TAB ─── */}
        {activeTab === "chd" && (
          !loading && !isAuthenticated
            ? <BlurredOverlay type="login" featureName="Pediatric CHD ScanCoach"><PedCHDCoach /></BlurredOverlay>
            : !loading && !isPremium
              ? <BlurredOverlay type="premium" featureName="Pediatric CHD ScanCoach"><PedCHDCoach /></BlurredOverlay>
              : <PedCHDCoach isPremium={isPremium} />
        )}
        {/* ─── ADULT CONGENITAL TAB ─── */}
        {activeTab === "achd" && (
          !loading && !isAuthenticated
            ? <BlurredOverlay type="login" featureName="Adult Congenital ScanCoach"><ACHDScanCoach /></BlurredOverlay>
            : !loading && !isPremium
              ? <BlurredOverlay type="premium" featureName="Adult Congenital ScanCoach"><ACHDScanCoach /></BlurredOverlay>
              : <ACHDScanCoach />
        )}
        {/* ─── PULMONARY HTN & PE TAB ─── */}
        {activeTab === "pulm" && (
          !loading && !isAuthenticated
            ? <BlurredOverlay type="login" featureName="Pulmonary HTN & PE ScanCoach"><PulmHTNScanCoach /></BlurredOverlay>
            : !loading && !isPremium
              ? <BlurredOverlay type="premium" featureName="Pulmonary HTN & PE ScanCoach"><PulmHTNScanCoach /></BlurredOverlay>
              : <PulmHTNScanCoach />
        )}
        {/* ─── STRAIN TAB ─── */}
        {activeTab === "strain" && (
          !loading && !isAuthenticated
            ? <BlurredOverlay type="login" featureName="Strain ScanCoach"><StrainScanCoachContent /></BlurredOverlay>
            : <StrainScanCoachContent isPremium={isPremium} />
        )}
        {/* ─── HOCM TAB ─── */}
        {activeTab === "hocm" && (
          !loading && !isAuthenticated
            ? <BlurredOverlay type="login" featureName="HOCM-Assist™ ScanCoach"><HOCMScanCoachContent /></BlurredOverlay>
            : !loading && !isPremium
              ? <BlurredOverlay type="premium" featureName="HOCM-Assist™ ScanCoach"><HOCMScanCoachContent /></BlurredOverlay>
              : <HOCMScanCoachContent />
        )}
        {/* ─── UEA TAB ─── */}
        {activeTab === "uea" && (
          !loading && !isAuthenticated
            ? <BlurredOverlay type="login" featureName="UEA ScanCoach"><UEAScanCoachContent /></BlurredOverlay>
            : !loading && !isPremium
              ? <BlurredOverlay type="premium" featureName="UEA ScanCoach"><UEAScanCoachContent /></BlurredOverlay>
              : <UEAScanCoachContent />
        )}
        {/* ─── DIASTOLIC FUNCTION TAB ─── */}
        {activeTab === "diastolic" && (
          !loading && !isAuthenticated
            ? <BlurredOverlay type="login" featureName="Diastolic Function ScanCoach"><DiastolicScanCoachContent /></BlurredOverlay>
            : !loading && !isPremium
              ? <BlurredOverlay type="premium" featureName="Diastolic Function ScanCoach"><DiastolicScanCoachContent /></BlurredOverlay>
              : <DiastolicScanCoachContent />
        )}
        {/* ─── TEE TAB ─── */}
        {activeTab === "tee" && (
          !loading && !isAuthenticated
            ? <BlurredOverlay type="login" featureName="TEE ScanCoach"><TEEIceScanCoachContent /></BlurredOverlay>
            : !loading && !isPremium
              ? <BlurredOverlay type="premium" featureName="TEE ScanCoach"><TEEIceScanCoachContent /></BlurredOverlay>
              : <TEEIceScanCoachContent />
        )}
        {/* ─── ICE TAB ─── */}
        {activeTab === "ice" && (
          !loading && !isAuthenticated
            ? <BlurredOverlay type="login" featureName="ICE ScanCoach"><ICEScanCoachContent /></BlurredOverlay>
            : !loading && !isPremium
              ? <BlurredOverlay type="premium" featureName="ICE ScanCoach"><ICEScanCoachContent /></BlurredOverlay>
              : <ICEScanCoachContent />
        )}
      </div>
    </Layout>
  );
}
