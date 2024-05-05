import { HonorType, BlessingEffect, BlessingSeason, HeroDefinition, ParameterPerStat, Series, SeriesBitfield, assertIsBlessedHeroDefinition } from "./dao-types";
import { Dao } from "../mixins/dao";
import { GithubSourced } from "../mixins/github-sourced";
import { WriteOnceIdIndexed } from "../mixins/id-indexed";
import { getAllEnumValues } from "enum-for";
import { MediaWikiImage as MediaWikiImage } from "../mixins/mediawiki-image";
import { VercelKvBacked } from "../mixins/vercel-kv-backed";

// typescript needs this to correctly infer the type parameters of generic mixins, 
// Thanks https://stackoverflow.com/a/57362442
const typeToken = null! as HeroDefinition;

const keyTypeToken = 0 as number;

export class HeroDao extends VercelKvBacked(typeToken,GithubSourced(typeToken, MediaWikiImage(typeToken, WriteOnceIdIndexed(typeToken, Dao<HeroDefinition>)))) {
    public initialization: Promise<void>;

    constructor({ repoPath, timerLabel }: { repoPath: string, timerLabel: string }) {
        super({ repoPath });
        console.time(timerLabel);
        this.initialization = this.loadData().then(() => console.timeEnd(timerLabel));
    }

    public async writeData(){
        await this.writeHash("HERO_BY_ID", this.collectionIds);
    }

    private async loadData() { // to KV, will never finish in 10 second limit so don't bother doing this in a deployed version
        return this.getGithubData()
            .then(data => data.filter(definition => definition.idNum > 0)) // remove the NULL Hero
            .then(data => this.populateHeroImageUrls(data))
            .then(/* not async so block is fine */data => { this.setByIds(data);});
    }

    protected override toValueType: (json: any) => HeroDefinition = (json) => {
        const heroDefinition = {
            idNum: json.id_num,
            sortValue: json.sort_value,

            idTag: json.id_tag,
            // specific transforms - for some reason these fields are not given in the JSON
            nameId: (json.id_tag as string).replace(/^PID/, "MPID"),
            epithetId: (json.id_tag as string).replace(/^PID/, "MPID_HONOR"),

            dragonflowers: { maxCount: json.dragonflowers.max_count },

            series: json.series,
            origins: toSeriesIdBitfield(json.origins),
            weaponType: json.weapon_type,
            movementType: json.move_type,
            refresher: json.refresher,

            baseVectorId: json.base_vector_id,
            baseStats: json.base_stats,
            growthRates: json.growth_rates,

            // importantly, heroes can equip Skills that are not exclusive OR appear in this collection
            skills: json.skills,

            //TODO:- again, do this without breaking TS 
            imageUrl: null! as string,
            resplendentImageUrl: undefined,

            honorType: classifyHonor(json),
        }

        switch (true) {
            case assertIsBlessedHeroDefinition(heroDefinition):
                // include blessing data
                return {
                    ...heroDefinition,
                    ...classifyBlessing(json.legendary),
                }
            default:
                // no further changes
                return heroDefinition;
        }
    }

    async getByIdNums(idNums: number[]) {
        await this.initialization;
        return this.getByIds(idNums);
    }

    async getAll() {
        await this.initialization;
        return this.getAllIds();
    }
}


function toSeriesIdBitfield(seriesBitvector: number): SeriesBitfield {
    const bitfield: any = {};
    getAllEnumValues(Series).forEach((id) => {
        bitfield[id] = (seriesBitvector & (1 << id)) > 0;
    });

    return bitfield;
}

const LEGENDARY_SEASONS = [
    BlessingSeason.FIRE, BlessingSeason.WATER, BlessingSeason.WIND, BlessingSeason.EARTH
] as const;

function classifyHonor(json: any) {
    if (json.legendary === null) {
        return HonorType.NONE;
    } else {
        switch (json.legendary.kind) {
            case 1: // legend mythic
                return (LEGENDARY_SEASONS.includes(json.legendary.element)) ? HonorType.LEGENDARY : HonorType.MYTHIC;
            case 2:
                return HonorType.DUO;
            case 3:
                return HonorType.HARMONIC;
            case 4:
                return HonorType.ASCENDED;
            case 5:
                return HonorType.REARMED;
            default:
                throw new Error(`unexpected legendary.kind ${JSON.stringify(json.legendary)}`);
        }
    }
}

// give the right keys
const packClassifyBlessing = (blessingSeason: BlessingSeason, blessingEffect: BlessingEffect) =>
    ({ blessingSeason, blessingEffect });
