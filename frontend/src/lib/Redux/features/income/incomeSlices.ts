/** @format */
import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface Income {
  id: string
  name: string
  amount: number
  type: "CREDIT" | "INCOME"
  category: string
  date: string
  description?: string
  accountId?: string
  createdAt?: string
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
  needsRecalculation: boolean
}

const initialState: IncomeState = {
  incomes: [],
  filteredIncomes: [],
  currentPage: 1,
  itemsPerPage: 5,
  needsRecalculation: true,
  filters: {
    sort: "",
    category: "",
    type: "",
    minAmount: "",
    maxAmount: "",
  },
}

const recalculateIncomes = (state: IncomeState) => {
  let filtered = [...state.incomes]

  // Apply category filter
  if (state.filters.category && state.filters.category !== "all") {
    filtered = filtered.filter(income => income.category === state.filters.category)
  }

  // Apply type filter
  if (state.filters.type && state.filters.type !== "all") {
    filtered = filtered.filter(income => income.type === state.filters.type)
  }

  // Apply amount range filter
  if (state.filters.minAmount !== "") {
    filtered = filtered.filter(income => income.amount >= Number(state.filters.minAmount))
  }
  if (state.filters.maxAmount !== "") {
    filtered = filtered.filter(income => income.amount <= Number(state.filters.maxAmount))
  }

  // Apply sorting
  switch (state.filters.sort) {
    case "asc":
      filtered.sort((a, b) => a.amount - b.amount)
      break
    case "desc":
      filtered.sort((a, b) => b.amount - a.amount)
      break
    case "date-asc":
      filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      break
    case "date-desc":
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      break
    default:
      // Default sorting (newest first)
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  state.filteredIncomes = filtered
  state.needsRecalculation = false
}

const incomeSlice = createSlice({
  name: "income",
  initialState,
  reducers: {
    addIncome: (state, action: PayloadAction<Income>) => {
      const newIncome = {
        ...action.payload,
        date: action.payload.date || action.payload.createdAt || new Date().toISOString(),
      }
      state.incomes.unshift(newIncome)
      state.needsRecalculation = true
      recalculateIncomes(state)
    },
    updateIncome: (state, action: PayloadAction<Income>) => {
      const index = state.incomes.findIndex(i => i.id === action.payload.id)
      if (index !== -1) {
        state.incomes[index] = action.payload
        state.needsRecalculation = true
        recalculateIncomes(state)
      }
    },
    deleteIncome: (state, action: PayloadAction<string>) => {
      state.incomes = state.incomes.filter(income => income.id !== action.payload)
      state.needsRecalculation = true
      recalculateIncomes(state)
    },
    setFilter: (state, action: PayloadAction<Partial<IncomeState["filters"]>>) => {
      // Debugging logs
      console.log("Current filters:", state.filters);
      console.log("Incoming payload:", action.payload);
    
      // Create new filters object with proper type handling
      const newFilters = {
        sort: action.payload.sort !== undefined ? action.payload.sort : state.filters.sort,
        category: action.payload.category !== undefined ? action.payload.category : state.filters.category,
        type: action.payload.type !== undefined ? action.payload.type : state.filters.type,
        minAmount: action.payload.minAmount !== undefined ? action.payload.minAmount : state.filters.minAmount,
        maxAmount: action.payload.maxAmount !== undefined ? action.payload.maxAmount : state.filters.maxAmount,
      };
    
      // Only update if there are actual changes
      if (JSON.stringify(state.filters) !== JSON.stringify(newFilters)) {
        console.log("Updating filters to:", newFilters);
        state.filters = newFilters;
        state.needsRecalculation = true;
        state.currentPage = 1;
        recalculateIncomes(state);
      } else {
        console.log("No filter changes detected");
      }
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload
    },
    resetFilters: (state) => {
      state.filters = initialState.filters
      state.needsRecalculation = true
      state.currentPage = 1
      recalculateIncomes(state)
      console.log("first filter", state.filters)
    },
    clearIncome: () => initialState,
    recalculate: (state) => {
      state.needsRecalculation = true
      recalculateIncomes(state)
    },
  },
})

// Selectors
export const selectTotalIncome = (state: { income: IncomeState }) =>
  state.income.incomes.reduce(
    (sum, income) => income.type === "CREDIT" || income.type === "INCOME" 
      ? sum + income.amount 
      : sum - income.amount,
    0
  )

export const selectLastMonthIncome = (state: { income: IncomeState }) => {
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  return state.income.incomes
    .filter(income => new Date(income.date) >= oneMonthAgo)
    .reduce(
      (sum, income) => income.type === "CREDIT" || income.type === "INCOME"
        ? sum + income.amount
        : sum - income.amount,
      0
    )
}

export const selectAverageIncome = (state: { income: IncomeState }) => {
  if (state.income.incomes.length === 0) return 0

  const creditIncomes = state.income.incomes.filter(
    income => income.type === "CREDIT" || income.type === "INCOME"
  )
  if (creditIncomes.length === 0) return 0

  return creditIncomes.reduce((sum, income) => sum + income.amount, 0) / creditIncomes.length
}

export const selectPaginatedIncomes = (state: { income: IncomeState }) => {
  const start = (state.income.currentPage - 1) * state.income.itemsPerPage
  const end = start + state.income.itemsPerPage
  return state.income.filteredIncomes.slice(start, end)
}

export const selectCurrentPage = (state: { income: IncomeState }) => 
  state.income.currentPage

export const selectTotalPages = (state: { income: IncomeState }) =>
  Math.ceil(state.income.filteredIncomes.length / state.income.itemsPerPage)

export const selectCategories = (state: { income: IncomeState }) => {
  const categories = new Set<string>()
  state.income.incomes.forEach(income => categories.add(income.category))
  return Array.from(categories)
}

export const selectCategoryData = (state: { income: IncomeState }) => {
  const categoryMap = new Map<string, number>()
  
  state.income.incomes.forEach(income => {
    if (income.type === "CREDIT" || income.type === "INCOME") {
      const current = categoryMap.get(income.category) || 0
      categoryMap.set(income.category, current + income.amount)
    }
  })

  return Array.from(categoryMap.entries()).map(([name, value]) => ({
    name,
    value
  }))
}

export const selectMonthlyIncomeData = (state: { income: IncomeState }) => {
  const monthlyMap = new Map<string, { income: number }>()
  const currentYear = new Date().getFullYear()

  state.income.incomes.forEach(income => {
    const date = new Date(income.date)
    if (date.getFullYear() === currentYear) {
      const month = date.toLocaleString('default', { month: 'short' })
      const current = monthlyMap.get(month) || { income: 0 }
      
      if (income.type === "CREDIT" || income.type === "INCOME") {
        current.income += income.amount
      } 
      
      monthlyMap.set(month, current)
    }
  })

  // Ensure all months are present
  const months = Array.from({ length: 12 }, (_, i) => 
    new Date(0, i).toLocaleString('default', { month: 'short' })
  )

  return months.map(month => ({
    name: month,
    income: monthlyMap.get(month)?.income || 0,
    
  }))
}

export const {
  addIncome,
  updateIncome,
  deleteIncome,
  clearIncome,
  setFilter,
  setPage,
  resetFilters,
  recalculate,
} = incomeSlice.actions

export default incomeSlice.reducer