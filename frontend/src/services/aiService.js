// src/services/aiService.js

const rawGeminiKey = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();

const GEMINI_API_KEY =
    rawGeminiKey && !rawGeminiKey.includes("your_gemini_api_key_here")
        ? rawGeminiKey
        : null;

const GENAI_ENDPOINT =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const MISSING_API_KEY_MESSAGE =
    "vArogra Health AI requires VITE_GEMINI_API_KEY to be configured.";

const GEMINI_KEY_HINT =
    "The AI assistant is disabled until you provide a valid Gemini key via VITE_GEMINI_API_KEY.";

const CONNECT_ERROR_MESSAGE =
    "⚠️ AI system connection failed. Please try again or consult a doctor.";

const MEDICINE_SYSTEM_PROMPT = `
You are vArogra Health AI Assistant, a friendly medical helper inside the vArogra Health platform.

CAPABILITIES:
• Explain medicines and their general use
• Explain symptoms in simple language
• Suggest when users should consult a doctor
• Help interpret prescriptions
• Guide users toward hospital or doctor booking

SAFETY RULES:
1. Never give prescriptions or dangerous medical advice.
2. Always encourage consulting a licensed doctor.
3. Keep answers short and easy to understand.
4. If user reports emergency symptoms like chest pain, breathing difficulty, fainting, severe bleeding, or high fever → advise using the SOS button immediately.

Always end responses with:
"This is general information only. Please consult a doctor."
`;

const SYSTEM_INSTRUCTION = {
    parts: [{ text: MEDICINE_SYSTEM_PROMPT }],
};

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const buildGeminiUrl = () => {
    if (!GEMINI_API_KEY) throw new Error(MISSING_API_KEY_MESSAGE);
    return `${GENAI_ENDPOINT}?key=${encodeURIComponent(GEMINI_API_KEY)}`;
};

const handleAiError = (error, fallbackMessage) => {
    console.error("AI Service Error:", error);

    const message = error?.message || error;

    if (message === MISSING_API_KEY_MESSAGE) {
        throw new Error(GEMINI_KEY_HINT);
    }

    throw new Error(fallbackMessage);
};

const sendGeminiRequest = async (payload) => {
    const requestBody = {
        ...payload,
        systemInstruction: SYSTEM_INSTRUCTION,
    };

    let retryCount = 0;
    const maxRetries = 3;
    let waitTime = 2000;

    while (retryCount <= maxRetries) {
        const response = await fetch(buildGeminiUrl(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (response.status === 429 && retryCount < maxRetries) {
            console.warn("Rate limited. Retrying...");
            await delay(waitTime);
            retryCount++;
            waitTime *= 2;
            continue;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Gemini API Error:", response.status, errorData);
            throw new Error(`Gemini API error ${response.status}`);
        }

        const data = await response.json();

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) throw new Error("Empty response from Gemini");

        return text.trim();
    }

    throw new Error("Exceeded retry attempts");
};

/* ---------------- CHAT AI ---------------- */

export const getAIResponse = async (messages, role = 'patient') => {
    try {
        let contents = [];
        if (Array.isArray(messages)) {
            contents = messages.map(msg => ({
                role: msg.role === 'model' ? 'model' : 'user',
                parts: [{ text: msg.text }]
            }));
        } else {
            contents = [{
                role: "user",
                parts: [{ text: messages }]
            }];
        }

        const text = await sendGeminiRequest({
            contents,
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.9,
                maxOutputTokens: 500,
            },
        });

        // IMPORTANT: return ONLY STRING
        return text;
    } catch (error) {
        handleAiError(error, CONNECT_ERROR_MESSAGE);
    }
};

/* ---------------- MEDICINE IDENTIFICATION ---------------- */

export const identifyMedicine = async (imageBase64) => {
    if (!imageBase64)
        return { success: false, message: "No image provided." };

    let mimeType = "image/jpeg";
    let data = imageBase64;

    if (imageBase64.startsWith("data:")) {
        const matches = imageBase64.match(
            /^data:([a-zA-Z0-9\/+.-]+);base64,(.+)$/
        );

        if (matches && matches.length === 3) {
            mimeType = matches[1];
            data = matches[2];
        }
    }

    try {
        const text = await sendGeminiRequest({
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: "Identify this medicine from the image. Provide name and common usage.",
                        },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: data,
                            },
                        },
                    ],
                },
            ],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 300,
            },
        });

        return { success: true, message: text };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Unable to identify medicine." };
    }
};

/* ---------------- PRESCRIPTION ANALYSIS ---------------- */

export const analyzePrescription = async (imageBase64) => {
    if (!imageBase64)
        return { success: false, message: "No image provided." };

    let mimeType = "image/jpeg";
    let data = imageBase64;

    if (imageBase64.startsWith("data:")) {
        const matches = imageBase64.match(
            /^data:([a-zA-Z0-9\/+.-]+);base64,(.+)$/
        );

        if (matches && matches.length === 3) {
            mimeType = matches[1];
            data = matches[2];
        }
    }

    try {
        const text = await sendGeminiRequest({
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: "Extract medicines from this prescription." },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: data,
                            },
                        },
                    ],
                },
            ],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 300,
            },
        });

        return { success: true, message: text };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Unable to analyze prescription." };
    }
};