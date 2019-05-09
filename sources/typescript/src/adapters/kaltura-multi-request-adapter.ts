import { VidiunMultiRequest } from '../api/vidiun-multi-request';
import { VidiunMultiResponse } from '../api/vidiun-multi-response';
import { createCancelableAction, createEndpoint, getHeaders, prepareParameters } from './utils';
import { VidiunAPIException } from '../api/vidiun-api-exception';
import { VidiunClientException } from '../api/vidiun-client-exception';
import { VidiunRequestOptions } from '../api/vidiun-request-options';
import { VidiunClientOptions } from '../vidiun-client-options';
import { CancelableAction } from '../cancelable-action';

export class VidiunMultiRequestAdapter {
    constructor() {
    }

    transmit(request: VidiunMultiRequest, clientOptions: VidiunClientOptions, defaultRequestOptions: VidiunRequestOptions): CancelableAction<VidiunMultiResponse> {

        const body = prepareParameters(request, clientOptions, defaultRequestOptions);

        const endpoint = createEndpoint(request, clientOptions, body['service'], body['action']);
        delete body['service'];
        delete body['action'];

        return <any>(createCancelableAction<VidiunMultiResponse>({endpoint, headers: getHeaders(), body})
            .then(result => {
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
                },
                error => {
                    const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : null;
                    throw new VidiunClientException("client::multi-request-network-error", errorMessage || 'Error connecting to server');
                }));
    }
}