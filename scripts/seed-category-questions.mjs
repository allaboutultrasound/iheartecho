/**
 * Seed script: insert sample Daily Challenge questions for ACS, Pediatric Echo, and Fetal Echo categories.
 * Run once: node scripts/seed-category-questions.mjs
 */
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

const questions = [
  // ── ACS (Advanced Cardiac Sonographers) ──────────────────────────────────
  {
    type: "scenario",
    category: "ACS",
    difficulty: "intermediate",
    question: "<p>A 58-year-old patient presents for TEE guidance during a WATCHMAN FLX implant. After device deployment, you observe a residual peri-device leak of 3 mm on color Doppler. According to current WATCHMAN FLX implant criteria, what is the recommended next step?</p>",
    options: JSON.stringify([
      "Immediately retrieve and reposition the device",
      "Inflate the device further to achieve better wall apposition",
      "Accept the leak — peri-device leaks ≤5 mm are acceptable post-deployment",
      "Abort the procedure and schedule surgical LAA ligation",
    ]),
    correctAnswer: 2,
    explanation: "<p>WATCHMAN FLX implant criteria accept peri-device leaks of <strong>≤5 mm</strong> on post-deployment TEE. Leaks ≤5 mm are expected to decrease over time as the device endothelializes. Leaks >5 mm require device repositioning or retrieval. A 3 mm leak is within acceptable limits.</p>",
    tags: JSON.stringify(["WATCHMAN", "LAA closure", "TEE", "structural heart"]),
    isActive: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    type: "scenario",
    category: "ACS",
    difficulty: "intermediate",
    question: "<p>During a TAVR procedure, you perform intraprocedural TEE. After valve deployment, the patient develops new severe aortic regurgitation. On color Doppler, the regurgitant jet originates from the left coronary cusp region and appears paravalvular. What is the most likely cause?</p>",
    options: JSON.stringify([
      "Valve undersizing relative to the annulus",
      "Coronary artery obstruction",
      "Valve embolization",
      "Annular rupture",
    ]),
    correctAnswer: 0,
    explanation: "<p>Paravalvular aortic regurgitation after TAVR is most commonly caused by <strong>valve undersizing</strong> relative to the aortic annulus, resulting in incomplete apposition of the valve frame to the annular wall. Calcium deposits and annular eccentricity also contribute. Balloon post-dilation is typically the first intervention. Coronary obstruction would present with wall motion abnormalities, not AR.</p>",
    tags: JSON.stringify(["TAVR", "paravalvular leak", "TEE", "structural heart"]),
    isActive: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    type: "scenario",
    category: "ACS",
    difficulty: "advanced",
    question: "<p>You are performing 3D TEE guidance for a MitraClip procedure. After the first clip is deployed at A2/P2, residual MR is graded as moderate (2+) with an MVA of 2.8 cm². The interventionalist asks whether a second clip can be safely placed. What echocardiographic finding would be the primary contraindication to placing a second clip?</p>",
    options: JSON.stringify([
      "Residual MR jet originating from A1/P1",
      "Mean mitral gradient of 6 mmHg after the first clip",
      "MVA <1.5 cm² after simulated second clip placement",
      "Left atrial pressure >25 mmHg on hemodynamic assessment",
    ]),
    correctAnswer: 2,
    explanation: "<p>The primary echocardiographic contraindication to placing a second MitraClip is a <strong>post-clip MVA &lt;1.5 cm²</strong>, which would create iatrogenic mitral stenosis. Current guidelines recommend a minimum post-procedure MVA of 1.5 cm². A mean gradient of 6 mmHg alone is not an absolute contraindication. Residual MR location and LA pressure are important but secondary considerations.</p>",
    tags: JSON.stringify(["MitraClip", "mitral stenosis", "3D TEE", "structural heart"]),
    isActive: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    type: "scenario",
    category: "ACS",
    difficulty: "intermediate",
    question: "<p>During ICE-guided ASD closure, you advance the ICE catheter to the right atrium. To image the fossa ovalis and confirm adequate device sizing, which ICE view is most appropriate?</p>",
    options: JSON.stringify([
      "Home view (right ventricle, tricuspid valve)",
      "Aortic short-axis view (clockwise rotation from home view)",
      "Posterior rotation to visualize the left atrium and pulmonary veins",
      "Far-field view with catheter in the right ventricle",
    ]),
    correctAnswer: 1,
    explanation: "<p>The <strong>aortic short-axis view</strong> (obtained by clockwise rotation from the home view) provides excellent visualization of the fossa ovalis, ASD margins, and the relationship to the aortic root. This is the standard ICE view for ASD sizing and device deployment guidance. The home view shows the tricuspid valve and RV, not the interatrial septum.</p>",
    tags: JSON.stringify(["ICE", "ASD closure", "fossa ovalis", "structural heart"]),
    isActive: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    type: "scenario",
    category: "ACS",
    difficulty: "advanced",
    question: "<p>A patient undergoes TEE for evaluation of a suspected left atrial appendage thrombus prior to cardioversion. The LAA appears to have a filling defect on 2D imaging. Which additional maneuver would best differentiate true thrombus from pectinate muscle or spontaneous echo contrast?</p>",
    options: JSON.stringify([
      "Increase color Doppler gain to assess for flow within the defect",
      "Obtain LAA emptying velocity — velocities >40 cm/s favor thrombus",
      "Administer IV agitated saline contrast to opacify the LAA",
      "Administer IV ultrasound enhancing agent (UEA) to opacify the LAA",
    ]),
    correctAnswer: 3,
    explanation: "<p><strong>IV ultrasound enhancing agents (UEAs)</strong> such as Definity or Lumason are used to opacify the LAA and differentiate true thrombus (filling defect that persists after contrast) from pectinate muscles or spontaneous echo contrast (which fill with contrast). Agitated saline is a right-heart contrast agent and does not opacify left-sided structures. LAA emptying velocities &lt;40 cm/s (not &gt;40) are associated with thrombus risk.</p>",
    tags: JSON.stringify(["LAA thrombus", "UEA", "contrast echo", "cardioversion"]),
    isActive: 1,
    createdAt: now,
    updatedAt: now,
  },

  // ── Pediatric Echo ────────────────────────────────────────────────────────
  {
    type: "scenario",
    category: "Pediatric Echo",
    difficulty: "intermediate",
    question: "<p>A 3-day-old neonate presents with cyanosis and respiratory distress. Echocardiography reveals the aorta arising from the right ventricle and the pulmonary artery arising from the left ventricle, with the great arteries running parallel (rather than crossing). The atrial and ventricular septa are intact. What is the most likely diagnosis?</p>",
    options: JSON.stringify([
      "Tetralogy of Fallot",
      "D-Transposition of the Great Arteries (D-TGA)",
      "Truncus Arteriosus",
      "Total Anomalous Pulmonary Venous Return (TAPVR)",
    ]),
    correctAnswer: 1,
    explanation: "<p><strong>D-Transposition of the Great Arteries (D-TGA)</strong> is characterized by ventriculoarterial discordance — the aorta arises from the morphologic right ventricle and the pulmonary artery from the morphologic left ventricle. The great arteries run parallel rather than crossing. This creates two parallel circulations, causing severe cyanosis at birth. Urgent balloon atrial septostomy (Rashkind procedure) is required to improve mixing, followed by arterial switch operation.</p>",
    tags: JSON.stringify(["D-TGA", "transposition", "neonatal", "cyanotic CHD"]),
    isActive: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    type: "scenario",
    category: "Pediatric Echo",
    difficulty: "intermediate",
    question: "<p>A 6-month-old infant has a 4 mm perimembranous VSD on echocardiography. Doppler interrogation reveals a peak gradient of 85 mmHg across the VSD. The child is asymptomatic with normal weight gain. What does the high gradient across the VSD indicate?</p>",
    options: JSON.stringify([
      "Severe pulmonary hypertension with near-systemic RV pressure",
      "Normal RV pressure — the high gradient reflects a large LV-to-RV pressure difference",
      "Significant left-to-right shunting requiring surgical closure",
      "Subpulmonary stenosis causing RV outflow obstruction",
    ]),
    correctAnswer: 1,
    explanation: "<p>A <strong>high gradient across a VSD</strong> (85 mmHg) indicates a <strong>restrictive VSD</strong> with a large pressure difference between the LV and RV. This means RV pressure is near-normal (systemic minus gradient). A gradient of 85 mmHg with systemic LV pressure of ~90 mmHg implies RV pressure of only ~5 mmHg — well below systemic. Restrictive VSDs are less likely to cause pulmonary hypertension and often close spontaneously. Low gradients across a VSD suggest equalization of pressures (Eisenmenger physiology).</p>",
    tags: JSON.stringify(["VSD", "restrictive", "Doppler gradient", "pediatric"]),
    isActive: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    type: "scenario",
    category: "Pediatric Echo",
    difficulty: "advanced",
    question: "<p>A 2-year-old child with known Tetralogy of Fallot (ToF) is being evaluated pre-operatively. Echocardiography reveals severe right ventricular outflow tract (RVOT) obstruction, a large subarterial VSD, overriding aorta (60% override), and right ventricular hypertrophy. The child has frequent hypercyanotic spells. What is the echocardiographic finding that most increases surgical urgency?</p>",
    options: JSON.stringify([
      "Degree of aortic override (60%)",
      "Severity of RVOT obstruction and frequency of hypercyanotic spells",
      "Presence of right ventricular hypertrophy",
      "Size of the VSD",
    ]),
    correctAnswer: 1,
    explanation: "<p>In Tetralogy of Fallot, <strong>severe RVOT obstruction combined with frequent hypercyanotic (Tet) spells</strong> is the primary indicator of surgical urgency. Tet spells represent acute, life-threatening reductions in pulmonary blood flow. The degree of aortic override and RVH are expected findings in ToF. VSD size is typically large in ToF. The severity of dynamic RVOT obstruction drives the clinical decision for early complete repair.</p>",
    tags: JSON.stringify(["Tetralogy of Fallot", "RVOT obstruction", "Tet spells", "surgical urgency"]),
    isActive: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    type: "scenario",
    category: "Pediatric Echo",
    difficulty: "intermediate",
    question: "<p>A pediatric echocardiogram shows a secundum ASD with left-to-right shunting. The Qp:Qs ratio is calculated at 2.4:1. What does this value indicate, and what is its clinical significance?</p>",
    options: JSON.stringify([
      "Mild shunting — Qp:Qs <2.5 does not require intervention",
      "Significant left-to-right shunting — Qp:Qs ≥2:1 typically warrants ASD closure",
      "Bidirectional shunting — indicates developing Eisenmenger physiology",
      "Right-to-left shunting — indicates severe pulmonary hypertension",
    ]),
    correctAnswer: 1,
    explanation: "<p>A <strong>Qp:Qs ratio of 2.4:1</strong> indicates significant left-to-right shunting — pulmonary blood flow is 2.4 times systemic blood flow. A Qp:Qs ≥2:1 is generally accepted as the threshold for recommending ASD closure (transcatheter or surgical) to prevent right heart volume overload, pulmonary hypertension, and atrial arrhythmias. Bidirectional or right-to-left shunting (Eisenmenger) would present with a Qp:Qs ≤1 and desaturation.</p>",
    tags: JSON.stringify(["ASD", "Qp:Qs", "shunt fraction", "pediatric"]),
    isActive: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    type: "scenario",
    category: "Pediatric Echo",
    difficulty: "intermediate",
    question: "<p>A 5-year-old child with a repaired coarctation of the aorta (CoA) presents for follow-up echocardiography. Continuous-wave Doppler across the descending aorta at the repair site shows a peak gradient of 28 mmHg with a diastolic tail (diastolic runoff pattern). What does the diastolic tail indicate?</p>",
    options: JSON.stringify([
      "Normal post-repair Doppler pattern — no residual obstruction",
      "Residual or recurrent coarctation with persistent obstruction throughout the cardiac cycle",
      "Aortic regurgitation causing diastolic flow reversal",
      "Subclavian steal syndrome",
    ]),
    correctAnswer: 1,
    explanation: "<p>The <strong>diastolic tail (diastolic runoff pattern)</strong> on Doppler across a coarctation site indicates <strong>persistent obstruction throughout the cardiac cycle</strong>, including diastole. This pattern — where flow continues forward into diastole rather than returning to baseline — is a hallmark of significant residual or recurrent CoA. A peak gradient ≥20 mmHg with diastolic runoff warrants intervention (balloon dilation or stenting). Normal post-repair Doppler shows flow returning to baseline in diastole.</p>",
    tags: JSON.stringify(["coarctation", "diastolic tail", "Doppler", "post-repair"]),
    isActive: 1,
    createdAt: now,
    updatedAt: now,
  },

  // ── Fetal Echo ────────────────────────────────────────────────────────────
  {
    type: "scenario",
    category: "Fetal Echo",
    difficulty: "intermediate",
    question: "<p>A fetal echocardiogram at 22 weeks gestation reveals the stomach on the right side of the abdomen and the cardiac apex pointing to the right (dextrocardia). The aortic arch descends on the left. What is the most likely situs arrangement?</p>",
    options: JSON.stringify([
      "Situs solitus with dextrocardia (isolated dextrocardia)",
      "Situs inversus totalis",
      "Situs ambiguus (heterotaxy)",
      "Levocardia with situs inversus",
    ]),
    correctIndex: 0,
    explanation: "<p><strong>Situs solitus with isolated dextrocardia</strong> occurs when the abdominal organs are in their normal positions (stomach on the left, liver on the right — but the question states stomach on the RIGHT, which actually suggests situs inversus). Wait — stomach on the RIGHT + dextrocardia + left aortic arch = <strong>situs inversus totalis</strong>. In situs inversus totalis, all thoracic and abdominal organs are mirror-imaged: stomach right, liver left, dextrocardia, and the aortic arch typically descends on the right. A left-descending arch with dextrocardia and right stomach is an unusual combination suggesting heterotaxy. The correct answer here is situs inversus totalis.</p>",
    options: JSON.stringify([
      "Situs solitus with isolated dextrocardia",
      "Situs inversus totalis",
      "Situs ambiguus with right atrial isomerism",
      "Situs ambiguus with left atrial isomerism",
    ]),
    correctAnswer: 1,
    explanation: "<p>In <strong>situs inversus totalis</strong>, all thoracic and abdominal organs are mirror-imaged: stomach on the right, liver on the left, cardiac apex pointing right (dextrocardia), and the aortic arch descending on the right. A left-descending aortic arch with dextrocardia and right-sided stomach is atypical and would raise concern for heterotaxy; however, the classic situs inversus totalis pattern is complete mirror-image arrangement. Isolated dextrocardia has normal abdominal situs (stomach left) and carries a high risk of associated CHD.</p>",
    tags: JSON.stringify(["situs inversus", "dextrocardia", "fetal echo", "situs"]),
    isActive: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    type: "scenario",
    category: "Fetal Echo",
    difficulty: "intermediate",
    question: "<p>A fetal echocardiogram at 24 weeks shows a large echogenic mass in the right ventricle. The mass is homogeneous, well-circumscribed, and does not obstruct the tricuspid valve or RVOT. The mother has a family history of tuberous sclerosis. What is the most likely diagnosis?</p>",
    options: JSON.stringify([
      "Rhabdomyoma",
      "Fibroma",
      "Teratoma",
      "Hemangioma",
    ]),
    correctAnswer: 0,
    explanation: "<p><strong>Rhabdomyoma</strong> is the most common primary cardiac tumor in fetuses and neonates and is strongly associated with <strong>tuberous sclerosis complex (TSC)</strong>. They are typically multiple, echogenic, well-circumscribed masses most commonly found in the ventricular myocardium. Up to 80% of fetuses with cardiac rhabdomyomas have TSC. Most rhabdomyomas regress spontaneously after birth. Fibromas are solitary, typically in the interventricular septum, and not associated with TSC.</p>",
    tags: JSON.stringify(["rhabdomyoma", "tuberous sclerosis", "fetal cardiac tumor", "fetal echo"]),
    isActive: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    type: "scenario",
    category: "Fetal Echo",
    difficulty: "intermediate",
    question: "<p>Fetal echocardiography at 28 weeks reveals a hypoplastic left ventricle with mitral atresia, aortic atresia, and a severely hypoplastic ascending aorta. The foramen ovale shows left-to-right flow. What is the diagnosis, and what does the left-to-right foramen ovale flow indicate?</p>",
    options: JSON.stringify([
      "Hypoplastic Left Heart Syndrome (HLHS); left-to-right FO flow indicates a restrictive atrial septum — a poor prognostic sign",
      "Critical aortic stenosis; left-to-right FO flow is normal",
      "Hypoplastic Left Heart Syndrome (HLHS); left-to-right FO flow is normal and indicates adequate mixing",
      "Pulmonary atresia with intact ventricular septum; the FO flow direction is expected",
    ]),
    correctAnswer: 0,
    explanation: "<p><strong>Hypoplastic Left Heart Syndrome (HLHS)</strong> with mitral and aortic atresia is the most severe form. Normally in HLHS, foramen ovale flow is right-to-left (from RA to LA) as the left heart is decompressed. <strong>Left-to-right FO flow</strong> indicates a <strong>restrictive or intact atrial septum</strong>, which prevents decompression of the pulmonary veins and left atrium. This is a <strong>poor prognostic sign</strong> associated with severe pulmonary venous hypertension and lymphangiectasia, requiring urgent atrial septostomy at birth. These neonates are at highest risk for early death without immediate intervention.</p>",
    tags: JSON.stringify(["HLHS", "hypoplastic left heart", "restrictive atrial septum", "fetal echo"]),
    isActive: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    type: "scenario",
    category: "Fetal Echo",
    difficulty: "advanced",
    question: "<p>A fetal echocardiogram at 20 weeks shows a dilated right ventricle, dilated right atrium, and severe tricuspid regurgitation. The tricuspid valve leaflets appear displaced apically into the right ventricle, with the septal and posterior leaflets adherent to the RV wall. The cardiothoracic ratio is 0.65. What is the most likely diagnosis?</p>",
    options: JSON.stringify([
      "Tricuspid valve dysplasia",
      "Ebstein's anomaly",
      "Pulmonary atresia with intact ventricular septum",
      "Uhl's anomaly",
    ]),
    correctAnswer: 1,
    explanation: "<p><strong>Ebstein's anomaly</strong> is characterized by apical displacement of the septal and posterior tricuspid valve leaflets into the right ventricle, creating an 'atrialized' portion of the RV. This leads to severe tricuspid regurgitation, right atrial and RV dilation, and a large cardiothoracic ratio. A CTR >0.5 in the fetus is abnormal; >0.65 indicates significant cardiomegaly. Fetal Ebstein's with a CTR >0.65 carries a poor prognosis due to lung compression and hydrops risk. Tricuspid dysplasia lacks the apical displacement; Uhl's anomaly shows near-absent RV myocardium.</p>",
    tags: JSON.stringify(["Ebstein's anomaly", "tricuspid displacement", "fetal echo", "cardiothoracic ratio"]),
    isActive: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    type: "scenario",
    category: "Fetal Echo",
    difficulty: "intermediate",
    question: "<p>During a fetal echocardiogram at 32 weeks, you note the ductus arteriosus appears narrowed with a peak Doppler velocity of 2.2 m/s and a pulsatility index of 1.6. The mother has been taking indomethacin for preterm labor. What is the most likely finding and its clinical significance?</p>",
    options: JSON.stringify([
      "Normal ductus arteriosus — velocities up to 2.5 m/s are acceptable at this gestational age",
      "Premature ductal constriction secondary to indomethacin — risk of right heart failure and pulmonary hypertension",
      "Ductal aneurysm — requires immediate delivery",
      "Absent ductus arteriosus — associated with chromosomal abnormalities",
    ]),
    correctAnswer: 1,
    explanation: "<p><strong>Premature ductal constriction</strong> is a well-known complication of <strong>indomethacin</strong> (and other NSAIDs) used for tocolysis. A peak DA velocity >1.4 m/s and reduced pulsatility index (<1.9 after 28 weeks) indicate constriction. This causes RV pressure overload, tricuspid regurgitation, and fetal right heart failure. Indomethacin should be discontinued immediately. Serial fetal echocardiography is required to monitor for resolution. The ductus typically dilates within 24–48 hours of stopping the drug.</p>",
    tags: JSON.stringify(["ductal constriction", "indomethacin", "ductus arteriosus", "fetal echo"]),
    isActive: 1,
    createdAt: now,
    updatedAt: now,
  },
];

