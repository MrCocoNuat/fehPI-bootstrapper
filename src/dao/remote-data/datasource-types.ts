export interface RepositoryDetails {
    repoOwner: string,
    repoName: string,
    branch: string,
    rawUrl: string,
    useLocal?: boolean,
}

export interface WikiDetails {
    baseUrl: string,
}