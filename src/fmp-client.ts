import axios, { AxiosResponse } from 'axios'

export interface CompanyProfile {
  symbol: string
  companyName: string
  industry: string
  sector: string
  marketCap: number
}

export interface IncomeStatement {
  symbol: string
  date: string
  revenue: number
  netIncome: number
  eps: number
}

export interface StockPrice {
  symbol: string
  price: number
  changesPercentage: number
  change: number
}

export interface DCFValuation {
  symbol: string
  dcf: number
  stock_price: number
}

export interface BalanceSheet {
  symbol: string
  date: string
  totalAssets: number
  totalLiabilities: number
  totalStockholdersEquity: number
}

export class FMPClient {
  private readonly apiKey: string
  private readonly baseURL = 'https://financialmodelingprep.com/api/v3'

  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API key is required')
    }
    this.apiKey = apiKey
  }

  async getCompanyProfile(symbol: string): Promise<CompanyProfile> {
    const response = await this.makeRequest<CompanyProfile[]>(`/profile/${symbol}`)
    return response[0]
  }

  async getIncomeStatement(symbol: string, limit: number = 5): Promise<IncomeStatement[]> {
    return this.makeRequest<IncomeStatement[]>(`/income-statement/${symbol}`, { limit })
  }

  async getStockPrice(symbol: string): Promise<StockPrice> {
    const response = await this.makeRequest<StockPrice[]>(`/quote/${symbol}`)
    return response[0]
  }

  async getDCFValuation(symbol: string): Promise<DCFValuation> {
    const response = await this.makeRequest<DCFValuation[]>(`/discounted-cash-flow/${symbol}`)
    return response[0]
  }

  async getBalanceSheet(symbol: string, limit: number = 5): Promise<BalanceSheet[]> {
    return this.makeRequest<BalanceSheet[]>(`/balance-sheet-statement/${symbol}`, { limit })
  }

  async getCashFlowStatement(symbol: string, limit: number = 5): Promise<any[]> {
    return this.makeRequest<any[]>(`/cash-flow-statement/${symbol}`, { limit })
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios({
        method: 'GET',
        url: `${this.baseURL}${endpoint}`,
        params: {
          apikey: this.apiKey,
          ...params
        }
      })
      return response.data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred')
    }
  }
}