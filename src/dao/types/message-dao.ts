import { Language, Message } from "./dao-types";
import { Dao } from "../mixins/dao";
import { GithubSourced } from "../mixins/github-sourced";
import { WriteOnceKeyIndexed } from "../mixins/key-indexed";
import fs from "fs";
import { VercelKvBacked } from "../mixins/vercel-kv-backed";

// typescript needs this to correctly infer the type parameters of generic mixins, 
// Thanks https://stackoverflow.com/a/57362442
const typeToken = null! as Message;

const keyTypeToken = "";

// There are 10 languages to support right now, each needs its own sub-DAO
class LangMessageDao extends VercelKvBacked(typeToken, GithubSourced(typeToken, WriteOnceKeyIndexed(typeToken, Dao<string>))){
    RELEVANT_KEY_PATTERNS = [
        /* we want: 
            Skill names
            Skill descriptions
            Hero names
            Hero descriptions
            remove everything else
        */
        /^MSID_(?!SEARCH).*/, // Messages related to Skills
        /^MPID_(?!VOICE)(?!ILLUST)(?!SEARCH).*/, // Messages related to Heroes (Persons)
    ] as const;
    public initialization: Promise<void>;
    redisKey: string;

    constructor({repoPath, timerLabel, langLabel} : {repoPath: string, timerLabel: string, langLabel: string}){
        super({repoPath});
        this.redisKey = "MESSAGE_BY_KEY_" + langLabel;
        console.time(timerLabel);
        this.initialization = this.loadData().then(() => console.timeEnd(timerLabel));
    }
    
    public async writeData(){
        await this.writeHash(this.redisKey, this.collectionKeys);
    }

    private async loadData(){ // to KV
        return this.getGithubData()
        .then(data => data.filter(message => this.RELEVANT_KEY_PATTERNS.some(regExp => regExp.test(message.idTag))))
        .then(data => this.setByKeys(data));
    }
    
    // already correct format
    protected override toValueType = (json : any) => {
        return {
            idTag: json.key,
            value: json.value,
        }
    };

    async getByMessageKeys(messageKeys : string[]){
        await this.initialization;
        return this.getByKeys(messageKeys);
    }
}

export class MessageDao{
    
    private langMessageDaos : {[lang in Language] : LangMessageDao} = {
        0: new LangMessageDao({repoPath: "files/assets/EUDE/Message/", timerLabel: "TIME: EUDE Message DAO finished initialization", langLabel: "EUDE"}),
        1: new LangMessageDao({repoPath: "files/assets/EUEN/Message/", timerLabel: "TIME: EUEN Message DAO finished initialization", langLabel: "EUEN"}),
        2: new LangMessageDao({repoPath: "files/assets/EUES/Message/", timerLabel: "TIME: EUES Message DAO finished initialization", langLabel: "EUES"}),
        3: new LangMessageDao({repoPath: "files/assets/EUFR/Message/", timerLabel: "TIME: EUFR Message DAO finished initialization", langLabel: "EUFR"}),
        4: new LangMessageDao({repoPath: "files/assets/EUIT/Message/", timerLabel: "TIME: EUIT Message DAO finished initialization", langLabel: "EUIT"}),
        5: new LangMessageDao({repoPath: "files/assets/JPJA/Message/", timerLabel: "TIME: JPJA Message DAO finished initialization", langLabel: "JPJA"}),
        6: new LangMessageDao({repoPath: "files/assets/TWZH/Message/", timerLabel: "TIME: TWZH Message DAO finished initialization", langLabel: "TWZH"}),
        7: new LangMessageDao({repoPath: "files/assets/USEN/Message/", timerLabel: "TIME: USEN Message DAO finished initialization", langLabel: "USEN"}),
        8: new LangMessageDao({repoPath: "files/assets/USES/Message/", timerLabel: "TIME: USES Message DAO finished initialization", langLabel: "USES"}),
        9: new LangMessageDao({repoPath: "files/assets/USPT/Message/", timerLabel: "TIME: USPT Message DAO finished initialization", langLabel: "USPT"}),
    }
   
    public initialization = Promise.all(Object.values(this.langMessageDaos).map(dao => dao.initialization)); 

    async getByMessageKeys(lang: Language, messageKeys: string[]){
        const langMessageDao = this.langMessageDaos[lang];
        return langMessageDao.getByMessageKeys(messageKeys);
    }

    public async writeData() {
        for (const messageDao of Object.values(this.langMessageDaos)){
            await messageDao.writeData();
            await new Promise(res => setTimeout(() => res(undefined), 3000));
        }
    }
}

export const defaultMessageDao = new MessageDao();