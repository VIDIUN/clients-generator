
export class VidiunClientException extends Error {
    constructor(public code: string, public message: string, public args?: any) {
        super(message);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, VidiunClientException.prototype);
    }
}