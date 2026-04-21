import { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { AnalysisType, AnalysisResult } from '../types/analysis';
import { AI_PROMPTS } from '../constants/prompts';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is missing. Please set it in your environment variables.');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

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
      const ai = getAIClient();
      
      // Select the correct prompt and schema from our decoupled constants
      const promptConfig = AI_PROMPTS[analysisType];
      let finalSystemInstruction = promptConfig.systemInstruction;

      if (customInstructions.trim()) {
        finalSystemInstruction += `\n\nAdditional user instructions to strictly follow: ${customInstructions}`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Help me make this decision: ${decision}`,
        config: {
          systemInstruction: finalSystemInstruction,
          responseMimeType: 'application/json',
          responseSchema: promptConfig.responseSchema,
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
      
      // Provide robust error handling and specialized UX messages
      let displayError = 'Se produjo un error al analizar la decisiÃ³n. Por favor, intenta de nuevo.';
      const rawMsg = err.message ? err.message.toLowerCase() : '';
      
      if (rawMsg.includes('429') || rawMsg.includes('quota')) {
        displayError = 'LÃ­mite de IA excedido o servicio saturado (429). Por favor, espera unos minutos antes de volver a intentarlo.';
      } else if (rawMsg.includes('503')) {
        displayError = 'Los servidores de IA estÃ¡n sobrecargados temporalmente (503). Intenta de nuevo en unos instantes.';
      } else if (rawMsg.includes('api_key')) {
        displayError = 'Hay un problema con tu clave de API (GEMINI_API_KEY). Verifica la configuraciÃ³n de tus variables de entorno.';
      }

      setError(displayError);
      return null;
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return { analyze, loading, error, result };
}
