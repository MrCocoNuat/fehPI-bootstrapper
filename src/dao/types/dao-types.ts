export enum SkillCategory {
    WEAPON,
    ASSIST,
    SPECIAL,
    PASSIVE_A,
    PASSIVE_B,
    PASSIVE_C,
    PASSIVE_S,
    // never use these
    //REFINE_EFFECT,
    //BEAST_EFFECT,
};
export type SkillCategoryName = keyof typeof SkillCategory;

export enum MovementType {
    INFANTRY,
    ARMORED,
    CAVALRY,
    FLYING,
};
export type MovementTypeName = keyof typeof MovementType;
export type MovementTypeBitfield = { [movementTypeId in MovementType]: boolean };

export enum WeaponType {
    SWORD,
    LANCE,
    AXE,
    RED_BOW,
    BLUE_BOW,
    GREEN_BOW,
    COLORLESS_BOW,
    RED_DAGGER,
    BLUE_DAGGER,
    GREEN_DAGGER,
    COLORLESS_DAGGER,
    RED_TOME,
    BLUE_TOME,
    GREEN_TOME,
    COLORLESS_TOME,
    STAFF,
    RED_BREATH,
    BLUE_BREATH,
    GREEN_BREATH,
    COLORLESS_BREATH,
    RED_BEAST,
    BLUE_BEAST,
    GREEN_BEAST,
    COLORLESS_BEAST,
};
export type WeaponTypeName = keyof typeof WeaponType;
export type WeaponTypeBitfield = { [weaponTypeId in WeaponType]: boolean };

export enum Series {
    HEROES = 0,
    SHADOW_DRAGON_AND_NEW_MYSTERY = 1,
    ECHOES = 2,
    GENEALOGY_OF_THE_HOLY_WAR = 3,
    THRACIA_776 = 4,
    BINDING_BLADE = 5,
    BLAZING_BLADE = 6,
    SACRED_STONES = 7,
    PATH_OF_RADIANCE = 8,
    RADIANT_DAWN = 9,
    AWAKENING = 10,
    FATES = 11,
    THREE_HOUSES = 12,
    TOKYO_MIRAGE_SESSIONS = 13,
    ENGAGE = 14,
}; // order matters!
export type SeriesName = keyof typeof Series;
export type SeriesBitfield = { [seriesId in Series]: boolean };

export interface SkillDefinition {
    idNum: number
    sortId: number,

    idTag: string,
    nameId: string,
    descId: string,

    prerequisites: string[],
    nextSkill: string | null,

    exclusive: boolean,
    enemyOnly: boolean,

    category: SkillCategory,
    wepEquip: WeaponTypeBitfield,
    movEquip: MovementTypeBitfield,
}

export enum RefineType {
    NONE,
    EFFECT,
    ATK,
    SPD,
    DEF,
    RES,
    DAZZLING,
    WRATHFUL,
}

export interface WeaponDefinition extends SkillDefinition {
    might: number,
    range: number,
    refined: boolean,
    refineBase: string | null,
    refineStats: ParameterPerStat,
    refines: string[],
    arcaneWeapon: boolean,
    refineType: RefineType,
    imageUrl?: string, // present for effect refines, which have unique icons
    category: SkillCategory.WEAPON, // always known
}
// not a complete guard, shifts responsibility to programmer to remember to actually define fields
export function assertIsWeaponDefinition(skillDefinition: SkillDefinition): skillDefinition is WeaponDefinition {
    return skillDefinition.category === SkillCategory.WEAPON;
}

export interface AssistDefinition extends SkillDefinition {
    range: number, // do we need this?
    category: SkillCategory.ASSIST,
}
export function assertIsAssistDefinition(skillDefinition: SkillDefinition): skillDefinition is AssistDefinition {
    return skillDefinition.category === SkillCategory.ASSIST;
}

export interface SpecialDefinition extends SkillDefinition {
    cooldownCount: number,
    category: SkillCategory.SPECIAL,
}
export function assertIsSpecialDefinition(skillDefinition: SkillDefinition): skillDefinition is SpecialDefinition {
    return skillDefinition.category === SkillCategory.SPECIAL;
}

