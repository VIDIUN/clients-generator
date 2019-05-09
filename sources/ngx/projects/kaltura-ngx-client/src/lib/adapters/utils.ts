import { VidiunRequestBase } from '../api/vidiun-request-base';
import { VidiunClientOptions } from '../vidiun-client-options';
import { VidiunRequestOptions, VidiunRequestOptionsArgs } from '../api/vidiun-request-options';
import { VidiunMultiRequest } from '../api/vidiun-multi-request';
import { VidiunRequest } from '../api/vidiun-request';
import { VidiunFileRequest } from '../api/vidiun-file-request';
import { environment } from '../environment';

export type CreateEndpointOptions = VidiunClientOptions & {
  service: string,
  action?: string,
  format?: string
}

export function createEndpoint(request: VidiunRequestBase, options: CreateEndpointOptions): string {
  const endpoint = options.endpointUrl;
  const clientTag = createClientTag(request, options);
  let result = `${endpoint}/api_v3/service/${options.service}`;

  if (options.action) {
    result += `/action/${options.action}`;
  }

  const format = options.format || request.getFormatValue();

  result += `?format=${format}`;

  if (clientTag)
  {
    result += `&${_buildQuerystring({clientTag})}`;
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

function _buildQuerystring(data: {}, prefix?: string) {
	let str = [], p;
	for (p in data) {
		if (data.hasOwnProperty(p)) {
			let k = prefix ? prefix + "[" + p + "]" : p, v = data[p];
			str.push((v !== null && typeof v === "object") ?
				_buildQuerystring(v, k) :
				encodeURIComponent(k) + "=" + encodeURIComponent(v));
		}
	}
	return str.join("&");

}

export function buildUrl(url: string, querystring?: {}) {
  let formattedUrl = (url).trim();
  const urlHasQuerystring = formattedUrl.indexOf('?') !== -1;
  if (!querystring) {
    return formattedUrl;
  }

  const formattedQuerystring = _buildQuerystring(querystring);
  return `${formattedUrl}${urlHasQuerystring ? '&' : '?'}${formattedQuerystring}`;
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
		}
	);
}
