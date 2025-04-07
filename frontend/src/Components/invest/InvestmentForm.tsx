/** @format */

"use client"
import React, { useState, useEffect, useActionState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/Components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/Components/ui/dialog"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select"
import { Card, CardContent } from "@/Components/ui/card"
import { Loader2, Search, X } from "lucide-react"
import {
  addInvestmentAction,
  getStockPrice,
} from "@/Actions/investmentApi/fetchStockPrice"
import { useAppDispatch, useAppSelector } from "@/lib/Redux/store/hooks"
import { toast } from "sonner"
import { addBackendInvestment } from "@/lib/Redux/features/investmentSlice/investmentSlice"

// Stock data remains the same as before
const popularStocks = [
  // Indian Stocks (NSE)
  { symbol: "RELIANCE.NS", name: "Reliance Industries Ltd" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services Ltd" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank Ltd" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank Ltd" },
  { symbol: "INFY.NS", name: "Infosys Ltd" },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever Ltd" },
  { symbol: "ITC.NS", name: "ITC Ltd" },
  { symbol: "SBIN.NS", name: "State Bank of India" },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel Ltd" },
  { symbol: "LT.NS", name: "Larsen & Toubro Ltd" },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank Ltd" },
  { symbol: "AXISBANK.NS", name: "Axis Bank Ltd" },
  { symbol: "ASIANPAINT.NS", name: "Asian Paints Ltd" },
  { symbol: "HCLTECH.NS", name: "HCL Technologies Ltd" },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki India Ltd" },

  // US Stocks
  { symbol: "AAPL", name: "Apple Inc" },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "GOOGL", name: "Alphabet Inc (Google)" },
  { symbol: "AMZN", name: "Amazon.com Inc" },
  { symbol: "META", name: "Meta Platforms Inc (Facebook)" },
  { symbol: "TSLA", name: "Tesla Inc" },
  { symbol: "NVDA", name: "NVIDIA Corporation" },
  { symbol: "JPM", name: "JPMorgan Chase & Co" },
  { symbol: "V", name: "Visa Inc" },
  { symbol: "WMT", name: "Walmart Inc" },

  // Other International
  { symbol: "005930.KS", name: "Samsung Electronics (Korea)" },
  { symbol: "9984.T", name: "SoftBank Group (Japan)" },
  { symbol: "BABA", name: "Alibaba Group (China)" },
  { symbol: "TSM", name: "Taiwan Semiconductor (TSMC)" },
  { symbol: "NESN.SW", name: "Nestlé (Switzerland)" },
  { symbol: "HSBA.L", name: "HSBC Holdings (UK)" },
  { symbol: "BP.L", name: "BP plc (UK)" },

  // Cryptocurrencies
  { symbol: "BTC-USD", name: "Bitcoin" },
  { symbol: "ETH-USD", name: "Ethereum" },
  { symbol: "BNB-USD", name: "Binance Coin" },
  { symbol: "SOL-USD", name: "Solana" },
  { symbol: "XRP-USD", name: "Ripple" },

  // Indian Mutual Funds (example)
  { symbol: "MIRAE_EMERGE", name: "Mirae Asset Emerging Bluechip Fund" },
  { symbol: "AXIS_MIDCAP", name: "Axis Midcap Fund" },
  { symbol: "PPFAS_LONGTERM", name: "PPFAS Long Term Equity Fund" },
]

interface InvestmentFormProps {
  open: boolean
  onClose: () => void
}

const SubmitButton = () => {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto min-w-[120px]">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Adding...
        </>
      ) : (
        "Add Investment"
      )}
    </Button>
  )
}

const initialState = {
  message: "",
  status: 0,
  errors: {},
  data: {},
}

