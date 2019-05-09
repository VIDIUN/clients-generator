import { NgModule, Optional, SkipSelf, ModuleWithProviders } from '@angular/core';
import { VidiunClient } from './vidiun-client.service';
import { HttpClientModule } from '@angular/common/http';
import { VIDIUN_CLIENT_OPTIONS, VidiunClientOptions } from './vidiun-client-options';
import { VIDIUN_CLIENT_DEFAULT_REQUEST_OPTIONS, VidiunRequestOptionsArgs } from './api/vidiun-request-options';


@NgModule({
    imports: <any[]>[
        HttpClientModule
    ],
    declarations: <any[]>[
    ],
    exports: <any[]>[
    ],
    providers: <any[]>[
    ]
})
export class VidiunClientModule {

    constructor(@Optional() @SkipSelf() module: VidiunClientModule) {
        if (module) {
            throw new Error("'VidiunClientModule' module imported twice.");
        }
    }

    static forRoot(clientOptionsFactory?: () => VidiunClientOptions, defaultRequestOptionsArgsFactory?: () => VidiunRequestOptionsArgs): ModuleWithProviders {
        return {
            ngModule: VidiunClientModule,
            providers: [
                VidiunClient,
                VIDIUN_CLIENT_OPTIONS ? {
                    provide: VIDIUN_CLIENT_OPTIONS,
                    useFactory: clientOptionsFactory
                } : [],
                VIDIUN_CLIENT_DEFAULT_REQUEST_OPTIONS? {
                    provide: VIDIUN_CLIENT_DEFAULT_REQUEST_OPTIONS,
                    useFactory: defaultRequestOptionsArgsFactory
                } : []
            ]
        };
    }
}
