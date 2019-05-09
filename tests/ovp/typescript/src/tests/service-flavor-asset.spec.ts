import { VidiunClient } from "../vidiun-client-service";
import { FlavorAssetListAction } from "../api/types/FlavorAssetListAction";
import { BaseEntryListAction } from "../api/types/BaseEntryListAction";
import { VidiunFlavorAssetListResponse } from "../api/types/VidiunFlavorAssetListResponse";
import { VidiunMediaEntryFilter } from "../api/types/VidiunMediaEntryFilter";
import { VidiunFlavorAsset } from "../api/types/VidiunFlavorAsset";
import { VidiunFlavorAssetFilter } from "../api/types/VidiunFlavorAssetFilter";
import { getClient } from "./utils";
import { LoggerSettings, LogLevels } from "../api/vidiun-logger";
import { asyncAssert } from "./utils";
import { VidiunResponse } from '../api';

describe(`service "Flavor" tests`, () => {
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

	test("flavor list", (done) => {

		expect.assertions(4);
		vidiunClient.multiRequest(
			[
				new BaseEntryListAction({
					filter: new VidiunMediaEntryFilter({
						flavorParamsIdsMatchOr: '0'
					})
				}),
				new FlavorAssetListAction(
					{
						filter: new VidiunFlavorAssetFilter(
							{
								entryIdEqual: ''
							}
						).setDependency(['entryIdEqual',0,'objects:0:id'])
					}
				)
			])
			.then(
				responses => {
					const response: VidiunResponse<VidiunFlavorAssetListResponse> = responses[1];
					asyncAssert(() => {
						expect(response.result instanceof VidiunFlavorAssetListResponse).toBeTruthy();
						if (response.result instanceof VidiunFlavorAssetListResponse) {
							expect(Array.isArray(response.result.objects)).toBeTruthy();
							expect(response.result.objects.length).toBeGreaterThan(0);
							expect(response.result.objects[0] instanceof VidiunFlavorAsset).toBeTruthy();
						}
					});
					done();
				},
				(error) => {
					done.fail(error);
				}
			);
	});
});
