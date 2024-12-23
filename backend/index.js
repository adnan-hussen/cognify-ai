// index.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const {
  AzureKeyCredential,
  DocumentAnalysisClient,
} = require('@azure/ai-form-recognizer');
const axios = require('axios');

const app = express();

// Allow cross-origin requests
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Configure file uploads (temporary folder for uploaded files)
const upload = multer({ dest: 'uploads/' });

// -------------------------------
// 1. Azure Document Intelligence Setup
// -------------------------------
const formRecognizerEndpoint = 'https://cognify-ai.cognitiveservices.azure.com';
const formRecognizerKey = '5npgREmd3ZT4bYM5FinIv5F6PkMqc3JBtmC7qrmVn5Yp9Jweni7dJQQJ99ALACYeBjFXJ3w3AAALACOG9EKb'; // Replace with your real key

const formClient = new DocumentAnalysisClient(
  formRecognizerEndpoint,
  new AzureKeyCredential(formRecognizerKey)
);

// -------------------------------
// 2. Azure OpenAI Setup
// -------------------------------
const openaiEndpoint =
  'https://ai-abdulfetahadnan4845ai688668060472.openai.azure.com';
const openaiKey = '1MrkWrD6xodDYBcYdLD5osfKf1NIBDKBHWGDzFhJjOGATCo6wOZBJQQJ99ALACHYHv6XJ3w3AAAAACOGP9We'; // Replace with your real key

const openaiClient = axios.create({
  baseURL: openaiEndpoint,
  headers: {
    'api-key': openaiKey,
    'Content-Type': 'application/json',
  },
});

// -------------------------------
// 3. Validate JSON Structure
// -------------------------------
// Validate each step:
const validateLessonFormat = (lessonJSON) => {
  try {
    // 1. Sanitize the raw AI string
    const sanitizedJSON = lessonJSON
      .trim()
      .replace(/^[^\[{]+/, '')
      .replace(/[^\]}]+$/, '');

    // 2. Parse
    const parsed = JSON.parse(sanitizedJSON);

    // 3. Check top-level fields
    if (
      typeof parsed.lessonTitle !== 'string' ||
      typeof parsed.lessonOverview !== 'string' ||
      !Array.isArray(parsed.steps)
    ) {
      return false;
    }

    // 4. Check each step
    for (const step of parsed.steps) {
      if (step.type === 'content') {
        // Must have title and content
        if (
          typeof step.title !== 'string' ||
          typeof step.content !== 'string'
        ) {
          return false;
        }
      } else if (step.type === 'quiz') {
        // We expect "quizTitle" (optional) and "questions" array
        if (!Array.isArray(step.questions) || step.questions.length !== 3) {
          return false; // Must have exactly 3 questions
        }

        // Validate each sub-question
        for (const q of step.questions) {
          if (
            typeof q.question !== 'string' ||
            !Array.isArray(q.options) ||
            typeof q.correctAnswer !== 'string'
          ) {
            return false;
          }
        }
      } else {
        // Unknown step type
        return false;
      }
    }

    // If everything checks out, return the parsed object
    return parsed;
  } catch (e) {
    console.error('Validation Error:', e);
    return false;
  }
};

// -------------------------------
// 4. Single Endpoint: /analyze-and-generate
// -------------------------------
app.post('/analyze-and-generate', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // STEP A: Extract text with Document Intelligence
    const fileStream = fs.createReadStream(req.file.path);
    const poller = await formClient.beginAnalyzeDocument(
      'prebuilt-read',
      fileStream
    );
    const result = await poller.pollUntilDone();

    if (!result || !result.content) {
      fs.unlinkSync(req.file.path);
      return res.status(500).json({ error: 'Document analysis failed.' });
    }

    const extractedText = result.content;
    fs.unlinkSync(req.file.path); // Clean up the uploaded file

    // STEP B: Generate ADHD-Friendly Lesson with Azure OpenAI
    // index.js (relevant excerpt)
const prompt = `
You are an AI specialized in creating ADHD-friendly lessons. 
Generate a detailed and engaging lesson in JSON format from the provided text. 
Ensure the lesson retains all the information and details in the input text but broken in to smaller chunks so that it is easier for students with ADHD to retain the information. You must include as much quiz steps as possible, and each quiz step must contain exactly 3 questions. The quiz questions should be from the information available on the lesson steps content. Moreover, you should generate as much steps as possible for the lesson, depending on the input text. 
Only output valid JSON with no extra text. Don't add things like "step" or "quiz number" in the labels snd titles.

Use this format:
{
  "lessonTitle": "Title of the lesson",
  "lessonOverview": "Brief overview",
  "steps": [
    {
      "type": "content",
      "title": "Step title",
      "content": "Detailed step content"
    },
    {
      "type": "quiz",
      "quizTitle": "Some quiz label",
      "questions": [
        {
          "question": "Quiz question #1",
          "options": ["Option 1", "Option 2", "Option 3"],
          "correctAnswer": "Option 1"
        },
        {
          "question": "Quiz question #2",
          "options": ["Option A", "Option B", "Option C"],
          "correctAnswer": "Option C"
        },
        {
          "question": "Quiz question #3",
          "options": ["True", "False"],
          "correctAnswer": "True"
        }
      ]
    }
  ]
}

Text: ${extractedText}
`;

// Then call openaiClient.post(...) as usual


    const response = await openaiClient.post(
      // Make sure these match your actual deployment name and version
      '/openai/deployments/gpt-4o/chat/completions?api-version=2024-08-01-preview',
      {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 16384,
      }
    );

    let aiGeneratedJSON = response.data?.choices?.[0]?.message?.content || '';

    // STEP C: Validate and Format AI-Generated JSON
    const validLesson = validateLessonFormat(aiGeneratedJSON);
    if (!validLesson) {
      return res.status(500).json({
        error:
          'AI-generated JSON is invalid or does not match the required format.',
      });
    }

    // Return the validated lesson
    res.json({
      extractedText, // Original extracted text
      lesson: validLesson, // Validated lesson in required JSON format
    });
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------
// Start the Server
// -------------------------------
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
