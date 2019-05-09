
import {of as observableOf,  Observable } from 'rxjs';
import { VidiunFileRequest } from '../api/vidiun-file-request';
import { VidiunRequestOptions, VidiunRequestOptionsArgs } from '../api/vidiun-request-options';
import { buildUrl, createClientTag, createEndpoint, prepareParameters } from './utils';
import { VidiunClientOptions } from '../vidiun-client-options';


export class VidiunFileRequestAdapter {

    public transmit(request: VidiunFileRequest, clientOptions: VidiunClientOptions, defaultRequestOptions: VidiunRequestOptions): Observable<{ url: string }> {
        const parameters = prepareParameters(request, clientOptions, defaultRequestOptions);
      const endpointOptions = { ...clientOptions, service: parameters['service'], action:  parameters['action'] }
        const endpointUrl = createEndpoint(request, endpointOptions);
        delete parameters['service'];
        delete parameters['action'];

        return observableOf({url: buildUrl(endpointUrl, parameters)});
    }
}