// returnseffect, season
function classifyBlessing(legendary: any) {
    if (legendary === null || legendary.kind !== 1) {
        throw new Error(`classifyBlessing called on not legend/mythic, ${JSON.stringify(legendary)}`)
    }
    const blessingSeason: BlessingSeason = legendary.element;
    const blessingCategory = LEGENDARY_SEASONS.includes(legendary.element) ? HonorType.LEGENDARY : HonorType.MYTHIC;
    const pack = packClassifyBlessing.bind(undefined, blessingSeason);

    const extraSlot: boolean = legendary.ae_extra;
    const pairUp: boolean = legendary.pair_up;
    const bonusStats: ParameterPerStat = legendary.bonus_effect;
    // only very specific bonus stat combinations are admissible, anything else must be a mistake
    if (blessingCategory === HonorType.LEGENDARY) {
        if (bonusStats.hp !== 3) {
            throw new Error(`illegal legendary unit bonus stats ${JSON.stringify(legendary)}, hp not 3`);
        }
        if (pairUp) {
            switch (true) {
                case (bonusStats.atk === 2 && bonusStats.spd === 0 && bonusStats.def === 0 && bonusStats.res === 0):
                    return pack(BlessingEffect.ATK_PAIR_UP);
                case (bonusStats.atk === 0 && bonusStats.spd === 3 && bonusStats.def === 0 && bonusStats.res === 0):
                    return pack(BlessingEffect.SPD_PAIR_UP);
                case (bonusStats.atk === 0 && bonusStats.spd === 0 && bonusStats.def === 4 && bonusStats.res === 0):
                    return pack(BlessingEffect.DEF_PAIR_UP);
                case (bonusStats.atk === 0 && bonusStats.spd === 0 && bonusStats.def === 0 && bonusStats.res === 4):
                    return pack(BlessingEffect.RES_PAIR_UP);
                case (bonusStats.atk === 0 && bonusStats.spd === 0 && bonusStats.def === 0 && bonusStats.res === 0):
                    return pack(BlessingEffect.PAIR_UP);
                default:
                    throw new Error(`illegal pair-up legendary unit bonus stats ${JSON.stringify(legendary)}, does not match`)
            }
        } else {
            switch (true) {
                case (bonusStats.atk === 2 && bonusStats.spd === 0 && bonusStats.def === 0 && bonusStats.res === 0):
                    return pack(BlessingEffect.ATK);
                case (bonusStats.atk === 0 && bonusStats.spd === 3 && bonusStats.def === 0 && bonusStats.res === 0):
                    return pack(BlessingEffect.SPD);
                case (bonusStats.atk === 0 && bonusStats.spd === 0 && bonusStats.def === 4 && bonusStats.res === 0):
                    return pack(BlessingEffect.DEF);
                case (bonusStats.atk === 0 && bonusStats.spd === 0 && bonusStats.def === 0 && bonusStats.res === 4):
                    return pack(BlessingEffect.RES);
                default:
                    throw new Error(`illegal non pair-up legendary unit bonus stats ${JSON.stringify(legendary)}, does not match`)
            }
        }
    } else {
        // MYTHIC
        if (bonusStats.hp !== 5) {
            throw new Error(`illegal mythic unit bonus stats ${JSON.stringify(bonusStats)}, hp not 5`);
        }
        if (extraSlot) {
            switch (true) {
                case (bonusStats.atk === 3 && bonusStats.spd === 0 && bonusStats.def === 0 && bonusStats.res === 0):
                    return pack(BlessingEffect.ATK_EXTRA);
                case (bonusStats.atk === 0 && bonusStats.spd === 4 && bonusStats.def === 0 && bonusStats.res === 0):
                    return pack(BlessingEffect.SPD_EXTRA);
                case (bonusStats.atk === 0 && bonusStats.spd === 0 && bonusStats.def === 5 && bonusStats.res === 0):
                    return pack(BlessingEffect.DEF_EXTRA);
                case (bonusStats.atk === 0 && bonusStats.spd === 0 && bonusStats.def === 0 && bonusStats.res === 5):
                    return pack(BlessingEffect.RES_EXTRA);
                default:
                    throw new Error(`illegal extra-slot mythic unit bonus stats ${JSON.stringify(legendary)}, does not match`)
            }
        } else {
            switch (true) {
                case (bonusStats.atk === 3 && bonusStats.spd === 0 && bonusStats.def === 0 && bonusStats.res === 0):
                    return pack(BlessingEffect.ATK);
                case (bonusStats.atk === 0 && bonusStats.spd === 4 && bonusStats.def === 0 && bonusStats.res === 0):
                    return pack(BlessingEffect.SPD);
                case (bonusStats.atk === 0 && bonusStats.spd === 0 && bonusStats.def === 5 && bonusStats.res === 0):
                    return pack(BlessingEffect.DEF);
                case (bonusStats.atk === 0 && bonusStats.spd === 0 && bonusStats.def === 0 && bonusStats.res === 5):
                    return pack(BlessingEffect.RES);
                default:
                    throw new Error(`illegal non extra-slot mythic unit bonus stats ${JSON.stringify(legendary)}, does not match`)
            }
        }
    }
}

export const defaultHeroDao = new HeroDao({repoPath: "files/assets/Common/SRPG/Person", timerLabel: "TIME: Hero Definition DAO finished initialization"});