const InvestmentForm = ({ open, onClose }: InvestmentFormProps) => {
  const { selectedAccount } = useAppSelector((state) => state.account)
  const [state, formAction] = useActionState(addInvestmentAction, initialState)
  const { token } = useAppSelector((state) => state.user)

  //  const submitWithToken = async (formData: FormData) => {
    
  //    formData.append("token", token || "") // Append to form data
  //    return formAction(formData)
  //  }
  const dispatch = useAppDispatch()
  useEffect(() => {
    if (state?.success) {
      toast.success("Investment added successfully!")
      console.log("Investment added successfully:", state.data)
      console.log(state.data.data.investment + "gerrthty")
      dispatch(addBackendInvestment(state.data.data.investment))

      onClose()
    } else if (state?.success === false) {
      toast.error(state.message || "Investment addition failed")
      console.error("Investment addition failed:", state.errors)
      // console.error('Error:', state.error)
    }
  }, [state])
  // State management remains the same
  const [formData, setFormData] = useState({
    accountId: selectedAccount?.id,
    symbol: "",
    name: "",
    quantity: 1,
    buyPrice: 0,
    currentPrice: 0,
    buyDate: new Date().toISOString().split("T")[0],
    type: "STOCK",
  })

  const [searchTerm, setSearchTerm] = useState("")
  const [priceLoading, setPriceLoading] = useState(false)
  const [filteredStocks, setFilteredStocks] = useState(popularStocks)
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "indian" | "international" | "crypto" | "mf"
  >("all")

  // Filter stocks based on search term and category
  useEffect(() => {
    let result = popularStocks

    // Apply category filter
    if (selectedCategory !== "all") {
      result = result.filter((stock) => {
        if (selectedCategory === "indian") return stock.symbol.endsWith(".NS")
        if (selectedCategory === "international")
          return !stock.symbol.endsWith(".NS") && !stock.symbol.includes("-USD")
        if (selectedCategory === "crypto") return stock.symbol.includes("-USD")
        if (selectedCategory === "mf") return stock.name.includes("Fund")
        return true
      })
    }

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (stock) =>
          stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stock.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredStocks(result)
  }, [searchTerm, selectedCategory])

  // Reset form when opening/closing
  useEffect(() => {
    if (open) {
      setFormData({
        accountId: selectedAccount?.id || "",
        symbol: "",
        name: "",
        quantity: 1,
        buyPrice: 0,
        currentPrice: 0,
        buyDate: new Date().toISOString().split("T")[0],
        type: "STOCK",
      })
      setSearchTerm("")
      setSelectedCategory("all")
    }
  }, [open])

const handleStockSelect = async (symbol: string) => {
  const selectedStock = popularStocks.find((stock) => stock.symbol === symbol)
  if (!selectedStock) return

  setFormData((prev) => ({
    ...prev,
    symbol: selectedStock.symbol,
    name: selectedStock.name,
    type: selectedStock.symbol.includes("-USD")
      ? "CRYPTO"
      : selectedStock.name.includes("Fund")
      ? "MUTUAL_FUND"
      : "STOCK",
  }))

  setPriceLoading(true)
  try {
    const price = await getStockPrice(selectedStock.symbol)
    setFormData((prev) => ({
      ...prev,
      currentPrice: price.price,
      buyPrice: price.price,
    }))
  } catch (error) {
    console.error("Failed to fetch stock price:", error)
    toast.error("Failed to fetch current price")
  } finally {
    setPriceLoading(false)
  }
}


  return (
    <div className="">
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[650px]  max-h-[90dvh]  overflow-y-auto  p-0 mx-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-1 sm:p-6">
            {/* Header with close button */}
            <div className="flex justify-between items-start mb-4">
              <DialogHeader className="text-left p-0">
                <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Add Investment
                </DialogTitle>
                <DialogDescription className="text-sm sm:text-base">
                  Track stocks, mutual funds, and crypto
                </DialogDescription>
              </DialogHeader>
              {/* <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close">
              <X className="h-5 w-5 text-gray-500" />
            </button> */}
            </div>

            {state?.error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                {state.error}
              </motion.div>
            )}

            <form
              action={(formData) => formAction({ formData, token: token || "" })}
              className="space-y-4 ">
              {/* Hidden inputs remain the same */}
              <input type="hidden" name="symbol" value={formData.symbol} />
              <input
                type="hidden"
                name="accountId"
                value={formData.accountId}
              />
              <input type="hidden" name="name" value={formData.name} />
              <input
                type="hidden"
                name="currentPrice"
                value={formData.currentPrice}
              />

              {/* Type and Date - Stack on mobile, side by side on desktop */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="type">Investment Type</Label>
                  <Select
                    name="type"
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value as any })
                    }>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STOCK">Stock</SelectItem>
                      <SelectItem value="MUTUAL_FUND">Mutual Fund</SelectItem>
                      <SelectItem value="CRYPTO">Cryptocurrency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 space-y-2">
                  <Label htmlFor="buyDate">Purchase Date</Label>
                  <Input
                    type="date"
                    name="buyDate"
                    value={formData.buyDate}
                    onChange={(e) =>
                      setFormData({ ...formData, buyDate: e.target.value })
                    }
                    className="w-full"
                  />
                </div>
              </div>

              {/* Search Section */}
              <div className="space-y-2">
                <Label>Search Investments</Label>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search stocks..."
                      className="pl-10 w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <Select
                    value={selectedCategory}
                    onValueChange={(value) =>
                      setSelectedCategory(value as any)
                    }>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="indian">Indian</SelectItem>
                      <SelectItem value="international">
                        International
                      </SelectItem>
                      <SelectItem value="crypto">Crypto</SelectItem>
                      <SelectItem value="mf">Mutual Funds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Stock List with fixed height and scroll */}
                <div className="relative">
                  {filteredStocks.length > 0 ? (
                    <Card className="h-[200px] overflow-y-auto">
                      <CardContent className="p-2">
                        {filteredStocks.map((stock) => (
                          <motion.div
                            key={stock.symbol}
                            whileTap={{ scale: 0.98 }}
                            className={`p-2 rounded hover:bg-accent cursor-pointer transition-colors ${
                              formData.symbol === stock.symbol
                                ? "bg-accent"
                                : ""
                            }`}
                            onClick={() => handleStockSelect(stock.symbol)}>
                            <div className="flex justify-between items-center">
                              <div className="font-medium truncate pr-2">
                                {stock.symbol}
                              </div>
                              {stock.symbol.endsWith(".NS") ? (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded whitespace-nowrap">
                                  NSE
                                </span>
                              ) : stock.symbol.includes("-USD") ? (
                                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded whitespace-nowrap">
                                  Crypto
                                </span>
                              ) : null}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {stock.name}
                            </div>
                          </motion.div>
                        ))}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      No matching investments found
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Investment Details */}
              {formData.symbol && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label>Symbol</Label>
                      <Input
                        value={formData.symbol}
                        readOnly
                        className="bg-gray-50 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={formData.name}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Current Price</Label>
                      <div className="relative">
                        {priceLoading ? (
                          <div className="flex items-center h-10 px-3 rounded-md border border-input bg-gray-50 text-sm">
                            <Loader2 className="animate-spin mr-2 h-4 w-4" />
                            Loading...
                          </div>
                        ) : (
                          <Input
                            value={formData.currentPrice.toLocaleString(
                              undefined,
                              {
                                style: "currency",
                                currency: formData.symbol.endsWith(".NS")
                                  ? "INR"
                                  : "USD",
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 6,
                              }
                            )}
                            readOnly
                            className="bg-gray-50 font-mono"
                          />
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="buyPrice">Buy Price</Label>
                      <Input
                        name="buyPrice"
                        type="number"
                        min="0.000001"
                        step="0.000001"
                        value={formData.buyPrice || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            buyPrice: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="[appearance:textfield] font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        name="quantity"
                        type="number"
                        min="0.000001"
                        step="0.000001"
                        value={formData.quantity}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            quantity: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="[appearance:textfield] font-mono"
                      />
                    </div>
                  </div>

                  {/* Total Investment */}
                  <div className="pt-2">
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                      <span className="font-medium">Total Investment</span>
                      <span className="font-bold text-blue-600 text-lg">
                        {(formData.buyPrice * formData.quantity).toLocaleString(
                          undefined,
                          {
                            style: "currency",
                            currency: formData.symbol.endsWith(".NS")
                              ? "INR"
                              : "USD",
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Form Actions - Stack on mobile, inline on desktop */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 sticky bottom-0 bg-background pb-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={state?.pending}
                  className="w-full sm:w-auto">
                  Cancel
                </Button>
                <SubmitButton />
              </div>
            </form>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default InvestmentForm
