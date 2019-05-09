import {ThumbAssetServeAction} from "../lib/api/types/ThumbAssetServeAction";
import { asyncAssert, getClient } from "./utils";
import {LoggerSettings, LogLevels} from "../lib/api/vidiun-logger";
import {VidiunClient} from "../lib/vidiun-client.service";
import { environment } from '../lib/environment';


describe("Vidiun File request", () => {
  let vidiunClient: VidiunClient = null;

  beforeAll(async () => {
    LoggerSettings.logLevel = LogLevels.error; // suspend warnings

    return new Promise((resolve => {
      getClient()
        .subscribe(client => {
          vidiunClient = client;
          resolve(client);
        });
    }));
  });

  afterAll(() => {
    vidiunClient = null;
  });

  test("thumbasset service > serve action", (done) => {

    const thumbRequest = new ThumbAssetServeAction({
      thumbAssetId: "1_ep9epsxy"
    });

    vidiunClient.setDefaultRequestOptions({vs: "vs123"});

    expect.assertions(3);

    vidiunClient.request(thumbRequest)
      .subscribe(
        result => {
          asyncAssert(() => {
            expect(result).toBeDefined();
            expect(result.url).toBeDefined();
            expect(result.url).toBe(`https://www.vidiun.com/api_v3/service/thumbasset/action/serve?format=1&clientTag=ngx-tests&vs=vs123&thumbAssetId=1_ep9epsxy&apiVersion=${environment.request.apiVersion}`);
          });

          done();
        },
        error => {
          fail(error);
        });

  });

  test("error when sending 'VidiunFileRequest' as part of multi-request", (done) => {

    const thumbRequest: any = new ThumbAssetServeAction({
      thumbAssetId: "thumbAssetId"
    });

    expect.assertions(3);

    vidiunClient.multiRequest([thumbRequest])
      .subscribe(
        result => {
          done.fail("got response instead of error");
        },
        error => {
          asyncAssert(() => {
            expect(error).toBeDefined();
            expect(error).toBeInstanceOf(Error);
            expect(error.message).toBe("multi-request not support requests of type 'VidiunFileRequest', use regular request instead");
          });
          done();
        });

  });
});
