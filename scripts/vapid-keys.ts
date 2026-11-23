import { generateVapidPair } from '../src/lib/notify/vapid';

const { vapidKeys, publicKey } = await generateVapidPair();
console.log(`VAPID_KEYS='${vapidKeys}'`);
console.log(`PUBLIC_VAPID_PUBLIC_KEY=${publicKey}`);
