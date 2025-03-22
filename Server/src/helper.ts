import { ZodError } from "zod";
import ejs from "ejs"
import path from "path";
import { fileURLToPath } from "url";

export const formatError =(error:ZodError)=>{
    let errors:any = {};
    error.errors?.map((error)=>{
        errors[error.path?.[0]] = error.message;
    })
    

    return errors;
}

export const renderEmailEjs = async (filename: string, payload: any) => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))

  try {
    const html = await ejs.renderFile(
      path.join(__dirname, "views", "email", `${filename}.ejs`),
      payload
    )
    return html
  } catch (error) {
    console.error("Error rendering EJS template:", error)
    throw error // Re-throw the error to handle it in the calling function
  }
}