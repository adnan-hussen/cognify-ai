// services/documentIntelligence.js
import { AzureKeyCredential, DocumentAnalysisClient } from "@azure/ai-form-recognizer";

const endpoint = "YOUR_DOCUMENT_INTELLIGENCE_ENDPOINT";
const key = "YOUR_DOCUMENT_INTELLIGENCE_KEY";

const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(key));

export async function extractTextFromDocument(file) {
    const readStream = file.stream(); // Assuming file is a File object from an input element

    const poller = await client.beginAnalyzeDocument("prebuilt-document", readStream, {
        onProgress: (state) => console.log(`Status: ${state.status}`)
    });

    const result = await poller.pollUntilDone();

    if (!result) {
        throw new Error("Document analysis failed");
    }

    // Combine text lines into a single string
    return result.pages.map(page => page.content).join("\n");
}
