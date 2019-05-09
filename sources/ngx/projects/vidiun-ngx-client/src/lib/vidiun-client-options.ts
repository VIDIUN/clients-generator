import { Injectable, InjectionToken } from '@angular/core';

export const VIDIUN_CLIENT_OPTIONS: InjectionToken<VidiunClientOptions> = new InjectionToken('vidiun client options');

export interface VidiunClientOptions {
    clientTag: string;
    endpointUrl: string;
    chunkFileSize?: number;
    chunkFileDisabled?: boolean;
}