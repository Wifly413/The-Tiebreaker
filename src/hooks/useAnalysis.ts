import { useState, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import type { AnalysisType, AnalysisResult } from '../types/analysis';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function useAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const isSubmittingRef = useRef(false);

  const analyze = async (decision: string, analysisType: AnalysisType, customInstructions: string) => {
    if (!decision.trim() || isSubmittingRef.current) return null;
    
    isSubmittingRef.current = true;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      let responseSchema;
      let systemInstruction = '';

      if (analysisType === 'pros-cons') {
        systemInstruction = 'You are an expert decision-making assistant. Analyze the user\'s dilemma and provide a list of pros and cons, along with a final conclusion or recommendation. Respond in Spanish if the prompt is in Spanish.';
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            pros: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'List of pros or advantages.' },
            cons: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'List of cons or disadvantages.' },
            conclusion: { type: Type.STRING, description: 'A final thought or recommendation.' }
          },
          required: ['pros', 'cons', 'conclusion']
        };
      } else if (analysisType === 'comparative') {
        systemInstruction = 'You are an expert decision-making assistant. Analyze the user\'s dilemma, identify the main options being considered, determine key criteria for comparison, and evaluate each option against those criteria. Finally, provide a conclusion. Respond in Spanish if the prompt is in Spanish.';
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            criteria: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'The criteria used for comparison.' },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: 'Name of the option.' },
                  evaluations: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Evaluation of this option for each criterion, in the same order as the criteria array.' }
                },
                required: ['name', 'evaluations']
              }
            },
            conclusion: { type: Type.STRING, description: 'A final thought or recommendation.' }
          },
          required: ['criteria', 'options', 'conclusion']
        };
      } else {
        systemInstruction = 'You are an expert decision-making assistant. Perform a SWOT (Strengths, Weaknesses, Opportunities, Threats) analysis on the user\'s dilemma. Provide a final conclusion. Respond in Spanish if the prompt is in Spanish.';
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
            threats: { type: Type.ARRAY, items: { type: Type.STRING } },
            conclusion: { type: Type.STRING }
          },
          required: ['strengths', 'weaknesses', 'opportunities', 'threats', 'conclusion']
        };
      }

      if (customInstructions.trim()) {
        systemInstruction += `\n\nAdditional user instructions to strictly follow: ${customInstructions}`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Help me make this decision: ${decision}`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema,
          temperature: 0.7,
        }
      });

      const text = response.text;
      if (!text) throw new Error('No response from AI');
      
      const parsed = JSON.parse(text);
      const finalResult = { type: analysisType, ...parsed } as AnalysisResult;
      setResult(finalResult);
      return finalResult;

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while analyzing your decision.');
      return null;
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return { analyze, loading, error, result };
}
