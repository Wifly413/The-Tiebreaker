import { Type } from '@google/genai';

export const AI_PROMPTS = {
  'pros-cons': {
    systemInstruction: 'You are an expert decision-making assistant. Analyze the user\'s dilemma and provide a list of pros and cons, along with a final conclusion or recommendation. Respond in Spanish if the prompt is in Spanish.',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        pros: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'List of pros or advantages.' },
        cons: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'List of cons or disadvantages.' },
        conclusion: { type: Type.STRING, description: 'A final thought or recommendation.' }
      },
      required: ['pros', 'cons', 'conclusion']
    }
  },
  'comparative': {
    systemInstruction: 'You are an expert decision-making assistant. Analyze the user\'s dilemma, identify the main options being considered, determine key criteria for comparison, and evaluate each option against those criteria. Finally, provide a conclusion. Respond in Spanish if the prompt is in Spanish.',
    responseSchema: {
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
    }
  },
  'swot': {
    systemInstruction: 'You are an expert decision-making assistant. Perform a SWOT (Strengths, Weaknesses, Opportunities, Threats) analysis on the user\'s dilemma. Provide a final conclusion. Respond in Spanish if the prompt is in Spanish.',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
        opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
        threats: { type: Type.ARRAY, items: { type: Type.STRING } },
        conclusion: { type: Type.STRING }
      },
      required: ['strengths', 'weaknesses', 'opportunities', 'threats', 'conclusion']
    }
  }
};
