/** @format */

import * as XLSX from "xlsx"
import { saveAs } from "file-saver"

export const exportToExcel = (data: any[], fileName: string = "Report") => {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions")

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  })

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })

  saveAs(blob, `${fileName}.xlsx`)
}
