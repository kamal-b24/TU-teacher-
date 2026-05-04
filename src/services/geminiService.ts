/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { ExamAnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function fileToGenerativePart(file: File) {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function analyzeExam(
  questionPaperFiles: File[],
  answerSheetFiles: File[]
): Promise<ExamAnalysisResult> {
  const questionPaperParts = await Promise.all(questionPaperFiles.map(fileToGenerativePart));
  const answerSheetParts = await Promise.all(answerSheetFiles.map(fileToGenerativePart));

  const prompt = `
    GENERAL INSTRUCTIONS:
    You are a highly experienced academic examiner with 20 years of experience in grading exams. Your goal is to provide a 100% accurate, fair, and strict evaluation of a student's answer sheet based on the provided Question Paper.
    
    STEP 1: ANALYZE QUESTION PAPER
    - Identify the subject, total marks, and passing criteria.
    - Read all instructions carefully. Pay extreme attention to choice-based sections (e.g., "Answer any 5 questions", "Section A is compulsory", "Choose one from each pair").
    - Index every question number and its maximum marks.
    
    STEP 2: READ HANDWRITTEN ANSWERS
    - Read the student's handwriting with high precision.
    - Map each response to a question number from the Question Paper. 
    - Note if a question was skipped or not attempted.
    - If any image page is blurred, distorted, or unreadable, mark "isReadable: false" for the affected questions.
    
    STEP 3: EVALUATE AND GRADE
    - Grade each answer based on accuracy, completeness, and conceptual clarity.
    - Deduct marks for incorrect information, missing key points, or irrelevant fluff.
    - Award partial credit for partially correct steps (especially in math or science).
    - If the student answered more questions than required in a choice-based section, follow the rule: Grade all and count the best N (where N is the required hits).
    - Subtract marks for significant grammatical errors only if the subject is a language (otherwise focus on content).
    
    STEP 4: OUTPUT FORMAT (VITAL)
    - You MUST return a VALID JSON object.
    - "totalMarksObtained" must be the sum of awarded marks.
    - "percentage" must be (totalMarksObtained / totalMaximumMarks) * 100.
    - "gradingStatus" is "Pass" if percentage >= 45, else "Fail".
    - "feedback" for each question must be specific (e.g., "Missing definition of photosynthesis", "Calculation error in step 2").
    
    ACCURACY REQUIREMENT:
    - Zero tolerance for guessing.
    - Re-read both paper and answer before finalizing marks.
    - Be as accurate as a real human teacher.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        {
          parts: [
            ...questionPaperParts,
            { text: "--- END OF QUESTION PAPER --- START OF ANSWER SHEET ---" },
            ...answerSheetParts,
            { text: prompt }
          ]
        }
      ],
      config: {
        temperature: 0.1, // Low temperature for consistency
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            totalMarksObtained: { type: Type.NUMBER },
            totalMaximumMarks: { type: Type.NUMBER },
            percentage: { type: Type.NUMBER, description: "Calculated as (obtained/max) * 100" },
            gradingStatus: { type: Type.STRING, enum: ["Pass", "Fail"] },
            overallComments: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  questionNumber: { type: Type.STRING },
                  marksAwarded: { type: Type.NUMBER },
                  maxMarks: { type: Type.NUMBER },
                  feedback: { type: Type.STRING, description: "Detailed mistakes or missing points" },
                  isReadable: { type: Type.BOOLEAN }
                },
                required: ["questionNumber", "marksAwarded", "maxMarks", "feedback", "isReadable"]
              }
            }
          },
          required: ["subject", "totalMarksObtained", "totalMaximumMarks", "percentage", "gradingStatus", "questions"]
        }
      }
    });

    const result = JSON.parse(response.text);
    return result as ExamAnalysisResult;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze exam. Please ensure pages are clear and try again.");
  }
}
