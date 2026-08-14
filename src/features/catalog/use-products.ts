import {
  useInfiniteQuery,
  keepPreviousData,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { fetchProducts, type CatalogFilters } from './catalog-api'
import type { ProductPage } from '@/lib/schemas/product-query-schema'

export type { CatalogFilters }

export function useProducts(
  filters: CatalogFilters,
): UseInfiniteQueryResult<InfiniteData<ProductPage, number>, Error> {
  return useInfiniteQuery({
    queryKey: ['products', filters],
    queryFn: ({ pageParam, signal }) => fetchProducts(filters, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    placeholderData: keepPreviousData,
  })
}
