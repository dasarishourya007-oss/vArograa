import fs from 'fs';
let code = fs.readFileSync('src/services/aiService.js', 'utf8');
code = code.replace(
    '"AIzaSyDYSovKeJOuHeYTjIXF2zXESWHV6qahSJA"'
);
code += '\nconsole.log("URL IS:", buildGeminiUrl());';
code += '\nconsole.log("Validation key check:", GEMINI_API_KEY === "YOUR_GEMINI_API_KEY");';
fs.writeFileSync('src/services/aiService.temp.js', code);
import('./src/services/aiService.temp.js').catch(console.error);
