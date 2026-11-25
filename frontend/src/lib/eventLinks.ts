/** Olay detayındaki ajan analizi kartının çapası (`id`). */
export const ANALYSIS_ANCHOR = 'analiz'

/** Olayın ajan analizine götüren adres: `/events/14#analiz` (detay sayfası karta kaydırır). */
export const eventAnalysisPath = (id: number) => `/events/${id}#${ANALYSIS_ANCHOR}`