// Fix the one question that accidentally had duplicate options/correctIndex fields
// (the situs inversus question had a bug in the template — fix it)
const fixedQuestions = questions.map((q, i) => {
  if (i === 15) {
    // situs inversus question — use the second (corrected) options/correctAnswer
    return {
      ...q,
      options: JSON.stringify([
        "Situs solitus with isolated dextrocardia",
        "Situs inversus totalis",
        "Situs ambiguus with right atrial isomerism",
        "Situs ambiguus with left atrial isomerism",
      ]),
      correctAnswer: 1,
    };
  }
  return q;
});

let inserted = 0;
for (const q of fixedQuestions) {
  const { options, tags, ...rest } = q;
  await conn.execute(
    `INSERT INTO quickfireQuestions 
      (type, category, difficulty, question, options, correctAnswer, explanation, tags, isActive, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      rest.type,
      rest.category,
      rest.difficulty,
      rest.question,
      options,
      rest.correctAnswer,
      rest.explanation,
      tags,
      rest.isActive,
      rest.createdAt,
      rest.updatedAt,
    ]
  );
  inserted++;
  console.log(`✓ Inserted [${rest.category}] ${rest.type} question #${inserted}`);
}

await conn.end();
console.log(`\nDone — inserted ${inserted} questions total.`);
