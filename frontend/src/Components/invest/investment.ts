/** @format */

export type InvestmentType = "stock" | "crypto" | "mutual-fund"

export interface Investment {
  id: string
  symbol: string
  name: string
  quantity: number
  buyPrice: number
  currentPrice?: number
  buyDate: string
  type: InvestmentType
}
