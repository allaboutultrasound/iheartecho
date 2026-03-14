// Migrate educator category enums to add General Ultrasound and Vascular Ultrasound
import { createConnection } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await createConnection(process.env.DATABASE_URL);

const newCategoryEnum = "'Adult Echo','Pediatric Echo','Fetal Echo','ACS','POCUS','General Ultrasound','Vascular Ultrasound','General'";
const newArdmsEnum = "'Adult Echo','Pediatric Echo','Fetal Echo','General Ultrasound','Vascular Ultrasound','General'";

const alterStatements = [
  // educatorCourses.category
  `ALTER TABLE educatorCourses MODIFY COLUMN category ENUM(${newCategoryEnum}) DEFAULT 'General'`,
  // educatorCompetencies.category
  `ALTER TABLE educatorCompetencies MODIFY COLUMN category ENUM(${newCategoryEnum}) DEFAULT 'General'`,
  // educatorPresentations.category
  `ALTER TABLE educatorPresentations MODIFY COLUMN category ENUM(${newCategoryEnum}) DEFAULT 'General'`,
  // educatorTemplates.ardmsCategory
  `ALTER TABLE educatorTemplates MODIFY COLUMN ardmsCategory ENUM(${newArdmsEnum}) NOT NULL DEFAULT 'Adult Echo'`,
];

for (const sql of alterStatements) {
  try {
    await conn.execute(sql);
    console.log("✓", sql.substring(0, 80));
  } catch (e) {
    // If table doesn't exist yet, skip
    if (e.code === "ER_NO_SUCH_TABLE") {
      console.log("⚠ Table not found, skipping:", sql.substring(0, 60));
    } else {
      console.error("✗ Error:", e.message, "\n  SQL:", sql.substring(0, 80));
    }
  }
}

await conn.end();
console.log("Migration complete.");
