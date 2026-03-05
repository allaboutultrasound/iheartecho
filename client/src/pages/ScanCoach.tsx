/*
  iHeartEcho — Scan Coach
  TTE + Fetal Echo view guides with anatomy diagrams from PPTX
  Brand: Teal #189aa1, Aqua #4ad9e0
  Fonts: Merriweather headings, Open Sans body
*/
import { useState } from "react";
import Layout from "@/components/Layout";
import { Scan, Heart, ChevronRight, Info, Eye, Crosshair, AlertTriangle } from "lucide-react";

// ---- TTE VIEWS ----
const tteViews = [
  {
    id: "plax",
    name: "Parasternal Long Axis",
    abbr: "PLAX",
    probePosition: "Left sternal border, 3rd–4th ICS",
    probeOrientation: "Marker toward right shoulder (2 o'clock)",
    structures: ["Aortic valve", "Mitral valve", "LV", "LA", "LVOT", "Descending aorta (posterior)"],
    doppler: "PW Doppler at LVOT, CW through AV",
    tips: [
      "Tilt probe to open up LVOT — IVS should be horizontal",
      "Descending aorta posterior to MV confirms true PLAX",
      "Avoid foreshortening — LV should appear elongated, not round",
    ],
    pitfalls: ["Foreshortening underestimates LV size", "Descending aorta mistaken for LA"],
    measurements: ["LVID (d/s)", "IVS (d)", "PW (d)", "Ao root", "LA diameter", "LVOT diameter"],
    color: "#189aa1",
    probeAngle: "2 o'clock",
  },
  {
    id: "psax_av",
    name: "Parasternal Short Axis — AV Level",
    abbr: "PSAX-AV",
    probePosition: "Left sternal border, 3rd–4th ICS",
    probeOrientation: "Marker toward left shoulder (10 o'clock), rotated 90° from PLAX",
    structures: ["Aortic valve (3 cusps)", "RVOT", "Pulmonary valve", "LA", "RA", "Tricuspid valve", "Interatrial septum"],
    doppler: "PW/CW through RVOT and pulmonic valve",
    tips: [
      "'Mercedes-Benz' sign = normal tricuspid AV",
      "Bicuspid AV: 2 cusps, fish-mouth opening",
      "Assess for ASD at this level — drop-out in IAS is common",
    ],
    pitfalls: ["Bicuspid AV may appear tricuspid if not fully open", "RVOT foreshortening"],
    measurements: ["RVOT diameter", "Pulmonary valve annulus", "AV planimetry (MVA)"],
    color: "#0891b2",
    probeAngle: "10 o'clock",
  },
  {
    id: "psax_mv",
    name: "Parasternal Short Axis — MV Level",
    abbr: "PSAX-MV",
    probePosition: "Left sternal border, 3rd–4th ICS — tilt inferiorly from AV level",
    probeOrientation: "Marker toward left shoulder (10 o'clock)",
    structures: ["Mitral valve (fish-mouth)", "LV (circular)", "Papillary muscles"],
    doppler: "Color Doppler for MR jet origin",
    tips: [
      "Fish-mouth opening of MV — both leaflets should open symmetrically",
      "Identify A1/A2/A3 and P1/P2/P3 scallops for MR localization",
      "Planimetry of MVA in mitral stenosis",
    ],
    pitfalls: ["Oblique cut gives oval LV — reposition for true circle", "Papillary muscle level vs MV level"],
    measurements: ["MVA planimetry", "LV short-axis dimensions"],
    color: "#7c3aed",
    probeAngle: "10 o'clock",
  },
  {
    id: "psax_pm",
    name: "Parasternal Short Axis — Papillary Muscle",
    abbr: "PSAX-PM",
    probePosition: "Left sternal border, 3rd–4th ICS — tilt further inferiorly",
    probeOrientation: "Marker toward left shoulder (10 o'clock)",
    structures: ["LV (circular)", "Anterolateral papillary muscle", "Posteromedial papillary muscle"],
    doppler: "Wall motion assessment in all segments",
    tips: [
      "Best level for regional wall motion assessment (6 segments visible)",
      "Anterolateral PM: LAD + LCx territory; Posteromedial PM: RCA territory",
      "Compare systolic thickening anterior vs inferior walls for ischemia",
    ],
    pitfalls: ["Foreshortening makes LV appear oval", "Near-field artifact from ribs"],
    measurements: ["LV EF (visual), wall motion score"],
    color: "#059669",
    probeAngle: "10 o'clock",
  },
  {
    id: "a4c",
    name: "Apical 4-Chamber",
    abbr: "A4C",
    probePosition: "Cardiac apex (5th ICS, midclavicular line)",
    probeOrientation: "Marker toward left (3 o'clock)",
    structures: ["LV", "RV", "LA", "RA", "Mitral valve", "Tricuspid valve", "Interatrial septum", "IVS"],
    doppler: "PW Doppler at MV tips (E/A), TDI at annulus (e'), TV inflow",
    tips: [
      "Apex must be at TOP of image — rotate patient to left lateral decubitus",
      "Foreshortening: LV appears round — move probe laterally and/or use lower ICS",
      "RV should be smaller than LV; RV:LV ratio >0.6 suggests RV dilation",
    ],
    pitfalls: ["Foreshortening is the most common error", "Apex not at top → incorrect volumes"],
    measurements: ["LV volumes (biplane Simpson)", "EF", "GLS", "E, A, DT", "e' septal/lateral", "TAPSE", "RV FAC"],
    color: "#d97706",
    probeAngle: "3 o'clock",
  },
  {
    id: "a2c",
    name: "Apical 2-Chamber",
    abbr: "A2C",
    probePosition: "Cardiac apex — rotate 60° CCW from A4C",
    probeOrientation: "Marker toward 12 o'clock (superior)",
    structures: ["LV (anterior and inferior walls)", "LA", "Mitral valve", "LAA"],
    doppler: "PW at MV tips, color for MR",
    tips: [
      "Rotate CCW from A4C until RV disappears — only LV and LA visible",
      "Anterior wall (top) and inferior wall (bottom) in this view",
      "LAA best seen with slight posterior tilt",
    ],
    pitfalls: ["Oblique cut includes RV — rotate further CCW", "Inferior wall foreshortening"],
    measurements: ["LV volume (biplane Simpson)", "LAA assessment"],
    color: "#be185d",
    probeAngle: "12 o'clock",
  },
  {
    id: "a3c",
    name: "Apical 3-Chamber (APLAX)",
    abbr: "A3C",
    probePosition: "Cardiac apex — rotate 30° CCW from A2C (or 30° CW from A4C)",
    probeOrientation: "Marker toward 10–11 o'clock",
    structures: ["LV", "LA", "LVOT", "Aortic valve", "Ascending aorta"],
    doppler: "PW in LVOT (VTI), CW through AV",
    tips: [
      "APLAX = apical long axis — shows LVOT and AV from apex",
      "Align Doppler cursor parallel to LVOT flow for accurate VTI",
      "Anteroseptal (top) and inferolateral (bottom) walls visible",
    ],
    pitfalls: ["Underalignment of Doppler cursor underestimates VTI by up to 30%", "Confusion with A2C"],
    measurements: ["LVOT VTI", "AVA (continuity equation)", "AV peak/mean gradient"],
    color: "#c2410c",
    probeAngle: "10–11 o'clock",
  },
  {
    id: "subcostal",
    name: "Subcostal",
    abbr: "Sub",
    probePosition: "Subxiphoid, angled toward left shoulder at 45°",
    probeOrientation: "Marker toward patient's left",
    structures: ["IVC", "RA", "RV", "Atrial septum", "Pericardium", "Liver"],
    doppler: "M-mode IVC for RAP estimation",
    tips: [
      "IVC < 2.1 cm + >50% collapse = RAP 0–5 mmHg (normal)",
      "IVC > 2.1 cm + <50% collapse = RAP 15 mmHg (elevated)",
      "Best view for pericardial effusion and tamponade",
      "Ask patient to sniff for IVC collapsibility",
    ],
    pitfalls: ["Hepatic vein mistaken for IVC", "Difficult in obese patients — try lateral decubitus"],
    measurements: ["IVC diameter", "IVC collapsibility index", "RAP estimate"],
    color: "#64748b",
    probeAngle: "Flat / 45°",
  },
  {
    id: "suprasternal",
    name: "Suprasternal",
    abbr: "SSN",
    probePosition: "Suprasternal notch, angled inferiorly",
    probeOrientation: "Marker toward left (sagittal plane)",
    structures: ["Aortic arch", "Innominate artery", "Left carotid artery", "Left subclavian artery", "Descending aorta", "RPA (cross-section)"],
    doppler: "CW Doppler in descending aorta (diastolic flow reversal in AR)",
    tips: [
      "Extend patient's neck with shoulder roll for better access",
      "Aortic arch visible as 'candy cane' shape",
      "Diastolic flow reversal in descending aorta = significant AR",
    ],
    pitfalls: ["Difficult in short necks or COPD", "Probe pressure may cause discomfort"],
    measurements: ["Aortic arch diameter", "Descending aorta diastolic flow reversal"],
    color: "#1d4ed8",
    probeAngle: "Sagittal",
  },
];

