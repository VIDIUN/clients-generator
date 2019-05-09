import {VidiunBrowserHttpClient} from "../lib/vidiun-clients/vidiun-browser-http-client";
import {MediaListAction} from "../lib/api/types/MediaListAction";
import {VidiunMediaListResponse} from "../lib/api/types/VidiunMediaListResponse";
import {VidiunMediaEntry} from "../lib/api/types/VidiunMediaEntry";
import {VidiunMediaType} from "../lib/api/types/VidiunMediaType";
import { asyncAssert, getClient } from "./utils";
import {LoggerSettings, LogLevels} from "../lib/api/vidiun-logger";
import {VidiunClient} from "../lib/vidiun-client.service";

describe(`service "Media" tests`, () => {
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

    if (!vidiunClient) {
      fail(`failure during 'SessionStart'. aborting test`);
      return;
    }

    expect.assertions(4);
    vidiunClient.request(new MediaListAction()).subscribe(
      (response) => {
        asyncAssert(() => {
          expect(response instanceof VidiunMediaListResponse).toBeTruthy();
          expect(response.objects).toBeDefined();
          expect(response.objects instanceof Array).toBeTruthy();
          expect(response.objects[0] instanceof VidiunMediaEntry).toBeTruthy();
        });
        done();
      },
      () => {
        done.fail(`failed to perform request`);
      }
    );
  });

  /*
    def test_createRemote(self):
        mediaEntry = VidiunMediaEntry()
        mediaEntry.setName("pytest.MediaTests.test_createRemote")
        mediaEntry.setMediaType(VidiunMediaType(VidiunMediaType.VIDEO))

        ulFile = getTestFile("DemoVideo.flv")
        uploadTokenId = self.client.media.upload(ulFile)

        mediaEntry = self.client.media.addFromUploadedFile(mediaEntry, uploadTokenId)

        self.assertIsInstance(mediaEntry.getId(), six.text_type)

        #cleanup
        self.client.media.delete(mediaEntry.id)
  */
  xtest(`invoke "createRemote" action`, () => {
    const media = new VidiunMediaEntry({
      name: "typescript.MediaTests.test_createRemote",
      mediaType: VidiunMediaType.video
    });
  });

  describe(`utf-8 tests`, () => {
    /*
      def test_utf8_name(self):
          test_unicode = six.u('\u03dd\xf5\xf6')  #an odd representation of the word 'FOO'
          mediaEntry = VidiunMediaEntry()
          mediaEntry.setName(u'pytest.MediaTests.test_UTF8_name'+test_unicode)
          mediaEntry.setMediaType(VidiunMediaType(VidiunMediaType.VIDEO))
          ulFile = getTestFile('DemoVideo.flv')
          uploadTokenId = self.client.media.upload(ulFile)

          #this will throw an exception if fail.
          mediaEntry = self.client.media.addFromUploadedFile(mediaEntry, uploadTokenId)

          self.addCleanup(self.client.media.delete, mediaEntry.getId())
     */
    xtest(`support utf-8 name`, () => {
      const media = new VidiunMediaEntry({
        name: "typescript.MediaTests.test_UTF8_name" + "\u03dd\xf5\xf6",
        mediaType: VidiunMediaType.video
      });
    });

    /*
      def test_utf8_tags(self):

          test_unicode = u'\u03dd\xf5\xf6'  #an odd representation of the word 'FOO'
          mediaEntry = VidiunMediaEntry()
          mediaEntry.setName('pytest.MediaTests.test_UTF8_tags')
          mediaEntry.setMediaType(VidiunMediaType(VidiunMediaType.VIDEO))
          ulFile = getTestFile('DemoVideo.flv')
          uploadTokenId = self.client.media.upload(ulFile)

          mediaEntry.setTags(test_unicode)

          #this will throw an exception if fail.
          mediaEntry = self.client.media.addFromUploadedFile(mediaEntry, uploadTokenId)

          self.addCleanup(self.client.media.delete, mediaEntry.getId())
     */
    xtest(`support utf-8 tags`, () => {
      const media = new VidiunMediaEntry({
        name: "typescript.MediaTests.test_UTF8_tags",
        mediaType: VidiunMediaType.video
      });
    });
  });
});
