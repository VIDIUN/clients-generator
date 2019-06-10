
import {map, catchError} from 'rxjs/operators';


import { HttpClient } from '@angular/common/http';
import { VidiunMultiRequest } from '../api/vidiun-multi-request';
import { VidiunMultiResponse } from '../api/vidiun-multi-response';
import { Observable } from 'rxjs';
import { createEndpoint, getHeaders, prepareParameters } from './utils';
import { VidiunAPIException } from '../api/vidiun-api-exception';
import { VidiunClientException } from '../api/vidiun-client-exception';
import { VidiunRequestOptions } from '../api/vidiun-request-options';
import { VidiunClientOptions } from '../vidiun-client-options';

export class VidiunMultiRequestAdapter {
    constructor(private _http: HttpClient) {
    }

    transmit(request: VidiunMultiRequest,  clientOptions: VidiunClientOptions, defaultRequestOptions: VidiunRequestOptions): Observable<VidiunMultiResponse> {

        const parameters = prepareParameters(request, clientOptions, defaultRequestOptions);

      const endpointOptions = { ...clientOptions, service: parameters['service'], action:  parameters['action'] }
        const endpointUrl = createEndpoint(request, endpointOptions);
        delete parameters['service'];
        delete parameters['action'];



        return this._http.request('post', endpointUrl,
            {
                body: parameters,
                headers: getHeaders()
            }).pipe(
            catchError(
                error => {
                    const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : null;
                    throw new VidiunClientException("client::multi-request-network-error", errorMessage || 'Error connecting to server');
                }
            ),
            map(
                result => {
                    try {
                        return request.handleResponse(result);
                    } catch (error) {
                        if (error instanceof VidiunClientException || error instanceof VidiunAPIException) {
                            throw error;
                        } else {
                            const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : null;
                            throw new VidiunClientException('client::multi-response-unknown-error', errorMessage || 'Failed to parse response');
                        }
                    }
                }));
    }
}
