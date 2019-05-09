import {map, catchError} from 'rxjs/operators';
import { VidiunRequest } from '../api/vidiun-request';
import { Observable } from 'rxjs';
import { VidiunResponse } from '../api/vidiun-response';
import { HttpClient } from '@angular/common/http';
import { VidiunAPIException } from '../api/vidiun-api-exception';
import { VidiunClientException } from '../api/vidiun-client-exception';
import { VidiunRequestOptions, VidiunRequestOptionsArgs } from '../api/vidiun-request-options';
import { VidiunClientOptions } from '../vidiun-client-options';
import { createClientTag, createEndpoint, getHeaders, prepareParameters } from './utils';
import { environment } from '../environment';



export class VidiunRequestAdapter {

  constructor(private _http: HttpClient) {
  }

  public transmit<T>(request: VidiunRequest<T>, clientOptions: VidiunClientOptions, defaultRequestOptions: VidiunRequestOptions): Observable<T>;
  public transmit<T>(request: VidiunRequest<any>, clientOptions: VidiunClientOptions, defaultRequestOptions: VidiunRequestOptions, format: string): Observable<any>;
  public transmit<T>(request: VidiunRequest<any>, clientOptions: VidiunClientOptions, defaultRequestOptions: VidiunRequestOptions, format: string, responseType: 'blob' | 'text'): Observable<any>;
  public transmit<T>(request: VidiunRequest<T>, clientOptions: VidiunClientOptions, defaultRequestOptions: VidiunRequestOptions, format?: string, responseType: 'blob' | 'text' = 'text'): Observable<any> {

    const requestSpecificFormat = typeof format !== 'undefined';
    const parameters = prepareParameters(request, clientOptions, defaultRequestOptions);

    const endpointOptions = { ...clientOptions, service: parameters['service'], action:  parameters['action'], format };
    const endpointUrl = createEndpoint(request, endpointOptions);
    delete parameters['service'];
    delete parameters['action'];

    if (environment.request.avoidQueryString) {
      parameters['clientTag'] = createClientTag(request, clientOptions);
    }

    return this._http.request('post', endpointUrl,
      {
        body: parameters,
        responseType: requestSpecificFormat ? responseType || 'text' : 'json',
        headers: requestSpecificFormat ? undefined : getHeaders()
      }).pipe(
      catchError(
        error => {
          if (environment.response.customErrorInHttp500) {
            if (error && typeof error.error === 'string') {
              const actualError = JSON.parse(error.error).result.error;
              throw new VidiunAPIException(actualError.message, actualError.code, actualError.args);
            }
            if (error && error.error instanceof Blob) {
              return Observable.create((observer) => {
                const reader = new FileReader();
                reader.addEventListener('loadend', (e) => {
                  const text = (e.srcElement as any).result;
                  const actualError = JSON.parse(text).result.error;
                  observer.error(new VidiunAPIException(actualError.message, actualError.code, actualError.args));
                });

                // Start reading the blob as text.
                reader.readAsText(error.error);
              });
            }
          }

          const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : null;
          throw new VidiunClientException("client::request-network-error", errorMessage || 'Error connecting to server');
        }
      ),
      map(
        result => {
          try {
            const response = request.handleResponse(result, requestSpecificFormat);

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
        }));
  }
}
