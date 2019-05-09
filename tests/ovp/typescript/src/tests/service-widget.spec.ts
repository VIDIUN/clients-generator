import { VidiunClient } from "../vidiun-client-service";
import { WidgetListAction } from "../api/types/WidgetListAction";
import { VidiunWidgetListResponse } from "../api/types/VidiunWidgetListResponse";
import { getClient } from "./utils";
import { LoggerSettings, LogLevels } from "../api/vidiun-logger";
import { asyncAssert } from "./utils";

describe(`service "Widget" tests`, () => {
  let vidiunClient: VidiunClient = null;

  beforeAll(async () => {
    LoggerSettings.logLevel = LogLevels.error; // suspend warnings

    return getClient()
      .then(client => {
        vidiunClient = client;
      }).catch(error => {
        // can do nothing since jasmine will ignore any exceptions thrown from before all
      });
  });

  afterAll(() => {
    vidiunClient = null;
  });

  test("widgets list", (done) => {
	  expect.assertions(1);
    vidiunClient.request(new WidgetListAction())
      .then(
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
