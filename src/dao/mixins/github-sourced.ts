import path from "path";
import { DaoConstructor } from "./dao";
import { fehAssetsJsonReader } from "../remote-data/remote-data";

export function GithubSourced<V, DBase extends DaoConstructor<V>>(typeToken: V, dBase: DBase) { //add the arguments here? kinda violates the spirit of mixins?
    return class GithubSourcedDao extends dBase {
        private githubInitialization: Promise<void>;
        private githubData: V[];

        protected toValueType: (json: any) => V = (json) => {
            throw new Error("toValueType not implemented");
        }
        protected acceptIf = (json : any) => true;

        private readonly REPO_PATH: string;
        private readonly IS_BLOB: boolean;

        // bye bye type safety!!
        constructor(...args: any[]) {
            super(...args);
            this.REPO_PATH = args[0].repoPath;
            this.IS_BLOB = args[0].isBlob ?? false;
            this.githubData = [];
            this.githubInitialization = this.githubInitialize();
        }

        private async githubInitialize() {
            if (this.IS_BLOB) {
                await this.processBlob(path.dirname(this.REPO_PATH), { name: path.basename(this.REPO_PATH) });
            } else {
                await this.processTree(this.REPO_PATH);
            }
        }

        private async processTree(dirPath: string) {
            // get all of the files in the tree - these are mostly per-update
            const tree = await fehAssetsJsonReader.queryForTree(dirPath);
            const blobEntries = tree.repository.object.entries.filter(entry => entry.type === "blob");
            const treeEntries = tree.repository.object.entries.filter(entry => entry.type === "tree");
            // for each file, get contents
            for (const entry of blobEntries) {
                // awaits not necessary for **eventual** correctness
                await this.processBlob(dirPath, entry);
            }
            // for each subdirectory, recurse
            for (const entry of treeEntries) {
                await this.processTree(path.join(dirPath, entry.name));
            }
        }

        private async processBlob(dirPath: string, entry: { name: string }) {
            const entryPath = path.join(dirPath, entry.name);
            let blobJson;

            // always make an ordinary GET request, no point using graphql here
            const blobText = await fehAssetsJsonReader.getRawBlob(entryPath);
            blobJson = JSON.parse(blobText) as [any];

            // js is singlethreaded, right?
            this.githubData.push(...blobJson.filter(this.acceptIf).map(this.toValueType));
        }

        protected async getGithubData() {
            await this.githubInitialization;
            return this.githubData;
        }
    }
}