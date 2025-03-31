// /** @format */
// "use client"

import ExpenseComponent from "@/Components/expense/ExpenseComponent"

// import { useState, useEffect } from "react"
// import { addDays, format } from "date-fns"
// import { CalendarIcon } from "lucide-react"
// import { DateRange } from "react-day-picker"
// import {
//   BarChart,
//   Bar,
//   PieChart,
//   Pie,
//   Cell,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "recharts"
// import { Input } from "@/Components/ui/input"
// import { Button } from "@/Components/ui/button"
// import {
//   Table,
//   TableBody,
//   TableCaption,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/Components/ui/table"
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/Components/ui/select"
// import {
//   Pagination,
//   PaginationContent,
//   PaginationItem,
//   PaginationPrevious,
//   PaginationLink,
//   PaginationNext,
// } from "@/Components/ui/pagination"
// import { cn } from "@/lib/utils"
// import { Calendar } from "@/Components/ui/calendar"
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/Components/ui/popover"

// interface Expense {
//   id: string
//   name: string
//   amount: number
//   category: string
//   date: Date
//   description?: string
// }

// const COLORS = [
//   "#0088FE",
//   "#00C49F",
//   "#FFBB28",
//   "#FF8042",
//   "#8884D8",
//   "#82CA9D",
// ]

// export default function ExpenseComponent() {
//   const [expenses, setExpenses] = useState<Expense[]>([])
//   const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
//   const [totalExpense, setTotalExpense] = useState<number>(0)
//   const [loading, setLoading] = useState<boolean>(true)
//   const [error, setError] = useState<string | null>(null)

//   // Date range state
//   const [dateRange, setDateRange] = useState<DateRange | undefined>({
//     from: undefined,
//     to: undefined,
//   })

//   // Filter states
//   const [searchTerm, setSearchTerm] = useState<string>("")
//   const [categoryFilter, setCategoryFilter] = useState<string>("all")
//   const [sortBy, setSortBy] = useState<"date" | "amount" | "name">("date")
//   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

//   // Pagination
//   const [currentPage, setCurrentPage] = useState<number>(1)
//   const itemsPerPage = 8

//   // Chart selection
//   const [activeChart, setActiveChart] = useState<"bar" | "pie">("bar")
//   const [activeIndex, setActiveIndex] = useState<number | null>(null)

//   // Fetch expenses (mock data)
//   useEffect(() => {
//     const fetchExpenses = async () => {
//       try {
//         setLoading(true)
//         const mockExpenses: Expense[] = [
//           {
//             id: "1",
//             name: "Groceries",
//             amount: 150.75,
//             category: "Food",
//             date: new Date("2023-05-15"),
//           },
//           {
//             id: "2",
//             name: "Electricity Bill",
//             amount: 85.2,
//             category: "Utilities",
//             date: new Date("2023-05-10"),
//           },
//           {
//             id: "3",
//             name: "Internet",
//             amount: 59.99,
//             category: "Utilities",
//             date: new Date("2023-05-05"),
//           },
//           {
//             id: "4",
//             name: "Dinner Out",
//             amount: 65.5,
//             category: "Food",
//             date: new Date("2023-04-28"),
//           },
//           {
//             id: "5",
//             name: "Gas",
//             amount: 45.3,
//             category: "Transportation",
//             date: new Date("2023-04-25"),
//           },
//           {
//             id: "6",
//             name: "Movie Tickets",
//             amount: 32.0,
//             category: "Entertainment",
//             date: new Date("2023-04-20"),
//           },
//           {
//             id: "7",
//             name: "Gym Membership",
//             amount: 35.0,
//             category: "Health",
//             date: new Date("2023-04-15"),
//           },
//           {
//             id: "8",
//             name: "Books",
//             amount: 42.5,
//             category: "Education",
//             date: new Date("2023-04-10"),
//           },
//           {
//             id: "9",
//             name: "Phone Bill",
//             amount: 55.0,
//             category: "Utilities",
//             date: new Date("2023-04-05"),
//           },
//           {
//             id: "10",
//             name: "Coffee",
//             amount: 12.75,
//             category: "Food",
//             date: new Date("2023-03-30"),
//           },
//         ]

//         setExpenses(mockExpenses)
//         setFilteredExpenses(mockExpenses)
//         setLoading(false)
//       } catch (err) {
//         setError("Failed to fetch expenses")
//         setLoading(false)
//       }
//     }

//     fetchExpenses()
//   }, [])

//   // Filter and sort expenses
//   useEffect(() => {
//     let result = [...expenses]

//     // Apply search filter
//     if (searchTerm) {
//       result = result.filter(
//         (expense) =>
//           expense.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           expense.description?.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//     }

