/** @format */

"use server"

import { CREATE_INVEST_URL } from "@/lib/EndPointApi"
import axios from "axios"
import { z } from "zod";
export type InvestmentType = "STOCK" | "MUTUAL_FUND" | "CRYPTO";

export interface InvestmentFormData {
  symbol: string;
  accountId: string;
  name: string;
  type: InvestmentType;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  buyDate: string;
}

export interface ApiResponse {
  status: number;
  message?: string;
  errors?: Record<string, string[]>;
  data?: any;
}
interface YahooFinanceResponse {
  quoteSummary: {
    result: Array<{
      price: {
        regularMarketPrice: {
          raw: number
          fmt: string
        }
        currency: string
        symbol: string
        longName?: string
        // Other available fields from the response
        regularMarketChangePercent?: {
          raw: number
          fmt: string
        }
        marketState?: string
        // Add other fields you need
      }
    }>
    error?: any
  }
}

interface StockPriceResponse {
  price: number
  formattedPrice: string
  currency: string
  symbol: string
  name?: string
  changePercent?: number
  formattedChangePercent?: string
  marketState?: string
  error?: string
}

export const getStockPrice = async (
  symbol: string
): Promise<StockPriceResponse> => {
  const options = {
    method: "GET",
    url: "https://yahoo-finance166.p.rapidapi.com/api/stock/get-price",
    params: {
      region: symbol.endsWith(".NS") ? "IN" : "US",
      symbol: symbol,
    },
    headers: {
      "x-rapidapi-key": process.env.X_RAPIDAPI || "",
      "x-rapidapi-host": "yahoo-finance166.p.rapidapi.com",
    },
  }

  try {
    // console.log(options)
    const response = await axios.request<YahooFinanceResponse>(options)
    console.log(response)

    if (!response.data?.quoteSummary?.result?.[0]?.price) {
      return {
        price: 0,
        formattedPrice: "N/A",
        currency: symbol.endsWith(".NS") ? "INR" : "USD",
        symbol,
        error: "Invalid response format",
      }
    }

    const priceData = response.data.quoteSummary.result[0].price
    console.log(priceData)

    return {
      price:
        priceData.currency == "INR"
          ? parseFloat((priceData.regularMarketPrice.raw / 85).toFixed(1))
          : (priceData.regularMarketPrice.raw).toFixed(1),
      formattedPrice: priceData.regularMarketPrice.fmt,
      currency: priceData.currency || (symbol.endsWith(".NS") ? "USD" : "USD"),
      symbol: priceData.symbol,
      name: priceData.longName,
      changePercent: priceData.regularMarketChangePercent?.raw,
      formattedChangePercent: priceData.regularMarketChangePercent?.fmt,
      marketState: priceData.marketState,
    }
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error)
    return {
      price: 0,
      formattedPrice: "N/A",
      currency: symbol.endsWith(".NS") ? "USD" : "USD",
      symbol,
      error: "Failed to fetch stock price",
    }
  }
}

// Updated investment action with better error handling

export const addInvestmentAction = async (
  prevState: any,
  payload: { formData: FormData; token: string }
): Promise<ApiResponse> => {
  const { formData, token } = payload;

  // Authentication check
  if (!token) {
    return {
      status: 401,
      message: "Unauthorized - Please login first",
    };
  }

  // Extract and validate data
  const rawData = {
    symbol: formData.get("symbol"),
    accountId: formData.get("accountId"),
    name: formData.get("name"),
    type: formData.get("type"),
    quantity: formData.get("quantity"),
    buyPrice: formData.get("buyPrice"),
    currentPrice: formData.get("currentPrice"),
    buyDate: formData.get("buyDate"),
  };

  const schema = z.object({
    symbol: z.string().min(1, "Symbol is required"),
    accountId: z.string().min(1, "Account is required"),
    name: z.string().min(1, "Name is required"),
    type: z.enum(["STOCK", "MUTUAL_FUND", "CRYPTO"]),
    quantity: z.coerce
      .number()
      .positive("Quantity must be greater than 0")
      .min(0.00000001, "Quantity must be greater than 0"), // For crypto
    buyPrice: z.coerce
      .number()
      .positive("Buy price must be greater than 0")
      .min(0.00000001, "Buy price must be greater than 0"),
    currentPrice: z.coerce.number().nonnegative("Current price cannot be negative"),
    buyDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  });

  try {
    // Validate data
    const validatedData = schema.parse(rawData);

    // API call
    const response = await axios.post(CREATE_INVEST_URL, validatedData, {
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
    });

    return {
      status: 200,
      data: response.data,
      message: "Investment added successfully",
    };
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return {
        status: 400,
        errors: error.flatten().fieldErrors,
        message: "Validation failed",
      };
    }

    // Handle API errors
    if (axios.isAxiosError(error)) {
      return {
        status: error.response?.status || 500,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to add investment",
      };
    }

    // Handle unexpected errors
    return {
      status: 500,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};


// // Utility function to refresh multiple stock prices
// export const refreshStockPrices = async (symbols: string[]) => {
//   const results = await Promise.all(
//     symbols.map(async (symbol) => {
//       const data = await getStockPrice(symbol)
//       if (!data.error) {
//         // Update database (example with Prisma)
//         // await prisma.investment.updateMany({
//         //   where: { symbol },
//         //   data: { currentPrice: data.price }
//         // })
//       }
//       return { ...data }
//     })
//   )


//   return results
// }
