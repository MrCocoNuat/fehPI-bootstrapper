import { DaoConstructor } from "./dao";
import { stringify } from "querystring";
import { partitionObj } from "./vercel-kv-backed";

// Write-Once dao: after a get, set operations are rejected 

export function WriteOnceIdIndexed<V extends {idNum: number}, DBase extends DaoConstructor<V>>(typeToken: V, dBase : DBase){
    return class IdIndexedDao extends dBase{
        protected collectionIds : {[id : number] : V} = {}; // screw you encapsulation
        private valuesArrayIds? : V[];
        private readOnlyIds = false;

        constructor(...args: any[]){
            super(...args);
        }

        protected getByIds(ids: number[]) {
            this.readOnlyIds = true;
            return ids.map(id => this.collectionIds[id]);
        }

        protected setByIds(entries: V[]){
            if (this.readOnlyIds){
                console.error("IdNum DAO modification attempted after readonly, write rejected");
                return;
            }
            entries.forEach(entry => this.collectionIds[entry.idNum] = entry);
        }

        // very common, cache results
        protected getAllIds(){
            this.readOnlyIds = true;
            if (this.valuesArrayIds === undefined){
                this.valuesArrayIds = Object.values(this.collectionIds);
                console.debug(`dao recorded ${this.valuesArrayIds.length} entries in getAll`);
            }
            return this.valuesArrayIds;
        }

        
    }
}