//     // Apply date range filter
//     if (dateRange?.from) {
//       result = result.filter(
//         (expense) => new Date(expense.date) >= dateRange.from!
//       )
//     }
//     if (dateRange?.to) {
//       result = result.filter(
//         (expense) => new Date(expense.date) <= dateRange.to!
//       )
//     }

//     // Apply category filter
//     if (categoryFilter !== "all") {
//       result = result.filter((expense) => expense.category === categoryFilter)
//     }

//     // Apply sorting
//     result.sort((a, b) => {
//       if (sortBy === "date") {
//         return sortOrder === "asc"
//           ? new Date(a.date).getTime() - new Date(b.date).getTime()
//           : new Date(b.date).getTime() - new Date(a.date).getTime()
//       } else if (sortBy === "amount") {
//         return sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount
//       } else {
//         return sortOrder === "asc"
//           ? a.name.localeCompare(b.name)
//           : b.name.localeCompare(a.name)
//       }
//     })

//     setFilteredExpenses(result)
//     const total = result.reduce((sum, expense) => sum + expense.amount, 0)
//     setTotalExpense(total)
//   }, [expenses, searchTerm, dateRange, categoryFilter, sortBy, sortOrder])

//   // Prepare data for charts
//   const categoryData = expenses.reduce((acc, expense) => {
//     const existingCategory = acc.find((item) => item.name === expense.category)
//     if (existingCategory) {
//       existingCategory.value += expense.amount
//     } else {
//       acc.push({ name: expense.category, value: expense.amount })
//     }
//     return acc
//   }, [] as { name: string; value: number }[])

//   const monthlyData = expenses.reduce((acc, expense) => {
//     const date = new Date(expense.date)
//     const monthYear = `${date.toLocaleString("default", {
//       month: "short",
//     })} ${date.getFullYear()}`
//     const existingMonth = acc.find((item) => item.name === monthYear)
//     if (existingMonth) {
//       existingMonth.value += expense.amount
//     } else {
//       acc.push({ name: monthYear, value: expense.amount })
//     }
//     return acc
//   }, [] as { name: string; value: number }[])

//   // Pagination logic
//   const indexOfLastItem = currentPage * itemsPerPage
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage
//   const currentItems = filteredExpenses.slice(indexOfFirstItem, indexOfLastItem)
//   const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage)

//   // Handle chart click
//   const handlePieClick = (data: any, index: number) => {
//     setActiveIndex(index === activeIndex ? null : index)
//     if (index !== activeIndex) {
//       setCategoryFilter(data.name)
//     } else {
//       setCategoryFilter("all")
//     }
//   }

//   const handleBarClick = (data: any) => {
//     const monthYear = data.activeLabel
//     if (monthYear) {
//       const [month, year] = monthYear.split(" ")
//       const monthNum = new Date(`${month} 1, ${year}`).getMonth() + 1
//       const start = new Date(`${year}-${monthNum}-01`)
//       const end = new Date(`${year}-${monthNum + 1}-01`)
//       end.setDate(end.getDate() - 1)
//       setDateRange({ from: start, to: end })
//       setActiveIndex(null)
//     }
//   }

//   // Reset filters
//   const resetFilters = () => {
//     setSearchTerm("")
//     setDateRange({ from: undefined, to: undefined })
//     setCategoryFilter("all")
//     setSortBy("date")
//     setSortOrder("desc")
//     setActiveIndex(null)
//     setCurrentPage(1)
//   }

//   if (loading)
//     return <div className="text-center py-8">Loading expenses...</div>
//   if (error) return <div className="text-center py-8 text-red-500">{error}</div>

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <h1 className="text-3xl font-bold text-gray-800 mb-6">Expense Tracker</h1>

//       {/* Summary Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
//         <div className="bg-white rounded-lg shadow p-6">
//           <h3 className="text-gray-500 font-medium">Total Expenses</h3>
//           <p className="text-2xl font-bold text-purple-600">
//             ${totalExpense.toFixed(2)}
//           </p>
//         </div>
//         <div className="bg-white rounded-lg shadow p-6">
//           <h3 className="text-gray-500 font-medium">Number of Expenses</h3>
//           <p className="text-2xl font-bold text-blue-600">
//             {filteredExpenses.length}
//           </p>
//         </div>
//         <div className="bg-white rounded-lg shadow p-6">
//           <h3 className="text-gray-500 font-medium">Average Expense</h3>
//           <p className="text-2xl font-bold text-green-600">
//             $
//             {(filteredExpenses.length > 0
//               ? totalExpense / filteredExpenses.length
//               : 0
//             ).toFixed(2)}
//           </p>
//         </div>
//       </div>

