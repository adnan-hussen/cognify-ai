// services/openai.js
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";

const endpoint = "YOUR_AZURE_OPENAI_ENDPOINT";
const key = "YOUR_AZURE_OPENAI_KEY";
const deploymentId = "gpt-4o";

const client = new OpenAIClient(endpoint, new AzureKeyCredential(key));

export async function generateLesson(content) {
    const prompt = `You are an expert educator specializing in creating interactive lessons for students with ADHD. Convert educational content into an engaging lesson following this JSON structure:
    {
      "title": "Topic title",
      "estimatedDuration": "X minutes",
      "steps": [
        { "type": "explanation", "title": "Concept title", "content": "Clear explanation", "emphasis": ["key term 1", "key term 2"] },
        { "type": "example", "title": "Real World Example", "content": "Practical example", "imageDescription": "Visual aid description" },
        { "type": "quiz", "question": "Test question", "options": ["Correct", "Wrong 1", "Wrong 2", "Wrong 3"], "correctAnswer": 0, "explanation": "Why this is correct" }
      ]
    }`;

    const result = await client.getCompletions(deploymentId, [{
        role: "system",
        content: prompt
    }, {
        role: "user",
        content
    }], {
        temperature: 0.7,
        maxTokens: 2000
    });

    const completion = result.choices[0]?.message?.content;

    if (!completion) {
        throw new Error("Failed to generate lesson content");
    }

    return JSON.parse(completion);
}
