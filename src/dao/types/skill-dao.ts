import { assertIsPassiveSkillDefinition, assertIsWeaponDefinition, AssistDefinition, MovementType, MovementTypeBitfield, ParameterPerStat, PassiveSkillDefinition, RefineType, SkillCategory, SkillDefinition, SpecialDefinition, Stat, WeaponDefinition, WeaponType, WeaponTypeBitfield, } from "./dao-types";
import { Dao } from "../mixins/dao";
import { GithubSourced } from "../mixins/github-sourced";
import { WriteOnceIdIndexed } from "../mixins/id-indexed";
import { WriteOnceKeyIndexed } from "../mixins/key-indexed";
import { getAllEnumValues } from "enum-for";
import { MediaWikiImage } from "../mixins/mediawiki-image";
import fs from "fs";
import { VercelKvBacked } from "../mixins/vercel-kv-backed";

// typescript needs this to correctly infer the type parameters of generic mixins, 
// Thanks https://stackoverflow.com/a/57362442
const typeToken = null! as SkillDefinition;
const imageTypeToken = null! as PassiveSkillDefinition;

const idKeyTypeToken = 0;
const stringKeyTypeToken = "";

export class SkillDao extends VercelKvBacked(typeToken, GithubSourced(typeToken, MediaWikiImage(imageTypeToken, WriteOnceIdIndexed(typeToken, WriteOnceKeyIndexed(typeToken, Dao<SkillDefinition>))))) {
    public initialization: Promise<void>;

    constructor({ repoPath, timerLabel }: { repoPath: string, timerLabel: string }) {
        super({ repoPath });
        console.time(timerLabel);
        this.initialization = this.loadData().then(() => console.timeEnd(timerLabel));
    }

    public async writeData(){
        await this.writeHash("SKILL_BY_ID", this.collectionIds);
        await this.writeHash("SKILL_BY_KEY", this.collectionKeys);
    }

    private async loadData() {
        return this.getGithubData()
            .then(data => data.filter(definition => definition.idNum > 0)) // remove the NULL Skill
            .then(data => { this.setByIds(data); return data; })
            .then(data => { this.setByKeys(data); return data; })
            .then(data => { this.populateRefines(data); return data; })
            // must be declared async/await since not returning the promise, but the data
            .then(async data => {
                await this.populateSkillImageUrls(
                    // too bad type guards don't work with filter...
                    data.filter(skillDefinition => assertIsPassiveSkillDefinition(skillDefinition)) as PassiveSkillDefinition[]
                );
                return data;
            })
            .then(async data => {
                await this.populateEffectRefineImageUrls(
                    data.filter(skillDefinition =>
                        assertIsWeaponDefinition(skillDefinition)
                        && skillDefinition.refineType === RefineType.EFFECT
                    ) as WeaponDefinition[]
                );
                return data;
            })
            .then(() => undefined);
    }

    protected override toValueType: (json: any) => SkillDefinition = (json) => {
        const skillDefinition: SkillDefinition = {
            idNum: json.id_num,
            sortId: json.sort_id,
            idTag: json.id_tag,
            nameId: json.name_id,
            descId: json.desc_id,

            // remove nulls, they are worthless.
            prerequisites: json.prerequisites.filter((idTag: string | null) => idTag !== null),
            nextSkill: json.next_skill,

            exclusive: json.exclusive,
            enemyOnly: json.enemy_only,

            category: json.category,
            wepEquip: toWeaponTypeIdBitfield(json.wep_equip),
            movEquip: toMovementTypeIdBitfield(json.mov_equip),
        }

        // category differentiates SkillDefinition implementations
        // pull it out into its own const to let TS narrow properly
        const category = skillDefinition.category;
        switch (category) {
            case SkillCategory.WEAPON:
                const weaponDefinition: WeaponDefinition = {
                    ...skillDefinition,
                    // I choose to EXCLUDE weapon refine atk boosts from might - this is not what is normally displayed!
                    might: json.might - (json.refine_stats?.[Stat.ATK] ?? 0), 
                    range: json.range,
                    arcaneWeapon: json.arcane_weapon,
                    refined: json.refined,
                    refineBase: json.refine_base,
                    refineStats: json.refine_stats,
                    // this needs to be loaded in later
                    refines: [],
                    refineType: classifyRefine(json),
                    category: category,
                };
                return weaponDefinition;
            case SkillCategory.ASSIST:
                const assistDefinition: AssistDefinition = {
                    ...skillDefinition,
                    range: json.range,
                    category: category,
                }
                return assistDefinition;
            case SkillCategory.SPECIAL:
                const specialDefinition: SpecialDefinition = {
                    ...skillDefinition,
                    cooldownCount: json.cooldown_count,
                    category: category,
                }
                return specialDefinition;
            case SkillCategory.PASSIVE_A:
            case SkillCategory.PASSIVE_B:
            case SkillCategory.PASSIVE_C:
            case SkillCategory.PASSIVE_S:
                const passiveSkillDefinition: PassiveSkillDefinition = {
                    ...skillDefinition,
                    // loaded in later
                    imageUrl: null! as string,
                }
                return passiveSkillDefinition;
            default:
                console.error(`Unexpected SkillCategory - should have been excluded! id ${skillDefinition.idNum}, ${SkillCategory[skillDefinition.category]}`)
                return skillDefinition;
        }
    }

