// "use server"
// import axios from "axios"
// export const GetStockprice= async({name}: {name: string})=>{

//     // const options = {
//     //   method: "GET",
//     //   url: "https://yahoo-finance166.p.rapidapi.com/api/stock/get-price",
//     //   params: {
//     //     region: "US",
//     //     symbol: `${name}`,
//     //   },
//     //   headers: {
//     //     "x-rapidapi-key": process.env.x_rapidapi_key || "",
//     //     "x-rapidapi-host": "yahoo-finance166.p.rapidapi.com",
//     //   },
//     // }

//     // try {
//     //   const response = await axios.request(options)
//     //   console.log(response.data)
//     // } catch (error) {
//     //   console.error(error)
//     // }
//     const options = {
//       method: "GET",
//       url: "https://yahoo-finance166.p.rapidapi.com/api/stock/get-price",
//       params: {
//         region: "US",
//         symbol: "AAPL",
//       },
//       headers: {
//         "x-rapidapi-key": "fb8f2ad820msh93c737ef6dbdaf9p11e391jsn2736f439efaa",
//         "x-rapidapi-host": "yahoo-finance166.p.rapidapi.com",
//       },
//     }
                     
    
//     try {
//       const response = await axios.request(options)
//       console.log(response.data)
//     } catch (error) {
//       console.error(error)
//     }
// }