//       {/* Charts Section */}
//       <div className="bg-white rounded-lg shadow p-6 mb-8">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-xl font-semibold text-gray-800">
//             Expense Analysis
//           </h2>
//           <div className="flex space-x-2">
//             <Button
//               variant={activeChart === "bar" ? "default" : "outline"}
//               onClick={() => setActiveChart("bar")}>
//               Monthly View
//             </Button>
//             <Button
//               variant={activeChart === "pie" ? "default" : "outline"}
//               onClick={() => setActiveChart("pie")}>
//               Category View
//             </Button>
//           </div>
//         </div>

//         <div className="h-80">
//           <ResponsiveContainer width="100%" height="100%">
//             {activeChart === "bar" ? (
//               <BarChart
//                 data={monthlyData}
//                 margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
//                 onClick={handleBarClick}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis
//                   dataKey="name"
//                   angle={-45}
//                   textAnchor="end"
//                   height={60}
//                 />
//                 <YAxis />
//                 <Tooltip formatter={(value) => [`$${value}`, "Amount"]} />
//                 <Legend />
//                 <Bar
//                   dataKey="value"
//                   name="Expense Amount"
//                   fill="#8884d8"
//                   radius={[4, 4, 0, 0]}>
//                   {monthlyData.map((entry, index) => (
//                     <Cell
//                       key={`cell-${index}`}
//                       fill={COLORS[index % COLORS.length]}
//                       stroke={
//                         activeIndex !== null && index === activeIndex
//                           ? "#000"
//                           : "#fff"
//                       }
//                       strokeWidth={
//                         activeIndex !== null && index === activeIndex ? 2 : 1
//                       }
//                     />
//                   ))}
//                 </Bar>
//               </BarChart>
//             ) : (
//               <PieChart>
//                 <Pie
//                   data={categoryData}
//                   cx="50%"
//                   cy="50%"
//                   labelLine={false}
//                   outerRadius={80}
//                   fill="#8884d8"
//                   dataKey="value"
//                   nameKey="name"
//                   label={({ name, percent }) =>
//                     `${name} ${(percent * 100).toFixed(0)}%`
//                   }
//                   onClick={handlePieClick}>
//                   {categoryData.map((entry, index) => (
//                     <Cell
//                       key={`cell-${index}`}
//                       fill={COLORS[index % COLORS.length]}
//                       stroke={
//                         activeIndex !== null && index === activeIndex
//                           ? "#000"
//                           : "#fff"
//                       }
//                       strokeWidth={
//                         activeIndex !== null && index === activeIndex ? 2 : 1
//                       }
//                     />
//                   ))}
//                 </Pie>
//                 <Tooltip formatter={(value) => [`$${value}`, "Amount"]} />
//                 <Legend />
//               </PieChart>
//             )}
//           </ResponsiveContainer>
//         </div>
//       </div>

//       {/* Filters Section */}
//       <div className="bg-white rounded-lg shadow p-6 mb-8">
//         <h2 className="text-xl font-semibold text-gray-800 mb-4">Filters</h2>
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Search
//             </label>
//             <Input
//               type="text"
//               placeholder="Search expenses..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//           </div>
//           <div className="md:col-span-2">
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Date Range
//             </label>
//             <div className={cn("grid gap-2")}>
//               <Popover>
//                 <PopoverTrigger asChild>
//                   <Button
//                     id="date"
//                     variant={"outline"}
//                     className={cn(
//                       "w-full justify-start text-left font-normal",
//                       !dateRange && "text-muted-foreground"
//                     )}>
//                     <CalendarIcon className="mr-2 h-4 w-4" />
//                     {dateRange?.from ? (
//                       dateRange.to ? (
//                         <>
//                           {format(dateRange.from, "LLL dd, y")} -{" "}
//                           {format(dateRange.to, "LLL dd, y")}
//                         </>
//                       ) : (
//                         format(dateRange.from, "LLL dd, y")
//                       )
//                     ) : (
//                       <span>Pick a date range</span>
//                     )}
//                   </Button>
//                 </PopoverTrigger>
//                 <PopoverContent className="w-auto p-0" align="start">
//                   <Calendar
//                     initialFocus
//                     mode="range"
//                     defaultMonth={dateRange?.from}
//                     selected={dateRange}
//                     onSelect={setDateRange}
//                     numberOfMonths={2}
//                   />
//                 </PopoverContent>
//               </Popover>
//             </div>
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Category
//             </label>
//             <Select
//               value={categoryFilter}
//               onValueChange={(value) => setCategoryFilter(value)}>
//               <SelectTrigger className="w-full">
//                 <SelectValue placeholder="Select category" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Categories</SelectItem>
//                 {Array.from(new Set(expenses.map((e) => e.category))).map(
//                   (category) => (
//                     <SelectItem key={category} value={category}>
//                       {category}
//                     </SelectItem>
//                   )
//                 )}
//               </SelectContent>
//             </Select>
//           </div>
//         </div>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Sort By
//             </label>
//             <Select
//               value={sortBy}
//               onValueChange={(value) => setSortBy(value as any)}>
//               <SelectTrigger className="w-full">
//                 <SelectValue placeholder="Sort by" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="date">Date</SelectItem>
//                 <SelectItem value="amount">Amount</SelectItem>
//                 <SelectItem value="name">Name</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Order
//             </label>
//             <Select
//               value={sortOrder}
//               onValueChange={(value) => setSortOrder(value as any)}>
//               <SelectTrigger className="w-full">
//                 <SelectValue placeholder="Sort order" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="desc">Descending</SelectItem>
//                 <SelectItem value="asc">Ascending</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//           <div className="flex items-end">
//             <Button variant="outline" className="w-full" onClick={resetFilters}>
//               Reset Filters
//             </Button>
//           </div>
//         </div>
//       </div>

