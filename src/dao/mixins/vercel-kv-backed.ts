import { kv } from "@vercel/kv";
import { DaoConstructor } from "./dao";

const batchSize = 300;

export function VercelKvBacked<V, DBase extends DaoConstructor<V>>(typeToken: V, dBase: DBase) {
    return class VercelKvDao extends dBase {
        protected async writeHash(hashName: string, hash: {[key: string|number] : V}){
            console.log("writing to " + hashName);
            const hashToPost = partitionObj(hash, batchSize);
            for (const batch of hashToPost){
                kv.hset(hashName,batch);    
            }     
            console.log("wrote to "+ hashName);
        }

        // This bulk operation vastly reduces the number of Vercel KV requests, which otherwise would exhaust all 30k/month in about 20 page loads (if there was no server side caching of course)
        protected async readHash(hashName: string, intendedKeyTypeToken: number | string){
            const result = {} as {[key : string | number] : V}; 
            const keyTransformer = typeof intendedKeyTypeToken === "number"? (s : string) => +s : (s : string) => s;

            console.log("reading from " + hashName);

            const hkeys = await kv.hkeys(hashName);
            const hashKeysToGet = partitionList(hkeys, batchSize);

            for (const batch of hashKeysToGet){
                const hash = await kv.hmget(hashName, ...batch);
                if (hash === null){
                    throw Error("retrieved hash was null");
                }
                for (let i = 0; i < batch.length; i++){
                    result[keyTransformer(batch[i])] = hash[batch[i]] as V;
                }
            }

            console.log("read from " + hashName);
            return result;
        }

        protected async writeString(key: string, value: string){
            await kv.set(key, value);
            console.log(`wrote to ${key}`);
        }

        protected async readString(key: string){
            const result = await kv.get(key) as string;
            console.log(`read from ${key}`);
            return result;
        }
    }   
}

// real useful for POSTing huge hashes to redis - break it up in case the endpoint does not like multi-MB requests
export function partitionObj<V>(obj: {[key : string | number]: V}, maxBatchSize: number) {
    const result = [] as (typeof obj)[];
    let counter = 0;
    let currentBatch = {} as typeof obj;
    for (const key in obj){
        currentBatch[key] = obj[key];
        counter++;
        if (counter == maxBatchSize){
            counter = 0;
            result.push(currentBatch);
            currentBatch = {};
        }
    }
    if (counter != 0){ // don't forget the last batch!
        result.push(currentBatch);
    }
    return result;
}

export function partitionList<T>(list: T[], maxBatchSize: number){
    const result = [] as T[][];
    let counter = 0;
    let currentBatch = [] as T[];
    for (const element of list){
        currentBatch.push(element);
        counter++;
        if (counter == maxBatchSize){
            counter = 0;
            result.push(currentBatch);
            currentBatch = [];
        }
    }
    if (counter != 0){ // don't forget the last batch!
        result.push(currentBatch);
    }
    return result;
}