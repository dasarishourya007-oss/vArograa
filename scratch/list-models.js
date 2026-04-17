
// c:/Users/Sreenath/OneDrive/Desktop/v/poiuy/healthlink/scratch/list-models.js
// Run with: node scratch/list-models.js

const GEMINI_API_KEY = 'AIzaSyDYSovKeJOuHeYTjIXF2zXESWHV6qahSJA';

async function listModels() {
    const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
    console.log(`Listing models... URL: ${URL.split('?')[0]}`);
    
    try {
        const response = await fetch(URL);
        console.log("Status:", response.status);
        
        const data = await response.json();
        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`));
        } else {
            console.log("No models found or error:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Failed:", e.message);
    }
}

listModels();
