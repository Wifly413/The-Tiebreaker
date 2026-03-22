import type { AnalysisResult } from '../types/analysis';

export function formatResultForClipboard(decision: string, result: AnalysisResult): string {
  let text = `Decision Analysis: ${decision}\n\n`;

  if (result.type === 'pros-cons') {
    text += `PROS:\n`;
    result.pros.forEach(pro => text += `- ${pro}\n`);
    text += `\nCONS:\n`;
    result.cons.forEach(con => text += `- ${con}\n`);
  } else if (result.type === 'comparative') {
    text += `COMPARATIVE ANALYSIS:\n`;
    result.criteria.forEach((criterion, i) => {
      text += `\n${criterion}:\n`;
      result.options.forEach(opt => {
        text += `- ${opt.name}: ${opt.evaluations[i]}\n`;
      });
    });
  } else if (result.type === 'swot') {
    text += `SWOT ANALYSIS:\n\n`;
    text += `STRENGTHS:\n`;
    result.strengths.forEach(s => text += `- ${s}\n`);
    text += `\nWEAKNESSES:\n`;
    result.weaknesses.forEach(w => text += `- ${w}\n`);
    text += `\nOPPORTUNITIES:\n`;
    result.opportunities.forEach(o => text += `- ${o}\n`);
    text += `\nTHREATS:\n`;
    result.threats.forEach(t => text += `- ${t}\n`);
  }

  text += `\nCONCLUSION:\n${result.conclusion}`;

  return text;
}
