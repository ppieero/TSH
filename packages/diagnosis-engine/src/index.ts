import type {
  AIAnalysis,
  PhonologicalCode,
  PrediagnosisReport,
  ScoresByCategory,
  SeverityLevel,
} from '@voicecheck/types';

// Phonological pattern descriptions (Spanish)
export const PATTERN_DESCRIPTIONS: Record<PhonologicalCode, string> = {
  'EM-C1': 'Omisión de consonante en posición inicial',
  'EM-C2': 'Omisión de consonante en posición media',
  'EM-C3': 'Omisión de consonante en posición final',
  'EM-G': 'Omisión de grupo consonántico',
  'EM-RD': 'Omisión de sílaba reduplicada',
  'EM-MT': 'Omisión de morfema trabante',
  'EM-M': 'Omisión de morfema',
  'EA-N': 'Asimilación nasal',
  'EA-L': 'Asimilación lateral',
  'EA-D': 'Asimilación dental',
  'ES-O': 'Sustitución de oclusivas',
  'ES-F': 'Sustitución de fricativas',
  'ES-P': 'Sustitución de palatales',
  'ES-SL': 'Sustitución de semilíquidas',
  'ES-SLNL': 'Sustitución de semilíquida no lateral',
  'ES-PS': 'Sustitución de posición silábica',
};

const OMISSION_CODES: PhonologicalCode[] = ['EM-C1','EM-C2','EM-C3','EM-G','EM-RD','EM-MT','EM-M'];
const ASSIMILATION_CODES: PhonologicalCode[] = ['EA-N','EA-L','EA-D'];
const SUBSTITUTION_CODES: PhonologicalCode[] = ['ES-O','ES-F','ES-P','ES-SL','ES-SLNL','ES-PS'];

function categorize(codes: PhonologicalCode[]): ScoresByCategory {
  const omissions = codes.filter(c => OMISSION_CODES.includes(c)).length;
  const assimilations = codes.filter(c => ASSIMILATION_CODES.includes(c)).length;
  const substitutions = codes.filter(c => SUBSTITUTION_CODES.includes(c)).length;
  return { omissions, assimilations, substitutions };
}

function computeSeverity(score: number): SeverityLevel {
  if (score >= 85) return 'typical';
  if (score >= 70) return 'monitor';
  if (score >= 50) return 'attention';
  return 'urgent';
}

function computeOverallScore(analyses: AIAnalysis[]): number {
  if (analyses.length === 0) return 100;
  const matchCount = analyses.filter(a => a.match).length;
  const baseScore = Math.round((matchCount / analyses.length) * 100);
  // Weighted penalty for low confidence
  const avgConfidence = analyses.reduce((s, a) => s + a.confidence, 0) / analyses.length;
  return Math.round(baseScore * avgConfidence + baseScore * (1 - avgConfidence) * 0.8);
}

function buildSummary(severity: SeverityLevel, patternsFound: PhonologicalCode[]): string {
  const patternList = patternsFound.map(p => PATTERN_DESCRIPTIONS[p]).join(', ');
  const summaries: Record<SeverityLevel, string> = {
    typical: 'El habla del niño/a muestra un desarrollo fonológico dentro de los rangos esperados para su edad.',
    monitor: `Se detectaron algunas variaciones fonológicas que conviene monitorear: ${patternList || 'ninguna específica'}. Se recomienda una nueva evaluación en 3 meses.`,
    attention: `Se identificaron patrones fonológicos que requieren atención: ${patternList}. Se recomienda consulta con un fonoaudiólogo.`,
    urgent: `Se detectaron múltiples alteraciones fonológicas: ${patternList}. Se recomienda evaluación profesional urgente.`,
  };
  return summaries[severity];
}

function buildRecommendation(severity: SeverityLevel): string {
  const recs: Record<SeverityLevel, string> = {
    typical: 'Continuar con estimulación del lenguaje en el hogar. Próxima evaluación en 6 meses.',
    monitor: 'Realizar actividades de estimulación fonológica. Nueva evaluación en 3 meses.',
    attention: 'Consultar con un fonoaudiólogo certificado para evaluación completa.',
    urgent: 'Solicitar evaluación fonoaudiológica urgente. No demorar la consulta.',
  };
  return recs[severity];
}

export function generateReport(
  sessionId: string,
  analyses: AIAnalysis[],
): Omit<PrediagnosisReport, 'id' | 'reviewed_by' | 'reviewed_at' | 'therapist_notes'> {
  const allCodes = analyses.flatMap(a => a.diagnosis_codes);
  const uniquePatterns = [...new Set(allCodes)] as PhonologicalCode[];
  const scoresByCategory = categorize(uniquePatterns);
  const scoreOverall = computeOverallScore(analyses);
  const severity = computeSeverity(scoreOverall);

  return {
    session_id: sessionId,
    patterns_found: uniquePatterns,
    severity_level: severity,
    score_overall: scoreOverall,
    scores_by_category: scoresByCategory,
    summary_es: buildSummary(severity, uniquePatterns),
    recommendation: buildRecommendation(severity),
    generated_at: new Date().toISOString(),
  };
}

export const DISCLAIMER_ES =
  'IMPORTANTE: Este reporte es una herramienta de despistaje y NO constituye un diagnóstico clínico. ' +
  'Los resultados deben ser interpretados por un fonoaudiólogo certificado. ' +
  'VoiceCheck no reemplaza la evaluación profesional.';