// ---- FETAL ECHO VIEWS (from PPTX: Lara Williams, ACS, RDCS, FASE) ----
const fetalViews = [
  {
    id: "4cv",
    name: "Four Chamber View",
    abbr: "4CV",
    description: "The most important screening view in fetal echo. Obtained from a transverse cross-section of the fetal thorax at the level of the AV valves. The heart should occupy approximately 1/3 of the thoracic area.",
    structures: ["LV (left, posterior)", "RV (right, anterior)", "LA (posterior left)", "RA (posterior right)", "Mitral valve", "Tricuspid valve", "IVS", "IAS with foramen ovale flap", "Descending aorta (posterior to spine)"],
    normalFindings: [
      "LV and RV roughly equal in size (RV slightly larger in fetus)",
      "Foramen ovale flap opens toward LA",
      "Apex points toward left anterior chest wall (levocardia)",
      "Descending aorta posterior-left to spine",
      "Pulmonary veins entering LA (2 on each side)",
    ],
    technique: "Transverse sweep from abdomen (situs view) cranially until 4 chambers are visible. Maintain transverse plane — do not oblique.",
    doppler: "Color Doppler across AV valves for regurgitation. PW at MV and TV tips for E/A ratio.",
    pitfalls: [
      "Dextrocardia vs dextroposition — check situs first",
      "Foramen ovale flap mistaken for ASD — flap should bow toward LA",
      "Oblique cut may make chambers appear unequal",
    ],
    redFlags: ["Cardiomegaly (>1/3 thorax)", "Unequal chamber sizes", "Absent or abnormal foramen ovale flap", "Pericardial effusion", "Echogenic focus (EIF)"],
    diagramUrl: "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/rwunmXvAnWyZzmvY.png?Expires=1804208212&Signature=AaSK1Bp0fwfGaS3Gy6MskOC8Y41FTeaGLhuOf1Vw2m1aP9MpyFxcUX6xU6v8zWO8izDObxRp1aLlaZe2eddBhS9x0ARDITURtd63chq7Hf8W24A7Yf3Sx4exLI3mj40xEaf~EULkvp1Dx~fqASblNU2l~hNkYFmvIzrYimuxniGjDX157UHziKaV9jSVcHlRwB7PPLIcP-lXMXfEP42i1sw6DNn64ZF0tsX8rQK6OouQoTCsuEHzsR1qex3Ru6dRm1~SCSsIWPjxKfEnEvLsr6hjOvacbyHoo0Mb3cSANGrd8cII-Px-1jTKpj1o~MSQo~ZDSy~HkkmwMfdok9vjJw__&Key-Pair-Id=K2HSFNDJXOU9YS",
    anatomyUrl: "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/YPalLBZtivOkZfbx.png?Expires=1804208212&Signature=bAFWzvfK6gfIX2MpmQm9vMh7pOa1W8vfFAaj0BgTQxVMGbHyFaL1HouWpHBxODA9XEaLyFE8NaamBoEKBgUMD2wMejq6h~kMZ9EOVfidfRnamBtSORoGkM4gFrmYp7d43-1r~KGvXYzMkPkR4SiDyaTOmKuDX9k3jJB~nWz7LgA0Fi6f1~FpIDL4Qhp4sa7Cgyr~Un89xQ5gWsxF9l3AbXBCl-H3EG3OdD7oSw1VTpIB2EGIqIZjcvzmiQwGDCJZq-LvxaKre9cJIm9So2tlo8ZJXvOiuRI0yv5s8USei0o6qn5rAQq60cB9kHJ9N2xRONZQtiv7OjUeHRAaCIh6sA__&Key-Pair-Id=K2HSFNDJXOU9YS",
    color: "#189aa1",
  },
  {
    id: "lvot",
    name: "LVOT View",
    abbr: "LVOT",
    description: "Obtained by rotating the transducer slightly from the 4CV to bring the LVOT into view. Confirms the aorta arises from the LV (ventriculo-arterial concordance) and crosses the RVOT.",
    structures: ["LV", "RV", "LA", "Ascending aorta (ASC AO)", "LVOT", "Pulmonary veins (entering LA)", "Descending aorta (DESC AO)"],
    normalFindings: [
      "Aorta arises from LV — continuity between IVS and anterior aortic wall",
      "Aorta crosses rightward over the RVOT",
      "Ascending aorta smaller than MPA in fetus",
      "Pulmonary veins visible entering LA posteriorly",
    ],
    technique: "From 4CV, rotate transducer slightly clockwise (or tilt anteriorly) until the aortic root comes into view arising from the LV. The LVOT should be parallel to the ultrasound beam.",
    doppler: "PW Doppler in LVOT for velocity. Color Doppler to confirm antegrade flow from LV to aorta.",
    pitfalls: [
      "Overangulation brings in RVOT instead of LVOT",
      "Aorta appears to arise from RV in TGA — confirm with RVOT view",
      "Pulmonary veins may be mistaken for other structures",
    ],
    redFlags: ["Aorta arising from RV (TGA)", "Overriding aorta (TOF)", "Aortic stenosis — turbulent LVOT flow", "Small ascending aorta (HLHS)"],
    diagramUrl: "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/CGXoqLlcddWmqOyu.png?Expires=1804208212&Signature=stUcTW5~Lz-uCZPVEUY-yj2zOa6EQYNOV-~hvfcuOEgzv10TttK52n5b1QwsVNogXfSyPHvdbW6Ofy4Jzx9R1vAakibQ57g16BpCD7k7hs4hMt4Pqc0yJzW4SztuOBa6TNc5XG2r~3~~i5vEGu0TU21dp~4FFp43raJkuutJiR7-e~imfueeW5ERiVMfR71jRmfGRI7tUxMLR01xLmURMjvVLNzQAhYKckSGlVTqgCrZlerJ55ap9ZthmC7v7SeQ2R13RJEyTqo1ubXQQ7G4bd-WtFjdejQ3C70EijGYXpyvqU56LFWT4c5cqNnpZyBiuRAeyJc0qQPa1tnuA7OaHw__&Key-Pair-Id=K2HSFNDJXOU9YS",
    anatomyUrl: "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/pUloPkAfZLgIPdfl.png?Expires=1804208212&Signature=o-VGC4TjwlM9yZeAMcBRtZK~Am1xqYzz8uRaI1JSK3JSPWt2E9ACdzk2t7Nu3hJptU-8V693hnk4jPD8Hma5X6KPUh6-BMDg4SpRLVCbnn21qj-dSQGe5K4yR826KNEpZ~gixhb5LQB1TfasH1lecGpL4BN21LK5HIZg04MjFexyPQBlbmh1zH-hom9vivsPVAbeNm37Judgv4W-19AfU~2Htnz~qSdw~fTLXeoyMqp4sh4OoeSJ-zb7Hndzg7Wyl5Ze1CvA28UKHtx9vwlVZDX-K-sH~t6XxwHaGaRtgq~~LOs0vEDbNE7LP0oGlgf2JoaocR~u1RAiYs9AD7qm2Q__&Key-Pair-Id=K2HSFNDJXOU9YS",
    color: "#0891b2",
  },
  {
    id: "rvot",
    name: "RVOT View",
    abbr: "RVOT",
    description: "Confirms the pulmonary artery arises from the RV. The MPA is normally larger than the ascending aorta in the fetus. The PA bifurcates into LPA and RPA.",
    structures: ["RV", "Main pulmonary artery (MPA/PA)", "Ascending aorta (ASC AO)", "Superior vena cava (SVC)", "Descending aorta (DESC AO)", "PA bifurcation (LPA/RPA)"],
    normalFindings: [
      "PA arises from RV — larger than ascending aorta in fetus",
      "PA bifurcates into LPA and RPA",
      "ASC AO and SVC visible as smaller circles to the right of PA",
      "DESC AO visible as small circle in lower left",
    ],
    technique: "From LVOT view, continue rotating/tilting anteriorly until PA comes into view arising from RV. The PA should be seen bifurcating.",
    doppler: "PW Doppler in MPA for velocity. Color Doppler to confirm antegrade flow from RV to PA.",
    pitfalls: [
      "PA arising from LV in TGA — confirm with LVOT view",
      "Pulmonary stenosis — turbulent flow in MPA",
      "PA and aorta equal in size suggests abnormality",
    ],
    redFlags: ["PA arising from LV (TGA)", "Small PA (pulmonary atresia/stenosis)", "PA = Ao size (abnormal)", "Absent PA bifurcation"],
    diagramUrl: "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/IpywJFoyzaxeeuvt.png?Expires=1804208212&Signature=rj00uhn4Ndt93ZRrp0Zsm7p2earD7WhCWaAhjcPy1a~od-3iz-Nu767BH2lcvt04rpOdK6xIftmR7uBkSwdjQdpwu5MjevegB85rr2yZpCVl79oTwv8G~nhUEq4cdnvW4tXShyVv4Y8o4zpHydweYjPrVnfebY48yBQZdIlaViTZb0WbB5uW9nC5ceYRWI-yf4E2bOKZtEZ84RmERGAl65gSo6LVt8SH4Rrx-Od7l4rSk2kVoiKkwiX9A32wGEu0BnyYWs8Hnyrf5i6hpTOq6b-v4DohTfNd30xfCEnHl6So9pORq7PVsUER01di9lV1guDBSzFjwsmcA9VmBEqujg__&Key-Pair-Id=K2HSFNDJXOU9YS",
    anatomyUrl: "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/dGQHKWlHgOSZUSmq.png?Expires=1804208212&Signature=Gg-jz7pYUSVps~DbCTYVRgLAg~~30UB0mft3MN9UYrtHyvBXt-UlLNVt0Dxltp99IxlSZ3bvac6jJtTv9kOh31qEfCcHfrcoCPTMy08XAxnViIXPOf3FO-QOpRMpi2gfde9BbG3COtpwDCCb-InP6cMhy-U4H7LEMY7r8S4OZg2uumtJz0lhQG6OHYDG4IFrUBEvpnHshbBzMfoAUFfwA2-XPfWOfWSOoAqQ7rnLkVgR~tcNWFtGnmRd8RVUo-oUpygV1hSI3EBSTIdiKNDPJlT1D~ylBp5Z3ppLPXrhYuMdPRy4zFxK~bun-Osk9bMARYJs4xlcHMwlUayRWPHr7A__&Key-Pair-Id=K2HSFNDJXOU9YS",
    color: "#7c3aed",
  },
  {
    id: "3vv_mpa",
    name: "3-Vessel View — MPA Bifurcation",
    abbr: "3VV-MPA",
    description: "A transverse view at the level of the great vessels showing three vessels in a line from left to right: MPA (largest), ascending aorta (medium), and SVC (smallest). The MPA bifurcates in this view.",
    structures: ["RV (superior)", "Main pulmonary artery (MPA) with bifurcation", "Ascending aorta (ASC AO)", "Superior vena cava (SVC)", "Descending aorta (DESC AO, lower left)"],
    normalFindings: [
      "Three vessels in a line: PA > Ao > SVC (left to right)",
      "PA is the largest vessel — normally larger than Ao in fetus",
      "MPA bifurcates into LPA (posterior) and RPA (anterior)",
      "Vessels align in a straight line (abnormal if offset)",
      "DESC AO in lower left quadrant",
    ],
    technique: "From RVOT view, slide the transducer slightly cranially. The three vessels should appear in a transverse plane. Maintain transverse orientation.",
    doppler: "Color Doppler across all three vessels to confirm antegrade flow. PW in MPA for velocity.",
    pitfalls: [
      "Only 2 vessels visible — may be at wrong level",
      "PA and Ao equal in size — abnormal",
      "Vessels not in a line — offset suggests abnormality",
    ],
    redFlags: ["PA < Ao (pulmonary stenosis/atresia)", "Absent SVC", "Vessels not in a line", "Reversed flow in PA (pulmonary atresia)"],
    diagramUrl: "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/wojTUjjlyRCesNzx.png?Expires=1804208212&Signature=IhnYcqurJg2M2A5kOmopTdWbZYjrUvZ0vQBZuW0Ab11yXvNfAV7ato2x93r-FbjoNEtjnCL4q6J9Sy4SMQkd3NrjTC~rzEOf-4AsHXechxml-KKdqMvEiPLk0Ld-F49h12C686X9R9TiSuQxtLNfBSj9db23rC0XU8y7q9Fci8o9vzvEAGG0fGoTyxPiRhyOECl71VS0SjoIcnRqBO7EN5FSHTvpk-5ne5ktAJfxW9qsbZtmYA3Qp7Qh~lWvvAv96JmshcHoHnM49gsxPU2A3-1zVF9wR44Pjh0ZY9mC1XlNDyJeIhaSKH6zxuz-Ro8QlX7r7dfDyaOi95D-a3Bv0Q__&Key-Pair-Id=K2HSFNDJXOU9YS",
    anatomyUrl: "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/eVQRJUSqoHzpHXnH.png?Expires=1804208212&Signature=U7r434KBkr8cx0F2obqrKshF1M3zSk5BkfSZJexvcI5EEB4eCsvwwFC-FAjuxrU1PgWtoVYyiFxRGEcn7507sFVjNO0JUrHZPiEmTkWngAubhTTXrM9uNn4AlxfUXbrgRUOkZr7lggSQZulAalHew6uW7XC3Yn-R1XjCT-c-f5R6qdb4zPpdwix2G~X-gk-dBEFG53BjhQrUpwSNZmuK-2yhlN5DjOIEhYbCxVqGXQ~DdOzKw5YsUk1qBitHmbDn5~g~OECDl3hx4d8~6b3mw8PS0WKXAZ1OusBgbO0f95EyrqDhFsfqAX0BA22Snp3XQmPaGLFGnCPowpxRRC8Dlg__&Key-Pair-Id=K2HSFNDJXOU9YS",
    color: "#059669",
  },
  {
    id: "3vv_ductal",
    name: "3-Vessel View — Ductal Arch",
    abbr: "3VV-Ductal",
    description: "A slightly more cranial or posterior sweep from the 3VV-MPA view showing the ductal arch — the connection between the MPA and the descending aorta via the ductus arteriosus.",
    structures: ["MPA", "Ductus arteriosus (DA)", "Descending aorta (connection point)", "ASC AO", "SVC"],
    normalFindings: [
      "Ductus arteriosus connects MPA to descending aorta",
      "Flow in DA is right-to-left in fetus (normal)",
      "DA and aortic arch form a 'V' shape meeting at the descending aorta",
      "DA is a wide, short connection — not a narrow vessel",
    ],
    technique: "From 3VV-MPA, tilt slightly posteriorly or slide cranially to bring the ductal arch into view. The DA should be seen connecting the MPA to the descending aorta.",
    doppler: "Color Doppler to show R→L flow through DA. PW Doppler to confirm direction and velocity.",
    pitfalls: [
      "Ductal arch confused with aortic arch — DA is more anterior",
      "Absent DA — may indicate pulmonary hypertension or premature closure",
      "Reversed flow in DA (L→R) is abnormal postnatally",
    ],
    redFlags: ["Absent ductus arteriosus", "Reversed flow (L→R) in DA", "Premature ductal constriction (NSAID exposure)", "Turbulent DA flow"],
    diagramUrl: "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/FvMAScexHjsODxkx.png?Expires=1804208212&Signature=NDrsmlTmDuzawivnY5TUW2H4H05fu21NDXFj~jTXY8FjVJyyWf4KF8M3NGpe7Tdpeoqu4bttlUGT8l6Lr5bSbQBwUPLADHlOZjxKsw8i38eWys8-PIweq4EzbYRfjhQtAPwdZEAm2Y5r05rwcTJu78u~hLqCA2QO5Er06jS2lr2ywq1vy6GJWq--lEjaQvAbk72WzaG1Xv-TiGne2EQXxSIJSEdh6CAmHxF4FwsIt8nr96GHzFQw-iojhwvbHo1NIsjYQuonl16R8AsAQy8GKNB~MvUdDrWQP-lp3zud6EwsvQFWkDZOHm6UbQ-jgJMw5zmtK9Ci5V~n7jbSNCFM8w__&Key-Pair-Id=K2HSFNDJXOU9YS",
    anatomyUrl: "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/UUdQoTWyFmBpDMHz.png?Expires=1804208212&Signature=KU6HA9DPeb8BmTepnEcPlnQ3PzWowIYecBAsjPISz46R~KP1CYHNu-C9J0caPyfjqBdl3~q4uSrF1bVDLPmbwzhNwBPzrKEtRsHHk8kcPyGF5t6WTWCGDBOE~5ObaN5B2M9oXQGfkbUHWd3FI7t2IzCwILO-0qjeBJM9KcJ34FrG46faB3Aj6KUR8vqOeC7rNiDupCkwGRusz96DbxFZ3BPYqApdCSVZNaJGXy7LAT~TAyNGf4WFFuj3eOKCY5vdJX35YPeMUND5dinVvJ-I0ufViST2MeXcV5I1etamuVxEKzjuAx8tdm8N1Xpu4obS61SLkR8TY~Jw0rmI4mQuDg__&Key-Pair-Id=K2HSFNDJXOU9YS",
    color: "#d97706",
  },
  {
    id: "3vt",
    name: "3-Vessel Trachea View",
    abbr: "3VT",
    description: "A transverse view at the level of the superior mediastinum showing the relationship of the three vessels to the trachea. Critical for detecting vascular rings and abnormal vessel arrangements.",
    structures: ["MPA / ductal arch", "Transverse aortic arch", "SVC", "Trachea (echogenic ring)", "Descending aorta"],
    normalFindings: [
      "Aortic arch curves to the left of the trachea (left aortic arch)",
      "Three vessels form a 'V' shape pointing to the right",
      "Trachea is a small echogenic ring to the right of the aortic arch",
      "SVC is the rightmost vessel",
    ],
    technique: "Slide cranially from 3VV until the trachea becomes visible as an echogenic ring. The aortic arch should be seen curving to the left.",
    doppler: "Color Doppler to confirm flow direction in all vessels.",
    pitfalls: [
      "Right aortic arch: arch curves to the right of trachea — abnormal",
      "Double aortic arch: vessels on both sides of trachea",
      "Trachea not identified — may be at wrong level",
    ],
    redFlags: ["Right aortic arch (curves right of trachea)", "Double aortic arch", "Aberrant subclavian artery", "Vascular ring encircling trachea"],
    diagramUrl: "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/DUGoyfJyqouvzlXQ.png?Expires=1804208294&Signature=ZoGGkxCjpa7InlBFIFqs7WTGNZqlHvNaPRtBu2m5Z0LZMpMRagZ9Njp0aZiVgJWSC4-JtE4tnyPi4Bp74d8CHtCVM8YOtJzFUyY6nnpuJucB3E7iVKjBcr2eFqHXWBwKOR8fnpyq-Q0vlmipKDEUnGw~mAPUQiG94dGBFB9IwDhYJtb~AKPcHhkuRQdnRmwLUfh93wPx-gbbDp~oxfaeXU41Y2a8tY77nHRMMoTubQi1n4PJ5CdNBN26cm00EALeU74mlX64X48JMcS8auoAjScYYmoebnbM9qCB4f5hRJ2GznCr~MX~iZRUWrZmxC-7XqAL1-IPXFrqho162zFyXQ__&Key-Pair-Id=K2HSFNDJXOU9YS",
    anatomyUrl: "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/quAIjuxeerREFjcJ.png?Expires=1804208294&Signature=Ji-2jcf1lUA~LtkQyzOYU1A9BQUs36jsIvuXWadRosUsXDJbSE4ZpfjIlG9pcnxMauoq4GD-ECe4tCh4Og8D6jhfX9PNnSAN5R3xeLMrYx6jQU0rCfEv9rb2ZEaERZHQ9UaRmBHkT1LQh8QONyZz6tSAPTx4J9nTj9i-RW2kCVkG7ky66vav-fUBhx8Mm0-1M~KqYfIhbNEp6WoGSLcK1u2Rx77En56~-E8PMaGMHPdpE31vX6YsVsdRj9h10lO5MkmUrHbdU~NAteHQNC9k4fM1lN8zp4nP6I1H8-jcyrqVKzwCz3QFaYFuy6EwANR5wKEpvNp3EYOVIPMSZ7iDiw__&Key-Pair-Id=K2HSFNDJXOU9YS",
    color: "#be185d",
  },
  {
    id: "bicaval",
    name: "Bicaval View",
    abbr: "Bicaval",
    description: "A sagittal or oblique view showing both the superior vena cava (SVC) and inferior vena cava (IVC) entering the right atrium. Critical for assessing the foramen ovale, atrial septum, and caval connections.",
    structures: ["Right atrium (RA)", "Superior vena cava (SVC)", "Inferior vena cava (IVC)", "Foramen ovale flap", "Interatrial septum", "Left atrium (posterior)"],
    normalFindings: [
      "SVC enters RA superiorly, IVC enters inferiorly",
      "Foramen ovale flap visible in RA, bowing toward LA",
      "Eustachian valve at IVC-RA junction (normal variant)",
      "Interatrial septum intact except at foramen ovale",
    ],
    technique: "From 4CV, rotate the transducer to a more sagittal plane (marker toward fetal head) and angle toward the right side of the fetus until both SVC and IVC are visible entering the RA.",
    doppler: "Color Doppler across foramen ovale to confirm R→L shunting. PW at SVC and IVC.",
    pitfalls: [
      "Foramen ovale flap mistaken for ASD — flap should bow toward LA",
      "Eustachian valve mistaken for mass",
      "TAPVR: pulmonary veins not entering LA — check with color Doppler",
    ],
    redFlags: ["Foramen ovale flap bowing toward RA (elevated LA pressure)", "Absent foramen ovale", "TAPVR (pulmonary veins not entering LA)", "Dilated coronary sinus (PAPVR, persistent LSVC)"],
    diagramUrl: "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/eDbNWBoyjKSuzVxA.png?Expires=1804208294&Signature=gm1o~ElPGO3b8VGbNLW4rg5fDjwzB6fVTbOyW9DlwHKrlNaMfi7IldTTl59ZnsE0J~5RNSXhRO0Imug1h~bTTmlgkthFIQlnV1BxC58pUZzNoeUSG~uEUPgfD5mj8ztCTWpuptnSYY1-iCtURvPbox7RTxW0M81uHtW45fJNiCKKbtYygaN9JOardaenx6TnR5D8TzsiYAfoL4SRue79UY5yxH89QBRwDbnORr0dncPdMjKVWQzp6O5dvvMwY01TbMArGq7vbmq~Ih64ieLie6A0hTv1N2zlq1bHjT5~fQ8fw9RfnGwcvzf-wMVIrRCviNhS1HYb8j6uZGIF415M4Q__&Key-Pair-Id=K2HSFNDJXOU9YS",
    anatomyUrl: "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/zjscSYCkFsFNQEuc.png?Expires=1804208294&Signature=C3eGoToPOQ62P1x2EKd-nCWsw7fdWBisHGaJYC64sfqClWNiyJzzjfhiv0nTVrIIYmzpcPikI5o5H47lSv3rv7WEB2PHDj7faWdzS45xx6yXVE8CE25GENrTgDzOIQD-0qTxTSN39F5VMSx5VNcvhTf2kNrQY4eaji7jayQh~grkm085Qu4niJM6bn0DKEFV8Fdi0cCcq5SZ18V7C~QO-AQRD0B6JU-6ZK9QPT~Ug~5nQwS-rQrcfnh-5C0qRvC7zRrJ6oss1QlM1hMa--ce3aUY6hCtDS5vNiGIu0KcVYA8Dwk0wxJOTMULC6AqschnqIYQeG40Njhpj7M8Jl5tlA__&Key-Pair-Id=K2HSFNDJXOU9YS",
    color: "#1d4ed8",
  },
];

