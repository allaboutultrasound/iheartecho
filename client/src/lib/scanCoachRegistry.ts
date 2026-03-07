/**
 * scanCoachRegistry.ts
 * Static registry of all ScanCoach modules and their views.
 * Used by the WYSIWYG editor to enumerate views and by the override hook
 * to know which fields are editable per module.
 */

export type ScanCoachModule = "tte" | "tee" | "ice" | "uea" | "strain" | "hocm";

export interface ScanCoachViewMeta {
  id: string;
  name: string;
  group?: string;
}

export interface ScanCoachModuleMeta {
  key: ScanCoachModule;
  label: string;
  path: string;
  views: ScanCoachViewMeta[];
}

export const SCANCOACH_MODULES: ScanCoachModuleMeta[] = [
  {
    key: "tte",
    label: "Adult TTE ScanCoach™",
    path: "/scan-coach",
    views: [
      { id: "plax",        name: "Parasternal Long Axis",                   group: "Parasternal" },
      { id: "psax_av",     name: "PSAX — Aortic Valve Level",               group: "Parasternal" },
      { id: "psax_mv",     name: "PSAX — Mitral Valve Level",               group: "Parasternal" },
      { id: "psax_pm",     name: "PSAX — Papillary Muscle Level",           group: "Parasternal" },
      { id: "a4c",         name: "Apical 4-Chamber",                        group: "Apical" },
      { id: "a5c",         name: "Apical 5-Chamber",                        group: "Apical" },
      { id: "a2c",         name: "Apical 2-Chamber",                        group: "Apical" },
      { id: "a3c",         name: "Apical 3-Chamber (APLAX)",                group: "Apical" },
      { id: "subcostal",   name: "Subcostal",                               group: "Other" },
      { id: "suprasternal",name: "Suprasternal",                            group: "Other" },
    ],
  },
  {
    key: "tee",
    label: "TEE ScanCoach™",
    path: "/tee-scan-coach",
    views: [
      { id: "me4c",         name: "ME 4-Chamber",                           group: "Mid-Esophageal" },
      { id: "me2c",         name: "ME 2-Chamber",                           group: "Mid-Esophageal" },
      { id: "melax",        name: "ME Long Axis (LAX)",                     group: "Mid-Esophageal" },
      { id: "meavsax",      name: "ME AV Short Axis",                       group: "Mid-Esophageal" },
      { id: "mebicaval",    name: "ME Bicaval",                             group: "Mid-Esophageal" },
      { id: "mervio",       name: "ME RV Inflow-Outflow",                   group: "Mid-Esophageal" },
      { id: "meaorta",      name: "ME Ascending Aorta SAX/LAX",             group: "Mid-Esophageal" },
      { id: "tgsax",        name: "TG Mid SAX",                             group: "Transgastric" },
      { id: "tg2c",         name: "TG 2-Chamber",                           group: "Transgastric" },
      { id: "tglax",        name: "TG Long Axis (LAX)",                     group: "Transgastric" },
      { id: "tgrvio",       name: "TG RV Inflow",                           group: "Transgastric" },
      { id: "ueaorticarch", name: "UE Aortic Arch",                         group: "Upper Esophageal" },
      { id: "uepv",         name: "UE Pulmonary Veins",                     group: "Upper Esophageal" },
    ],
  },
  {
    key: "ice",
    label: "ICE ScanCoach™",
    path: "/ice-scan-coach",
    views: [
      { id: "home",           name: "Home View",                            group: "Standard Views" },
      { id: "avview",         name: "Aortic Valve View",                    group: "Standard Views" },
      { id: "mvlhview",       name: "Mitral Valve / Left Heart View",       group: "Standard Views" },
      { id: "transseptal",    name: "Transseptal View",                     group: "Procedural" },
      { id: "laaview",        name: "Left Atrial Appendage View",           group: "Procedural" },
      { id: "pvview",         name: "Pulmonary Vein View",                  group: "Standard Views" },
      { id: "pericardialview",name: "Pericardial Monitoring View",          group: "Standard Views" },
    ],
  },
  {
    key: "uea",
    label: "UEA ScanCoach™",
    path: "/uea-scan-coach",
    views: [
      { id: "plax",     name: "Parasternal Long Axis (PLAX)",               group: "Standard Views" },
      { id: "psax_mv",  name: "PSAX — Mitral Valve Level",                  group: "Standard Views" },
      { id: "psax_pap", name: "PSAX — Mid-Papillary Level",                 group: "Standard Views" },
      { id: "a4c",      name: "Apical 4-Chamber (A4C)",                     group: "Standard Views" },
      { id: "a2c",      name: "Apical 2-Chamber (A2C)",                     group: "Standard Views" },
      { id: "a3c",      name: "Apical 3-Chamber / Long Axis (A3C)",         group: "Standard Views" },
      { id: "subcostal",name: "Subcostal 4-Chamber",                        group: "Standard Views" },
    ],
  },
  {
    key: "strain",
    label: "Strain ScanCoach™",
    path: "/strain-scan-coach",
    views: [
      { id: "plax",     name: "Parasternal Long Axis (PLAX)",               group: "Acquisition" },
      { id: "a4c",      name: "Apical 4-Chamber (A4C)",                     group: "Acquisition" },
      { id: "a2c",      name: "Apical 2-Chamber (A2C)",                     group: "Acquisition" },
      { id: "a3c",      name: "Apical 3-Chamber (APLAX)",                   group: "Acquisition" },
    ],
  },
  {
    key: "hocm",
    label: "HOCM ScanCoach™",
    path: "/hocm-scan-coach",
    views: [
      { id: "plax",          name: "Parasternal Long Axis (PLAX)",          group: "2D Assessment" },
      { id: "psax_mv",       name: "PSAX — Mitral Valve Level",             group: "2D Assessment" },
      { id: "psax_pap",      name: "PSAX — Papillary Muscle Level",         group: "2D Assessment" },
      { id: "a4c",           name: "Apical 4-Chamber (A4C)",                group: "2D Assessment" },
      { id: "a5c",           name: "Apical 5-Chamber (A5C) — LVOT CW",     group: "Doppler / LVOT" },
      { id: "a3c",           name: "Apical 3-Chamber (APLAX) — LVOT CW",   group: "Doppler / LVOT" },
      { id: "a2c",           name: "Apical 2-Chamber (A2C)",                group: "2D Assessment" },
      { id: "subcostal",     name: "Subcostal 4-Chamber",                   group: "2D Assessment" },
      { id: "valsalva_pos",  name: "Valsalva — Patient Positioning",        group: "Provocation" },
      { id: "cw_lvot",       name: "CW Doppler — LVOT Dagger Waveform",    group: "Doppler / LVOT" },
      { id: "pw_lvot",       name: "PW Doppler — LVOT Sample Site",        group: "Doppler / LVOT" },
      { id: "mr_jet",        name: "MR Jet — CW Doppler",                  group: "Doppler / LVOT" },
      { id: "sam_plax",      name: "SAM — PLAX M-Mode",                    group: "SAM Assessment" },
      { id: "sam_zoom",      name: "SAM — Zoomed PLAX",                    group: "SAM Assessment" },
    ],
  },
];

