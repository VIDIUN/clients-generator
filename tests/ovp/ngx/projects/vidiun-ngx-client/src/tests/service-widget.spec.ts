import {WidgetListAction} from "../lib/api/types/WidgetListAction";
import {VidiunWidgetListResponse} from "../lib/api/types/VidiunWidgetListResponse";
import { asyncAssert, getClient } from "./utils";
import {LoggerSettings, LogLevels} from "../lib/api/vidiun-logger";
import {VidiunClient} from "../lib/vidiun-client.service";

describe(`service "Widget" tests`, () => {
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

  test("widgets list", (done) => {
    expect.assertions(1);
    vidiunClient.request(new WidgetListAction())
      .subscribe(
        response => {
          asyncAssert(() => {
            expect(response instanceof VidiunWidgetListResponse).toBeTruthy();
          });
          done();
        },
        (error) => {
          done.fail(error);
        }
      );
  });
});
