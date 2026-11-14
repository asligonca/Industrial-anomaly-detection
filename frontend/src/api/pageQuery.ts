/** Sayfalı listelerin `?limit=&offset=` parametreleri. */
export interface PageQuery {
  limit: number
  offset: number
}

/** 1'den başlayan sayfa numarasını `limit/offset`'e çevirir. */
export function pageQuery(page: number, pageSize: number): PageQuery {
  return { limit: pageSize, offset: (page - 1) * pageSize }
}
