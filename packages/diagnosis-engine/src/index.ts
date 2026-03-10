import type {
  PrediagnosisReport,
  AIAnalysis,
  PhonologicalCode,
  SeverityLevel,
  WordResult,
  ScoresByCategory,
} from '@voicecheck/types';

export const PATTERN_DESCRIPTIONS: Record<PhonologicalCode, string> = {
  'EM-C1': 'Omisión de coda nasal',
  'EM-C2': 'Omisión de coda sibilante',
  'EM-C3': 'Omisión de coda líquida',
  'EM-G': 'Reducción de grupo consonántico',
  'EM-RD': 'Reducción de diptongo',
  'EM-MT': 'Reducción metrical',
  'EM-M': 'Metátesis',
  'EA-N': 'Asimilación nasal',
  'EA-L': 'Asimilación labial',
  'EA-D': 'Asimilación dental/alveolar',
  'ES-O': 'Sustitución de oclusivas',
  'ES-F': 'Sustitución de fricativas',
  'ES-P': 'Sustitución de palatales',
  'ES-SL': 'Sustitución de líquidas',
  'ES-SLNL': 'Sustitución semiconsonante-lateral',
  'ES-PS': 'Sustitución de obstruyente por sonora',
};

export const DISCLAIMER_ES = `IMPORTANTE: Este informe es una herramienta de cribado (screening) y NO constituye un diagnóstico clínico. Los resultados deben ser interpretados por un fonoaudiólogo certificado. La presencia de procesos fonológicos puede ser normal según la edad del niño. Consulte a un profesional de la salud para una evaluación completa.`;

export function generateReport(
  sessionId: string,
  wordResults: WordResult[],
): Omit<PrediagnosisReport, 'id' | 'reviewed_by' | 'reviewed_at' | 'therapist_notes'> {

  const analyses = wordResults.map(wr => wr.analysis).filter(Boolean) as AIAnalysis[];

  if (analyses.length === 0) {
    return {
      session_id: sessionId,
      patterns_found: [],
      severity_level: 'typical',
      score_overall: 100,
      scores_by_category: { omissions: 100, assimilations: 100, substitutions: 100 },
      summary_es: 'No se registraron análisis para esta sesión.',
      recommendation: 'Complete la evaluación para obtener resultados.',
      word_results: wordResults,
      generated_at: new Date().toISOString(),
    };
  }

  // Count all detected codes
  const codeFrequency: Record<string, number> = {};
  const uniqueCodes = new Set<PhonologicalCode>();

  for (const analysis of analyses) {
    for (const code of analysis.diagnosis_codes) {
      codeFrequency[code] = (codeFrequency[code] || 0) + 1;
      uniqueCodes.add(code);
    }
  }

  const patternsFound = Array.from(uniqueCodes);

  // Calculate match percentage weighted by confidence
  const totalConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0);
  const matchScore = analyses.reduce((sum, a) => sum + (a.match ? a.confidence : 0), 0);
  const scoreOverall = totalConfidence > 0
    ? Math.round((matchScore / totalConfidence) * 100)
    : 0;

  // Scores by category
  const omissionCodes = patternsFound.filter(c => c.startsWith('EM-'));
  const assimilationCodes = patternsFound.filter(c => c.startsWith('EA-'));
  const substitutionCodes = patternsFound.filter(c => c.startsWith('ES-'));

  const calcCategoryScore = (codes: PhonologicalCode[]) => {
    if (codes.length === 0) return 100;
    const affected = codes.reduce((sum, c) => sum + (codeFrequency[c] || 0), 0);
    const penalty = Math.min(affected * 10, 60);
    return Math.max(100 - penalty, 40);
  };

  const scoresByCategory: ScoresByCategory = {
    omissions: calcCategoryScore(omissionCodes),
    assimilations: calcCategoryScore(assimilationCodes),
    substitutions: calcCategoryScore(substitutionCodes),
  };

  // Determine severity
  let severityLevel: SeverityLevel;
  if (scoreOverall >= 85) severityLevel = 'typical';
  else if (scoreOverall >= 70) severityLevel = 'monitor';
  else if (scoreOverall >= 50) severityLevel = 'attention';
  else severityLevel = 'urgent';

  // Generate pattern summary for summary text
  const patternNames = patternsFound.slice(0, 3).map(c => PATTERN_DESCRIPTIONS[c]).join(', ');

  const summaries: Record<SeverityLevel, string> = {
    typical: `El desarrollo fonológico se encuentra dentro de los rangos esperados para su edad. ${analyses.filter(a => a.match).length} de ${analyses.length} palabras fueron pronunciadas correctamente.`,
    monitor: `Se observaron algunos procesos de simplificación fonológica (${patternNames}). Esto puede ser normal en el desarrollo del lenguaje, pero se recomienda seguimiento.`,
    attention: `Se detectaron múltiples procesos fonológicos: ${patternNames}${patternsFound.length > 3 ? ' y otros' : ''}. Se recomienda consultar con un fonoaudiólogo para evaluación.`,
    urgent: `Se detectaron procesos fonológicos significativos en ${patternsFound.length} categorías. Se recomienda evaluación profesional urgente por parte de un fonoaudiólogo.`,
  };

  const recommendations: Record<SeverityLevel, string> = {
    typical: 'El desarrollo fonológico parece adecuado para la edad. Continúe estimulando el lenguaje mediante la lectura en voz alta y la conversación. Se recomienda una nueva evaluación en 6 meses.',
    monitor: 'Se recomienda repetir la evaluación en 3 meses. Si los procesos fonológicos persisten, consulte con un fonoaudiólogo. Practique con el niño la pronunciación clara de las palabras.',
    attention: 'Se recomienda consultar con un fonoaudiólogo certificado para una evaluación completa del desarrollo fonológico. La intervención temprana es clave para el progreso.',
    urgent: 'Se recomienda consultar urgentemente con un fonoaudiólogo. Los patrones detectados requieren evaluación y posible intervención profesional especializada.',
  };

  return {
    session_id: sessionId,
    patterns_found: patternsFound,
    severity_level: severityLevel,
    score_overall: scoreOverall,
    scores_by_category: scoresByCategory,
    summary_es: summaries[severityLevel],
    recommendation: recommendations[severityLevel],
    word_results: wordResults,
    generated_at: new Date().toISOString(),
  };
}
