import { Queue, Worker } from "bullmq";
import { defaultJobOptions, redisConnection } from "../Config/Queue.js";
import { sendMail } from "../Config/mail.js";
export const emailQueueName = "emailQueue";
export const emailQueue = new Queue(emailQueueName, {
    connection: redisConnection,
    defaultJobOptions: defaultJobOptions,
});
export const queueWorker = new Worker(emailQueueName, async (job) => {
    const data = job.data;
    // console.log(job.data)
    // console.log(data.body);
    await sendMail(data.to, data.subject, data.html);
}, {
    connection: redisConnection,
});
