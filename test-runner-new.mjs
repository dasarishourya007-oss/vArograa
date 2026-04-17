import fs from 'fs';

let code = fs.readFileSync('src/services/aiService.js', 'utf8');
code = code.replace(
    '"AIzaSyAjfWvUUESkXF54dIUMYGbvr7vZZxIQnHY"'
);

// Add logging to see the exact error from API
code = code.replace(
    'const data = await response.json();',
    'const data = await response.json(); console.log("RESPONDED API DATA:", JSON.stringify(data, null, 2));'
);

fs.writeFileSync('src/services/aiService.temp.js', code);

import('./src/services/aiService.temp.js').then(async (aiService) => {
    console.log("--- Testing getAIResponse with new key ---");
    const response = await aiService.getAIResponse('What is ibuprofen used for?');
    console.log("Returned Response:", response);
    fs.unlinkSync('src/services/aiService.temp.js');
}).catch(console.error);
