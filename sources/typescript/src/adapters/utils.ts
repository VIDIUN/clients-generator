import { VidiunRequestBase } from '../api/vidiun-request-base';
import { VidiunClientOptions } from '../vidiun-client-options';
import { VidiunRequestOptions, VidiunRequestOptionsArgs } from '../api/vidiun-request-options';
import { VidiunMultiRequest } from '../api/vidiun-multi-request';
import { VidiunRequest } from '../api/vidiun-request';
import { VidiunFileRequest } from '../api/vidiun-file-request';
import { CancelableAction } from '../cancelable-action';
import { VidiunAPIException } from '../api/vidiun-api-exception';
import { VidiunClientException } from '../api/vidiun-client-exception';
import { environment } from '../environment';


export function  createEndpoint(request: VidiunRequestBase, options: VidiunClientOptions, service: string, action?: string): string {
    const endpoint = options.endpointUrl;
    const clientTag = createClientTag(request, options);
    let result = `${endpoint}/api_v3/service/${service}`;

    if (action) {
        result += `/action/${action}`;
    }

    if (clientTag)
    {
        result += `?${buildQuerystring({clientTag})}`;
    }
    return result;
}

export function createClientTag(request: VidiunRequestBase, options: VidiunClientOptions)
{
    const networkTag = (request.getNetworkTag() || "").trim();
    const clientTag = (options.clientTag || "").trim() || "ng-app";

    if (networkTag && networkTag.length)
    {
        return `${clientTag}_${networkTag}`;
    }else {
        return clientTag;
    }
}

export function buildQuerystring(data: {}, prefix?: string) {
    let str = [], p;
    for (p in data) {
        if (data.hasOwnProperty(p)) {
            let k = prefix ? prefix + "[" + p + "]" : p, v = data[p];
            str.push((v !== null && typeof v === "object") ?
                buildQuerystring(v, k) :
                encodeURIComponent(k) + "=" + encodeURIComponent(v));
        }
    }
    return str.join("&");

}

export function getHeaders(): any {
    return {
        "Accept": "application/json",
        "Content-Type": "application/json"
    };
}

export function prepareParameters(request: VidiunRequest<any> | VidiunMultiRequest | VidiunFileRequest,  options: VidiunClientOptions,  defaultRequestOptions: VidiunRequestOptions): any {

    return Object.assign(
        {},
        request.buildRequest(defaultRequestOptions),
        {
	        apiVersion: environment.request.apiVersion,
            format: 1
        }
    );
}

export function createCancelableAction<T>(data : { endpoint : string, headers : any, body : any} ) : CancelableAction<T> {
	const result = new CancelableAction<T>((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		let isComplete = false;

		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (isComplete) {
					return;
				}
				isComplete = true;

				let resp;

				try {
					if (xhr.status === 200) {
						resp = JSON.parse(xhr.response);
					} else {
						resp = new VidiunClientException('client::requre-failure', xhr.responseText || 'failed to transmit request');
					}
				} catch (e) {
					resp = new Error(xhr.responseText);
				}

				if (resp instanceof Error || resp instanceof VidiunAPIException) {
					reject(resp);
				} else {
					resolve(resp);
				}
			}
		};

		xhr.open('POST', data.endpoint);

		if (data.headers) {
			Object.keys(data.headers).forEach(headerKey => {
				const headerValue = data.headers[headerKey];
				xhr.setRequestHeader(headerKey, headerValue);
			});
		}

		xhr.send(JSON.stringify(data.body));

		return () => {
			if (!isComplete) {
				isComplete = true;
				xhr.abort();
			}
		};
	});

	return result;
}
