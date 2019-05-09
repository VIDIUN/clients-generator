import { VidiunRequest } from '../api/vidiun-request';
import { VidiunAPIException } from '../api/vidiun-api-exception';
import { VidiunClientException } from '../api/vidiun-client-exception';
import { VidiunRequestOptions } from '../api/vidiun-request-options';
import { VidiunClientOptions } from '../vidiun-client-options';
import { createCancelableAction, createEndpoint, getHeaders, prepareParameters } from './utils';
import { CancelableAction } from '../cancelable-action';

export class VidiunRequestAdapter {

    constructor() {
    }

    public transmit<T>(request: VidiunRequest<T>, clientOptions: VidiunClientOptions, defaultRequestOptions: VidiunRequestOptions): CancelableAction<T> {

        const body = prepareParameters(request, clientOptions, defaultRequestOptions);

        const endpoint = createEndpoint(request, clientOptions, body['service'], body['action']);
        delete body['service'];
        delete body['action'];

        return <any>createCancelableAction<T>({endpoint, headers: getHeaders(), body})
            .then(result => {
                    try {
                        const response = request.handleResponse(result);

                        if (response.error) {
                            throw response.error;
                        } else {
                            return response.result;
                        }
                    } catch (error) {
                        if (error instanceof VidiunClientException || error instanceof VidiunAPIException) {
                            throw error;
                        } else {
                            const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : null;
                            throw new VidiunClientException('client::response-unknown-error', errorMessage || 'Failed to parse response');
                        }
                    }
                },
                error => {
                    const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : null;
                    throw new VidiunClientException("client::request-network-error", errorMessage || 'Error connecting to server');
                });
    }
}