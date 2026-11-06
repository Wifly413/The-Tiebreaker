import type { AnalysisResult } from '../types/analysis';
import { ReadingBand } from './ReadingBand';
import { Followups } from './Followups';
import { BalanceView } from './results/BalanceView';
import { HeadToHeadView } from './results/HeadToHeadView';
import { StrategyView } from './results/StrategyView';

export interface AnalysisViewProps {
  result: AnalysisResult;
  dense?: boolean;
}

/** Banda de lectura + cuerpo del método + cierre. Los tres métodos comparten el mismo esqueleto. */
export function AnalysisView({ result, dense = false }: AnalysisViewProps) {
  return (
    <div className={dense ? 'flex flex-col gap-8' : 'flex flex-col gap-12 md:gap-14'}>
      <ReadingBand result={result} dense={dense} />

      {result.type === 'balance' ? <BalanceView result={result} dense={dense} /> : null}
      {result.type === 'head-to-head' ? <HeadToHeadView result={result} dense={dense} /> : null}
      {result.type === 'strategy' ? <StrategyView result={result} dense={dense} /> : null}

      <Followups result={result} dense={dense} />
    </div>
  );
}
