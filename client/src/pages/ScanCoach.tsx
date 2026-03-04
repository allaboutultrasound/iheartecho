/*
  iHeartEcho — Scan Coach
  Visual probe guidance with anatomy overlays
  Brand: Teal #189aa1, Aqua #4ad9e0
*/
import { useState } from "react";
import Layout from "@/components/Layout";
import { Scan, MapPin, RotateCcw, Crosshair } from "lucide-react";

const views = [
  {
    id: "plax",
    name: "Parasternal Long Axis",
    abbr: "PLAX",
    probePosition: "Left sternal border, 3rd–4th ICS",
    probeOrientation: "Marker toward right shoulder (2 o'clock)",
    structures: ["Aortic valve", "Mitral valve", "LV", "LA", "LVOT", "Descending aorta (posterior)"],
    doppler: "PW Doppler at LVOT, CW through AV",
    tips: ["Tilt probe to open up LVOT", "Descending aorta posterior to MV confirms PLAX", "Avoid foreshortening — IVS should be horizontal"],
    color: "#189aa1",
    svgPath: "M 50 80 Q 100 20 150 80 Q 100 140 50 80",
    probeAngle: "45°",
  },
  {
    id: "psax_av",
    name: "Parasternal Short Axis — AV",
    abbr: "PSAX-AV",
    probePosition: "Left sternal border, 3rd–4th ICS",
    probeOrientation: "Marker toward left shoulder (10 o'clock), rotated 90° from PLAX",
    structures: ["Aortic valve (3 cusps)", "RVOT", "Pulmonary valve", "LA", "RA", "Tricuspid valve"],
    doppler: "PW/CW through RVOT and pulmonic valve",
    tips: ["'Mercedes-Benz' sign = normal tricuspid AV", "Bicuspid AV: 2 cusps, fish-mouth opening", "Assess for ASD at this level"],
    color: "#0891b2",
    probeAngle: "90°",
  },
  {
    id: "a4c",
    name: "Apical 4-Chamber",
    abbr: "A4C",
    probePosition: "Cardiac apex (5th ICS, midclavicular line)",
    probeOrientation: "Marker toward left (3 o'clock)",
    structures: ["LV", "RV", "LA", "RA", "Mitral valve", "Tricuspid valve", "Interatrial septum", "Interventricular septum"],
    doppler: "PW Doppler at MV tips (E/A), TDI at annulus (e'), TV inflow",
    tips: ["Apex must be at TOP of image", "Foreshortening: LV appears round — reposition", "RV should be smaller than LV"],
    color: "#7c3aed",
    probeAngle: "0°",
  },
  {
    id: "a5c",
    name: "Apical 5-Chamber",
    abbr: "A5C",
    probePosition: "Same as A4C, tilt anteriorly",
    probeOrientation: "Slight anterior tilt from A4C",
    structures: ["LVOT", "Aortic valve", "Ascending aorta"],
    doppler: "PW Doppler in LVOT (VTI), CW through AV",
    tips: ["Tilt probe toward sternum from A4C", "Align cursor parallel to LVOT flow", "Used for LVOT VTI and AVA calculation"],
    color: "#059669",
    probeAngle: "0° + tilt",
  },
  {
    id: "subcostal",
    name: "Subcostal",
    abbr: "Sub",
    probePosition: "Subxiphoid, angled toward left shoulder",
    probeOrientation: "Marker toward patient's left",
    structures: ["IVC", "RA", "RV", "Atrial septum", "Pericardium"],
    doppler: "M-mode IVC for RAP estimation",
    tips: ["IVC < 2.1 cm + >50% collapse = RAP 0–5 mmHg", "Best view for pericardial effusion", "Ask patient to sniff for IVC collapsibility"],
    color: "#d97706",
    probeAngle: "Flat",
  },
];