//       {/* Expenses Table */}
//       <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
//         <Table>
//           <TableCaption className="text-left p-4 bg-gray-50">
//             <div className="flex justify-between items-center">
//               <h2 className="text-xl font-semibold text-gray-800">
//                 Expense Records
//               </h2>
//               <span className="text-sm text-gray-500">
//                 Showing {indexOfFirstItem + 1}-
//                 {Math.min(indexOfLastItem, filteredExpenses.length)} of{" "}
//                 {filteredExpenses.length} expenses
//               </span>
//             </div>
//           </TableCaption>
//           <TableHeader className="bg-gray-100">
//             <TableRow>
//               <TableHead className="w-[150px]">Date</TableHead>
//               <TableHead>Name</TableHead>
//               <TableHead>Category</TableHead>
//               <TableHead className="text-right">Amount</TableHead>
//               <TableHead>Description</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {currentItems.length > 0 ? (
//               currentItems.map((expense) => (
//                 <TableRow key={expense.id}>
//                   <TableCell className="font-medium">
//                     {new Date(expense.date).toLocaleDateString()}
//                   </TableCell>
//                   <TableCell>{expense.name}</TableCell>
//                   <TableCell>
//                     <span
//                       className="px-2 py-1 rounded-full text-xs"
//                       style={{
//                         backgroundColor:
//                           COLORS[
//                             Array.from(
//                               new Set(expenses.map((e) => e.category))
//                             ).indexOf(expense.category) % COLORS.length
//                           ] + "20",
//                         color:
//                           COLORS[
//                             Array.from(
//                               new Set(expenses.map((e) => e.category))
//                             ).indexOf(expense.category) % COLORS.length
//                           ],
//                       }}>
//                       {expense.category}
//                     </span>
//                   </TableCell>
//                   <TableCell className="text-right">
//                     ${expense.amount.toFixed(2)}
//                   </TableCell>
//                   <TableCell className="text-gray-500">
//                     {expense.description || "-"}
//                   </TableCell>
//                 </TableRow>
//               ))
//             ) : (
//               <TableRow>
//                 <TableCell colSpan={5} className="text-center py-8">
//                   No expenses found matching your criteria
//                 </TableCell>
//               </TableRow>
//             )}
//           </TableBody>
//         </Table>

//         {/* Pagination */}
//         {filteredExpenses.length > itemsPerPage && (
//           <div className="p-4 border-t">
//             <Pagination>
//               <PaginationContent>
//                 <PaginationItem>
//                   <PaginationPrevious
//                     onClick={() =>
//                       setCurrentPage((prev) => Math.max(prev - 1, 1))
//                     }
//                     disabled={currentPage === 1}
//                   />
//                 </PaginationItem>
//                 {Array.from({ length: totalPages }, (_, i) => i + 1).map(
//                   (page) => (
//                     <PaginationItem key={page}>
//                       <PaginationLink
//                         isActive={page === currentPage}
//                         onClick={() => setCurrentPage(page)}>
//                         {page}
//                       </PaginationLink>
//                     </PaginationItem>
//                   )
//                 )}
//                 <PaginationItem>
//                   <PaginationNext
//                     onClick={() =>
//                       setCurrentPage((prev) => Math.min(prev + 1, totalPages))
//                     }
//                     disabled={currentPage === totalPages}
//                   />
//                 </PaginationItem>
//               </PaginationContent>
//             </Pagination>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }
const page =  () =>{
  return( <ExpenseComponent/>)
}
export default page;