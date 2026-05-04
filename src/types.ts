/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ExamQuestionResult {
  questionNumber: string;
  marksAwarded: number;
  maxMarks: number;
  feedback: string;
  isReadable: boolean;
}

export interface ExamAnalysisResult {
  subject: string;
  totalMarksObtained: number;
  totalMaximumMarks: number;
  percentage: number;
  gradingStatus: 'Pass' | 'Fail';
  questions: ExamQuestionResult[];
  overallComments: string;
}

export interface UploadedFile {
  id: string;
  file: File;
  preview: string;
}

export type AppState = 'HOME' | 'ANALYSING' | 'RESULT';
