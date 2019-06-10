import { ThumbAssetServeAction } from "../api/types/ThumbAssetServeAction";
import { VidiunClient } from "../vidiun-client-service";
import { asyncAssert } from "./utils";

xdescribe("Vidiun File request", () => {
    test("thumbasset service > serve action", (done) => {

        const thumbRequest = new ThumbAssetServeAction({
            thumbAssetId: '1_ep9epsxy'
        });

	    const config =
		    {
			    endpointUrl: 'https://www.vidiun.com',
			    clientTag: 'ts'
		    };

        const predefinedClient = new VidiunClient(config);
        predefinedClient.setDefaultRequestOptions(
            {
                vs: 'YWIyZDAxYWRhZmQ1NzhjMzQ5ZmI3Nzc4MzVhYTJkMGI1NDdhYzA5YnwxNzYzMzIxOzE3NjMzMjE7MTUxMjA1MzA1MzsyOzE1MTE5NjY2NTMuNTk7YWRtaW47ZGlzYWJsZWVudGl0bGVtZW50Ozs'
            }
        );

	    expect.assertions(3);
        predefinedClient.request(thumbRequest)
            .then(
                result => {
	                asyncAssert(() => {
		                expect(result).toBeDefined();
		                expect(result.url).toBeDefined();
		                expect(result.url).toBe('https://www.vidiun.com/api_v3/service/thumbasset/action/serve?format=1&apiVersion=@VERSION@&thumbAssetId=1_ep9epsxy&vs=YWIyZDAxYWRhZmQ1NzhjMzQ5ZmI3Nzc4MzVhYTJkMGI1NDdhYzA5YnwxNzYzMzIxOzE3NjMzMjE7MTUxMjA1MzA1MzsyOzE1MTE5NjY2NTMuNTk7YWRtaW47ZGlzYWJsZWVudGl0bGVtZW50Ozs&clientTag=ts');

	                });
                    done();
                },
                error => {
                    done.fail(error);
                });

    });

    test("error when sending 'VidiunFileRequest' as part of multi-request", (done) => {

        const thumbRequest: any = new ThumbAssetServeAction({
            thumbAssetId: 'thumbAssetId'
        });


        const config =
            {
                endpointUrl: 'https://www.vidiun.com',
                clientTag: 'ts'
            };

        const predefinedClient = new VidiunClient();
        predefinedClient.setDefaultRequestOptions({
            vs: 'YWIyZDAxYWRhZmQ1NzhjMzQ5ZmI3Nzc4MzVhYTJkMGI1NDdhYzA5YnwxNzYzMzIxOzE3NjMzMjE7MTUxMjA1MzA1MzsyOzE1MTE5NjY2NTMuNTk7YWRtaW47ZGlzYWJsZWVudGl0bGVtZW50Ozs'
        });

	    expect.assertions(3);
        predefinedClient.multiRequest([thumbRequest])
            .then(
                result => {
                    done.fail('got response instead of error');
                },
                error => {
	                asyncAssert(() => {
		                expect(error).toBeDefined();
		                expect(error).toBeInstanceOf(Error);
		                expect(error.message).toBe("multi-request not support requests of type 'VidiunFileRequest'");
	                });
                    done();
                });

    });
});
