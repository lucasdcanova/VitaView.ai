/**
 * Sistema de normalização de nomes de exames médicos
 * 
 * Este módulo implementa uma solução para unificar diferentes variações dos nomes
 * de exames, incluindo diferenças de capitalização, acentuação, abreviações e
 * nomenclaturas alternativas. Isso garante que o sistema trate diferentes representações
 * do mesmo exame como uma única entidade, melhorando a consistência dos dados e
 * possibilitando comparações históricas mais precisas.
 */

// Mapeamento de variações comuns para nomes padronizados
const examNameMap: Record<string, string> = {
  // Hemograma
  'hemacias': 'eritrócitos',
  'hemácias': 'eritrócitos',
  'eritrócitos': 'eritrócitos',
  'eritrocitos': 'eritrócitos',
  'hemoglobina': 'hemoglobina',
  'hgb': 'hemoglobina',
  'hb': 'hemoglobina',
  'hematócrito': 'hematócrito',
  'hematocrito': 'hematócrito',
  'ht': 'hematócrito',
  'htc': 'hematócrito',
  'v.c.m.': 'vcm',
  'vcm': 'vcm',
  'volume corpuscular médio': 'vcm',
  'h.c.m.': 'hcm',
  'hcm': 'hcm',
  'hemoglobina corpuscular média': 'hcm',
  'c.h.c.m.': 'chcm',
  'chcm': 'chcm',
  'concentração de hemoglobina corpuscular média': 'chcm',
  'rdw': 'rdw',
  'r.d.w.': 'rdw',
  'rdw-cv': 'rdw',
  'rdw-sd': 'rdw-sd',
  'amplitude de distribuição dos eritrócitos': 'rdw',
  
  // Leucograma
  'leucócitos': 'leucócitos',
  'leucocitos': 'leucócitos',
  'wbc': 'leucócitos',
  'leucograma': 'leucócitos',
  'neutrófilos': 'neutrófilos',
  'neutrofilos': 'neutrófilos',
  'segmentados': 'neutrófilos',
  'bastonetes': 'bastonetes',
  'eosinófilos': 'eosinófilos',
  'eosinofilos': 'eosinófilos',
  'basófilos': 'basófilos',
  'basofilos': 'basófilos',
  'linfócitos': 'linfócitos',
  'linfocitos': 'linfócitos',
  'monócitos': 'monócitos',
  'monocitos': 'monócitos',
  
  // Plaquetas
  'plaquetas': 'plaquetas',
  'plt': 'plaquetas',
  'contagem de plaquetas': 'plaquetas',
  
  // Glicose
  'glicose': 'glicose',
  'glicemia': 'glicose',
  'glicemia de jejum': 'glicose',
  'glic.': 'glicose',
  'gli': 'glicose',
  
  // Colesterol
  'colesterol total': 'colesterol total',
  'colesterol': 'colesterol total',
  'col. total': 'colesterol total',
  'col total': 'colesterol total',
  'hdl': 'colesterol hdl',
  'hdl-colesterol': 'colesterol hdl',
  'colesterol hdl': 'colesterol hdl',
  'hdl-c': 'colesterol hdl',
  'ldl': 'colesterol ldl',
  'ldl-colesterol': 'colesterol ldl',
  'colesterol ldl': 'colesterol ldl',
  'ldl-c': 'colesterol ldl',
  'vldl': 'colesterol vldl',
  'vldl-colesterol': 'colesterol vldl',
  'colesterol vldl': 'colesterol vldl',
  'vldl-c': 'colesterol vldl',
  
  // Triglicerídeos
  'triglicerídeos': 'triglicerídeos',
  'triglicerideos': 'triglicerídeos',
  'triglicérides': 'triglicerídeos',
  'triglicerides': 'triglicerídeos',
  'tg': 'triglicerídeos',
  
  // Função hepática
  'tgo': 'tgo',
  'ast': 'tgo',
  'aspartato aminotransferase': 'tgo',
  'transaminase glutâmica oxalacética': 'tgo',
  'tgp': 'tgp',
  'alt': 'tgp',
  'alanina aminotransferase': 'tgp',
  'transaminase glutâmica pirúvica': 'tgp',
  'gama gt': 'gama gt',
  'ggt': 'gama gt',
  'gama glutamil transferase': 'gama gt',
  'gama glutamil transpeptidase': 'gama gt',
  'γ-gt': 'gama gt',
  'fosfatase alcalina': 'fosfatase alcalina',
  'fa': 'fosfatase alcalina',
  'fosf alc': 'fosfatase alcalina',
  'bilirubina total': 'bilirubina total',
  'bt': 'bilirubina total',
  'bilirrubina total': 'bilirubina total',
  'bilirubina direta': 'bilirubina direta',
  'bd': 'bilirubina direta',
  'bilirrubina direta': 'bilirubina direta',
  'bilirubina indireta': 'bilirubina indireta',
  'bi': 'bilirubina indireta',
  'bilirrubina indireta': 'bilirubina indireta',
  
  // Função renal
  'ureia': 'ureia',
  'uréia': 'ureia',
  'ur': 'ureia',
  'bun': 'ureia',
  'nitrogênio ureico': 'ureia',
  'creatinina': 'creatinina',
  'cr': 'creatinina',
  'creat': 'creatinina',
  'clearance de creatinina': 'clearance de creatinina',
  'ácido úrico': 'ácido úrico',
  'acido urico': 'ácido úrico',
  'au': 'ácido úrico',
  
  // Eletrólitos
  'sódio': 'sódio',
  'sodio': 'sódio',
  'na': 'sódio',
  'na+': 'sódio',
  'potássio': 'potássio',
  'potassio': 'potássio',
  'k': 'potássio',
  'k+': 'potássio',
  'cálcio': 'cálcio',
  'calcio': 'cálcio',
  'ca': 'cálcio',
  'ca++': 'cálcio',
  'fósforo': 'fósforo',
  'fosforo': 'fósforo',
  'p': 'fósforo',
  'magnésio': 'magnésio',
  'magnesio': 'magnésio',
  'mg': 'magnésio',
  'ferro': 'ferro',
  'fe': 'ferro',
  
  // Proteínas
  'proteínas totais': 'proteínas totais',
  'proteinas totais': 'proteínas totais',
  'prot. totais': 'proteínas totais',
  'pt': 'proteínas totais',
  'albumina': 'albumina',
  'alb': 'albumina',
  'globulina': 'globulina',
  'glob': 'globulina',
  'relação albumina/globulina': 'relação albumina/globulina',
  'rel a/g': 'relação albumina/globulina',
  
  // Coagulação
  'tempo de protrombina': 'tempo de protrombina',
  'tp': 'tempo de protrombina',
  'tpae': 'tempo de tromboplastina parcial ativada',
  'ttpa': 'tempo de tromboplastina parcial ativada',
  'tempo de tromboplastina parcial ativada': 'tempo de tromboplastina parcial ativada',
  'kttp': 'tempo de tromboplastina parcial ativada',
  'inr': 'inr',
  'razão normalizada internacional': 'inr',
  
  // Inflamação
  'vhs': 'vhs',
  'hemossedimentação': 'vhs',
  'velocidade de hemossedimentação': 'vhs',
  'pcr': 'proteína c reativa',
  'proteína c reativa': 'proteína c reativa',
  'proteina c reativa': 'proteína c reativa',
  
  // Hormônios
  'tsh': 'tsh',
  'hormônio estimulante da tireoide': 'tsh',
  't4': 't4',
  't4 livre': 't4 livre',
  't4l': 't4 livre',
  'tiroxina livre': 't4 livre',
  't3': 't3',
  't3 livre': 't3 livre',
  't3l': 't3 livre',
  'insulina': 'insulina',
  
  // Outros
  'ferritina': 'ferritina',
  'vitamina d': 'vitamina d',
  '25-hidroxivitamina d': 'vitamina d',
  'vitamina b12': 'vitamina b12',
  'acido folico': 'ácido fólico',
  'ácido fólico': 'ácido fólico',
  'b12': 'vitamina b12',
  'hemoglobina glicada': 'hemoglobina glicada',
  'hba1c': 'hemoglobina glicada',
  'a1c': 'hemoglobina glicada',
};

