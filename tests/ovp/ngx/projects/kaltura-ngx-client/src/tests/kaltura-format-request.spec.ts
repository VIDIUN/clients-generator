import {BaseEntryListAction} from "../lib/api/types/BaseEntryListAction";
import {UserLoginByLoginIdAction} from "../lib/api/types/UserLoginByLoginIdAction";
import {VidiunDetachedResponseProfile} from "../lib/api/types/VidiunDetachedResponseProfile";
import {VidiunBaseEntryFilter} from "../lib/api/types/VidiunBaseEntryFilter";
import {VidiunSearchOperator} from "../lib/api/types/VidiunSearchOperator";
import {VidiunNullableBoolean} from "../lib/api/types/VidiunNullableBoolean";
import {AppTokenAddAction} from "../lib/api/types/AppTokenAddAction";
import {VidiunAppToken} from "../lib/api/types/VidiunAppToken";
import {VidiunSearchOperatorType} from "../lib/api/types/VidiunSearchOperatorType";
import {VidiunContentDistributionSearchItem} from "../lib/api/types/VidiunContentDistributionSearchItem";
import {UserGetAction} from "../lib/api/types/UserGetAction";
import {PlaylistListAction} from "../lib/api/types/PlaylistListAction";
import {VidiunResponseType} from "../lib/api/types/VidiunResponseType";
import {VidiunBaseEntryListResponse} from "../lib/api/types/VidiunBaseEntryListResponse";
import {VidiunPlaylist} from "../lib/api/types/VidiunPlaylist";
import {PartnerGetAction} from "../lib/api/types/PartnerGetAction";
import {VidiunPlaylistType} from "../lib/api/types/VidiunPlaylistType";
import {VidiunEntryReplacementStatus} from "../lib/api/types/VidiunEntryReplacementStatus";
import {VidiunMediaEntryFilterForPlaylist} from "../lib/api/types/VidiunMediaEntryFilterForPlaylist";
import {VidiunAPIException} from "../lib/api/vidiun-api-exception";
import {VidiunAppTokenHashType} from "../lib/api/types/VidiunAppTokenHashType";
import {VidiunMediaEntryFilter} from "../lib/api/types/VidiunMediaEntryFilter";
import {VidiunMediaEntry} from "../lib/api/types/VidiunMediaEntry";
import { asyncAssert, escapeRegExp, getClient } from "./utils";
import {LoggerSettings, LogLevels} from "../lib/api/vidiun-logger";
import {VidiunFilterPager} from "../lib/api/types/VidiunFilterPager";
import {VidiunClient} from "../lib/vidiun-client.service";
import {TestsConfig} from './tests-config';

describe("Vidiun server API request", () => {
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

    describe("Vidiun request with specific format type", () => {
        test("handle response format 1 (json)", (done) => {
            // example of assignment by setParameters function (support chaining)
            const listAction: BaseEntryListAction = new BaseEntryListAction(
                {
                    filter: new VidiunBaseEntryFilter().setData(filter => {
                        filter.statusIn = "2";
                    })
                });
            expect.assertions(2);
            vidiunClient.request(listAction, VidiunResponseType.responseTypeJson).subscribe(
                (response) => {
                    asyncAssert(() => {
                        expect(typeof response === 'string').toBeTruthy();
                        expect(JSON.parse(response)).toBeDefined();
                    });
                    done();
                },
                (error) => {
                    done.fail(error);
                }
            );
        });

        test("handle response format 2 (xml)", (done) => {
            // example of assignment by setParameters function (support chaining)
            const listAction: BaseEntryListAction = new BaseEntryListAction(
                {
                    filter: new VidiunBaseEntryFilter().setData(filter => {
                        filter.statusIn = "2";
                    })
                });
            expect.assertions(2);
            vidiunClient.request(listAction, VidiunResponseType.responseTypeXml).subscribe(
                (response) => {
                    asyncAssert(() => {
                        expect(typeof response === 'string').toBeTruthy();
                        expect(response.indexOf('<?xml ')).toBe(0);
                    });
                    done();
                },
                (error) => {
                    done.fail(error);
                }
            );
        });
    });
});
