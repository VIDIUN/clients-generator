import {throwError as observableThrowError,  Observable } from 'rxjs';
import { Inject, Injectable, Optional, Self } from '@angular/core';


import { HttpClient } from '@angular/common/http';
import { VidiunRequest } from './api/vidiun-request';
import { _FORMAT_TYPES_TOKEN_ } from './api/types/_FORMAT_TYPES_TOKEN_';
import { VidiunMultiRequest } from './api/vidiun-multi-request';
import { VidiunMultiResponse } from './api/vidiun-multi-response';
import { VidiunFileRequest } from './api/vidiun-file-request';
import { VidiunUploadRequest } from './api/vidiun-upload-request';
import { VidiunRequestAdapter } from './adapters/vidiun-request-adapter';
import { VidiunFileRequestAdapter } from './adapters/vidiun-file-request-adapter';
import { VidiunClientOptions, VIDIUN_CLIENT_OPTIONS } from './vidiun-client-options';
import { VidiunMultiRequestAdapter } from './adapters/vidiun-multi-request-adapter';
import { VidiunClientException } from './api/vidiun-client-exception';
import { VidiunUploadRequestAdapter } from './adapters/vidiun-upload-request-adapter';
import {
  VIDIUN_CLIENT_DEFAULT_REQUEST_OPTIONS, VidiunRequestOptions,
  VidiunRequestOptionsArgs
} from './api/vidiun-request-options';

@Injectable()
export class VidiunClient {

  private _defaultRequestOptions: VidiunRequestOptions;

  constructor(private _http: HttpClient, @Inject(VIDIUN_CLIENT_OPTIONS) @Optional() @Self() private _options: VidiunClientOptions,
              @Inject(VIDIUN_CLIENT_DEFAULT_REQUEST_OPTIONS) @Optional() @Self()  defaultRequestOptionsArgs: VidiunRequestOptionsArgs) {
    this._defaultRequestOptions = new VidiunRequestOptions(defaultRequestOptionsArgs || {});
  }

  public appendOptions(options: VidiunClientOptions): void {
    if (!options) {
      throw new VidiunClientException('client::append_options',`missing required argument 'options'`);
    }

    this._options = Object.assign(
      this._options || {}, options
    );
  }

  public setOptions(options: VidiunClientOptions): void {
    if (!options) {
      throw new VidiunClientException('client::set_options',`missing required argument 'options'`);
    }

    this._options = options;
  }

  public appendDefaultRequestOptions(args: VidiunRequestOptionsArgs): void {
    if (!args) {
      throw new VidiunClientException('client::append_default_request_options',`missing required argument 'args'`);
    }

    this._defaultRequestOptions = Object.assign(
      this._defaultRequestOptions || new VidiunRequestOptions(), new VidiunRequestOptions(args)
    );
  }

  public setDefaultRequestOptions(args: VidiunRequestOptionsArgs): void {
    if (!args) {
      throw new VidiunClientException('client::set_default_request_options',`missing required argument 'args'`);
    }

    this._defaultRequestOptions = new VidiunRequestOptions(args);
  }

  private _validateOptions(): Error | null {
    if (!this._options) {
      return new VidiunClientException('client::missing_options','cannot transmit request, missing client options (did you forgot to provide options manually or using VIDIUN_CLIENT_OPTIONS?)');
    }

    if (!this._options.endpointUrl) {
      return new VidiunClientException('client::missing_options', `cannot transmit request, missing 'endpointUrl' in client options`);
    }

    if (!this._options.clientTag) {
      return new VidiunClientException('client::missing_options', `cannot transmit request, missing 'clientTag' in client options`);
    }

    return null;
  }

  public request<T>(request: VidiunRequest<T>): Observable<T>;
  public request<T>(request: VidiunFileRequest): Observable<{ url: string }>;
  public request<T>(request: VidiunRequest<any>, format: _FORMAT_TYPES_TOKEN_, responseType: 'blob' | 'text'): Observable<any>;
  public request<T>(request: VidiunRequest<T> | VidiunFileRequest, format?: _FORMAT_TYPES_TOKEN_, responseType?: 'blob' | 'text'): Observable<T | { url: string }> {

    const optionsViolationError = this._validateOptions();

    if (optionsViolationError) {
      return observableThrowError(optionsViolationError);
    }

    if (typeof format !== 'undefined') {
      return new VidiunRequestAdapter(this._http).transmit(request, this._options, this._defaultRequestOptions, format +'', responseType);
    }

    if (request instanceof VidiunFileRequest) {
      return new VidiunFileRequestAdapter().transmit(request, this._options, this._defaultRequestOptions);

    } else if (request instanceof VidiunUploadRequest) {
      return new VidiunUploadRequestAdapter(this._options, this._defaultRequestOptions).transmit(request);
    }
    else if (request instanceof VidiunRequest) {
      return new VidiunRequestAdapter(this._http).transmit(request, this._options, this._defaultRequestOptions);
    } else {
      return observableThrowError(new VidiunClientException("client::request_type_error", 'unsupported request type requested'));
    }
  }

  public multiRequest(requests: VidiunRequest<any>[]): Observable<VidiunMultiResponse>
  public multiRequest(request: VidiunMultiRequest): Observable<VidiunMultiResponse>;
  public multiRequest(arg: VidiunMultiRequest | VidiunRequest<any>[]): Observable<VidiunMultiResponse> {
    const optionsViolationError = this._validateOptions();
    if (optionsViolationError) {
      return observableThrowError(optionsViolationError);
    }

    const request = arg instanceof VidiunMultiRequest ? arg : (arg instanceof Array ? new VidiunMultiRequest(...arg) : null);
    if (!request) {
      return observableThrowError(new VidiunClientException('client::invalid_request', `Expected argument of type Array or VidiunMultiRequest`));
    }

    const containsFileRequest = request.requests.some(item => item instanceof VidiunFileRequest);
    if (containsFileRequest) {
      return observableThrowError(new VidiunClientException('client::invalid_request', `multi-request not support requests of type 'VidiunFileRequest', use regular request instead`));
    } else {
      return new VidiunMultiRequestAdapter(this._http).transmit(request, this._options, this._defaultRequestOptions);
    }
  }
}