/**
 * Normaliza o nome de um exame para um formato padronizado
 * 
 * @param name Nome do exame para normalizar
 * @returns Nome normalizado
 */
export function normalizeExamName(name: string): string {
  if (!name) return "desconhecido";
  
  // Converter para minúsculo e remover espaços extras
  const normalized = name.toLowerCase().trim();
  
  // Verificar no mapeamento
  if (examNameMap[normalized]) {
    return examNameMap[normalized];
  }
  
  // Se não estiver no mapeamento, retorna o nome original com primeira letra maiúscula 
  // e resto minúscula para manter consistência
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

/**
 * Normaliza as métricas de saúde em um array, combinando métricas duplicadas
 * 
 * @param metrics Array de métricas para normalizar
 * @returns Array de métricas normalizadas sem duplicatas
 */
export function normalizeHealthMetrics(metrics: any[]): any[] {
  if (!metrics || !Array.isArray(metrics)) return [];
  
  // Usar um mapa para agrupar métricas por nome normalizado
  const processedMetrics = new Map<string, any>();
  
  // Normalizar todos os nomes e agrupar métricas idênticas
  for (const metric of metrics) {
    if (!metric || !metric.name) continue;
    
    const normalizedName = normalizeExamName(metric.name);
    
    // Se já temos uma métrica com esse nome normalizado, usamos a mais recente
    // ou a que tem mais informações (assumindo que a ordem indica prioridade)
    if (!processedMetrics.has(normalizedName)) {
      processedMetrics.set(normalizedName, {
        ...metric,
        name: normalizedName
      });
    }
  }
  
  // Converter de volta para array
  return Array.from(processedMetrics.values());
}