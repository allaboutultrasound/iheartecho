/**
 * generate-case-questions.mjs
 * 
 * Finds all approved cases with fewer than 2 MCQ questions and generates
 * 2 clinically relevant questions per case using the AI API.
 * 
 * Usage: node scripts/generate-case-questions.mjs
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const DB_URL = process.env.DATABASE_URL;
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!DB_URL || !FORGE_API_URL || !FORGE_API_KEY) {
  console.error('Missing required environment variables: DATABASE_URL, BUILT_IN_FORGE_API_URL, BUILT_IN_FORGE_API_KEY');
  process.exit(1);
}

// Parse MySQL connection URL
function parseDbUrl(url) {
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:\/]+):?(\d+)?\/([^?]+)/);
  if (!match) throw new Error('Invalid DATABASE_URL format');
  return {
    host: match[3],
    port: parseInt(match[4] || '3306'),
    user: match[1],
    password: match[2],
    database: match[5].split('?')[0],
    ssl: { rejectUnauthorized: false },
  };
}

async function callAI(prompt) {
  const response = await fetch(`${FORGE_API_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1200,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function buildPrompt(caseRow) {
  const neededCount = 2 - (caseRow.question_count || 0);
  return `You are an expert echocardiography educator. Generate exactly ${neededCount} multiple-choice question(s) for the following clinical echo case. Each question must be clinically relevant, educational, and directly related to the case findings.

CASE DETAILS:
Title: ${caseRow.title}
Modality: ${caseRow.modality}
Difficulty: ${caseRow.difficulty}
Summary: ${caseRow.summary || ''}
Diagnosis: ${caseRow.diagnosis || ''}
Clinical History: ${caseRow.clinicalHistory || ''}
Teaching Points: ${caseRow.teachingPoints || ''}

Return ONLY a valid JSON array (no markdown, no explanation) with exactly ${neededCount} object(s) in this format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Brief explanation of why the correct answer is correct and why others are wrong."
  }
]

Rules:
- correctAnswer is the 0-based index of the correct option
- Always provide exactly 4 options
- Questions must test clinically meaningful knowledge about this specific case
- Use United States English spelling
- Keep questions concise but clinically precise
- Explanation should be 2-4 sentences`;
}

async function generateQuestionsForCase(caseRow) {
  const prompt = buildPrompt(caseRow);
  const raw = await callAI(prompt);
  
  // Extract JSON from response
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error(`No JSON array found in AI response: ${raw.substring(0, 200)}`);
  }
  
  const questions = JSON.parse(jsonMatch[0]);
  return questions;
}

async function main() {
  console.log('Connecting to database...');
  const conn = await mysql.createConnection(parseDbUrl(DB_URL));
  
  try {
    // Get all approved cases with fewer than 2 questions
    const [cases] = await conn.execute(`
      SELECT 
        c.id,
        c.title,
        c.summary,
        c.diagnosis,
        c.modality,
        c.difficulty,
        c.clinicalHistory,
        c.teachingPoints,
        COUNT(q.id) as question_count
      FROM echoLibraryCases c
      LEFT JOIN echoLibraryCaseQuestions q ON q.caseId = c.id
      WHERE c.status = 'approved'
      GROUP BY c.id
      HAVING COUNT(q.id) < 2
      ORDER BY c.id
    `);
    
    console.log(`Found ${cases.length} cases needing questions.`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < cases.length; i++) {
      const caseRow = cases[i];
      console.log(`[${i + 1}/${cases.length}] Processing case ${caseRow.id}: ${caseRow.title.substring(0, 60)}...`);
      
      try {
        const questions = await generateQuestionsForCase(caseRow);
        
        // Get the current max sortOrder for this case
        const [existing] = await conn.execute(
          'SELECT MAX(sortOrder) as maxSort FROM echoLibraryCaseQuestions WHERE caseId = ?',
          [caseRow.id]
        );
        let nextSort = (existing[0]?.maxSort ?? -1) + 1;
        
        // Insert each generated question
        for (const q of questions) {
          await conn.execute(
            `INSERT INTO echoLibraryCaseQuestions 
              (caseId, question, options, correctAnswer, explanation, sortOrder)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              caseRow.id,
              q.question,
              JSON.stringify(q.options),
              q.correctAnswer,
              q.explanation || '',
              nextSort++,
            ]
          );
        }
        
        console.log(`  ✓ Inserted ${questions.length} question(s)`);
        successCount++;
        
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 300));
        
      } catch (err) {
        console.error(`  ✗ Error for case ${caseRow.id}: ${err.message}`);
        errorCount++;
        // Continue with next case
      }
    }
    
    console.log(`\nDone! Success: ${successCount}, Errors: ${errorCount}`);
    
  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
