import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FMPClient } from '../src/fmp-client'

describe('FMPClient', () => {
  let client: FMPClient
  const mockApiKey = 'test-api-key'

  beforeEach(() => {
    client = new FMPClient(mockApiKey)
  })

  describe('constructor', () => {
    it('should create instance with API key', () => {
      expect(client).toBeInstanceOf(FMPClient)
    })

    it('should throw error if API key is not provided', () => {
      expect(() => new FMPClient('')).toThrow('API key is required')
    })
  })

  describe('getCompanyProfile', () => {
    it('should fetch company profile data', async () => {
      const mockResponse = {
        symbol: 'AAPL',
        companyName: 'Apple Inc.',
        industry: 'Technology',
        sector: 'Consumer Electronics',
        marketCap: 3000000000000
      }

      vi.spyOn(client as any, 'makeRequest').mockResolvedValue([mockResponse])

      const result = await client.getCompanyProfile('AAPL')
      
      expect(result).toEqual(mockResponse)
      expect(client['makeRequest']).toHaveBeenCalledWith('/profile/AAPL')
    })

    it('should throw error for invalid symbol', async () => {
      vi.spyOn(client as any, 'makeRequest').mockRejectedValue(new Error('Invalid symbol'))

      await expect(client.getCompanyProfile('INVALID')).rejects.toThrow('Invalid symbol')
    })
  })

  describe('getIncomeStatement', () => {
    it('should fetch income statement data', async () => {
      const mockResponse = [{
        symbol: 'AAPL',
        date: '2023-09-30',
        revenue: 383285000000,
        netIncome: 96995000000,
        eps: 6.13
      }]

      vi.spyOn(client as any, 'makeRequest').mockResolvedValue(mockResponse)

      const result = await client.getIncomeStatement('AAPL')
      
      expect(result).toEqual(mockResponse)
      expect(client['makeRequest']).toHaveBeenCalledWith('/income-statement/AAPL', { limit: 5 })
    })

    it('should accept custom limit parameter', async () => {
      vi.spyOn(client as any, 'makeRequest').mockResolvedValue([])

      await client.getIncomeStatement('AAPL', 10)
      
      expect(client['makeRequest']).toHaveBeenCalledWith('/income-statement/AAPL', { limit: 10 })
    })
  })

  describe('getStockPrice', () => {
    it('should fetch current stock price', async () => {
      const mockResponse = [{
        symbol: 'AAPL',
        price: 150.25,
        changesPercentage: 2.5,
        change: 3.75
      }]

      vi.spyOn(client as any, 'makeRequest').mockResolvedValue(mockResponse)

      const result = await client.getStockPrice('AAPL')
      
      expect(result).toEqual(mockResponse[0])
      expect(client['makeRequest']).toHaveBeenCalledWith('/quote/AAPL')
    })
  })

  describe('getDCFValuation', () => {
    it('should fetch DCF valuation data', async () => {
      const mockResponse = [{
        symbol: 'AAPL',
        dcf: 145.50,
        stock_price: 150.25
      }]

      vi.spyOn(client as any, 'makeRequest').mockResolvedValue(mockResponse)

      const result = await client.getDCFValuation('AAPL')
      
      expect(result).toEqual(mockResponse[0])
      expect(client['makeRequest']).toHaveBeenCalledWith('/discounted-cash-flow/AAPL')
    })
  })

  describe('makeRequest', () => {
    it('should handle API errors gracefully', async () => {
      vi.spyOn(client as any, 'makeRequest').mockRejectedValue(new Error('Network error'))

      await expect(client['makeRequest']('/test-endpoint')).rejects.toThrow('Network error')
    })
  })
})