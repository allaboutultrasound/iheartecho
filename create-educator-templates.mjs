import { createConnection } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await createConnection(process.env.DATABASE_URL);

await conn.execute(`
  CREATE TABLE IF NOT EXISTS educatorTemplates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uploadedByUserId INT NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    ardmsCategory ENUM('Adult Echo','Pediatric Echo','Fetal Echo','General Ultrasound','Vascular Ultrasound','General') NOT NULL DEFAULT 'Adult Echo',
    contentType ENUM('presentation','quiz','flashcard_deck','case_study','protocol_guide','study_guide') NOT NULL DEFAULT 'presentation',
    fileUrl TEXT,
    fileKey TEXT,
    mimeType VARCHAR(100),
    slidesData LONGTEXT,
    contentData LONGTEXT,
    coverImageUrl TEXT,
    tags TEXT,
    estimatedMinutes INT,
    viewCount INT NOT NULL DEFAULT 0,
    isPublished TINYINT(1) NOT NULL DEFAULT 0,
    isViewOnly TINYINT(1) NOT NULL DEFAULT 1,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`);

console.log("✓ educatorTemplates table created");
await conn.end();