/** Lookup a module by key */
export function getModuleMeta(key: ScanCoachModule): ScanCoachModuleMeta | undefined {
  return SCANCOACH_MODULES.find((m) => m.key === key);
}

/** Lookup a view within a module */
export function getViewMeta(module: ScanCoachModule, viewId: string): ScanCoachViewMeta | undefined {
  return getModuleMeta(module)?.views.find((v) => v.id === viewId);
}

/** All editable image slots */
export const IMAGE_SLOTS = [
  { key: "echoImageUrl",       label: "Clinical Echo Image",      hint: "The echo image shown in the view reference panel" },
  { key: "anatomyImageUrl",    label: "Anatomy Reference Image",  hint: "Anatomy diagram or labelled schematic" },
  { key: "transducerImageUrl", label: "Transducer Position Image",hint: "Probe/transducer positioning photograph or diagram" },
] as const;

export type ImageSlotKey = typeof IMAGE_SLOTS[number]["key"];

/** All editable text fields */
export const TEXT_FIELDS = [
  { key: "description",      label: "Description",       multiline: true,  isArray: false },
  { key: "howToGet",         label: "How To Get",        multiline: true,  isArray: true  },
  { key: "tips",             label: "Tips",              multiline: false, isArray: true  },
  { key: "pitfalls",         label: "Pitfalls",          multiline: false, isArray: true  },
  { key: "structures",       label: "Structures",        multiline: false, isArray: true  },
  { key: "measurements",     label: "Key Measurements",  multiline: false, isArray: true  },
  { key: "criticalFindings", label: "Critical Findings", multiline: false, isArray: true  },
] as const;

export type TextFieldKey = typeof TEXT_FIELDS[number]["key"];
