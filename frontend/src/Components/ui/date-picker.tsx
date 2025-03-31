/** @format */

"use client"

import React from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

interface DatePickerProps {
  selected: Date | null
  onChange: (date: Date | null) => void
  placeholderText?: string
  className?: string
  minDate?: Date | null
  maxDate?: Date | null
}

export function DatePickerComponent({
  selected,
  onChange,
  placeholderText,
  className = "",
  minDate = null,
  maxDate = null,
}: DatePickerProps) {
  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      placeholderText={placeholderText}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      minDate={minDate}
      maxDate={maxDate}
      dateFormat="MMMM d, yyyy"
    />
  )
}
