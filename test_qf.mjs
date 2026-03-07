import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { readFileSync } from 'fs';

// Load env
const envContent = readFileSync('.env', 'utf8');
for (const line of envContent.split('\n')) {
  const [k, ...v] = line.split('=');
  if (k && v.length) process.env[k.trim()] = v.join('=').trim();
}

console.log('API URL:', process.env.BUILT_IN_FORGE_API_URL);
console.log('API KEY:', process.env.BUILT_IN_FORGE_API_KEY?.substring(0, 10) + '...');

const openai = createOpenAI({
  apiKey: process.env.BUILT_IN_FORGE_API_KEY,
  baseURL: `${process.env.BUILT_IN_FORGE_API_URL}/v1`,
});
const model = openai.chat('gpt-4o');

try {
  const { text } = await generateText({
    model,
    prompt: 'Generate 1 echocardiography MCQ question as JSON. Return ONLY: {"questions":[{"question":"...","options":["A","B","C","D"],"correctAnswer":0,"explanation":"...","tags":["echo"]}]}',
  });
  console.log('SUCCESS:', text.substring(0, 300));
} catch(e) {
  console.error('ERROR:', e.message);
  if (e.responseBody) console.error('RESPONSE BODY:', e.responseBody.substring(0, 1000));
  if (e.cause) console.error('CAUSE:', String(e.cause).substring(0, 500));
}
