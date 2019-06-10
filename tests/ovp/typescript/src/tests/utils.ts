import * as fs from "fs";
import * as path from "path";
import { TestsConfig } from "./tests-config";
import { VidiunClient } from "../vidiun-client-service";
import { SessionStartAction } from "../api/types/SessionStartAction";
import { VidiunSessionType } from "../api/types/VidiunSessionType";

export function getTestFile(): string | Buffer {
  return fs.readFileSync(path.join(__dirname, "DemoVideo.flv"));
}

export function asyncAssert(callback) {
	try {
		callback();
	} catch(e) {
		fail(e);
	}
}

export function escapeRegExp(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\$&");
}

export function getClient(): Promise<VidiunClient> {
    const httpConfiguration = {
        endpointUrl: TestsConfig.endpointUrl,
        clientTag: TestsConfig.clientTag
    };

    let client = new VidiunClient(httpConfiguration);


    return client.request(new SessionStartAction({
        secret: TestsConfig.adminSecret,
        userId: TestsConfig.userName,
        type: VidiunSessionType.admin,
        partnerId: <any>TestsConfig.partnerId * 1
    })).then(vs => {
        client.setDefaultRequestOptions({
            vs
        });
        return client;
    },
        error => {
            console.error(`failed to create session with the following error 'SessionStartAction'`);
            throw error;
        });
}
