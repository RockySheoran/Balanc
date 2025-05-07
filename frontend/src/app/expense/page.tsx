// /** @format */


import ExpenseComponent from "@/Components/expense/ExpenseComponent"
export const revalidate = 60
const page =  () =>{
  return( <ExpenseComponent/>)
}
export default page;
export const metadata = {
  title: "Expense",
  description: "Your Expense page",
}