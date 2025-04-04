/** @format */
"use client"

import { motion } from "framer-motion"
import IncomeStats from "@/Components/income/IncomeStats"
import IncomeCharts from "@/Components/income/IncomeCharts"
import IncomeFilters from "@/Components/income/IncomeFilters"
import IncomeTable from "@/Components/income/IncomeTable"
import IncomePagination from "@/Components/income/IncomePagination"
import AddIncomeForm from "@/Components/income/AddIncomeForm"

// Create store


const page = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4 gap-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className=" mx-auto">
        <div className="bg-gradient-to-r mb-4 from-indigo-50 to-purple-50 flex flex-col md:flex-row justify-between items-center rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
          <h1 className="text-4xl font-bold text-indigo-900 mb-6 md:mb-0">
            Income Management
          </h1>
          <div className="w-full md:w-auto">
            <AddIncomeForm />
          </div>
        </div>

        <div className="">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <IncomeStats />
            <IncomeCharts />
            <IncomeFilters />
            <IncomeTable />
            <IncomePagination />
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default page