    // Only want these categories, 
    RELEVANT_SKILL_CATEGORIES = getAllEnumValues(SkillCategory);
    protected override acceptIf: (json: any) => boolean = (json) => {
        // Only want some SkillCategories - others are rejected
        return this.RELEVANT_SKILL_CATEGORIES.includes(json.category);
    }

    //TODO:- where is a special effect refine's desc stored?

    // the refineBase of a refined weapon points to the unrefined version
    // but a refines of a unrefined weapon pointing to the refined versions is needed too - perform that reverse mapping
    private async populateRefines(data: SkillDefinition[]) {
        data.forEach(skillDefinition => {
            if (!assertIsWeaponDefinition(skillDefinition) || skillDefinition.refineBase === null) {
                return;
            }
            const refineBaseWeapon = this.sneakyGetByKey(skillDefinition.refineBase);
            if (assertIsWeaponDefinition(refineBaseWeapon) /* always true */) {
                refineBaseWeapon.refines.push(skillDefinition.idTag);
            }
        })
    }

    async getByIdNums(idNums: number[], filterCategories?: SkillCategory[] | null) {
        await this.initialization;
        const skills = this.getByIds(idNums);
        if (filterCategories) {
            return skills.filter(skill => filterCategories.includes(skill.category));
        }
        return skills;
    }

    // NOTE!! idTags are not unique - e.g. Quick Riposte 3 as a PASSIVE_B and Quick Riposte 3 as a PASSIVE_S share the same idTag.
    async getByIdTags(idTags: string[]) {
        await this.initialization;
        return this.getByKeys(idTags);
    }

    async getAll(filterCategories?: SkillCategory[] | null) {
        await this.initialization;
        const skills = this.getAllIds();
        if (filterCategories) {
            return skills.filter(skill => filterCategories.includes(skill.category));
        }
        return skills;
    }
}


// Is there a nice way to constrain a generic type to Numeric Enum???
function toWeaponTypeIdBitfield(weaponTypeBitvector: number): WeaponTypeBitfield {
    const bitfield: any = {};
    getAllEnumValues(WeaponType).forEach((id) => {
        bitfield[id] = (weaponTypeBitvector & (1 << id)) > 0;
    });

    return bitfield;
}
function toMovementTypeIdBitfield(movementTypeBitvector: number): MovementTypeBitfield {
    const bitfield: any = {};
    getAllEnumValues(MovementType).forEach((id) => {
        bitfield[id] = (movementTypeBitvector & (1 << id)) > 0;
    });

    return bitfield;
}


function classifyRefine(json: {
    refine_stats: ParameterPerStat,
    class_params: ParameterPerStat,
    wep_equip: number,
    refine_sort_id: number,
    refined: boolean,
}) {
    const {
        class_params,
        wep_equip,
        refine_sort_id,
    } = json;

    if (toWeaponTypeIdBitfield(wep_equip)[WeaponType.STAFF]) {
        // staff refines are NONE, DAZZLING, WRATHFUL
        // prf non-refines seem to be distinguished by a non-zero class_params.hp, which indicates WRATHFUL (1) or DAZZLING (2)
        // their refines are always EFFECT
        if ((class_params[Stat.HP]) > 0 && (refine_sort_id) > 0) {
            return RefineType.EFFECT;
        }
        // inheritables don't get the non-zero class_params.hp even if the refine provides WRATHFUL or DAZZLING,
        // their refine effect is indicated solely by refine_sort_id
        switch (refine_sort_id) {
            case 0:
                return RefineType.NONE;
            case 1:
                return RefineType.WRATHFUL;
            case 2:
                return RefineType.DAZZLING;
            default:
                // uh oh - did the rules change?
                throw new Error(`Could not classify staff refine with ${(json as any).id_tag} refine sort id: ${JSON.stringify(refine_sort_id)}`);
        }
    } else {
        // non-staff refines are NONE, EFFECT, A/S/D/R
        // and completely determined by the value of refine_sort_id

        switch (refine_sort_id) {
            case 0:
                return RefineType.NONE;
            case 1:
            case 2:
                return RefineType.EFFECT;
            case 101:
                return RefineType.ATK;
            case 102:
                return RefineType.SPD;
            case 103:
                return RefineType.DEF;
            case 104:
                return RefineType.RES;
        }

        // uh oh - this should really never happen, unless the rules for refine stats change a lot
        throw new Error(`Could not classify refine ${(json as any).id_tag} with refine sort id: ${refine_sort_id}`);
    }
}

export const defaultSkillDao = new SkillDao({repoPath: "files/assets/Common/SRPG/Skill", timerLabel: "TIME: Skill Definition DAO finished initialization"});
