import { VidiunResponse } from "./vidiun-response";
import { VidiunRequestBase, VidiunRequestBaseArgs } from "./vidiun-request-base";
import { VidiunAPIException } from './vidiun-api-exception';
import { VidiunObjectBase } from './vidiun-object-base';
import { VidiunRequestOptions, VidiunRequestOptionsArgs } from './vidiun-request-options';
import { environment } from '../environment';

export interface VidiunRequestArgs extends VidiunRequestBaseArgs
{

}


export abstract class VidiunRequest<T> extends VidiunRequestBase {

  private __requestOptions__: VidiunRequestOptions;
  protected callback: (response: VidiunResponse<T>) => void;
  private responseType : string;
  private responseSubType : string;
  protected _responseConstructor : { new() : VidiunObjectBase}; // NOTICE: this property is not used directly. It is here to force import of that type for bundling issues.

  constructor(data : VidiunRequestBaseArgs, {responseType, responseSubType, responseConstructor} : {responseType : string, responseSubType? : string, responseConstructor : { new() : VidiunObjectBase}  } ) {
    super(data);
    this.responseSubType = responseSubType;
    this.responseType = responseType;
    this._responseConstructor = responseConstructor;
  }

  setCompletion(callback: (response: VidiunResponse<T>) => void): this {
    this.callback = callback;
    return this;
  }

  private _unwrapResponse(response: any): any {
    if (environment.response.nestedResponse) {
      if (response && response.hasOwnProperty('result')) {
        if (response.result.hasOwnProperty('error')) {
          return response.result.error;
        } else {
          return response.result;
        }
      } else if (response && response.hasOwnProperty('error')) {
        return response.error;
      }
    }

    return response;
  }

  parseServerResponse(response: any): { status: boolean, response: any} {
    try {

      const unwrappedResponse = this._unwrapResponse(response);

      if (unwrappedResponse instanceof VidiunAPIException) {
        // handle situation when multi request propagated actual api exception object.
        return { status: false, response: unwrappedResponse};
      }

      if (unwrappedResponse && unwrappedResponse.objectType === 'VidiunAPIException') {
        return { status: false,
          response: new VidiunAPIException(
            unwrappedResponse.message,
            unwrappedResponse.code,
            unwrappedResponse.args
          )};
      }

      const parsedResponse = unwrappedResponse ? super._parseResponseProperty(
        "",
        {
          type: this.responseType,
          subType: this.responseSubType
        },
        unwrappedResponse
      ) : undefined;

      if (!parsedResponse && this.responseType !== 'v') {
        return {
          status: false,
          response: new VidiunAPIException(`server response is undefined, expected '${this.responseType} / ${this.responseSubType}'`, 'client::response_type_error', null)
        };
      }

      return { status: true, response: parsedResponse};
    } catch (ex) {
      return {
        status: false,
        response: new VidiunAPIException(ex.message, 'client::general_error', null)
      };
    }
  }

  handleResponse(response: any, returnRawResponse: boolean = false): VidiunResponse<T> {
    let responseResult: any;
    let responseError: any;

    let result: VidiunResponse<T>;

    if (returnRawResponse) {
      result = new VidiunResponse(response, undefined);
    } else {
      let parsedResponse = this.parseServerResponse(response);

      result = parsedResponse.status ?
        new VidiunResponse<T>(parsedResponse.response, undefined) :
        new VidiunResponse<T>(undefined, parsedResponse.response);
    }

    if (this.callback) {
      try {
        this.callback(result);
      } catch (ex) {
        // do nothing by design
      }
    }

    return result;
  }

  setRequestOptions(optionArgs: VidiunRequestOptionsArgs): this;
  setRequestOptions(options: VidiunRequestOptions): this;
  setRequestOptions(arg: VidiunRequestOptionsArgs | VidiunRequestOptions): this {
    this.__requestOptions__ = arg instanceof VidiunRequestOptions ? arg : new VidiunRequestOptions(arg);
    return this;
  }

  getRequestOptions(): VidiunRequestOptions {
    return this.__requestOptions__;
  }

  buildRequest(defaultRequestOptions: VidiunRequestOptions): {} {
    const requestOptionsObject = this.__requestOptions__ ? this.__requestOptions__.toRequestObject() : {};
    const defaultRequestOptionsObject = defaultRequestOptions ? defaultRequestOptions.toRequestObject() : {};

    return Object.assign(
      {},
      defaultRequestOptionsObject,
      requestOptionsObject,
      this.toRequestObject()
    );
  }
}
