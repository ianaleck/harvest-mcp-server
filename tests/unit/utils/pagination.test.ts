/**
 * Pagination Utils Unit Tests
 */

import {
  buildPaginationParams,
  extractPaginationInfo,
  buildPaginatedResponse,
  hasNextPage,
  hasPreviousPage,
  getNextPageNumber,
  getPreviousPageNumber,
  getAllPages,
  PaginatedQuery,
  PaginatedResponse
} from '../../../src/utils/pagination';
import { PaginationInfo } from '../../../src/types';

describe('Pagination Utils', () => {
  describe('buildPaginationParams', () => {
    it('should build URL params for valid pagination query', () => {
      const query: PaginatedQuery = {
        page: 2,
        per_page: 50
      };

      const params = buildPaginationParams(query);
      
      expect(params.get('page')).toBe('2');
      expect(params.get('per_page')).toBe('50');
    });

    it('should ignore invalid page numbers', () => {
      const query: PaginatedQuery = {
        page: 0,
        per_page: 50
      };

      const params = buildPaginationParams(query);
      
      expect(params.get('page')).toBeNull();
      expect(params.get('per_page')).toBe('50');
    });

    it('should ignore invalid per_page values', () => {
      const query: PaginatedQuery = {
        page: 1,
        per_page: 5000 // Over limit
      };

      const params = buildPaginationParams(query);
      
      expect(params.get('page')).toBe('1');
      expect(params.get('per_page')).toBeNull();
    });

    it('should handle empty query', () => {
      const params = buildPaginationParams({});
      
      expect(params.toString()).toBe('');
    });

    it('should ignore negative per_page values', () => {
      const query: PaginatedQuery = {
        page: 1,
        per_page: -10
      };

      const params = buildPaginationParams(query);
      
      expect(params.get('per_page')).toBeNull();
    });
  });

  describe('extractPaginationInfo', () => {
    it('should extract pagination info from response', () => {
      const response = {
        page: 2,
        per_page: 50,
        total_pages: 5,
        total_entries: 250,
        next_page: 3,
        previous_page: 1
      };

      const info = extractPaginationInfo(response);
      
      expect(info.page).toBe(2);
      expect(info.per_page).toBe(50);
      expect(info.total_pages).toBe(5);
      expect(info.total_entries).toBe(250);
      expect(info.next_page).toBe(3);
      expect(info.previous_page).toBe(1);
    });

    it('should use defaults for missing values', () => {
      const response = {};

      const info = extractPaginationInfo(response);
      
      expect(info.page).toBe(1);
      expect(info.per_page).toBe(2000);
      expect(info.total_pages).toBe(1);
      expect(info.total_entries).toBe(0);
      expect(info.next_page).toBeNull();
      expect(info.previous_page).toBeNull();
    });
  });

  describe('buildPaginatedResponse', () => {
    it('should build paginated response with data and links', () => {
      const data = [{ id: 1, name: 'Item 1' }];
      const paginationData = {
        page: 1,
        per_page: 50,
        total_pages: 3,
        total_entries: 150,
        next_page: 2,
        previous_page: null,
        links: {
          first: 'https://api.test.com?page=1',
          next: 'https://api.test.com?page=2',
          previous: null,
          last: 'https://api.test.com?page=3'
        }
      };

      const response = buildPaginatedResponse(data, paginationData);
      
      expect(response.data).toEqual(data);
      expect(response.pagination.page).toBe(1);
      expect(response.pagination.next_page).toBe(2);
      expect(response.links.first).toBe('https://api.test.com?page=1');
      expect(response.links.next).toBe('https://api.test.com?page=2');
      expect(response.links.previous).toBeNull();
    });

    it('should handle missing links', () => {
      const data = [{ id: 1 }];
      const paginationData = { page: 1 };

      const response = buildPaginatedResponse(data, paginationData);
      
      expect(response.links.first).toBe('');
      expect(response.links.next).toBeNull();
      expect(response.links.previous).toBeNull();
      expect(response.links.last).toBe('');
    });
  });

  describe('hasNextPage', () => {
    it('should return true when next page exists', () => {
      const pagination: PaginationInfo = {
        page: 2,
        per_page: 50,
        total_pages: 5,
        total_entries: 250,
        next_page: 3,
        previous_page: 1
      };

      expect(hasNextPage(pagination)).toBe(true);
    });

    it('should return false when no next page', () => {
      const pagination: PaginationInfo = {
        page: 5,
        per_page: 50,
        total_pages: 5,
        total_entries: 250,
        next_page: null,
        previous_page: 4
      };

      expect(hasNextPage(pagination)).toBe(false);
    });

    it('should return false when on last page', () => {
      const pagination: PaginationInfo = {
        page: 3,
        per_page: 50,
        total_pages: 3,
        total_entries: 150,
        next_page: 4, // Has next_page but current page equals total_pages
        previous_page: 2
      };

      expect(hasNextPage(pagination)).toBe(false);
    });
  });

  describe('hasPreviousPage', () => {
    it('should return true when previous page exists', () => {
      const pagination: PaginationInfo = {
        page: 3,
        per_page: 50,
        total_pages: 5,
        total_entries: 250,
        next_page: 4,
        previous_page: 2
      };

      expect(hasPreviousPage(pagination)).toBe(true);
    });

    it('should return false when on first page', () => {
      const pagination: PaginationInfo = {
        page: 1,
        per_page: 50,
        total_pages: 5,
        total_entries: 250,
        next_page: 2,
        previous_page: null
      };

      expect(hasPreviousPage(pagination)).toBe(false);
    });
  });

  describe('getNextPageNumber', () => {
    it('should return next page number when available', () => {
      const pagination: PaginationInfo = {
        page: 2,
        per_page: 50,
        total_pages: 5,
        total_entries: 250,
        next_page: 3,
        previous_page: 1
      };

      expect(getNextPageNumber(pagination)).toBe(3);
    });

    it('should return null when no next page', () => {
      const pagination: PaginationInfo = {
        page: 5,
        per_page: 50,
        total_pages: 5,
        total_entries: 250,
        next_page: null,
        previous_page: 4
      };

      expect(getNextPageNumber(pagination)).toBeNull();
    });
  });

  describe('getPreviousPageNumber', () => {
    it('should return previous page number when available', () => {
      const pagination: PaginationInfo = {
        page: 3,
        per_page: 50,
        total_pages: 5,
        total_entries: 250,
        next_page: 4,
        previous_page: 2
      };

      expect(getPreviousPageNumber(pagination)).toBe(2);
    });

    it('should return null when no previous page', () => {
      const pagination: PaginationInfo = {
        page: 1,
        per_page: 50,
        total_pages: 5,
        total_entries: 250,
        next_page: 2,
        previous_page: null
      };

      expect(getPreviousPageNumber(pagination)).toBeNull();
    });
  });

  describe('getAllPages', () => {
    it('should fetch all pages of data', async () => {
      const mockData = [
        [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }],
        [{ id: 3, name: 'Item 3' }, { id: 4, name: 'Item 4' }],
        [{ id: 5, name: 'Item 5' }]
      ];

      const fetchPage = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({
          data: mockData[0],
          pagination: { page: 1, per_page: 2, total_pages: 3, total_entries: 5, next_page: 2, previous_page: null },
          links: { first: '', next: '', previous: null, last: '' }
        }))
        .mockImplementationOnce(() => Promise.resolve({
          data: mockData[1],
          pagination: { page: 2, per_page: 2, total_pages: 3, total_entries: 5, next_page: 3, previous_page: 1 },
          links: { first: '', next: '', previous: '', last: '' }
        }))
        .mockImplementationOnce(() => Promise.resolve({
          data: mockData[2],
          pagination: { page: 3, per_page: 2, total_pages: 3, total_entries: 5, next_page: null, previous_page: 2 },
          links: { first: '', next: null, previous: '', last: '' }
        }));

      const allItems = await getAllPages(fetchPage, 2);
      
      expect(allItems).toHaveLength(5);
      expect(allItems).toEqual([
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
        { id: 4, name: 'Item 4' },
        { id: 5, name: 'Item 5' }
      ]);
      expect(fetchPage).toHaveBeenCalledTimes(3);
    });

    it('should handle single page response', async () => {
      const fetchPage = jest.fn().mockResolvedValue({
        data: [{ id: 1, name: 'Item 1' }],
        pagination: { page: 1, per_page: 2000, total_pages: 1, total_entries: 1, next_page: null, previous_page: null },
        links: { first: '', next: null, previous: null, last: '' }
      });

      const allItems = await getAllPages(fetchPage);
      
      expect(allItems).toHaveLength(1);
      expect(fetchPage).toHaveBeenCalledTimes(1);
      expect(fetchPage).toHaveBeenCalledWith(1, 2000);
    });

    it('should handle empty response', async () => {
      const fetchPage = jest.fn().mockResolvedValue({
        data: [],
        pagination: { page: 1, per_page: 2000, total_pages: 1, total_entries: 0, next_page: null, previous_page: null },
        links: { first: '', next: null, previous: null, last: '' }
      });

      const allItems = await getAllPages(fetchPage);
      
      expect(allItems).toHaveLength(0);
      expect(fetchPage).toHaveBeenCalledTimes(1);
    });
  });
});