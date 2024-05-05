import { dot } from "node:test/reporters";
import { defaultGrowthVectorDao } from "./dao/types/growth-vector-dao";
import { defaultHeroDao } from "./dao/types/hero-dao";
import { defaultMessageDao } from "./dao/types/message-dao";
import { defaultSkillDao } from "./dao/types/skill-dao";
import * as dotenv from "dotenv";

// don't throw 107000/300 requests to vercel KV at once - the js way hahahahaha
// wish i had extension methods...
const thenWaitThen = function thenWait(time: number, promise : Promise<any>) {
    return promise.then(result => new Promise(resolve => setTimeout(resolve, time, result)));
};

dotenv.config();
console.log(`Vercel KV token: ${process.env.KV_REST_API_TOKEN?.substring(0,1)}*******`);

const heroDao = defaultHeroDao;
const skillDao = defaultSkillDao;
const messageDao = defaultMessageDao;
const growthVectorDao = defaultGrowthVectorDao;
Promise.all([
    heroDao.initialization,
    skillDao.initialization,
    messageDao.initialization,
    growthVectorDao.initialization
]).then(() => 
    thenWaitThen(3000, 
        thenWaitThen(3000, 
            thenWaitThen(3000,
                 heroDao.writeData())
                 .then(() => growthVectorDao.writeData())
        ).then(() => skillDao.writeData())
    ).then(() => messageDao.writeData())
).then(() => console.log("done!"));
