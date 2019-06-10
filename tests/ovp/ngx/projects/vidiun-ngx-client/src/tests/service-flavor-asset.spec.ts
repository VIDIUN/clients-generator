import {FlavorAssetListAction} from "../lib/api/types/FlavorAssetListAction";
import {VidiunFlavorAssetListResponse} from "../lib/api/types/VidiunFlavorAssetListResponse";
import {VidiunFlavorAsset} from "../lib/api/types/VidiunFlavorAsset";
import {BaseEntryListAction} from "../lib/api/types/BaseEntryListAction";
import {VidiunMediaEntryFilter} from "../lib/api/types/VidiunMediaEntryFilter";
import {VidiunFlavorAssetFilter} from "../lib/api/types/VidiunFlavorAssetFilter";
import { asyncAssert, getClient } from "./utils";
import {LoggerSettings, LogLevels} from "../lib/api/vidiun-logger";
import {VidiunResponse} from "../lib/api";
import {VidiunClient} from "../lib/vidiun-client.service";

describe(`service "Flavor" tests`, () => {
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

	test("flavor list", (done) => {
		expect.assertions(3);
		vidiunClient.multiRequest([
			new BaseEntryListAction(
				{
					filter: new VidiunMediaEntryFilter({
						flavorParamsIdsMatchOr: '0'
					})
				}
			),
			new FlavorAssetListAction(
				{
					filter: new VidiunFlavorAssetFilter(
						{
							entryIdEqual: ''
						}
					).setDependency(['entryIdEqual',0,'objects:0:id'])
				}
			)]
		)
			.subscribe(
				responses => {

					const response: VidiunResponse<VidiunFlavorAssetListResponse> = responses[1];
					asyncAssert(() => {
						expect(response.result instanceof VidiunFlavorAssetListResponse).toBeTruthy();
						expect(Array.isArray(response.result.objects)).toBeTruthy();
						expect(response.result.objects.every(obj => obj instanceof VidiunFlavorAsset)).toBeTruthy();
					});
					done();
				},
				(error) => {
					done.fail(error);
				}
			);
	});
});
