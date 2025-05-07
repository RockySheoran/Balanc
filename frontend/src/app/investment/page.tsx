
import React from 'react';
import InvestmentManagement from "@/Components/investment/InvestmentManagement";
export const revalidate = 60
const Page = () => {
  return (
   
      <InvestmentManagement />

  );
};

export default Page;
export const metadata = {
  // title: "Investment",
  title: "Investment Management",
  description: "Your Investment page",
}