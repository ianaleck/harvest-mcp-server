/**
 * Pagination helpers for Harvest API responses
 * Provides utilities for handling paginated data
 */

import { PaginationInfo } from '../types';

export interface PaginatedQuery {
  page?: number;
  per_page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
  links: {
    first: string;
    next: string | null;
    previous: string | null;
    last: string;
  };
}

export function buildPaginationParams(query: PaginatedQuery): URLSearchParams {
  const params = new URLSearchParams();
  
  if (query.page && query.page > 0) {
    params.append('page', String(query.page));
  }
  
  if (query.per_page && query.per_page > 0 && query.per_page <= 2000) {
    params.append('per_page', String(query.per_page));
  }
  
  return params;
}

export function extractPaginationInfo(response: any): PaginationInfo {
  return {
    page: response.page || 1,
    per_page: response.per_page || 2000,
    total_pages: response.total_pages || 1,
    total_entries: response.total_entries || 0,
    next_page: response.next_page || null,
    previous_page: response.previous_page || null,
  };
}

export function buildPaginatedResponse<T>(
  data: T[], 
  paginationData: any
): PaginatedResponse<T> {
  return {
    data,
    pagination: extractPaginationInfo(paginationData),
    links: {
      first: paginationData.links?.first || '',
      next: paginationData.links?.next || null,
      previous: paginationData.links?.previous || null,
      last: paginationData.links?.last || '',
    },
  };
}

export function hasNextPage(pagination: PaginationInfo): boolean {
  return pagination.next_page !== null && pagination.page < pagination.total_pages;
}

export function hasPreviousPage(pagination: PaginationInfo): boolean {
  return pagination.previous_page !== null && pagination.page > 1;
}

export function getNextPageNumber(pagination: PaginationInfo): number | null {
  return hasNextPage(pagination) ? pagination.next_page : null;
}

export function getPreviousPageNumber(pagination: PaginationInfo): number | null {
  return hasPreviousPage(pagination) ? pagination.previous_page : null;
}

export async function getAllPages<T>(
  fetchPage: (page: number, perPage: number) => Promise<PaginatedResponse<T>>,
  perPage: number = 2000
): Promise<T[]> {
  const allItems: T[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetchPage(currentPage, perPage);
    allItems.push(...response.data);
    
    hasMore = hasNextPage(response.pagination);
    currentPage = response.pagination.next_page || currentPage + 1;
  }

  return allItems;
}