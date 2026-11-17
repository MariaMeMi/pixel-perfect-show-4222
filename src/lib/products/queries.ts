import { queryOptions } from '@tanstack/react-query';
import { getCatalog } from './catalog.functions';
export const catalogQuery = queryOptions({ queryKey: ['verified-product-library'], queryFn: () => getCatalog(), staleTime: 60_000 });