export default function ScanCoach() {
  const [selected, setSelected] = useState(views[0]);

  return (
    <Layout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1" style={{ fontFamily: "Merriweather, serif" }}>
            Scan Coach
          </h1>
          <p className="text-sm text-gray-500">
            Visual probe guidance with anatomy overlays and Doppler positioning tips for each echo view.
          </p>
        </div>

        {/* View selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {views.map(v => (
            <button key={v.id} onClick={() => setSelected(v)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                selected.id === v.id ? "text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:border-[#189aa1] hover:text-[#189aa1]"
              }`}
              style={selected.id === v.id ? { background: selected.color } : {}}>
              {v.abbr}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visual probe diagram */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Scan className="w-4 h-4" style={{ color: selected.color }} />
              <h3 className="font-bold text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>{selected.name}</h3>
            </div>
            <div className="p-6">
              {/* Chest diagram */}
              <div className="relative bg-[#f8fafb] rounded-xl border border-gray-100 flex items-center justify-center" style={{ height: 240 }}>
                <svg viewBox="0 0 200 200" className="w-full h-full max-w-xs">
                  {/* Chest outline */}
                  <ellipse cx="100" cy="100" rx="75" ry="85" fill="none" stroke="#e2e8f0" strokeWidth="2" />
                  {/* Sternum */}
                  <line x1="100" y1="30" x2="100" y2="150" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                  {/* Ribs */}
                  {[50, 65, 80, 95, 110].map((y, i) => (
                    <g key={i}>
                      <path d={`M 100 ${y} Q 60 ${y + 5} 40 ${y + 20}`} fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
                      <path d={`M 100 ${y} Q 140 ${y + 5} 160 ${y + 20}`} fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
                    </g>
                  ))}
                  {/* Heart — tilted slightly left (apex toward patient's left) */}
                  <g transform="rotate(-15, 100, 110)">
                    <path d="M 100 140 Q 70 110 75 90 Q 80 75 95 80 Q 100 82 100 82 Q 100 82 105 80 Q 120 75 125 90 Q 130 110 100 140 Z"
                      fill="#fecdd3" stroke="#fca5a5" strokeWidth="1" opacity="0.7" />
                  </g>

                  {/* Probe position indicator */}
                  {selected.id === "plax" && (
                    <g>
                      <circle cx="85" cy="75" r="8" fill={selected.color} opacity="0.9" />
                      <text x="85" y="78" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">P</text>
                      <line x1="85" y1="83" x2="100" y2="110" stroke={selected.color} strokeWidth="1.5" strokeDasharray="3,2" />
                    </g>
                  )}
                  {selected.id === "psax_av" && (
                    <g>
                      <circle cx="85" cy="75" r="8" fill={selected.color} opacity="0.9" />
                      <text x="85" y="78" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">P</text>
                      <circle cx="100" cy="100" r="15" fill="none" stroke={selected.color} strokeWidth="1.5" strokeDasharray="3,2" />
                    </g>
                  )}
                  {selected.id === "a4c" && (
                    <g>
                      <circle cx="110" cy="145" r="8" fill={selected.color} opacity="0.9" />
                      <text x="110" y="148" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">P</text>
                      <line x1="110" y1="137" x2="100" y2="110" stroke={selected.color} strokeWidth="1.5" strokeDasharray="3,2" />
                    </g>
                  )}
                  {selected.id === "a5c" && (
                    <g>
                      <circle cx="110" cy="145" r="8" fill={selected.color} opacity="0.9" />
                      <text x="110" y="148" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">P</text>
                      <line x1="110" y1="137" x2="95" y2="95" stroke={selected.color} strokeWidth="1.5" strokeDasharray="3,2" />
                    </g>
                  )}
                  {selected.id === "subcostal" && (
                    <g>
                      <circle cx="100" cy="168" r="8" fill={selected.color} opacity="0.9" />
                      <text x="100" y="171" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">P</text>
                      <line x1="100" y1="160" x2="100" y2="140" stroke={selected.color} strokeWidth="1.5" strokeDasharray="3,2" />
                    </g>
                  )}

                  {/* Labels — patient's right is on diagram's left, patient's left is on diagram's right */}
                  <text x="22" y="100" fontSize="7" fill="#94a3b8">Right</text>
                  <text x="155" y="100" fontSize="7" fill="#94a3b8">Left</text>
                  <text x="90" y="22" fontSize="7" fill="#94a3b8">Head</text>
                  <text x="85" y="190" fontSize="7" fill="#94a3b8">Feet</text>
                </svg>

                {/* Probe indicator */}
                <div className="absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-full text-white"
                  style={{ background: selected.color }}>
                  {selected.probeAngle}
                </div>
              </div>

              {/* Position info */}
              <div className="mt-4 space-y-2">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-[#f0fbfc] border border-[#189aa1]/10">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#189aa1" }} />
                  <div>
                    <div className="text-xs font-semibold text-gray-600 mb-0.5">Probe Position</div>
                    <div className="text-xs text-gray-700">{selected.probePosition}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-[#f0fbfc] border border-[#189aa1]/10">
                  <RotateCcw className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#189aa1" }} />
                  <div>
                    <div className="text-xs font-semibold text-gray-600 mb-0.5">Probe Orientation</div>
                    <div className="text-xs text-gray-700">{selected.probeOrientation}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            {/* Structures */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="teal-header px-5 py-3">
                <h3 className="font-bold text-sm text-white" style={{ fontFamily: "Merriweather, serif" }}>Structures Visualized</h3>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {selected.structures.map(s => (
                  <span key={s} className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: selected.color + "15", color: selected.color }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Doppler */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <Crosshair className="w-4 h-4" style={{ color: "#189aa1" }} />
                <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>Doppler Positioning</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{selected.doppler}</p>
            </div>

            {/* Tips */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>Scanning Tips</h3>
              </div>
              <div className="p-4 space-y-2">
                {selected.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                      style={{ background: selected.color }}>
                      {i + 1}
                    </span>
                    <p className="text-xs text-gray-600 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
