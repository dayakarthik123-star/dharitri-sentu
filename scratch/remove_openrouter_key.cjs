const fs = require('fs');

let env = fs.readFileSync('.env', 'utf8');
env = env.replace(/# OpenRouter AI Integration\r?\nOPENROUTER_API_KEY=.*\r?\nOPENROUTER_MODEL=.*\r?\nOPENROUTER_BASE_URL=.*\r?\n?/g, '');
fs.writeFileSync('.env', env, 'utf8');

let envEx = fs.readFileSync('.env.example', 'utf8');
envEx = envEx.replace(/# OpenRouter AI Integration\r?\nOPENROUTER_API_KEY=.*\r?\nOPENROUTER_MODEL=.*\r?\nOPENROUTER_BASE_URL=.*\r?\n?/g, '');
fs.writeFileSync('.env.example', envEx, 'utf8');

console.log('OpenRouter keys and lines completely removed from .env and .env.example');
