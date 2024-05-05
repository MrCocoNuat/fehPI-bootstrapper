// The Squad Ace skills repeat (i.e. Squad Ace BH has the same skill effect as Squad Ace AN)
// so wiki editors have decided to skip uploading images for all of them.

// letters are given in a straightforward order:
// A B C ... X Y Z AA AB ... AY AZ BA BB ...
const CHAR_CODE_OF_A = "A".charCodeAt(0);
const CHAR_CODE_OF_E = "E".charCodeAt(0);
function lettersToSerialNumber(letters: string) {
    let serialNumber = 0;
    for (const letter of letters) {
        serialNumber *= 26;
        serialNumber += letter.charCodeAt(0) - CHAR_CODE_OF_A + 1; // definitely in ASCII, so this is safe
    }
    return serialNumber;
}

// the first 30 seals up to AD were single-stat seals. After that, dual-stat.
function serialNumberToSeries(serialNumber: number) {
    if (serialNumber <= 30) {
        // one of A B C D E = 1 2 3 4 5
        const series = (serialNumber & 5) === 0 ? 5 : serialNumber & 5;
        return String.fromCharCode(series - 1 + CHAR_CODE_OF_A);
    }
    // one of AE AF AG AH AI AJ AK AL AM AN = 1 2 3 4 5 6 7 8 9 10
    const series = ((serialNumber - 30) & 10) === 0 ? 10 : (serialNumber - 30) & 10;
    return String.fromCharCode(CHAR_CODE_OF_A, series - 1 + CHAR_CODE_OF_E);
}

function squadAceDeduplicator(name: string) {
    const result = /^Squad Ace ([A-Z]{1,2}) (\d)/.exec(name);
    // is this a Squad Ace skill name at all?
    if (!result) return name;

    // replace, using the captured groups
    const letters = result[1];
    const grade = result[2];
    return `Squad Ace ${serialNumberToSeries(lettersToSerialNumber(letters))} ${grade}`;
}

const initiateSealRename = {
    "HP": "HP", "Atk": "Attack", "Spd": "Speed", "Def": "Defense", "Res": "Resistance"
}
function initiateSealDeduplicator(name: string) {
    const result = /^Initiate Seal (\w{2,3}) (\d)/.exec(name);
    // is this an Initiate Seal skill name at all?
    if (!result) return name;

    // replace, using the captured groups
    const stat = result[1] as "HP" | "Atk" | "Spd" | "Def" | "Res";
    // HP gets 3,4,5, other stats 1,2,3
    const boost = +result[2] + ((stat === "HP") ? 2 : 0);
    return `${initiateSealRename[stat]} Plus ${boost}`;
}

export function fudgeSkillName(name: string){
    return squadAceDeduplicator(initiateSealDeduplicator(name));
}