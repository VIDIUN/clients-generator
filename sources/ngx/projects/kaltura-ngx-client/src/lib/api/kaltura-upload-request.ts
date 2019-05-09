import { VidiunRequest, VidiunRequestArgs } from "./vidiun-request";
import { VidiunObjectBase } from "./vidiun-object-base";

export type ProgressCallback = (loaded: number, total: number) => void;

export interface VidiunUploadRequestArgs extends VidiunRequestArgs {
  uploadedFileSize?: number;
}

export class VidiunUploadRequest<T> extends VidiunRequest<T> {
    private _progressCallback: ProgressCallback;
    public uploadedFileSize: number = 0;

    constructor(data: VidiunUploadRequestArgs, {responseType, responseSubType, responseConstructor}: { responseType: string, responseSubType?: string, responseConstructor: { new(): VidiunObjectBase } }) {
        super(data, {responseType, responseSubType, responseConstructor});
        this.uploadedFileSize = data.uploadedFileSize;
    }

    setProgress(callback: ProgressCallback): this {
        this._progressCallback = callback;
        return this;
    }

    public _getProgressCallback(): ProgressCallback {
        return this._progressCallback;
    }

    public supportChunkUpload(): boolean {
        // chunk upload currently assume support according to request/reseponse properties. Should get this information from the client-generator directly.
        const {properties} = this._getMetadata();
        const responseSupportChunk = this._responseConstructor ? (new this._responseConstructor()).hasMetadataProperty("uploadedFileSize") : false;
        return responseSupportChunk
            && !!properties["resume"]
            && !!properties["resumeAt"]
            && !!properties["finalChunk"];
    }

    public getFileInfo(): { file: File, propertyName: string } {
        const metadataProperties = this._getMetadata().properties;
        const filePropertyName = Object.keys(metadataProperties).find(propertyName => metadataProperties[propertyName].type === "f");

        return filePropertyName ? { propertyName: filePropertyName, file: this[filePropertyName] } : null;
    }

    public toRequestObject(): {} {
        const result = super.toRequestObject();
        const { propertyName: filePropertyName } = this.getFileInfo();

        if (filePropertyName) {
            delete result[filePropertyName];
        }

        return result;
    }
}