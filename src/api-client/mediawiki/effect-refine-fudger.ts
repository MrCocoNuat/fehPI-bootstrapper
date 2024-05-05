// effect refines that share the same effect (generally an effect also given by a passive) 

import { Message } from "../../dao/types/dao-types";

// sometimes have a recycled icon (generally similar to that passive) applied:
const effectRefineFudgedNames = {
    "Lordly Lance": "Ally Support Joint Bonuses",
    "Knightly Lance": "Ally Support Joint Bonuses",
    "Devil Axe": "Wrath",
    "Jubilant Blade": "Combat Bonuses Life",
    "Veteran Lance": "Sabotage Atk",
    "Blue-Crow Tome": "Weakness Atk",
    "Runeaxe": "Combat Bonuses Enemy Penalty",
    "Gloom Breath": "Combat Bonuses Enemy Weakening",
    "Valflame": "Weakness Atk",
    "Wargod's Tome": "Weakness Atk",
    "Alondite": "Killer All",
    "Blizzard": "Weakness Amplification",
    "Missiletainn": "Missiletainn sword",
    "Fruit of Iðunn": "Giga Excalibur",
    "Sagittae": "Expiration",
    "Sol Katti": "Brash Assault",
    "Mystletainn": "Fury",
    "Hauteclere": "Special Damage",
    "Armorsmasher+": "Dull Armor",
    "Slaying Spear+": "Dull Armor",
    "Slaying Hammer+": "Dull Armor",
    "Zanbato+": "Dull Cavalry",
    "Ridersbane+": "Dull Cavalry",
    "Keen Rauðrwolf+": "Dull Cavalry",
    "Keen Blárwolf+": "Dull Cavalry",
    "Keen Gronnwolf+": "Dull Cavalry",
    "Parthia": "Distant Atk",
    "Cymbeline": "Flier Atk Res Bond",
    "Wing Sword": "Flashing Blade",
    "Basilikos": "Life and Death",
    "Falchion MYSTERY": "Falchion Mystery",
    "Falchion GAIDEN": "Falchion Gaiden",
    "Falchion AWAKENING": "Falchion Awakening",
    "Eckesachs": "Distant Def",
    "Poleaxe+": "Dull Cavalry",
    "Nameless Blade": "Special Damage",
    "Forblaze": "Death Blow",
    "Binding Blade": "Quick Riposte",
    "Regal Blade": "Infantry Mage Bond",
    "Rhomphaia": "Flashing Blade",
    "Dauntless Lance": "Steady Posture",
    "Draconic Poleax": "Res Tactic",
    "Fólkvangr": "Triangle Adept",
    "Fensalir": "Spd Def Bond",
    "Nóatún": "Follow",
    "Cherche's Axe": "Panic Ploy",
    "Odin's Grimoire": "Atk Spd Link",
    "Solitary Blade": "Life and Death",
    "Vidofnir": "Atk Spd Bond Infantry Armor",
    "Shanna's Lance": "Special Damage",
    "Axe of Virility": "Fury",
    "Gladiator's Blade": "Atk Spd Bond Infantry Flier",
    "Whitewing Blade": "Triangle",
    "Whitewing Lance": "Triangle",
    "Whitewing Spear": "Triangle",
    "Tactical Bolt": "All Tactic",
    "Tactical Gale": "All Tactic",
    "Tome of Thoron": "Darting Blow",
    "Tyrfing": "Atk Def Bond",
    "Durandal": "Swift Sparrow",
    "Silverbrand": "Spd Tactic",
    "Hinata's Katana": "Fury",
    "Oboro's Spear": "Close Def",
    "Iris's Tome": "Even Atk Wave",
    "Niles's Bow": "Flashing Blade",
    "Dark Excalibur": "Quickened Pulse",
    "Argent Bow": "Chill Def",
    "Eternal Tome": "Bracing Stance",
    "Bull Blade": "Consecutive Attack RG",
    "Hana's Katana": "Swift Sparrow",
    "Panther Sword": "Def Side Consecutive Atk RG",
    "Bull Spear": "Def Side Consecutive Atk RG",
    "Daybreak Lance": "Sturdy Stance",
    "Bow of Devotion": "Quick Riposte",
    "Amiti": "Swift Sparrow",
    "Steady Lance": "Darting Blow",
    "Selena's Blade": "Special Damage",
    "Book of Orchids": "Atk Spd Link",
    "Guardian's Axe": "Lull Atk Def",
    "Frederick's Axe": "Death Blow",
    "Concealed Blade": "Desperation",
    "Sun Dragonstone": "Lull Atk Spd",
} as { [name: string]: string };
export function fudgeEffectRefine(name: string) {
    return effectRefineFudgedNames[name] ?? name;
}

// the list of shared icons is not expected to grow anymore
// current refines are packed with so many effects that it is inconceivable for 
// two weapon refines to share the same effects, and in any case
// no single existing passive icon will suffice to represent it

const falchionEffectRefineNames = {
    "MSID_ファルシオン": "Falchion MYSTERY",
    "MSID_ファルシオン外伝": "Falchion GAIDEN",
    "MSID_ファルシオン覚醒": "Falchion AWAKENING",
} as { [tag: string]: string };

// the three different weapons all named "Falchion" have different image urls
export const distinguishFalchions: (message: Message) => string = (message) => {
    return (falchionEffectRefineNames[message.idTag]) ?? message.value;
}
// this list is not expected to increase either, since most Falchions now have additional adjectives attached