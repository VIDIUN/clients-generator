import {UiConfListAction} from "../lib/api/types/UiConfListAction";
import {VidiunUiConfListResponse} from "../lib/api/types/VidiunUiConfListResponse";
import {VidiunUiConf} from "../lib/api/types/VidiunUiConf";
import {VidiunUiConfFilter} from "../lib/api/types/VidiunUiConfFilter";
import {VidiunUiConfObjType} from "../lib/api/types/VidiunUiConfObjType";
import {UiConfListTemplatesAction} from "../lib/api/types/UiConfListTemplatesAction";
import { asyncAssert, getClient } from "./utils";
import {LoggerSettings, LogLevels} from "../lib/api/vidiun-logger";
import {VidiunClient} from "../lib/vidiun-client.service";

describe(`service "UIConf" tests`, () => {
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

  test("uiconf list", (done) => {
    expect.assertions(3);
    vidiunClient.request(new UiConfListAction())
      .subscribe(
        response => {
          asyncAssert(() => {
            expect(response instanceof VidiunUiConfListResponse).toBeTruthy();
            expect(Array.isArray(response.objects)).toBeTruthy();
            expect(response.objects.every(obj => obj instanceof VidiunUiConf)).toBeTruthy();
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
    const filter = new VidiunUiConfFilter({objTypeIn: players.join(",")});
    expect.assertions(1);
    vidiunClient.request(new UiConfListAction(filter))
      .subscribe(
        response => {
          asyncAssert(() => {
            expect(response.objects.every(obj => players.indexOf(Number(obj.objType)) !== -1)).toBeTruthy();
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

    expect.assertions(2);
    vidiunClient.request(new UiConfListAction(filter))
      .subscribe(
        response => {
          asyncAssert(() => {
            expect(response.objects).toBeDefined();
            expect(response.objects.length).toBeGreaterThan(0);
            const match = /isPlaylist="(.*?)"/g.exec(response.objects[0].confFile);
            if (match) {
              expect(["true", "multi"].indexOf(match[1]) !== -1).toBeTruthy();
            }
          });
          done();
        },
        (error) => {
          fail(error);
          done();
        }
      );
  });

  test("uiconf list templates", (done) => {
    expect.assertions(3);
    vidiunClient.request(new UiConfListTemplatesAction())
      .subscribe(
        response => {
          asyncAssert(() => {
            expect(response instanceof VidiunUiConfListResponse).toBeTruthy();
            expect(Array.isArray(response.objects)).toBeTruthy();
            expect(response.objects.every(obj => obj instanceof VidiunUiConf)).toBeTruthy();
          });
          done();
        },
        (error) => {
          done.fail(error);
        }
      );
  });
});
