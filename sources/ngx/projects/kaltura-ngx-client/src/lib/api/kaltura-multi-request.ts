import { VidiunResponse } from "./vidiun-response";
import { VidiunRequest } from "./vidiun-request";
import { VidiunRequestBase } from "./vidiun-request-base";

import { VidiunMultiResponse } from "./vidiun-multi-response";
import { VidiunAPIException } from "./vidiun-api-exception";
import { VidiunObjectMetadata } from './vidiun-object-base';
import { VidiunRequestOptions } from './vidiun-request-options';
import { environment } from '../environment';


export class VidiunMultiRequest extends VidiunRequestBase {

    protected callback: (response: VidiunMultiResponse) => void;

    requests: VidiunRequest<any>[] = [];

    constructor(...args: VidiunRequest<any>[]) {
        super({});
        this.requests = args;
    }

    buildRequest(defaultRequestOptions: VidiunRequestOptions): {} {
        const result = super.toRequestObject();

        for (let i = 0, length = this.requests.length; i < length; i++) {
            result[i] = this.requests[i].buildRequest(defaultRequestOptions);
        }

        return result;
    }

    protected _getMetadata() : VidiunObjectMetadata
    {
        const result = super._getMetadata();
        Object.assign(
            result.properties,
            {
                service : { default : 'multirequest', type : 'c'  }
            });

        return result;

    }

    private _unwrapResponse(response: any): any {
        if (environment.response.nestedResponse) {
            if (response && response.hasOwnProperty('result')) {
                return response.result;
            } else if (response && response.hasOwnProperty('error')) {
                return response.error;
            }
        }

        return response;
    }

    setCompletion(callback: (response: VidiunMultiResponse) => void): VidiunMultiRequest {
        this.callback = callback;
        return this;
    }

    handleResponse(responses: any): VidiunMultiResponse {
        const vidiunResponses: VidiunResponse<any>[] = [];

        const unwrappedResponse = this._unwrapResponse(responses);
        let responseObject = null;

        if (!unwrappedResponse || !(unwrappedResponse instanceof Array) || unwrappedResponse.length !== this.requests.length) {
            const response = new VidiunAPIException(`server response is invalid, expected array of ${this.requests.length}`, 'client::response_type_error', null);
            for (let i = 0, len = this.requests.length; i < len; i++) {
                vidiunResponses.push(this.requests[i].handleResponse(response));
            }
        }
        else {

            for (let i = 0, len = this.requests.length; i < len; i++) {
                const serverResponse = unwrappedResponse[i];
                vidiunResponses.push(this.requests[i].handleResponse(serverResponse));
            }

            if (this.callback) {
                try {
                    this.callback(new VidiunMultiResponse(vidiunResponses));
                } catch (ex) {
                    // do nothing by design
                }
            }
        }

        return new VidiunMultiResponse(vidiunResponses);
    }
}
