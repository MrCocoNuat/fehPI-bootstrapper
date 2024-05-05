import { Dao } from "../mixins/dao";
import { GithubSourced } from "../mixins/github-sourced";
import { GrowthVectors } from "./dao-types";
import { VercelKvBacked } from "../mixins/vercel-kv-backed";

const typeToken = null! as GrowthVectors;

export class GrowthVectorDao extends VercelKvBacked(typeToken, GithubSourced(typeToken, Dao<GrowthVectors>)) {
    public initialization: Promise<void>;
    private growthVectors: GrowthVectors[] = [];
    private redisKey = "GROWTH_VECTORS";

    constructor({ repoPath, isBlob, timerLabel }: { repoPath: string, isBlob: boolean, timerLabel: string }) {
        super({ repoPath, isBlob });
        console.time(timerLabel);
        this.initialization = this.loadData().then(() => console.timeEnd(timerLabel));
    }

    public async writeData(){
        this.writeString(this.redisKey, JSON.stringify(this.growthVectors));
    }

    private async loadData() {
        return this.getGithubData()
            .then(data => this.growthVectors = data)
    }

    // turn into a string so it can be transmitted
    protected toValueType: (json: any) => GrowthVectors = (json) => (json.map((bitvector: number) => String(bitvector)));

    async getAllGrowthVectors() {
        await this.initialization;
        return this.growthVectors;
    }
}

export const defaultGrowthVectorDao = new GrowthVectorDao({repoPath: "files/assets/Common/SRPG/Grow.json", isBlob: true, timerLabel: "TIME: Growth Vector DAO finished initialization"})