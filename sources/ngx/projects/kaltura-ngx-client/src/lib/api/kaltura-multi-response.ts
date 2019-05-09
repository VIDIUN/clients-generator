import { VidiunResponse } from "./vidiun-response";
import { VidiunAPIException } from './vidiun-api-exception';

export class VidiunMultiResponse extends Array<VidiunResponse<any>> {
    constructor(results: VidiunResponse<any>[] = []) {
        super();

        if (new.target) {
            // Set the prototype explicitly - see: https://github.com/Microsoft/TypeScript/wiki/FAQ#why-doesnt-extending-built-ins-like-error-array-and-map-work
            Object.setPrototypeOf(this, new.target.prototype);
        }

        if (results && results.length > 0) {
            this.push(...results);
        }
    }

    public hasErrors(): boolean {
        return this.filter(result => result.error).length > 0;
    }

    public getFirstError(): VidiunAPIException {
        let result: VidiunAPIException = null;
        for (let i = 0; i < this.length; i++) {
            result = this[i].error;

            if (result) {
                break;
            }
        }
        return result;
    }


}
