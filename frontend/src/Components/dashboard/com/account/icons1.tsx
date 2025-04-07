/** @format */

// Icons.tsx
"use client"

import { SVGProps } from "react"

export const Icons = {
  balance: (props: SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  income: (props: SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  expense: (props: SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
  ),
  trendUp: (props: SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  ),
  default: (props: SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
    </svg>
  ),
}
