
// c:/Users/Sreenath/OneDrive/Desktop/v/poiuy/healthlink/scratch/test-nvidia.js
// This test is harder to run because it requires the backend server to be running.
// However, we can simulate the API call to NVIDIA directly if we have the key.

const NVIDIA_API_KEY = "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";
const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const MODEL = "meta/llama-3.1-70b-instruct";

async function testNvidiaDirect() {
    console.log(`Testing NVIDIA Direct... Model: ${MODEL}`);
    
    try {
        const response = await fetch(NVIDIA_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${NVIDIA_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: "user", content: "Hello! Are you working?" }],
                temperature: 0.7,
                max_tokens: 100
            })
        });

        console.log("Status:", response.status);
        const data = await response.json();
        
        if (response.ok) {
            console.log("SUCCESS! Reply:", data.choices[0].message.content);
        } else {
            console.error("FAILED! Error:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Connection Failed:", e.message);
    }
}

testNvidiaDirect();
