import { VidiunClient } from "../vidiun-client-service";
import { UiConfListAction } from "../api/types/UiConfListAction";
import { VidiunUiConfListResponse } from "../api/types/VidiunUiConfListResponse";
import { VidiunUiConf } from "../api/types/VidiunUiConf";
import { VidiunUiConfFilter } from "../api/types/VidiunUiConfFilter";
import { VidiunUiConfObjType } from "../api/types/VidiunUiConfObjType";
import { UiConfListTemplatesAction } from "../api/types/UiConfListTemplatesAction";
import { getClient } from "./utils";
import { LoggerSettings, LogLevels } from "../api/vidiun-logger";
import { asyncAssert } from "./utils";

describe(`service "UIConf" tests`, () => {
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

  test("uiconf list", (done) => {
	  expect.assertions(4);
    vidiunClient.request(new UiConfListAction())
      .then(
        response => {
	        asyncAssert(() => {
		        expect(response instanceof VidiunUiConfListResponse).toBeTruthy();
		        expect(Array.isArray(response.objects)).toBeTruthy();
		        expect(response.objects.length).toBeGreaterThan(0);
		        expect(response.objects[0] instanceof VidiunUiConf).toBeTruthy();
	        });
          done();
        },
        (error) => {
          done.fail(error);
        }
      );
  });


  // TODO [vmc] investigate response
  xtest("get players", (done) => {
    const players = [VidiunUiConfObjType.player, VidiunUiConfObjType.playerV3, VidiunUiConfObjType.playerSl];
    const filter = new VidiunUiConfFilter({ objTypeIn: players.join(",") });

	  expect.assertions(2);
    vidiunClient.request(new UiConfListAction(filter))
      .then(
        response => {
	        asyncAssert(() => {
		        expect(response.objects.length).toBeGreaterThan(0);
		        expect(players.indexOf(Number(response.objects[0].objType)) !== -1).toBeTruthy();
        });
          done();
        },
        (error) => {
          done.fail(error);
        }
      );
  });

  test("get video players", (done) => {
    const players = [VidiunUiConfObjType.player, VidiunUiConfObjType.playerV3, VidiunUiConfObjType.playerSl];
    const filter = new VidiunUiConfFilter({
      objTypeIn: players.join(","),
      tagsMultiLikeOr: "player"
    });

	  expect.assertions(1);
    vidiunClient.request(new UiConfListAction(filter))
      .then(
        response => {
	        expect(response.objects.length).toBeGreaterThan(0);
          done();
        },
        (error) => {
          done.fail(error);
        }
      );
  });

  test("uiconf list templates", (done) => {
	  expect.assertions(4);
    vidiunClient.request(new UiConfListTemplatesAction())
      .then(
        response => {
	        asyncAssert(() => {
		        expect(response instanceof VidiunUiConfListResponse).toBeTruthy();
		        expect(Array.isArray(response.objects)).toBeTruthy();
		        expect(response.objects.length).toBeGreaterThan(0);
		        expect(response.objects[0] instanceof VidiunUiConf).toBeTruthy();
	        });
          done();
        },
        (error) => {
          done.fail(error);
        }
      );
  });
});
