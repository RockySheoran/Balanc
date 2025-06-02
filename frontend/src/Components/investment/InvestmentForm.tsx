"use client";
import React, { useState, useEffect, useMemo, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { Button } from "@/Components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/Components/ui/dialog";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { Card, CardContent } from "@/Components/ui/card";
import { Loader2, Search } from "lucide-react";
import { addInvestmentAction, ApiResponse, getStockPrice } from "@/Actions/investmentApi/fetchStockPrice";
import { useAppDispatch, useAppSelector } from "@/lib/Redux/store/hooks";
import { toast } from "sonner";
import { addInvestmentToState } from "@/lib/Redux/features/investmentSlice/investmentSlice";
import { popularStocks } from "./allStock-Array";


export type InvestmentType = "STOCK" | "MUTUAL_FUND" | "CRYPTO";
interface InvestmentFormProps {
  open: boolean;
  onClose: () => void;
}

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full cursor-pointer sm:w-auto min-w-[120px]"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Adding...
        </>
      ) : (
        "Add Investment"
      )}
    </Button>
  );
};

const InvestmentForm = ({ open, onClose }: InvestmentFormProps) => {
  const { selectedAccount } = useAppSelector((state) => state.account);
  const { token } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState({
    accountId: selectedAccount?.id || "",
    symbol: "",
    name: "",
    quantity: 1,
    buyPrice: 0,
    currentPrice: 0,
    buyDate: new Date().toISOString().split("T")[0],
    type: "STOCK" as InvestmentType,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [priceLoading, setPriceLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "indian" | "international" | "crypto" | "mf"
  >("all");

  // Handle form submission response
  const [state, formAction] = useActionState(addInvestmentAction, null);

  useEffect(() => {
    if (!state) return;

    switch (state.status) {
      case 200:
        toast.success(state.message || "Investment added successfully!");
        dispatch(  addInvestmentToState   (state.data?.data?.investment));
        onClose();
        break;
      case 400:
        // Display validation errors
        if (state.errors) {
          Object.entries(state.errors).forEach(([field, messages]) => {
            const message = Array.isArray(messages) ? messages.join(", ") : messages;
            toast.error(`${field}: ${message}`);
          });
        } else {
          toast.error(state.message || "Validation failed");
        }
        break;
      case 401:
        toast.error(state.message || "Please login again");
        break;
      case 500:
        toast.error(state.message || "Server error occurred");
        break;
      default:
        toast.error(state.message || "An error occurred");
    }
  }, [state, dispatch, onClose]);

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
      });
      setSearchTerm("");
      setSelectedCategory("all");
    }
  }, [open, selectedAccount?.id]);

  // Filter stocks based on search and category
  const filteredStocks = useMemo(() => {
    let result = popularStocks;

    // Apply category filter
    if (selectedCategory !== "all") {
      result = result.filter((stock) => {
        if (selectedCategory === "indian") return stock.symbol.endsWith(".NS");
        if (selectedCategory === "international")
          return !stock.symbol.endsWith(".NS") && !stock.symbol.includes("-USD");
        if (selectedCategory === "crypto") return stock.symbol.includes("-USD");
        if (selectedCategory === "mf") return stock.name.includes("Fund");
        return true;
      });
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (stock) =>
          stock.symbol.toLowerCase().includes(term) ||
          stock.name.toLowerCase().includes(term)
      );
    }

    return result;
  }, [searchTerm, selectedCategory]);

  // Handle stock selection
  const handleStockSelect = async (symbol: string) => {
    const selectedStock = popularStocks.find((stock) => stock.symbol === symbol);
    if (!selectedStock) return;

    setFormData((prev) => ({
      ...prev,
      symbol: selectedStock.symbol,
      name: selectedStock.name,
      type: selectedStock.symbol.includes("-USD")
        ? "CRYPTO"
        : selectedStock.name.includes("Fund")
        ? "MUTUAL_FUND"
        : "STOCK",
    }));

    setPriceLoading(true);
    try {
      const price = await getStockPrice(selectedStock.symbol);
      setFormData((prev) => ({
        ...prev,
        currentPrice: price.price,
        buyPrice: price.price,
      }));
    } catch (error) {
      console.error("Failed to fetch stock price:", error);
      toast.error("Failed to fetch current price");
    } finally {
      setPriceLoading(false);
    }
  };

  const currencySymbol = "USD";
  const totalInvestment = formData.buyPrice * formData.quantity;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[650px] max-h-[90dvh] overflow-y-auto p-0 mx-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-1 sm:p-6"
        >
          <div className="flex justify-between items-start mb-4">
            <DialogHeader className="text-left p-0">
              <DialogTitle className="text-xl  sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Add Investment
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Track stocks, mutual funds, and crypto
              </DialogDescription>
            </DialogHeader>
          </div>

          <form
            action={(formData) => formAction({ formData, token: token || "" })}
            className="space-y-4"
          >
            {/* Hidden fields for form submission */}
            <input type="hidden" name="symbol" value={formData.symbol} />
            <input type="hidden" name="accountId" value={formData.accountId} />
            <input type="hidden" name="name" value={formData.name} />
            <input
              type="hidden"
              name="currentPrice"
              value={formData.currentPrice}
            />
            <input type="hidden" name="type" value={formData.type} />

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="type">Investment Type</Label>
                <Select
                  name="type"
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as InvestmentType })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STOCK">Stock</SelectItem>
                    {/* <SelectItem value="MUTUAL_FUND">Mutual Fund</SelectItem>
                    <SelectItem value="CRYPTO">Cryptocurrency</SelectItem> */}
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
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

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
                  onValueChange={(value) => setSelectedCategory(value as any)}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="indian">Indian</SelectItem>
                    <SelectItem value="international">International</SelectItem>
                    {/* <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="mf">Mutual Funds</SelectItem> */}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                {filteredStocks.length > 0 ? (
                  <Card className="h-[200px] overflow-y-auto">
                    <CardContent className="p-2">
                      {filteredStocks.map((stock) => (
                        <motion.div
                          key={stock.symbol}
                          whileTap={{ scale: 0.98 }}
                          className={`p-2 rounded hover:bg-accent cursor-pointer transition-colors ${
                            formData.symbol === stock.symbol ? "bg-accent" : ""
                          }`}
                          onClick={() => handleStockSelect(stock.symbol)}
                        >
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

            {formData.symbol && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
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
                          value={formData.currentPrice.toLocaleString(undefined, {
                            style: "currency",
                            currency: "USD",
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
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
                      min="0.1"
                      step="0.1"
                      value={formData.buyPrice || ""}
                      readOnly={true}
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
                      min="1"
                      step="1"
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

                <div className="pt-2">
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                    <span className="font-medium">Total Investment</span>
                    <span className="font-bold text-blue-600 text-lg">
                      {totalInvestment.toLocaleString(undefined, {
                        style: "currency",
                        currency: currencySymbol,
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 sticky bottom-0 bg-background pb-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="w-full cursor-pointer sm:w-auto"
              >
                Cancel
              </Button>
              <SubmitButton />
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default InvestmentForm;




