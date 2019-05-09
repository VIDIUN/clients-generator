import { VidiunAPIException } from "./vidiun-api-exception";

export class VidiunResponse<T> {

    constructor(public result : T, public error : VidiunAPIException)
    {


    }
}
