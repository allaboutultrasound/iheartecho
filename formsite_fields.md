# FormSite Physician Peer Review - Field Mapping

## Exam Type Codes
- Adult TTE = AETTE
- Adult TEE = AETEE
- Adult STRESS = AE_STRESS
- Pediatric/Congenital TTE = PETTE
- Pediatric/Congenital TEE = PETEE
- FETAL = FE

## Field List (raw label → display name → exam types)

### Always shown (no prefix / universal)
- Date Review Completed
- Exam Identifier (LAS, FIR MRN)
- Exam DOS
- Exam Type
- Original Interpreting Physician
- Pericardial Effusion
- Patent Foramen Ovale
- OTHER FINDINGS (x3)
- Review Comments
- Over-Reading Physician Reviewer

### FE only
- FE_Situs → "Situs"
- FE_Cardiac Position → "Cardiac Position"
- FE_Left Heart → "Left Heart"
- FE_Right Heart → "Right Heart"
- FE_Aortic Valve → "Aortic Valve"
- FE_Mitral Valve → "Mitral Valve"
- FE_Tricuspid Valve → "Tricuspid Valve"
- FE_Pulmonic Valve → "Pulmonic Valve"
- FE_Fetal Biometry → "Fetal Biometry"
- FE_Fetal Position → "Fetal Position"
- FE_Fetal Heart Rate/Rhythm → "Fetal Heart Rate/Rhythm"

### AETTE + AETEE + PETTE + PETEE (all non-stress, non-fetal)
- AETTE_AETEE_PETTE_PETEE_EF% → "EF%"
- AETTE_AETEE_PETTE_PETEE_LV Chamber Size → "LV Chamber Size"
- AETTE_AETEE_PETTE_PETEE_LA Chamber Size → "LA Chamber Size"
- AETTE_AETEE_PETTE_PETEE_RV Chamber Size → "RV Chamber Size"
- AETTE_AETEE_PETTE_PETEE_RA Chamber Size → "RA Chamber Size"
- AETTE_AETEE_PETTE_PETEE_Aortic Stenosis → "Aortic Stenosis"
- AETTE_AETEE_PETTE_PETEE_Aortic Insufficiency → "Aortic Insufficiency"
- AETTE_AETEE_PETTE_PETEE_Mitral Stenosis → "Mitral Stenosis"
- AETTE_AETEE_PETTE_PETEE_Mitral Regurgitation → "Mitral Regurgitation"
- AETTE_AETEE_PETTE_PETEE_Tricuspid Stenosis → "Tricuspid Stenosis"
- AETTE_AETEE_PETTE_PETEE_Tricuspid Regurgitation → "Tricuspid Regurgitation"
- AETTE_AETEE_PETTE_PETEE_Pulmonic Stenosis → "Pulmonic Stenosis"
- AETTE_AETEE_PETTE_PETEE_Pulmonic Insufficiency → "Pulmonic Insufficiency"
- AETTE_AETEE_PETTE_PETEE_Peripheral Pulmonary Stenosis → "Peripheral Pulmonary Stenosis"
- AETTE_AETEE_PETTE_PETEE_RVSP mmHg → "RVSP mmHg"

### AETTE + AETEE only (adult non-stress)
- AETTE_AETEE_Regional Wall Motion Abnormalities → "Regional Wall Motion Abnormalities"

### Also need LV Wall Thickness (no prefix in form - shown for all non-fetal)
- LV Wall Thickness (no prefix — shown for AETTE, AETEE, PETTE, PETEE)

### PETTE + PETEE + FE
- PETTE_PETEE_FE_Pulmonary Veins → "Pulmonary Veins"
- PETTE_PETEE_FE_Coronary Anatomy → "Coronary Anatomy"
- PETTE_PETEE_FE_Aortic Arch → "Aortic Arch"
- PETTE_PETEE_FE_Great Vessels → "Great Vessels"
- PETTE_PETEE_FE_PDA/Ductal Arch → "PDA/Ductal Arch"
- PETTE_PETEE_FE_Conotruncal Anatomy → "Conotruncal Anatomy"

### FE + PETTE + PETEE (septal defects)
- FE_PETTE_PETEE_Ventricular Septal Defect → "Ventricular Septal Defect"
- FE_PETTE_PETEE_Atrial Septal Defect → "Atrial Septal Defect"

### AE_STRESS only
- AE_STRESS_Resting EF% → "Resting EF%"
- AE_STRESS_Post Stress EF% → "Post Stress EF%"
- AE_STRESS_RESTING - Regional Wall Motion Abnormalities → "RESTING - Regional Wall Motion Abnormalities"
- AE_STRESS_POST STRESS - Regional Wall Motion Abnormalities → "POST STRESS - Regional Wall Motion Abnormalities"
- AE_STRESS_Response to Stress → "Response to Stress"
- AE_STRESS_Aortic Stenosis → "Aortic Stenosis"
- AE_STRESS_Aortic Insufficiency → "Aortic Insufficiency"
- AE_STRESS_Mitral Stenosis → "Mitral Stenosis"
- AE_STRESS_Mitral Regurgitation → "Mitral Regurgitation"
- AE_STRESS_Tricuspid Stenosis → "Tricuspid Stenosis"
- AE_STRESS_Tricuspid Regurgitation → "Tricuspid Regurgitation"
- AE_STRESS_Pulmonic Stenosis → "Pulmonic Stenosis"
- AE_STRESS_Pulmonic Insufficiency → "Pulmonic Insufficiency"
- AE_STRESS_RVSP mmHg → "RVSP mmHg"

### Post-Stress Doppler Performed (shown for AETTE, AETEE, AE_STRESS)
- Post-Stress Doppler Performed (shown for stress-capable exams)
