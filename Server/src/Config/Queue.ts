import{ConnectionOptions,DefaultJobOptions} from "bullmq"


export const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_URL || "localhost",
  port: parseInt(process.env.REDIS_PORT || "14170"),
  password: process.env.REDIS_PASSWORD, // Essential for authenticated Redis
//   tls: process.env.REDIS_TLS === "true" ? {} : undefined, // For cloud Redis
}


export const defaultJobOptions:DefaultJobOptions ={
    removeOnComplete:{
    count:20,
    age:60*60
    },
    attempts:3,
    backoff:{
        type:'exponential',
        delay:3000,
    }
    ,
    removeOnFail:false,
}
