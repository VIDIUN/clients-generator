import { VidiunFileRequest } from '../api/vidiun-file-request';
import { VidiunRequestOptions, VidiunRequestOptionsArgs } from '../api/vidiun-request-options';
import { buildQuerystring, createClientTag, createEndpoint, prepareParameters } from './utils';
import { VidiunClientOptions } from '../vidiun-client-options';
import { CancelableAction } from '../cancelable-action';


export class VidiunFileRequestAdapter {

    public transmit(request: VidiunFileRequest, clientOptions: VidiunClientOptions, defaultRequestOptions: VidiunRequestOptions): CancelableAction<{ url: string }> {
        const parameters = prepareParameters(request, clientOptions, defaultRequestOptions);
        const endpointUrl = createEndpoint(request, clientOptions, parameters['service'], parameters['action']);
        delete parameters['service'];
        delete parameters['action'];

        return CancelableAction.resolve({url: `${endpointUrl}?${buildQuerystring(parameters)}`});
    }
}