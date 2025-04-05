import { createClient } from 'redis';

const client = createClient({
  username: "default",
  // password: 'ELlDTn16bsUuWNAUJo9bcGCU6WVv5IVX',
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_URL,
    port: 14170,
  },
})


client.on('error', err => console.log('Redis Client Error', err));

await client.connect();
const redisClient = client;
export default redisClient;
await client.set('foo', 'bar');
const result = await client.get('foo');
console.log(result)  // >>> bar
