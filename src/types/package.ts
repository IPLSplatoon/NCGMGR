export interface PackageSchema {
    name: string
    version: string
}

export enum PackageStatus {
    READY_TO_INSTALL,
    INSTALLED,
    UNABLE_TO_INSTALL
}
