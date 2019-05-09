import { VidiunClient } from "../vidiun-client-service";
import { PlaylistListAction } from "../api/types/PlaylistListAction";
import { VidiunPlaylistListResponse } from "../api/types/VidiunPlaylistListResponse";
import { VidiunPlaylist } from "../api/types/VidiunPlaylist";
import { VidiunPlaylistType } from "../api/types/VidiunPlaylistType";
import { PlaylistAddAction } from "../api/types/PlaylistAddAction";
import { PlaylistDeleteAction } from "../api/types/PlaylistDeleteAction";
import { PlaylistUpdateAction } from "../api/types/PlaylistUpdateAction";
import { getClient } from "./utils";
import { LoggerSettings, LogLevels } from "../api/vidiun-logger";
import { asyncAssert } from "./utils";

describe(`service "Playlist" tests`, () => {
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

  test(`invoke "list" action`, (done) => {
	  expect.assertions(5);
    vidiunClient.request(new PlaylistListAction()).then(
      (response) => {
	      asyncAssert(() => {
		      expect(response instanceof VidiunPlaylistListResponse).toBeTruthy();
		      expect(response.objects).toBeDefined();
		      expect(response.objects instanceof Array).toBeTruthy();
		      expect(response.objects.length).toBeGreaterThan(0);
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
    vidiunClient.request(new PlaylistAddAction({ playlist }))
      .then(
        (response) => {
	        asyncAssert(() => {
		        expect(response instanceof VidiunPlaylist).toBeTruthy();
		        expect(typeof response.id).toBe("string");
	        });

	        vidiunClient.request(new PlaylistDeleteAction({ id: response.id })).then(
                () => {
	                done();
                },
                () => {
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
    vidiunClient.request(new PlaylistAddAction({ playlist }))
      .then(({ id }) => {
          playlist.name = "Changed!";
          return vidiunClient.request(new PlaylistUpdateAction({ id, playlist }));
        }
      )
      .then(({ id, name }) => {
	      asyncAssert(() => {
		      expect(name).toBe("Changed!");
	      });
            vidiunClient.request(new PlaylistDeleteAction({ id })).then(
	            () => {
		            done();
	            },
	            () => {
		            done();
	            });
      })
      .catch((error) => {
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
    vidiunClient.request(new PlaylistAddAction({ playlist }))
      .then(
        (response) => {
	        asyncAssert(() => {
		        expect(response instanceof VidiunPlaylist).toBeTruthy();
		        expect(typeof response.id).toBe("string");
	        });
          vidiunClient.request(new PlaylistDeleteAction({ id: response.id })).then(
	          () => {
		          done();
	          },
	          () => {
		          done();
	          }
          );
        },
        (error) => {
          done.fail(error);
        }
      );
  });
});
