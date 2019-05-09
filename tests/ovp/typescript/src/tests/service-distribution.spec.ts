import { VidiunClient } from "../vidiun-client-service";
import { DistributionProviderListAction } from "../api/types/DistributionProviderListAction";
import { VidiunDistributionProviderListResponse } from "../api/types/VidiunDistributionProviderListResponse";
import { VidiunDistributionProvider } from "../api/types/VidiunDistributionProvider";
import { DistributionProfileListAction } from "../api/types/DistributionProfileListAction";
import { VidiunDistributionProfileListResponse } from "../api/types/VidiunDistributionProfileListResponse";
import { VidiunDistributionProfile } from "../api/types/VidiunDistributionProfile";
import { EntryDistributionListAction } from "../api/types/EntryDistributionListAction";
import { VidiunEntryDistributionListResponse } from "../api/types/VidiunEntryDistributionListResponse";
import { VidiunEntryDistribution } from "../api/types/VidiunEntryDistribution";
import { getClient } from "./utils";
import { LoggerSettings, LogLevels } from "../api/vidiun-logger";
import { asyncAssert } from "./utils";

describe(`service "Distribution" tests`, () => {
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

	test("distribution provider list", (done) => {
		expect.assertions(2);
		vidiunClient.request(new DistributionProviderListAction())
			.then(
				response => {
					asyncAssert(() => {
						expect(response instanceof VidiunDistributionProviderListResponse).toBeTruthy();
						expect(Array.isArray(response.objects)).toBeTruthy();

					});
					done();
				},
				(error) => {
					done.fail(error);
				});
	});

	test("distribution profile list", (done) => {
		expect.assertions(4);
		vidiunClient.request(new DistributionProfileListAction())
			.then(
				response => {
					asyncAssert(() => {
						expect(response instanceof VidiunDistributionProfileListResponse).toBeTruthy();
						expect(Array.isArray(response.objects)).toBeTruthy();
						expect(response.objects.length).toBeGreaterThan(0);
						expect(response.objects[0] instanceof VidiunDistributionProfile).toBeTruthy();
					});
					done();
				},
				() => {
					done.fail("should not reach this part");
				});
	});

	test("entry distribution list", (done) => {
		expect.assertions(2);
		vidiunClient.request(new EntryDistributionListAction())
			.then(
				response => {
					asyncAssert(() => {
						expect(response instanceof VidiunEntryDistributionListResponse).toBeTruthy();
						expect(Array.isArray(response.objects)).toBeTruthy();
					});
					done();
				},
				() => {
					done.fail("should not reach this part");
				});
	});
});
