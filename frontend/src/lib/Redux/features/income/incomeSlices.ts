/** @format */

// store/slices/incomeSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface Income {
  id: string
  name: string
  amount: number
  type: "CREDIT" | "INCOME"
  category: string
  date: string
}

interface IncomeState {
  incomes: Income[]
  filteredIncomes: Income[]
  currentPage: number
  itemsPerPage: number
  filters: {
    sort: "asc" | "desc" | "date-asc" | "date-desc" | ""
    category: string
    type: string
    minAmount: number | ""
    maxAmount: number | ""
  }
}

const initialState: IncomeState = {
  incomes: [],
  filteredIncomes: [],
  currentPage: 1,
  itemsPerPage: 5,
  filters: {
    sort: "",
    category: "",
    type: "",
    minAmount: "",
    maxAmount: "",
  },
}

const incomeSlice = createSlice({
  name: "income",
  initialState,
  reducers: {
    addIncome: (state, action: PayloadAction<Omit<Income>>) => {
      const newIncome = {
        ...action.payload,    
        date:action.payload.createdAt,
      }
      state.incomes = [newIncome, ...state.incomes]
      state.filteredIncomes = applyFilters(
        [newIncome, ...state.filteredIncomes],
        state.filters
      )
    },
    deleteIncome: (state, action: PayloadAction<string>) => {
      state.incomes = state.incomes.filter(
        (income) => income.id !== action.payload
      )
      state.filteredIncomes = state.filteredIncomes.filter(
        (income) => income.id !== action.payload
      )
    },
    setFilter: (
      state,
      action: PayloadAction<Partial<IncomeState["filters"]>>
    ) => {
      state.filters = { ...state.filters, ...action.payload }
      state.filteredIncomes = applyFilters(state.incomes, {
        ...state.filters,
        ...action.payload,
      })
      state.currentPage = 1
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload
    },
    resetFilters: (state) => {
     
      state.filters = initialState.filters
      state.filteredIncomes = state.incomes
      state.currentPage = 1
    },
    clearIncome: () => initialState,
  },
})

// Helper function to apply all filters
const applyFilters = (incomes: Income[], filters: IncomeState["filters"]) => {
  let filtered = [...incomes]

  // Category filter
  if (filters.category) {
    filtered = filtered.filter((income) => income.category === filters.category)
  }

  // Type filter
  if (filters.type) {
    filtered = filtered.filter((income) => income.type === filters.type)
  }

  // Amount range filter
  if (filters.minAmount !== "") {
    filtered = filtered.filter((income) => income.amount >= Number(filters.minAmount))
  }
  if (filters.maxAmount !== "") {
    filtered = filtered.filter((income) => income.amount <= Number(filters.maxAmount))
  }

  // Sorting
  switch (filters.sort) {
    case "asc":
      filtered.sort((a, b) => a.amount - b.amount)
      break
    case "desc":
      filtered.sort((a, b) => b.amount - a.amount)
      break
    case "date-asc":
      filtered.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      break
    case "date-desc":
      filtered.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      break
    default:
      // Default sorting (newest first)
      filtered.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
  }

  return filtered
}

// Selectors
export const selectTotalIncome = (state: { income: IncomeState }) =>
  state.income.incomes.reduce(
    (sum, income) =>
      income.type === "CREDIT" || "INCOME"
        ? sum + income.amount
        : sum - income.amount,
    0
  )

export const selectLastMonthIncome = (state: { income: IncomeState }) => {
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  return state.income.incomes
    .filter((income) => new Date(income.date) >= oneMonthAgo)
    .reduce(
      (sum, income) =>
        income.type === "CREDIT" || "INCOME"
          ? sum + income.amount
          : sum - income.amount,
      0
    )
}

export const selectAverageIncome = (state: { income: IncomeState }) => {
  if (state.income.incomes.length === 0) return 0

  const creditIncomes = state.income.incomes.filter(
    (income) => income.type === "CREDIT" || "INCOME"
  )
  if (creditIncomes.length === 0) return 0

  return (
    creditIncomes.reduce((sum, income) => sum + income.amount, 0) /
    creditIncomes.length
  )
}

export const selectPaginatedIncomes = (state: { income: IncomeState }) => {
  const start = (state.income.currentPage - 1) * state.income.itemsPerPage
  const end = start + state.income.itemsPerPage
  return state.income.filteredIncomes.slice(start, end)
}
// Add this to your incomeSlice.ts file, with the other selectors
export const selectCurrentPage = (state: { income: IncomeState }) => state.income.currentPage;

export const selectTotalPages = (state: { income: IncomeState }) =>
  Math.ceil(state.income.filteredIncomes.length / state.income.itemsPerPage)

export const selectCategories = (state: { income: IncomeState }) => {
  const categories = new Set<string>()
  state.income.incomes.forEach((income) => categories.add(income.category))
  return Array.from(categories)
}
// In your incomeSlice.ts
export const selectCategoryData = (state: { income: IncomeState }) => {
  const categoryMap = new Map<string, number>();
  
  state.income.incomes.forEach(income => {
    if (income.type === "CREDIT" || "INCOME") {
      const current = categoryMap.get(income.category) || 0
      categoryMap.set(income.category, current + income.amount)
    }
  });

  return Array.from(categoryMap.entries()).map(([name, value]) => ({
    name,
    value
  }));
};

export const selectMonthlyIncomeData = (state: { income: IncomeState }) => {
  const monthlyMap = new Map<string, { income: number; expense: number }>();
  const currentYear = new Date().getFullYear();

  state.income.incomes.forEach(income => {
    const date = new Date(income.date);
    if (date.getFullYear() === currentYear) {
      const month = date.toLocaleString('default', { month: 'short' });
      const current = monthlyMap.get(month) || { income: 0, expense: 0 };
      
      if (income.type === "CREDIT" || "INCOME") {
        current.income += income.amount
      } else {
        current.expense += income.amount
      }
      
      monthlyMap.set(month, current);
    }
  });

  // Ensure all months are present
  const months = Array.from({ length: 12 }, (_, i) => 
    new Date(0, i).toLocaleString('default', { month: 'short' })
  );

  return months.map(month => ({
    name: month,
    income: monthlyMap.get(month)?.income || 0,
    expense: monthlyMap.get(month)?.expense || 0
  }));
};

export const { addIncome, deleteIncome,clearIncome, setFilter, setPage, resetFilters } =
  incomeSlice.actions
export default incomeSlice.reducer
