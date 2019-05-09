import {PlaylistListAction} from "../lib/api/types/PlaylistListAction";
import {VidiunPlaylistListResponse} from "../lib/api/types/VidiunPlaylistListResponse";
import {VidiunPlaylist} from "../lib/api/types/VidiunPlaylist";
import {VidiunPlaylistType} from "../lib/api/types/VidiunPlaylistType";
import {PlaylistAddAction} from "../lib/api/types/PlaylistAddAction";
import {PlaylistDeleteAction} from "../lib/api/types/PlaylistDeleteAction";
import {PlaylistUpdateAction} from "../lib/api/types/PlaylistUpdateAction";
import { asyncAssert, getClient } from "./utils";
import {LoggerSettings, LogLevels} from "../lib/api/vidiun-logger";
import {VidiunClient} from "../lib/vidiun-client.service";
import { switchMap } from 'rxjs/operators';


describe(`service "Playlist" tests`, () => {
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

  test(`invoke "list" action`, (done) => {
    expect.assertions(4);
    vidiunClient.request(new PlaylistListAction()).subscribe(
      (response) => {
        asyncAssert(() => {
          expect(response instanceof VidiunPlaylistListResponse).toBeTruthy();
          expect(response.objects).toBeDefined();
          expect(response.objects instanceof Array).toBeTruthy();
          expect(response.objects[0] instanceof VidiunPlaylist).toBeTruthy();
        });

        done();
      },
      () => {
        done.fail(`failed to perform request`);
      }
    );
  });

  test(`invoke "createRemote:staticList" action`, (done) => {
    const playlist = new VidiunPlaylist({
      name: "tstest.PlaylistTests.test_createRemote",
      playlistType: VidiunPlaylistType.staticList
    });
    expect.assertions(2);
    vidiunClient.request(new PlaylistAddAction({playlist}))
      .subscribe(
        (response) => {
          vidiunClient.request(new PlaylistDeleteAction({id: response.id})).subscribe(
            () => {
              asyncAssert(() => {
                expect(response instanceof VidiunPlaylist).toBeTruthy();
                expect(typeof response.id).toBe("string");
              });
              done();
            }
          );
        },
        (error) => {
          done.fail(error);
        }
      );
  });

  test(`invoke "update" action`, (done) => {
    const playlist = new VidiunPlaylist({
      name: "tstest.PlaylistTests.test_createRemote",
      referenceId: "tstest.PlaylistTests.test_update",
      playlistType: VidiunPlaylistType.staticList
    });
    expect.assertions(1);
    vidiunClient.request(new PlaylistAddAction({playlist}))
      .pipe(
      switchMap(({id}) => {
          playlist.name = "Changed!";
          return vidiunClient.request(new PlaylistUpdateAction({id, playlist}));
        }
      ),
      switchMap(({id, name}) => {
        asyncAssert(() => {
          expect(name).toBe("Changed!");
        });
        return vidiunClient.request(new PlaylistDeleteAction({id}));
      }))
      .subscribe(() => {
            done();
        },
        error => {
          done.fail(error);
        });
  });

  test(`invoke "createRemote:dynamicList" action`, (done) => {
    const playlist = new VidiunPlaylist({
      name: "tstest.PlaylistTests.test_createRemote",
      playlistType: VidiunPlaylistType.dynamic,
      totalResults: 0
    });
    expect.assertions(2);
    vidiunClient.request(new PlaylistAddAction({playlist}))
      .subscribe(
        (response) => {
          vidiunClient.request(new PlaylistDeleteAction({id: response.id}))
            .subscribe(() => {
              asyncAssert(() => {
                expect(response instanceof VidiunPlaylist).toBeTruthy();
                expect(typeof response.id).toBe("string");
              });
              done();
            });
        },
        (error) => {
          done.fail(error);
        }
      );
  });
});
