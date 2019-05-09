import {DistributionProviderListAction} from "../lib/api/types/DistributionProviderListAction";
import {VidiunDistributionProviderListResponse} from "../lib/api/types/VidiunDistributionProviderListResponse";
import {VidiunDistributionProvider} from "../lib/api/types/VidiunDistributionProvider";
import {DistributionProfileListAction} from "../lib/api/types/DistributionProfileListAction";
import {VidiunDistributionProfileListResponse} from "../lib/api/types/VidiunDistributionProfileListResponse";
import {VidiunDistributionProfile} from "../lib/api/types/VidiunDistributionProfile";
import {EntryDistributionListAction} from "../lib/api/types/EntryDistributionListAction";
import {VidiunEntryDistributionListResponse} from "../lib/api/types/VidiunEntryDistributionListResponse";
import {VidiunEntryDistribution} from "../lib/api/types/VidiunEntryDistribution";
import { asyncAssert, getClient } from "./utils";
import {LoggerSettings, LogLevels} from "../lib/api/vidiun-logger";
import {VidiunClient} from "../lib/vidiun-client.service";

describe(`service "Distribution" tests`, () => {
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

  test("distribution provider list", (done) => {
    expect.assertions(3);
    vidiunClient.request(new DistributionProviderListAction())
      .subscribe(
        response => {
          asyncAssert(() => {
            expect(response instanceof VidiunDistributionProviderListResponse).toBeTruthy();
            expect(Array.isArray(response.objects)).toBeTruthy();
            expect(response.objects.every(obj => obj instanceof VidiunDistributionProvider)).toBeTruthy();
          });
          done();
        },
        (error) => {
          done.fail(error);
        });
  });

  test("distribution profile list", (done) => {
    expect.assertions(3);
    vidiunClient.request(new DistributionProfileListAction())
      .subscribe(
        response => {
          asyncAssert(() => {
            expect(response instanceof VidiunDistributionProfileListResponse).toBeTruthy();
            expect(Array.isArray(response.objects)).toBeTruthy();
            expect(response.objects.every(obj => obj instanceof VidiunDistributionProfile)).toBeTruthy();
          });
          done();
        },
        () => {
          done.fail("should not reach this part");
        });
  });

  test("entry distribution list", (done) => {
    expect.assertions(3);
    vidiunClient.request(new EntryDistributionListAction())
      .subscribe(
        response => {
          asyncAssert(() => {
            expect(response instanceof VidiunEntryDistributionListResponse).toBeTruthy();
            expect(Array.isArray(response.objects)).toBeTruthy();
            expect(response.objects.every(obj => obj instanceof VidiunEntryDistribution)).toBeTruthy();
          });
          done();
        },
        () => {
          done.fail("should not reach this part");
        });
  });
});
