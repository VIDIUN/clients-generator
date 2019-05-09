import { VidiunObjectBase } from "./vidiun-object-base";
import { VidiunRequestBase, VidiunRequestBaseArgs } from './vidiun-request-base';
import { VidiunRequest, VidiunRequestArgs } from './vidiun-request';



export interface VidiunFileRequestArgs extends VidiunRequestArgs  {
}

export class VidiunFileRequest extends VidiunRequest<{url: string}> {

    constructor(data: VidiunFileRequestArgs) {
        super(data, {responseType : 'v', responseSubType : '', responseConstructor : null });
    }

}