// ---- TTE VIEW CARD ----
function TTEViewCard({ view, isSelected, onClick }: { view: typeof tteViews[0]; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg border transition-all hover:shadow-sm"
      style={{
        borderColor: isSelected ? view.color : "#e5e7eb",
        background: isSelected ? view.color + "12" : "white",
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold text-xs" style={{ color: view.color, fontFamily: "Merriweather, serif" }}>{view.abbr}</div>
          <div className="text-xs text-gray-600 mt-0.5">{view.name}</div>
        </div>
        <div className="text-[10px] text-gray-400 font-mono">{view.probeAngle}</div>
      </div>
    </button>
  );
}

// ---- FETAL VIEW CARD ----
function FetalViewCard({ view, isSelected, onClick }: { view: typeof fetalViews[0]; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg border transition-all hover:shadow-sm"
      style={{
        borderColor: isSelected ? view.color : "#e5e7eb",
        background: isSelected ? view.color + "12" : "white",
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold text-xs" style={{ color: view.color, fontFamily: "Merriweather, serif" }}>{view.abbr}</div>
          <div className="text-xs text-gray-600 mt-0.5 leading-tight">{view.name}</div>
        </div>
        <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
      </div>
    </button>
  );
}

// ---- MAIN COMPONENT ----
export default function ScanCoach() {
  const [activeTab, setActiveTab] = useState<"tte" | "fetal">("tte");
  const [selectedTTE, setSelectedTTE] = useState(tteViews[0]);
  const [selectedFetal, setSelectedFetal] = useState(fetalViews[0]);
  const [fetalImageMode, setFetalImageMode] = useState<"diagram" | "anatomy">("diagram");

  return (
    <Layout>
      <div className="container py-6">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-800 mb-1" style={{ fontFamily: "Merriweather, serif" }}>
            Scan Coach
          </h1>
          <p className="text-sm text-gray-500">
            View-by-view probe guidance, anatomy references, Doppler tips, and pitfalls for TTE and Fetal Echo.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setActiveTab("tte")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: activeTab === "tte" ? "#189aa1" : "white",
              color: activeTab === "tte" ? "white" : "#189aa1",
              border: "2px solid #189aa1",
            }}
          >
            <Scan className="w-4 h-4" />
            Adult TTE
          </button>
          <button
            onClick={() => setActiveTab("fetal")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: activeTab === "fetal" ? "#189aa1" : "white",
              color: activeTab === "fetal" ? "white" : "#189aa1",
              border: "2px solid #189aa1",
            }}
          >
            <Heart className="w-4 h-4" />
            Fetal Echo
          </button>
        </div>

        {/* ---- TTE TAB ---- */}
        {activeTab === "tte" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* View List */}
            <div className="lg:col-span-1 space-y-2">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>
                    TTE Views
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">{tteViews.length} standard views</p>
                </div>
                <div className="p-3 space-y-2">
                  {tteViews.map(v => (
                    <TTEViewCard key={v.id} view={v} isSelected={selectedTTE.id === v.id} onClick={() => setSelectedTTE(v)} />
                  ))}
                </div>
              </div>
            </div>

            {/* TTE Detail Panel */}
            <div className="lg:col-span-3 space-y-4">
              {/* Header */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b" style={{ borderColor: selectedTTE.color + "30", background: selectedTTE.color + "08" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                      style={{ background: selectedTTE.color }}>
                      {selectedTTE.abbr.substring(0, 3)}
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>{selectedTTE.name}</h2>
                      <p className="text-xs text-gray-500">{selectedTTE.probePosition}</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Probe Info */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Crosshair className="w-4 h-4" style={{ color: selectedTTE.color }} />
                      <span className="text-sm font-semibold text-gray-700">Probe Orientation</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">{selectedTTE.probeOrientation}</div>
                  </div>
                  {/* Doppler */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Scan className="w-4 h-4" style={{ color: selectedTTE.color }} />
                      <span className="text-sm font-semibold text-gray-700">Doppler</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">{selectedTTE.doppler}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Structures */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="w-4 h-4" style={{ color: selectedTTE.color }} />
                    <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>Structures to Identify</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {selectedTTE.structures.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: selectedTTE.color }}></span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Measurements */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4" style={{ color: selectedTTE.color }} />
                    <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>Key Measurements</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTTE.measurements.map((m, i) => (
                      <span key={i} className="px-2 py-1 rounded text-xs font-mono text-white"
                        style={{ background: selectedTTE.color }}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tips & Pitfalls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <h3 className="font-bold text-sm text-gray-700 mb-3" style={{ fontFamily: "Merriweather, serif" }}>Scanning Tips</h3>
                  <ul className="space-y-2">
                    {selectedTTE.tips.map((tip, i) => (
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
                    {selectedTTE.pitfalls.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---- FETAL ECHO TAB ---- */}
        {activeTab === "fetal" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* View List */}
            <div className="lg:col-span-1 space-y-2">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>
                    Fetal Echo Views
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Based on AAU / iHeartEcho curriculum</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 italic">Lara Williams, ACS, RDCS, FASE</p>
                </div>
                <div className="p-3 space-y-2">
                  {fetalViews.map(v => (
                    <FetalViewCard key={v.id} view={v} isSelected={selectedFetal.id === v.id} onClick={() => setSelectedFetal(v)} />
                  ))}
                </div>
              </div>
            </div>

            {/* Fetal Detail Panel */}
            <div className="lg:col-span-3 space-y-4">
              {/* Header */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b" style={{ borderColor: selectedFetal.color + "30", background: selectedFetal.color + "08" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: selectedFetal.color }}>
                        {selectedFetal.abbr.substring(0, 4)}
                      </div>
                      <div>
                        <h2 className="font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>{selectedFetal.name}</h2>
                        <p className="text-xs text-gray-500">Fetal Echocardiography View Guide</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedFetal.description}</p>
                </div>
              </div>

              {/* Diagrams */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>View Diagrams</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setFetalImageMode("diagram")}
                      className="px-3 py-1 rounded text-xs font-semibold transition-all"
                      style={{
                        background: fetalImageMode === "diagram" ? selectedFetal.color : "#f3f4f6",
                        color: fetalImageMode === "diagram" ? "white" : "#6b7280",
                      }}
                    >
                      Anatomy Diagram
                    </button>
                    <button
                      onClick={() => setFetalImageMode("anatomy")}
                      className="px-3 py-1 rounded text-xs font-semibold transition-all"
                      style={{
                        background: fetalImageMode === "anatomy" ? selectedFetal.color : "#f3f4f6",
                        color: fetalImageMode === "anatomy" ? "white" : "#6b7280",
                      }}
                    >
                      Echo Image
                    </button>
                  </div>
                </div>
                <div className="p-4 flex justify-center bg-gray-50">
                  <img
                    key={fetalImageMode === "diagram" ? selectedFetal.diagramUrl : selectedFetal.anatomyUrl}
                    src={fetalImageMode === "diagram" ? selectedFetal.diagramUrl : selectedFetal.anatomyUrl}
                    alt={`${selectedFetal.name} ${fetalImageMode}`}
                    className="max-h-72 object-contain rounded-lg"
                    style={{ background: "#f9fafb" }}
                  />
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

              {/* Technique + Doppler */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <h3 className="font-bold text-sm text-gray-700 mb-2" style={{ fontFamily: "Merriweather, serif" }}>Scanning Technique</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{selectedFetal.technique}</p>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <h4 className="font-semibold text-xs text-gray-500 mb-1 uppercase tracking-wide">Doppler</h4>
                    <p className="text-sm text-gray-600">{selectedFetal.doppler}</p>
                  </div>
                </div>

                {/* Red Flags */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>Red Flags / Abnormal Findings</h3>
                  </div>
                  <ul className="space-y-1.5 mb-3">
                    {selectedFetal.redFlags.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                        <span className="text-red-500 font-bold mt-0.5 flex-shrink-0">!</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-gray-100 pt-3">
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
              </div>

              {/* Copyright */}
              <div className="text-xs text-gray-400 text-center py-2">
                View diagrams © All About Ultrasound, Inc. / iHeartEcho — Lara Williams, ACS, RDCS, FASE. Educational use only.
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
