import { distinguishFalchions, fudgeEffectRefine } from "../../api-client/mediawiki/effect-refine-fudger";
import { asciify } from "../../api-client/mediawiki/file-title";
import { fudgeSkillName } from "../../api-client/mediawiki/skill-name-fudger";
import { fehWikiReader } from "../remote-data/remote-data";
import { HeroDefinition, Language, PassiveSkillDefinition, SkillCategory, SkillDefinition, WeaponDefinition } from "../types/dao-types";
import { defaultMessageDao } from "../types/message-dao";
import { DaoConstructor } from "./dao";

// specifically for getting image urls from mediawiki
export function MediaWikiImage<V extends { imageUrl: string, nameId: string }, DBase extends DaoConstructor<V>>(typeToken: V, dBase: DBase) {
    return class MediaWikiImageDao extends dBase {

        // could really generify by allowing overrides for getting file titles, but how often is this mixin really going to be used???

        async populateHeroImageUrls(definitions: HeroDefinition[]) {
            const names = await defaultMessageDao.getByMessageKeys(Language.USEN, definitions.map(definition => definition.nameId));
            const epithets = await defaultMessageDao.getByMessageKeys(Language.USEN, definitions.map(definition => definition.epithetId));
            // zip these up
            const messageStrings = definitions.map((definition, i) => `${names[i].value} ${epithets[i].value}`);

            const fileTitles = messageStrings.map(messageString => `File:${asciify(messageString)} Face FC.webp`);
            const imageUrls = await fehWikiReader.queryImageUrls(fileTitles, true);
            definitions.forEach((definition, i) => definition.imageUrl = imageUrls[i]);

            // a lot of these will not exist
            const resplendentFileTitles = messageStrings.map(messageString => `File:${asciify(messageString)} Resplendent Face FC.webp`);
            const resplendentImageUrls = await fehWikiReader.queryImageUrls(resplendentFileTitles, false);
            definitions.forEach((definition, i) => definition.resplendentImageUrl = resplendentImageUrls[i]);

            return definitions;
        }

        async populateSkillImageUrls(definitions: PassiveSkillDefinition[]) {
            const messages = await defaultMessageDao.getByMessageKeys(Language.USEN, definitions.map(definition => definition.nameId));

            const fileTitles = messages.map(message => message.value).map(name => fudgeSkillName(name)).map(name => `File:${asciify(name)}.png`);
            const imageUrls = await fehWikiReader.queryImageUrls(fileTitles, true);

            definitions.forEach((definition, i) => definition.imageUrl = imageUrls[i]);
            return definitions;
        }

        async populateEffectRefineImageUrls(definitions: WeaponDefinition[]){
            const messages = await defaultMessageDao.getByMessageKeys(Language.USEN, definitions.map(definition => definition.nameId));

            const fileTitles = messages.map(message => distinguishFalchions(message)).map(name => fudgeEffectRefine(name)).map(name => `File:${asciify(name)} W.png`);
            const imageUrls = await fehWikiReader.queryImageUrls(fileTitles, true);

            definitions.forEach((definition, i) => definition.imageUrl = imageUrls[i]);
            return definitions;
        }
    }
}