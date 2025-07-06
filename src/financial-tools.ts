import { FMPClient, CompanyProfile, IncomeStatement, StockPrice } from './fmp-client'

export interface CompanyAnalysis {
  symbol: string
  profile: CompanyProfile
  financials: IncomeStatement[]
  currentPrice: StockPrice
  analysis: {
    peRatio: number
    profitMargin: number
    revenueGrowth: number
  }
}

export interface FinancialRatios {
  symbol: string
  ratios: {
    peRatio: number
    profitMargin: number
    returnOnEquity: number
    debtToEquity: number
    priceToBook: number
  }
  date: string
}

export interface DCFAnalysis {
  symbol: string
  dcfValue: number
  currentPrice: number
  upside: number
  recommendation: string
  analysis: string
}

export interface CompanyComparison {
  companies: Array<{
    symbol: string
    profile: CompanyProfile
    financials: IncomeStatement[]
  }>
  comparison: {
    largestByMarketCap: string
    highestEPS: string
    summary: string
  }
}

export interface SectorAnalysis {
  sector: string
  companies: Array<{
    symbol: string
    profile: CompanyProfile
    currentPrice: StockPrice
  }>
  sectorMetrics: {
    averageMarketCap: number
    averageChange: number
    totalMarketCap: number
    topPerformer: string
  }
}

export class FinancialTools {
  constructor(private fmpClient: FMPClient) {}

  async getCompanyAnalysis(symbol: string): Promise<CompanyAnalysis> {
    const [profile, financials, currentPrice] = await Promise.all([
      this.fmpClient.getCompanyProfile(symbol),
      this.fmpClient.getIncomeStatement(symbol, 5),
      this.fmpClient.getStockPrice(symbol)
    ])

    const latestFinancials = financials[0]
    const previousFinancials = financials[1]

    const peRatio = currentPrice.price / latestFinancials.eps
    const profitMargin = (latestFinancials.netIncome / latestFinancials.revenue) * 100
    const revenueGrowth = previousFinancials 
      ? ((latestFinancials.revenue - previousFinancials.revenue) / previousFinancials.revenue) * 100
      : 0

    return {
      symbol,
      profile,
      financials,
      currentPrice,
      analysis: {
        peRatio: Math.round(peRatio * 100) / 100,
        profitMargin: Math.round(profitMargin * 100) / 100,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100
      }
    }
  }

  async calculateFinancialRatios(symbol: string): Promise<FinancialRatios> {
    const [incomeStatement, balanceSheet, stockPrice] = await Promise.all([
      this.fmpClient.getIncomeStatement(symbol, 5),
      this.fmpClient.getBalanceSheet(symbol, 5),
      this.fmpClient.getStockPrice(symbol)
    ])

    const latestIncome = incomeStatement[0]
    const latestBalance = balanceSheet[0]

    const peRatio = stockPrice.price / latestIncome.eps
    const profitMargin = (latestIncome.netIncome / latestIncome.revenue) * 100
    const returnOnEquity = (latestIncome.netIncome / latestBalance.totalStockholdersEquity) * 100
    const debtToEquity = latestBalance.totalLiabilities / latestBalance.totalStockholdersEquity
    const bookValue = latestBalance.totalStockholdersEquity
    const priceToBook = (stockPrice.price * 1000000000) / bookValue // Assuming shares outstanding approximation

    return {
      symbol,
      ratios: {
        peRatio: Math.round(peRatio * 100) / 100,
        profitMargin: Math.round(profitMargin * 100) / 100,
        returnOnEquity: Math.round(returnOnEquity * 100) / 100,
        debtToEquity: Math.round(debtToEquity * 100) / 100,
        priceToBook: Math.round(priceToBook * 100) / 100
      },
      date: latestIncome.date
    }
  }

  async performDCFAnalysis(symbol: string): Promise<DCFAnalysis> {
    const [dcfData, stockPrice] = await Promise.all([
      this.fmpClient.getDCFValuation(symbol),
      this.fmpClient.getStockPrice(symbol)
    ])

    const upside = ((dcfData.dcf - stockPrice.price) / stockPrice.price) * 100
    
    let recommendation: string
    let analysis: string

    if (upside > 20) {
      recommendation = 'BUY'
      analysis = `Strong buy recommendation. DCF suggests ${upside.toFixed(1)}% upside potential.`
    } else if (upside > 0) {
      recommendation = 'HOLD'
      analysis = `Hold recommendation. DCF suggests modest ${upside.toFixed(1)}% upside potential.`
    } else {
      recommendation = 'SELL'
      analysis = `Sell recommendation. Stock appears overvalued by ${Math.abs(upside).toFixed(1)}%.`
    }

    return {
      symbol,
      dcfValue: dcfData.dcf,
      currentPrice: stockPrice.price,
      upside: Math.round(upside * 100) / 100,
      recommendation,
      analysis
    }
  }

  async compareCompanies(symbols: string[]): Promise<CompanyComparison> {
    if (symbols.length === 0) {
      throw new Error('At least one company symbol is required')
    }

    const companies = await Promise.all(
      symbols.map(async (symbol) => {
        const [profile, financials] = await Promise.all([
          this.fmpClient.getCompanyProfile(symbol),
          this.fmpClient.getIncomeStatement(symbol, 5)
        ])
        return { symbol, profile, financials }
      })
    )

    const largestByMarketCap = companies.reduce((largest, company) => 
      company.profile.marketCap > largest.profile.marketCap ? company : largest
    ).symbol

    const highestEPS = companies.reduce((highest, company) => 
      company.financials[0].eps > highest.financials[0].eps ? company : highest
    ).symbol

    const summary = `Comparison of ${symbols.length} companies. ${largestByMarketCap} has the largest market cap, while ${highestEPS} has the highest EPS.`

    return {
      companies,
      comparison: {
        largestByMarketCap,
        highestEPS,
        summary
      }
    }
  }

  async getMarketSector(symbols: string[]): Promise<SectorAnalysis> {
    const companies = await Promise.all(
      symbols.map(async (symbol) => {
        const [profile, currentPrice] = await Promise.all([
          this.fmpClient.getCompanyProfile(symbol),
          this.fmpClient.getStockPrice(symbol)
        ])
        return { symbol, profile, currentPrice }
      })
    )

    const sector = companies[0]?.profile.sector || 'Unknown'
    const totalMarketCap = companies.reduce((sum, company) => sum + company.profile.marketCap, 0)
    const averageMarketCap = totalMarketCap / companies.length
    const averageChange = companies.reduce((sum, company) => sum + company.currentPrice.changesPercentage, 0) / companies.length
    const topPerformer = companies.reduce((top, company) => 
      company.currentPrice.changesPercentage > top.currentPrice.changesPercentage ? company : top
    ).symbol

    return {
      sector,
      companies,
      sectorMetrics: {
        averageMarketCap: Math.round(averageMarketCap),
        averageChange: Math.round(averageChange * 100) / 100,
        totalMarketCap: Math.round(totalMarketCap),
        topPerformer
      }
    }
  }
}