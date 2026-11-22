const fs = require('fs');
let env = fs.readFileSync('.env', 'utf8');
if (!env.includes('OPENROUTER_API_KEY')) {
  env = env.replace(
    '# Google Gemini AI Integration',
    '# OpenRouter AI Integration\r\nOPENROUTER_API_KEY=\r\nOPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct\r\nOPENROUTER_BASE_URL=https://openrouter.ai/api/v1\r\n\r\n# Google Gemini AI Integration (Legacy Fallback)'
  );
  fs.writeFileSync('.env', env, 'utf8');
  console.log('Added OpenRouter config to .env');
} else {
  console.log('OpenRouter already in .env');
}
