import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FinancialTools } from '../src/financial-tools'
import { FMPClient } from '../src/fmp-client'

describe('FinancialTools', () => {
  let financialTools: FinancialTools
  let fmpClient: FMPClient

  beforeEach(() => {
    fmpClient = new FMPClient('test-api-key')
    financialTools = new FinancialTools(fmpClient)
  })

  describe('getCompanyAnalysis', () => {
    it('should return comprehensive company analysis', async () => {
      const mockProfile = {
        symbol: 'AAPL',
        companyName: 'Apple Inc.',
        industry: 'Technology',
        sector: 'Consumer Electronics',
        marketCap: 3000000000000
      }

      const mockIncomeStatement = [{
        symbol: 'AAPL',
        date: '2023-09-30',
        revenue: 383285000000,
        netIncome: 96995000000,
        eps: 6.13
      }]

      const mockStockPrice = {
        symbol: 'AAPL',
        price: 150.25,
        changesPercentage: 2.5,
        change: 3.75
      }

      const makeRequestSpy = vi.spyOn(fmpClient as any, 'makeRequest')
      makeRequestSpy
        .mockResolvedValueOnce([mockProfile])  // getCompanyProfile
        .mockResolvedValueOnce(mockIncomeStatement)  // getIncomeStatement
        .mockResolvedValueOnce([mockStockPrice])  // getStockPrice

      const result = await financialTools.getCompanyAnalysis('AAPL')

      expect(result).toEqual({
        symbol: 'AAPL',
        profile: mockProfile,
        financials: mockIncomeStatement,
        currentPrice: mockStockPrice,
        analysis: {
          peRatio: expect.any(Number),
          profitMargin: expect.any(Number),
          revenueGrowth: expect.any(Number)
        }
      })

      expect(makeRequestSpy).toHaveBeenCalledWith('/profile/AAPL')
      expect(makeRequestSpy).toHaveBeenCalledWith('/income-statement/AAPL', { limit: 5 })
      expect(makeRequestSpy).toHaveBeenCalledWith('/quote/AAPL')
    })

    it('should handle API errors gracefully', async () => {
      const makeRequestSpy = vi.spyOn(fmpClient as any, 'makeRequest')
      makeRequestSpy.mockRejectedValue(new Error('API Error'))

      await expect(financialTools.getCompanyAnalysis('INVALID')).rejects.toThrow('API Error')
    })
  })

  describe('calculateFinancialRatios', () => {
    it('should calculate key financial ratios', async () => {
      const mockIncomeStatement = [{
        symbol: 'AAPL',
        date: '2023-09-30',
        revenue: 383285000000,
        netIncome: 96995000000,
        eps: 6.13
      }]

      const mockBalanceSheet = [{
        symbol: 'AAPL',
        date: '2023-09-30',
        totalAssets: 352755000000,
        totalLiabilities: 290437000000,
        totalStockholdersEquity: 62318000000
      }]

      const mockStockPrice = {
        symbol: 'AAPL',
        price: 150.25,
        changesPercentage: 2.5,
        change: 3.75
      }

      const makeRequestSpy = vi.spyOn(fmpClient as any, 'makeRequest')
      makeRequestSpy
        .mockResolvedValueOnce(mockIncomeStatement)  // getIncomeStatement
        .mockResolvedValueOnce(mockBalanceSheet)  // getBalanceSheet
        .mockResolvedValueOnce([mockStockPrice])  // getStockPrice

      const result = await financialTools.calculateFinancialRatios('AAPL')

      expect(result).toEqual({
        symbol: 'AAPL',
        ratios: {
          peRatio: expect.any(Number),
          profitMargin: expect.any(Number),
          returnOnEquity: expect.any(Number),
          debtToEquity: expect.any(Number),
          priceToBook: expect.any(Number)
        },
        date: '2023-09-30'
      })

      expect(makeRequestSpy).toHaveBeenCalledWith('/income-statement/AAPL', { limit: 5 })
      expect(makeRequestSpy).toHaveBeenCalledWith('/balance-sheet-statement/AAPL', { limit: 5 })
      expect(makeRequestSpy).toHaveBeenCalledWith('/quote/AAPL')
    })
  })

  describe('performDCFAnalysis', () => {
    it('should perform DCF valuation analysis', async () => {
      const mockDCF = {
        symbol: 'AAPL',
        dcf: 145.50,
        stock_price: 150.25
      }

      const mockStockPrice = {
        symbol: 'AAPL',
        price: 150.25,
        changesPercentage: 2.5,
        change: 3.75
      }

      const makeRequestSpy = vi.spyOn(fmpClient as any, 'makeRequest')
      makeRequestSpy
        .mockResolvedValueOnce([mockDCF])  // getDCFValuation
        .mockResolvedValueOnce([mockStockPrice])  // getStockPrice

      const result = await financialTools.performDCFAnalysis('AAPL')

      expect(result).toEqual({
        symbol: 'AAPL',
        dcfValue: 145.50,
        currentPrice: 150.25,
        upside: expect.any(Number),
        recommendation: expect.any(String),
        analysis: expect.any(String)
      })

      expect(makeRequestSpy).toHaveBeenCalledWith('/discounted-cash-flow/AAPL')
      expect(makeRequestSpy).toHaveBeenCalledWith('/quote/AAPL')
    })

    it('should provide buy recommendation when stock is undervalued', async () => {
      const mockDCF = {
        symbol: 'AAPL',
        dcf: 185.00,
        stock_price: 150.25
      }

      const mockStockPrice = {
        symbol: 'AAPL',
        price: 150.25,
        changesPercentage: 2.5,
        change: 3.75
      }

      const makeRequestSpy = vi.spyOn(fmpClient as any, 'makeRequest')
      makeRequestSpy
        .mockResolvedValueOnce([mockDCF])
        .mockResolvedValueOnce([mockStockPrice])

      const result = await financialTools.performDCFAnalysis('AAPL')

      expect(result.recommendation).toBe('BUY')
      expect(result.upside).toBeGreaterThan(0)
    })

    it('should provide sell recommendation when stock is overvalued', async () => {
      const mockDCF = {
        symbol: 'AAPL',
        dcf: 120.00,
        stock_price: 150.25
      }

      const mockStockPrice = {
        symbol: 'AAPL',
        price: 150.25,
        changesPercentage: 2.5,
        change: 3.75
      }

      const makeRequestSpy = vi.spyOn(fmpClient as any, 'makeRequest')
      makeRequestSpy
        .mockResolvedValueOnce([mockDCF])
        .mockResolvedValueOnce([mockStockPrice])

      const result = await financialTools.performDCFAnalysis('AAPL')

      expect(result.recommendation).toBe('SELL')
      expect(result.upside).toBeLessThan(0)
    })
  })

  describe('compareCompanies', () => {
    it('should compare multiple companies', async () => {
      const mockProfile1 = {
        symbol: 'AAPL',
        companyName: 'Apple Inc.',
        industry: 'Technology',
        sector: 'Consumer Electronics',
        marketCap: 3000000000000
      }

      const mockProfile2 = {
        symbol: 'MSFT',
        companyName: 'Microsoft Corporation',
        industry: 'Technology',
        sector: 'Software',
        marketCap: 2800000000000
      }

      const mockIncomeStatement1 = [{
        symbol: 'AAPL',
        date: '2023-09-30',
        revenue: 383285000000,
        netIncome: 96995000000,
        eps: 6.13
      }]

      const mockIncomeStatement2 = [{
        symbol: 'MSFT',
        date: '2023-09-30',
        revenue: 211915000000,
        netIncome: 72361000000,
        eps: 9.65
      }]

      const makeRequestSpy = vi.spyOn(fmpClient as any, 'makeRequest')
      makeRequestSpy
        .mockResolvedValueOnce([mockProfile1])  // getCompanyProfile AAPL
        .mockResolvedValueOnce(mockIncomeStatement1)  // getIncomeStatement AAPL
        .mockResolvedValueOnce([mockProfile2])  // getCompanyProfile MSFT
        .mockResolvedValueOnce(mockIncomeStatement2)  // getIncomeStatement MSFT

      const result = await financialTools.compareCompanies(['AAPL', 'MSFT'])

      expect(result).toEqual({
        companies: [
          expect.objectContaining({ 
            symbol: 'AAPL',
            profile: mockProfile1,
            financials: mockIncomeStatement1
          }),
          expect.objectContaining({ 
            symbol: 'MSFT',
            profile: mockProfile2,
            financials: mockIncomeStatement2
          })
        ],
        comparison: {
          largestByMarketCap: 'AAPL',
          highestEPS: 'MSFT',
          summary: expect.any(String)
        }
      })
    })

    it('should handle empty company list', async () => {
      await expect(financialTools.compareCompanies([])).rejects.toThrow('At least one company symbol is required')
    })

    it('should handle single company', async () => {
      const mockProfile = {
        symbol: 'AAPL',
        companyName: 'Apple Inc.',
        industry: 'Technology',
        sector: 'Consumer Electronics',
        marketCap: 3000000000000
      }

      const mockIncomeStatement = [{
        symbol: 'AAPL',
        date: '2023-09-30',
        revenue: 383285000000,
        netIncome: 96995000000,
        eps: 6.13
      }]

      const makeRequestSpy = vi.spyOn(fmpClient as any, 'makeRequest')
      makeRequestSpy
        .mockResolvedValueOnce([mockProfile])
        .mockResolvedValueOnce(mockIncomeStatement)

      const result = await financialTools.compareCompanies(['AAPL'])

      expect(result.companies).toHaveLength(1)
      expect(result.companies[0].symbol).toBe('AAPL')
    })
  })

  describe('getMarketSector', () => {
    it('should analyze sector performance', async () => {
      const companies = ['AAPL', 'MSFT', 'GOOGL']
      
      const makeRequestSpy = vi.spyOn(fmpClient as any, 'makeRequest')
      
      // Mock responses for each company (profile + stock price)
      companies.forEach(symbol => {
        makeRequestSpy
          .mockResolvedValueOnce([{
            symbol,
            companyName: `${symbol} Inc.`,
            industry: 'Technology',
            sector: 'Technology',
            marketCap: 2000000000000
          }])
          .mockResolvedValueOnce([{
            symbol,
            price: 150,
            changesPercentage: 5.0,
            change: 7.5
          }])
      })

      const result = await financialTools.getMarketSector(companies)

      expect(result).toEqual({
        sector: 'Technology',
        companies: expect.arrayContaining([
          expect.objectContaining({ symbol: 'AAPL' }),
          expect.objectContaining({ symbol: 'MSFT' }),
          expect.objectContaining({ symbol: 'GOOGL' })
        ]),
        sectorMetrics: {
          averageMarketCap: expect.any(Number),
          averageChange: expect.any(Number),
          totalMarketCap: expect.any(Number),
          topPerformer: expect.any(String)
        }
      })
    })
  })
})