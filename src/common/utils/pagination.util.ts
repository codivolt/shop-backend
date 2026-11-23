import { PaginatedResponse, PaginationDto } from '../dto/pagination.dto';

export interface ResolvedPagination {
  page: number;
  limit: number;
  skip: number;
}

export function resolvePagination(
  paginationDto: PaginationDto,
): ResolvedPagination {
  const page = Math.max(1, Number(paginationDto.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(paginationDto.limit) || 10));

  return { page, limit, skip: (page - 1) * limit };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  pagination: ResolvedPagination,
): PaginatedResponse<T> {
  const { page, limit } = pagination;

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
