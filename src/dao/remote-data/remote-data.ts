import { LocalRepositoryReader, RemoteRepositoryReader, RepositoryReader } from "../../api-client/github/github";
import { MediaWikiReader } from "../../api-client/mediawiki/mediawiki";
import { RepositoryDetails, WikiDetails } from "./datasource-types";

import remoteData from "./remotes.json";

const loadDataSourceDetails = (descriptor: string) => {
    return (remoteData as { [repositoryDescriptor: string]: any })[descriptor];
}

const fehRepositoryReader: () => RepositoryReader = () => {
    const repositoryDetails = loadDataSourceDetails("feh-assets-json") as RepositoryDetails;
    //in dev, use a local copy instead of around 100 graphql requests
    return (process.env.USE_LOCAL === "true") ?
        new LocalRepositoryReader(repositoryDetails)
        : new RemoteRepositoryReader(repositoryDetails);
}

const mediaWikiReader: () => MediaWikiReader = () => {
    const mediaWikiDetails = loadDataSourceDetails("feh-wiki") as WikiDetails;
    return new MediaWikiReader(mediaWikiDetails);
}

export const fehAssetsJsonReader = fehRepositoryReader();
export const fehWikiReader = mediaWikiReader();