export interface PassiveSkillDefinition extends SkillDefinition {
    imageUrl: string,
}
const passiveSkillCategories: readonly SkillCategory[] = [SkillCategory.PASSIVE_A, SkillCategory.PASSIVE_B, SkillCategory.PASSIVE_C, SkillCategory.PASSIVE_S];
export function assertIsPassiveSkillDefinition(skillDefinition: SkillDefinition): skillDefinition is PassiveSkillDefinition {
    return passiveSkillCategories.includes(skillDefinition.category);
}

type SkillsPerRarity = [
    string | null,
    string | null,
    string | null,
    string | null,
    string | null,
    string | null,
    string | null,
    string | null,
    string | null,
    string | null,
    string | null,
    string | null,
    string | null,
    string | null,
];
// 14 length - Known(weapon,assist,special,a,b,c) Learnable(weapon,assist,special,a,b,c,Leg/Myth upgraded prf,Leg/Myth Remix)
// gets transformed by graphql into:
export type HeroSkills = { known: string[], learnable: string[] }


export type ParameterPerStat = { [stat in Stat]: number }

// these string enum values ARE IMPORTANT - they match feh-assets-json
export enum OptionalStat {
    HP = "hp",
    ATK = "atk",
    SPD = "spd",
    DEF = "def",
    RES = "res",
    NONE = "none",
}
export enum Stat {
    HP = "hp", //OptionalStat.HP,
    ATK = "atk", //OptionalStat.ATK,
    SPD = "spd", //OptionalStat.SPD,
    DEF = "def", //OptionalStat.DEF,
    RES = "res", //OptionalStat.RES
};
export const StatEnumValues = [Stat.HP, Stat.ATK, Stat.SPD, Stat.DEF, Stat.RES] as const;
// getting only enum keys or values of a string enum is not fun
export function sameStats(s1 :Stat|OptionalStat, s2 : Stat|OptionalStat){
    return s1 as OptionalStat === s2 as OptionalStat
}

export enum HonorType {
    NONE,
    LEGENDARY,
    MYTHIC,
    DUO,
    HARMONIC,
    ASCENDED,
    REARMED,
    // please IS never create more or allow a hero to be more than one
}


// for legendary/mythic
export enum BlessingSeason {
    // legendary
    FIRE = 1,
    WATER,
    WIND,
    EARTH,
    // mythic
    LIGHT,
    DARK,
    ASTRA,
    ANIMA,
}
export enum BlessingEffect{
    // both
    ATK,
    SPD,
    DEF,
    RES,
    // valid for legendary only
    PAIR_UP,
    ATK_PAIR_UP,
    SPD_PAIR_UP,
    DEF_PAIR_UP,
    RES_PAIR_UP,
    // valid for mythic only
    ATK_EXTRA,
    SPD_EXTRA,
    DEF_EXTRA,
    RES_EXTRA,
}


export interface HeroDefinition {
    idNum: number,
    sortValue: number,

    idTag: string,
    nameId: string,
    epithetId: string,

    dragonflowers: { maxCount: number },

    origins: SeriesBitfield,
    series: Series,
    weaponType: WeaponType,
    movementType: MovementType,
    refresher: boolean,

    baseVectorId: number,
    baseStats: ParameterPerStat,
    growthRates: ParameterPerStat,

    // importantly, heroes can equip Skills that are (not exclusive) OR (appear in this collection)
    skills: [SkillsPerRarity, SkillsPerRarity, SkillsPerRarity, SkillsPerRarity, SkillsPerRarity],

    imageUrl: string,
    resplendentImageUrl?: string,

    honorType: HonorType,
}

// legendary and mythic Honors specifically
export interface BlessedHeroDefinition extends HeroDefinition {
    blessingSeason: BlessingSeason,
    blessingEffect: BlessingEffect,
}
export function assertIsBlessedHeroDefinition(heroDefinition: HeroDefinition): heroDefinition is BlessedHeroDefinition {
    return heroDefinition.honorType === HonorType.LEGENDARY || heroDefinition.honorType === HonorType.MYTHIC;
}


export enum Language {
    EUDE, EUEN, EUES, EUFR, EUIT, JPJA, TWZH, USEN, USES, USPT
};
export enum OptionalLanguage {
    EUDE, EUEN, EUES, EUFR, EUIT, JPJA, TWZH, USEN, USES, USPT, NONE
};

export type Message = {
    idTag: string,
    value: string,
};

export type GrowthVectors = string[];