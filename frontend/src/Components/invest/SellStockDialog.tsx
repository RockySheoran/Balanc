/** @format */

"use client"
import React, { useState, useEffect, useActionState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/Components/ui/dialog"
import { Button } from "@/Components/ui/button"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"
import { toast } from "sonner"
import { Loader2, RefreshCw } from "lucide-react"
import { useFormState, useFormStatus } from "react-dom"
import { sellInvestment } from "@/Actions/investmentApi/investment-actions"


interface Investment {
  id: string
  symbol: string
  name: string
  quantity: number
  buyPrice: number
  currentValue?: number
  buyDate: string
}

interface SellInvestmentDialogProps {
  investment: Investment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const initialState = {
  message: "",
  errors: {
    sellPrice: [],
    sellDate: [],
    quantitySold: [],
  },
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} variant="destructive">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        "Confirm Sale"
      )}
    </Button>
  )
}

export function SellInvestmentDialog({
  investment,
  open,
  onOpenChange,
  onSuccess,
}: SellInvestmentDialogProps) {
  const [priceLoading, setPriceLoading] = useState(false)
  const [state, formAction] = useActionState(sellInvestment, initialState)
  const [formData, setFormData] = useState({
    sellPrice: 0,
    sellDate: new Date().toISOString().split("T")[0],
    quantitySold: 1,
  })

  // Initialize form when investment changes
  useEffect(() => {
    if (investment && open) {
      setFormData({
        sellPrice: investment.currentValue || 0,
        sellDate: new Date().toISOString().split("T")[0],
        quantitySold: 1,
      })
    }
  }, [investment, open])

  const fetchCurrentPrice = async () => {
    if (!investment) return

    try {
      setPriceLoading(true)
      const price = await getStockPrice(investment.symbol)
      setFormData((prev) => ({
        ...prev,
        sellPrice: price.price,
      }))
      toast.success("Current price updated")
    } catch (error) {
      console.error("Failed to fetch stock price:", error)
      toast.error("Failed to fetch current price")
    } finally {
      setPriceLoading(false)
    }
  }

  const handleSubmit = (formData: FormData) => {
    // if (!investment) return

    // formAction(formData)
    //   .then((result) => {
    //     if (result?.success) {
    //       toast.success("Investment sold successfully")
    //       onOpenChange(false)
    //       onSuccess?.()
    //     } else if (result?.errors) {
    //       toast.error("Please fix the errors in the form")
    //     }
    //   })
    //   .catch(() => {
    //     toast.error("Failed to process sale")
    //   })
  }

  const calculateProfitLoss = () => {
    if (!investment) return 0
    return (formData.sellPrice - investment.buyPrice) * formData.quantitySold
  }

  const calculateROI = () => {
    if (!investment || investment.buyPrice === 0) return 0
    return (
      ((formData.sellPrice - investment.buyPrice) / investment.buyPrice) * 100
    )
  }

  const getProfitLossColor = (value: number) => {
    if (value === 0) return "text-foreground"
    return value > 0
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400"
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value)
  }

  if (!investment) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Sell Investment</DialogTitle>
          <DialogDescription>
            Selling {investment.name} ({investment.symbol})
          </DialogDescription>
        </DialogHeader>

        <form action={formAction}>
          <input type="hidden" name="investmentId" value={investment.id} />

          <div className="grid gap-4 py-4">
            {/* Current Holdings */}
            <div className="space-y-2">
              <h4 className="font-medium">Current Holdings</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Quantity</p>
                  <p>{investment.quantity}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg Buy Price</p>
                  <p>{formatCurrency(investment.buyPrice)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Cost</p>
                  <p>
                    {formatCurrency(investment.buyPrice * investment.quantity)}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              {/* Sell Quantity */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantitySold" className="text-right">
                  Quantity to Sell
                </Label>
                <div className="col-span-3">
                  <Input
                    id="quantitySold"
                    name="quantitySold"
                    type="number"
                    min="1"
                    max={investment.quantity}
                    value={formData.quantitySold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantitySold: Math.min(
                          Number(e.target.value),
                          investment.quantity
                        ),
                      })
                    }
                  />
                  {state?.errors?.quantitySold?.map((error, index) => (
                    <p key={index} className="text-sm text-red-500 mt-1">
                      {error}
                    </p>
                  ))}
                  <p className="text-sm text-muted-foreground mt-1">
                    Available: {investment.quantity}
                  </p>
                </div>
              </div>

              {/* Sell Price */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sellPrice" className="text-right">
                  Sell Price
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="sellPrice"
                    name="sellPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.sellPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sellPrice: Math.max(0, Number(e.target.value)),
                      })
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={fetchCurrentPrice}
                    disabled={priceLoading}>
                    {priceLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {state?.errors?.sellPrice?.map((error, index) => (
                  <p
                    key={index}
                    className="col-span-3 col-start-2 text-sm text-red-500">
                    {error}
                  </p>
                ))}
              </div>

              {/* Sell Date */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sellDate" className="text-right">
                  Sell Date
                </Label>
                <div className="col-span-3">
                  <Input
                    id="sellDate"
                    name="sellDate"
                    type="date"
                    value={formData.sellDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sellDate: e.target.value,
                      })
                    }
                  />
                  {state?.errors?.sellDate?.map((error, index) => (
                    <p key={index} className="text-sm text-red-500 mt-1">
                      {error}
                    </p>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Total Value</Label>
                  <div className="col-span-3 font-medium">
                    {formatCurrency(formData.sellPrice * formData.quantitySold)}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Profit/Loss</Label>
                  <div
                    className={`col-span-3 font-medium ${getProfitLossColor(
                      calculateProfitLoss()
                    )}`}>
                    {formatCurrency(calculateProfitLoss())}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">ROI</Label>
                  <div
                    className={`col-span-3 font-medium ${getProfitLossColor(
                      calculateROI()
                    )}`}>
                    {calculateROI().toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Mock function - replace with your actual stock price fetching logic
async function getStockPrice(symbol: string): Promise<{ price: number }> {
  console.log(`Fetching price for ${symbol}`)
  await new Promise((resolve) => setTimeout(resolve, 500))
  return { price: Math.random() * 100 + 50 } // Random price between 50 and 150
}
