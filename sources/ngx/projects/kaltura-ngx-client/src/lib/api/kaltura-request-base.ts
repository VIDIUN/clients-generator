import { VidiunObjectBase, VidiunObjectBaseArgs } from './vidiun-object-base';
import { VidiunRequestOptions, VidiunRequestOptionsArgs } from './vidiun-request-options';


export interface VidiunRequestBaseArgs  extends VidiunObjectBaseArgs {
}


export class VidiunRequestBase extends VidiunObjectBase {

    private _networkTag: string;

    constructor(data: VidiunRequestBaseArgs) {
        super(data);
    }

    setNetworkTag(tag: string): this {
        if (!tag || tag.length > 10) {
            console.warn(`cannot set network tag longer than 10 characters. ignoring tag '${tag}`);
        } else {
            this._networkTag = tag;
        }

        return this;
    }

    getNetworkTag(): string {
        return this._networkTag;
    }

    public getFormatValue() {
      return 1;
    }
}

