/** @format */
"use client"

import React, { useState, useEffect } from "react";
import { Button } from "@/Components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/Components/ui/popover";
import { 
  FiPlus, 
  FiX, 
  FiTrendingUp, 
  FiDollarSign, 
  FiBookmark, 
  FiBell,
  FiExternalLink,
  FiArrowRight
} from "react-icons/fi";
import { Skeleton } from "@/Components/ui/skeleton";
import { useAppSelector } from "@/lib/Redux/store/hooks";
import Link from "next/link";
import { Investment } from "@/Components/investment/investment";

export const FinancialAssistant = () => {
  const [open, setOpen] = useState(false);
  const investments = useAppSelector((state) => state.investments.investments);
  const [activeTab, setActiveTab] = useState("recommendations");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate portfolio summary
  const portfolioSummary = investments.reduce(
    (acc, investment) => {
      const value = investment.currentValue || investment.buyPrice;
      const quantity = investment.quantity;
      const invested = investment.buyPrice * quantity;
      const currentValue = value * quantity;
      
      acc.totalInvested += invested;
      acc.currentValue += currentValue;
      acc.profitLoss += (currentValue - invested);
      
      return acc;
    },
    { totalInvested: 0, currentValue: 0, profitLoss: 0 }
  );

  const tabs = [
    { id: "recommendations", label: "Recommend", icon: <FiTrendingUp size={16} /> },
    { id: "news", label: "News", icon: <FiBell size={16} /> },
    { id: "calculators", label: "Tools", icon: <FiDollarSign size={16} /> },
    { id: "insights", label: "Insights", icon: <FiBookmark size={16} /> },
  ];

  return (
    <div className={`fixed ${isMobile ? 'bottom-4 right-4' : 'bottom-6 right-6'} z-50`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="default"
            size="lg"
            className={`rounded-full ${isMobile ? 'w-12 h-12' : 'w-14 h-14'} p-0 shadow-lg bg-blue-600 hover:bg-blue-700 transition-all`}
            aria-label="Financial assistant"
          >
            {open ? <FiX size={isMobile ? 20 : 24} /> : <FiPlus size={isMobile ? 20 : 24} />}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className={`${isMobile ? 'w-[90vw] h-[80vh]' : 'w-[350px] h-[500px]'} p-0 mr-2 mb-2`}
          align={isMobile ? "center" : "end"}
        >
          <div className="flex flex-col h-full rounde-2xl">
            {/* Header */}
            <div className="border-b p-4 rounded-[10px] bg-gradient-to-r from-blue-600 to-blue-500 text-white">
              <h3 className="font-bold text-lg">Financial Assistant</h3>
              <p className="text-sm text-blue-100">
                Your personal finance helper
              </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`flex-1 py-3 text-sm font-medium flex flex-col items-center justify-center gap-1 ${activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {activeTab === "recommendations" && (
                <RecommendationsTab summary={portfolioSummary} investments={investments} />
              )}
              {activeTab === "news" && <NewsTab investments={investments} />}
              {activeTab === "calculators" && <CalculatorsTab />}
              {activeTab === "insights" && <InsightsTab investments={investments} />}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

const RecommendationsTab = ({ 
  summary, 
  investments 
}: { 
  summary: { totalInvested: number; currentValue: number; profitLoss: number },
  investments: Investment[]
}) => {
  const profitPercentage = summary.totalInvested > 0 
    ? (summary.profitLoss / summary.totalInvested) * 100 
    : 0;

  // Get top 3 holdings by value
  const topHoldings = [...investments]
    .sort((a, b) => (b.currentValue || b.buyPrice) * b.quantity - (a.currentValue || a.buyPrice) * a.quantity)
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <FiTrendingUp className="text-blue-600" />
          Portfolio Summary
        </h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-300">Invested:</span>
            <span className="font-medium">${summary.totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-300">Current Value:</span>
            <span className="font-medium">${summary.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-300">Profit/Loss:</span>
            <span className={`font-medium ${summary.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${summary.profitLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({profitPercentage.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <FiBookmark className="text-yellow-500" />
          Top Holdings
        </h4>
        <div className="space-y-3">
          {topHoldings.map((investment) => {
            const value = (investment.currentValue || investment.buyPrice) * investment.quantity;
            const percentage = (value / summary.currentValue) * 100;
            
            return (
              <Link 
                key={investment.id} 
                href={`/investments/${investment.id}`}
                className="block p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-medium">{investment.symbol}</h5>
                    <p className="text-sm text-gray-500">{investment.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-100 dark:border-yellow-800">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <FiBell className="text-yellow-600" />
          Recommendations
        </h4>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 mt-0.5">•</span>
            <span>Consider diversifying your portfolio with international stocks</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 mt-0.5">•</span>
            <span>Set price alerts for your top holdings</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 mt-0.5">•</span>
            <span>Review your asset allocation quarterly</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

const NewsTab = ({ investments }: { investments: Investment[] }) => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Mock data - in a real app you'd fetch from a news API
  const mockNews = [
    {
      id: 1,
      title: "Tech stocks rally as earnings season begins",
      source: "Bloomberg",
      time: "2h ago",
      url: "https://www.bloomberg.com/tech-stocks-rally",
      relatedStocks: ["AAPL", "MSFT", "GOOGL"]
    },
    {
      id: 2,
      title: "Fed signals potential rate cuts in Q3",
      source: "Financial Times",
      time: "5h ago",
      url: "https://www.ft.com/fed-rate-cuts",
      relatedStocks: []
    },
    {
      id: 3,
      title: "Energy sector faces headwinds amid oil price volatility",
      source: "Wall Street Journal",
      time: "1d ago",
      url: "https://www.wsj.com/energy-sector",
      relatedStocks: ["XOM", "CVX"]
    },
  ];

  // Find news related to user's investments
  const relatedNews = mockNews.filter(article => 
    article.relatedStocks.some(stock => 
      investments.some(inv => inv.symbol.includes(stock))
    )
  );

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <FiBell className="text-blue-500" />
          Market News
        </h4>
        <div className="space-y-3">
          {mockNews.map((item) => (
            <a 
              key={item.id} 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
            >
              <h5 className="font-medium group-hover:text-blue-600 transition-colors">{item.title}</h5>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-gray-500">{item.source} • {item.time}</span>
                <FiExternalLink className="text-gray-400 group-hover:text-blue-600 transition-colors" size={14} />
              </div>
            </a>
          ))}
        </div>
      </div>

      {relatedNews.length > 0 && (
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <FiTrendingUp className="text-green-500" />
            News About Your Holdings
          </h4>
          <div className="space-y-3">
            {relatedNews.map((item) => (
              <a 
                key={item.id} 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-3 border rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors group border-green-100 dark:border-green-800"
              >
                <h5 className="font-medium group-hover:text-green-600 transition-colors">{item.title}</h5>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-500">{item.source} • {item.time}</span>
                  <FiExternalLink className="text-gray-400 group-hover:text-green-600 transition-colors" size={14} />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CalculatorsTab = () => {
  const [activeCalculator, setActiveCalculator] = useState("sip");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={activeCalculator === "sip" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveCalculator("sip")}
          className="flex-shrink-0"
        >
          SIP Calculator
        </Button>
        <Button
          variant={activeCalculator === "lumpsum" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveCalculator("lumpsum")}
          className="flex-shrink-0"
        >
          Lumpsum
        </Button>
        <Button
          variant={activeCalculator === "profit" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveCalculator("profit")}
          className="flex-shrink-0"
        >
          Profit
        </Button>
        <Button
          variant={activeCalculator === "retirement" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveCalculator("retirement")}
          className="flex-shrink-0"
        >
          Retirement
        </Button>
      </div>

      {activeCalculator === "sip" && <SipCalculator />}
      {activeCalculator === "lumpsum" && <LumpsumCalculator />}
      {activeCalculator === "profit" && <ProfitCalculator />}
      {activeCalculator === "retirement" && <RetirementCalculator />}
    </div>
  );
};

const SipCalculator = () => {
  const [amount, setAmount] = useState(10000);
  const [duration, setDuration] = useState(10);
  const [rate, setRate] = useState(12);
  const [result, setResult] = useState(0);

  const calculate = () => {
    const months = duration * 12;
    const monthlyRate = rate / 12 / 100;
    const futureValue = amount * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
    setResult(parseFloat(futureValue.toFixed(2)));
  };

  return (
    <div className="space-y-4 ">
      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Monthly Investment (₹)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full pl-8 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="500"
              step="500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Duration (years)</label>
          <input
            type="range"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            min="1"
            max="30"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 yr</span>
            <span>{duration} yrs</span>
            <span>30 yrs</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Expected Return (%)</label>
          <input
            type="range"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            min="1"
            max="30"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1%</span>
            <span>{rate}%</span>
            <span>30%</span>
          </div>
        </div>
      </div>
      
      <Button 
        onClick={calculate} 
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        Calculate
      </Button>
      
      {result > 0 && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Invested Amount</div>
              <div className="text-lg font-semibold">₹{(amount * duration * 12).toLocaleString()}</div>
            </div>
            <FiArrowRight className="text-gray-400" />
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-300">Estimated Returns</div>
              <div className="text-lg font-semibold text-green-600">₹{(result - (amount * duration * 12)).toLocaleString()}</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-green-100 dark:border-green-800">
            <div className="text-sm text-gray-600 dark:text-gray-300">Total Value</div>
            <div className="text-2xl font-bold text-green-600">₹{result.toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  );
};

const LumpsumCalculator = () => {
  const [amount, setAmount] = useState(100000);
  const [duration, setDuration] = useState(5);
  const [rate, setRate] = useState(12);
  const [result, setResult] = useState(0);

  const calculate = () => {
    const futureValue = amount * Math.pow(1 + (rate / 100), duration);
    setResult(parseFloat(futureValue.toFixed(2)));
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Investment Amount (₹)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full pl-8 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="1000"
              step="1000"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Duration (years)</label>
          <input
            type="range"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            min="1"
            max="30"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 yr</span>
            <span>{duration} yrs</span>
            <span>30 yrs</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Expected Return (%)</label>
          <input
            type="range"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            min="1"
            max="30"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1%</span>
            <span>{rate}%</span>
            <span>30%</span>
          </div>
        </div>
      </div>
      
      <Button 
        onClick={calculate} 
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        Calculate
      </Button>
      
      {result > 0 && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Invested Amount</div>
              <div className="text-lg font-semibold">₹{amount.toLocaleString()}</div>
            </div>
            <FiArrowRight className="text-gray-400" />
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-300">Estimated Returns</div>
              <div className="text-lg font-semibold text-blue-600">₹{(result - amount).toLocaleString()}</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-800">
            <div className="text-sm text-gray-600 dark:text-gray-300">Total Value</div>
            <div className="text-2xl font-bold text-blue-600">₹{result.toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProfitCalculator = () => {
  const [buyPrice, setBuyPrice] = useState(100);
  const [sellPrice, setSellPrice] = useState(150);
  const [quantity, setQuantity] = useState(10);
  const [result, setResult] = useState({ profit: 0, percentage: 0 });

  const calculate = () => {
    const profit = (sellPrice - buyPrice) * quantity;
    const percentage = ((sellPrice - buyPrice) / buyPrice) * 100;
    setResult({
      profit: parseFloat(profit.toFixed(2)),
      percentage: parseFloat(percentage.toFixed(2))
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Buy Price (₹)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
            <input
              type="number"
              value={buyPrice}
              onChange={(e) => setBuyPrice(Number(e.target.value))}
              className="w-full pl-8 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0.01"
              step="0.01"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Sell Price (₹)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
            <input
              type="number"
              value={sellPrice}
              onChange={(e) => setSellPrice(Number(e.target.value))}
              className="w-full pl-8 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0.01"
              step="0.01"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Quantity</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="1"
          />
        </div>
      </div>
      
      <Button 
        onClick={calculate} 
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        Calculate
      </Button>
      
      {(result.profit !== 0 || result.percentage !== 0) && (
        <div className={`mt-4 p-4 rounded-lg border ${
          result.profit >= 0 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'
        }`}>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-300">Profit/Loss</div>
            <div className={`text-2xl font-bold ${
              result.profit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ₹{Math.abs(result.profit).toLocaleString()} ({result.percentage.toFixed(2)}%)
            </div>
            <div className="mt-2 text-sm">
              {result.profit >= 0 ? (
                <span className="text-green-600">You made a profit!</span>
              ) : (
                <span className="text-red-600">You incurred a loss</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RetirementCalculator = () => {
  return (
    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-800">
      <h4 className="font-medium mb-2 text-yellow-800 dark:text-yellow-200">Retirement Calculator</h4>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        This advanced calculator will help you plan your retirement savings.
      </p>
      <Button className="w-full mt-3 bg-yellow-500 hover:bg-yellow-600 text-white">
        Coming Soon
      </Button>
    </div>
  );
};

const InsightsTab = ({ investments }: { investments: Investment[] }) => {
  const topPerformers = [...investments]
    .sort((a, b) => {
      const aReturn = ((a.currentValue || a.buyPrice) - a.buyPrice) / a.buyPrice;
      const bReturn = ((b.currentValue || b.buyPrice) - b.buyPrice) / b.buyPrice;
      return bReturn - aReturn;
    })
    .slice(0, 3);

  const worstPerformers = [...investments]
    .sort((a, b) => {
      const aReturn = ((a.currentValue || a.buyPrice) - a.buyPrice) / a.buyPrice;
      const bReturn = ((b.currentValue || b.buyPrice) - b.buyPrice) / b.buyPrice;
      return aReturn - bReturn;
    })
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <FiTrendingUp className="text-green-500" />
          Top Performers
        </h4>
        <div className="space-y-3">
          {topPerformers.map((investment) => {
            const returnPct = (((investment.currentValue || investment.buyPrice) - investment.buyPrice) / investment.buyPrice) * 100;
            return (
              <Link 
                key={investment.id} 
                href={`/investments/${investment.id}`}
                className="block p-3 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors border border-green-100 dark:border-green-800"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-medium">{investment.symbol}</h5>
                    <p className="text-sm text-gray-500">{investment.name}</p>
                  </div>
                  <span className={`text-lg font-semibold ${returnPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {returnPct.toFixed(2)}%
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <FiTrendingUp className="text-red-500 transform rotate-180" />
          Underperformers
        </h4>
        <div className="space-y-3">
          {worstPerformers.map((investment) => {
            const returnPct = (((investment.currentValue || investment.buyPrice) - investment.buyPrice) / investment.buyPrice) * 100;
            return (
              <Link 
                key={investment.id} 
                href={`/investments/${investment.id}`}
                className="block p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-100 dark:border-red-800"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-medium">{investment.symbol}</h5>
                    <p className="text-sm text-gray-500">{investment.name}</p>
                  </div>
                  <span className={`text-lg font-semibold ${returnPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {returnPct.toFixed(2)}%
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <FiBookmark className="text-blue-500" />
          Asset Allocation
        </h4>
        <div className="h-40 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          <span className="text-gray-500">Pie chart visualization coming soon</span>
        </div>
      </div>
    </div>
  );
};