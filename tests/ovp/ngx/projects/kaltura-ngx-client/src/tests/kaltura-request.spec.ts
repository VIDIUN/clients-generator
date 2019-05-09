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


	describe("Building request", () => {
		test("expose request configuration properties as part of each action", () => {
			const listAction: BaseEntryListAction = new BaseEntryListAction();
			expect(listAction).toBeDefined();
			expect(listAction instanceof BaseEntryListAction).toBeTruthy();

			const userLoginByLoginIdAction: UserLoginByLoginIdAction = new UserLoginByLoginIdAction(
				{
					loginId: "a",
					password: "a",
					partnerId: 1234
				}
			);

			userLoginByLoginIdAction.setRequestOptions({
				vs: "valid vs",
				responseProfile: new VidiunDetachedResponseProfile().setData(data => {
					data.fields = "fields";
				})
			});

			expect(userLoginByLoginIdAction).toBeDefined();
			expect(userLoginByLoginIdAction instanceof UserLoginByLoginIdAction).toBeTruthy();

			const pojoRequest = <any>userLoginByLoginIdAction.buildRequest(null);
			expect(pojoRequest.service).toBe("user");
			expect(pojoRequest.action).toBe("loginByLoginId");
			expect(pojoRequest.vs).toBe("valid vs");
			expect(pojoRequest.partnerId).toBe(1234);
			expect(pojoRequest.responseProfile).toBeDefined();
			expect(pojoRequest.responseProfile.objectType).toBe("VidiunDetachedResponseProfile");
			expect(pojoRequest.responseProfile.fields).toBe("fields");

		});

		test("create a pojo of the request by and emit ", () => {
			const request = new BaseEntryListAction(
				{
					filter: new VidiunBaseEntryFilter().setData(data => {
						data.advancedSearch = new VidiunSearchOperator();
					})
				}
			);

			expect(request.filter).toBeDefined();
			expect(request.filter instanceof VidiunBaseEntryFilter).toBeTruthy();
			expect(request.filter.advancedSearch).toBeDefined();
			expect(request.filter.advancedSearch instanceof VidiunSearchOperator).toBeTruthy();

			const pojoRequest: any = <any>request.buildRequest(null);
			expect(pojoRequest).toBeDefined();

			expect(pojoRequest.filter).toBeDefined();
			expect(pojoRequest.filter.objectType).toBe("VidiunBaseEntryFilter");
			expect(pojoRequest.filter instanceof VidiunBaseEntryFilter).toBeFalsy();
			expect(pojoRequest.filter.advancedSearch).toBeDefined();
			expect(pojoRequest.filter.advancedSearch.objectType).toBe("VidiunSearchOperator");
			expect(pojoRequest.filter.advancedSearch instanceof VidiunSearchOperator).toBeFalsy();
		});

		test("ignore undefined/null/empty array values in request", () => {
			const request = new BaseEntryListAction(
				{
					filter: new VidiunBaseEntryFilter(),
					responseProfile: new VidiunDetachedResponseProfile()
				});

			const pojoRequest = <any>request.buildRequest(null);
			expect(pojoRequest).toBeDefined();
			expect(pojoRequest.hasOwnProperty("pager")).toBeFalsy();
			expect(pojoRequest.filter).toBeDefined();
			// expect(pojoRequest.filter.hasOwnProperty("statusIn")).toBeFalsy();
			// expect(pojoRequest.responseProfile).toBeDefined();
			// expect(pojoRequest.responseProfile.hasOwnProperty("mappings")).toBeFalsy();
		});

		test("ignore local action properties properties in request", () => {
			const request = new BaseEntryListAction(
				{
					filter: new VidiunBaseEntryFilter()
				});

			const pojoRequest = <any>request.buildRequest(null);
			expect(pojoRequest).toBeDefined();
			expect(typeof pojoRequest.objectType).toBe("undefined");
		});


		test("send enum of type int in request", () => {
			const request = new BaseEntryListAction(
				{
					filter: new VidiunBaseEntryFilter().setData(data => {
						data.isRoot = VidiunNullableBoolean.trueValue;
					})
				}
			);

			const pojoRequest: any = request.buildRequest(null);
			expect(pojoRequest).toBeDefined();
			expect(pojoRequest.filter.isRoot).toBe(1);
			expect(typeof pojoRequest.filter.isRoot === "number");
		});

		test("send enum of type string in request", () => {
			const request = new AppTokenAddAction(
				{
					appToken: new VidiunAppToken().setData(
						request => {
							request.hashType = VidiunAppTokenHashType.sha1;
						}
					)
				}
			);

			expect(VidiunAppTokenHashType.sha1).toBe(VidiunAppTokenHashType.sha1);

			const pojoRequest: any = request.buildRequest(null);
			expect(pojoRequest).toBeDefined();
			expect(pojoRequest.appToken.hashType).toBe(VidiunAppTokenHashType.sha1.toString());
			expect(typeof pojoRequest.appToken.hashType === "string");
		});

		test("send object in request", () => {
			const request = new BaseEntryListAction(
				{
					filter: new VidiunBaseEntryFilter().setData(data => {
						data.statusIn = "2";
					})
				}
			);

			const pojoRequest: any = request.buildRequest(null);
			expect(pojoRequest).toBeDefined();
			expect(pojoRequest.filter).toBeDefined();
			expect(pojoRequest.filter instanceof VidiunBaseEntryFilter).toBeFalsy();
			expect(pojoRequest.filter.objectType).toBe("VidiunBaseEntryFilter");

		});

		xtest("send date in request", () => {
			pending("waiting to a server support for dates");
			// const request = new BaseEntryListAction(
			// {
			// filter:
			//     new VidiunBaseEntryFilter().setData(data =>
			//     {
			//         data.createdAtGreaterThanOrEqual = new Date("1980-08-11");
			//     })
			// }
			// );
			//
			// const requestData  : any= request.build();
			// expect(requestData).toBeDefined();
			// expect(requestData.filter).toBeDefined();
			// expect(requestData.filter.createdAtGreaterThanOrEqual).toBe(334800000);
		});

		xtest("send array of simple types in request", () => {
			pending("TBD");
		});

		test("send array of objects in request", () => {
			const request = new BaseEntryListAction(
				{
					filter: new VidiunBaseEntryFilter().setData(data => {
						data.statusIn = "2";
						data.advancedSearch = new VidiunSearchOperator().setData(data => {
							data.type = VidiunSearchOperatorType.searchAnd;
							data.items.push(
								new VidiunSearchOperator(),
								new VidiunSearchOperator().setData(searchOperator => {
									searchOperator.type = VidiunSearchOperatorType.searchOr;
									searchOperator.items.push(
										new VidiunContentDistributionSearchItem().setData(distribution => {
											distribution.distributionProfileId = 1;
										}),
										new VidiunContentDistributionSearchItem().setData(distribution => {
											distribution.distributionProfileId = 2;
										})
									);
								})
							);
						});
					})
				}
			);

			const pojoRequest: any = request.buildRequest(null);
			expect(pojoRequest).toBeDefined();

			const requestFilter: any = pojoRequest.filter;
			expect(requestFilter).toBeDefined();
			const requestAvancedSearch: any = requestFilter.advancedSearch;
			expect(requestAvancedSearch.items.length).toBe(2);
			expect(requestAvancedSearch.items[1].items.length).toBe(2);
			expect(requestAvancedSearch.items[1].items[0].distributionProfileId).toBe(1);
			expect(requestAvancedSearch.items[1].items[1].distributionProfileId).toBe(2);
		});

		test("handle default value property of type int correctly", () => {
			const request = new BaseEntryListAction(
				{
					filter: new VidiunBaseEntryFilter()
				}
			);

			let pojoRequest: any = request.buildRequest(null);
			expect(pojoRequest).toBeDefined();
			expect(pojoRequest.filter).toBeDefined();
			expect(typeof pojoRequest.filter.partnerIdEqual).toBe("undefined");

			request.filter.partnerIdEqual = 123;
			pojoRequest = request.buildRequest(null);
			expect(pojoRequest.filter).toBeDefined();
			expect(pojoRequest.filter.partnerIdEqual).toBe(123);
		});

		test("handle default value property of type string correctly", () => {
			const request = new BaseEntryListAction(
				{
					filter: new VidiunBaseEntryFilter()
				}
			);

			let pojoRequest: any = request.buildRequest(null);
			expect(pojoRequest).toBeDefined();
			expect(pojoRequest.filter).toBeDefined();
			expect(typeof pojoRequest.filter.freeText).toBe("undefined");

			request.filter.freeText = "free";
			pojoRequest = request.buildRequest(null);
			expect(pojoRequest.filter).toBeDefined();
			expect(pojoRequest.filter.freeText).toBe("free");

			const request2 = new UserLoginByLoginIdAction(
				{
					loginId: "username",
					password: "password"
				});

			const pojoRequest2: any = request2.buildRequest(null);
			expect(pojoRequest2).toBeDefined();
			expect(pojoRequest2.privileges).toBe("*");

		});

		test("treat string default value ", () => {
			const request = new UserGetAction();

			expect(request.userId).toBeUndefined();

			let pojoRequest: any = request.buildRequest(null);
			expect(pojoRequest).toBeDefined();
			expect(pojoRequest.userId).toBeUndefined();
		});

		test("chain complex request with one statement (nested arrays, inner complex object)", () => {

			const request = new BaseEntryListAction(
				{
					filter: new VidiunBaseEntryFilter().setData(data => {
						data.statusIn = "2";
						data.advancedSearch = new VidiunSearchOperator().setData(data => {
							data.type = VidiunSearchOperatorType.searchAnd;
							data.items.push(
								new VidiunSearchOperator().setData(searchOperator => {
									searchOperator.type = VidiunSearchOperatorType.searchOr;
									searchOperator.items.push(
										new VidiunContentDistributionSearchItem().setData(distribution => {
											distribution.distributionProfileId = 12333;
										})
									);
								})
							);
						});
					})
				}
			);

			const pojoRequest: any = request.buildRequest(null);
			expect(pojoRequest).toBeDefined();

			const requestFilter: any = pojoRequest.filter;
			expect(requestFilter).toBeDefined();
			expect(requestFilter instanceof VidiunBaseEntryFilter).toBeFalsy();
			expect(requestFilter.statusIn).toBe("2");
			expect(requestFilter.advancedSearch.objectType).toBe("VidiunSearchOperator");
			expect(requestFilter.advancedSearch.type).toBe(VidiunSearchOperatorType.searchAnd);
			const advancedSearchItem: any = requestFilter.advancedSearch.items["0"];
			expect(advancedSearchItem).toBeDefined();
			expect(advancedSearchItem.type).toBe(VidiunSearchOperatorType.searchOr);
			expect(advancedSearchItem.items).toBeDefined();
			const distributionSearchItem: any = advancedSearchItem.items["0"];
			expect(distributionSearchItem).toBeDefined();
			expect(distributionSearchItem.objectType).toBe("VidiunContentDistributionSearchItem");
			expect(distributionSearchItem.distributionProfileId).toBe(12333);
		});

		test("force required parameters to be provided by constructor", () => {
			const request = new UserLoginByLoginIdAction(
				{
					loginId: "username",
					password: "password"
				});

			const pojoRequest: any = request.buildRequest(null);
			expect(pojoRequest).toBeDefined();

			expect(pojoRequest["loginId"]).toBe("username");
			expect(pojoRequest["password"]).toBe("password");
		});


		test("set optional parameters of action request (only!) directly from the action constructor", () => {
			const request = new UserLoginByLoginIdAction({
				loginId: "username",
				password: "password",
				expiry: 1234
			});

			const pojoRequest: any = request.buildRequest(null);
			expect(pojoRequest).toBeDefined();
			expect(pojoRequest.expiry).toBe(1234);

			const filter = new VidiunBaseEntryFilter();
			filter.statusIn = "2";
			const request2: BaseEntryListAction = new BaseEntryListAction({filter: filter});

			const pojoRequest2: any = request2.buildRequest(null);

			expect(pojoRequest2).toBeDefined();
			expect(pojoRequest2.filter).toBeDefined();
			expect(pojoRequest2.filter instanceof VidiunBaseEntryFilter).toBeDefined();
			expect(pojoRequest2.filter["statusIn"]).toBe("2");

		});


		test("allow overriding the general request configuration for vs/partnerid for specific request", () => {
			// build request with default vs (not settings vs explicitly)
			const requestWithDefaultVS = new UserLoginByLoginIdAction({
				loginId: "username",
				password: "password"
			});


			const pojoRequest: any = requestWithDefaultVS.buildRequest(null);
			expect(pojoRequest).toBeDefined();
			expect(pojoRequest.vs).toBeUndefined();

			// build request with custom vs
			const requestWithCustomVS = new UserLoginByLoginIdAction({
				loginId: "username",
				password: "password"
			});

			requestWithCustomVS.setRequestOptions({vs: "custom request VS"});

			const pojoRequest2: any = requestWithCustomVS.buildRequest(null);

			expect(pojoRequest2).toBeDefined();
			expect(pojoRequest2.vs).toBe("custom request VS");


		});

		test("support chaining on setCompletion", () => {
			const request = new UserLoginByLoginIdAction({
				loginId: "username",
				password: "password"
			});
			request.setRequestOptions({vs: "custom request VS"});
			const setCompletionResult = request.setCompletion(() => {
			});

			expect(setCompletionResult instanceof UserLoginByLoginIdAction).toBeTruthy();
		});

		test("expose function that allow setting multiple parameters while chaining", () => {
			const request: UserLoginByLoginIdAction = new UserLoginByLoginIdAction({
				loginId: "username",
				password: "password"
			}).setData(
				(request) => {
					request.expiry = 1;
					request.privileges = "none";
				}
			);

			const pojoRequest: any = request.buildRequest(null);


			expect(pojoRequest).toBeDefined();
			expect(pojoRequest.expiry).toBe(1);
			expect(pojoRequest.privileges).toBe("none");
		});
	});

	describe("Invoking vidiun response", () => {
		test("parse action response type", (done) => {
			// example of assignment by setParameters function (support chaining)
			const listAction: BaseEntryListAction = new BaseEntryListAction(
				{
					filter: new VidiunBaseEntryFilter().setData(filter => {
						filter.statusIn = "2";
					})
				});
			expect.assertions(1);
			vidiunClient.request(listAction).subscribe(
				(response) => {
					asyncAssert(() => {
						expect(response instanceof VidiunBaseEntryListResponse).toBeTruthy();
					});
					done();
				},
				(error) => {
					done.fail(error);
				}
			);
		});

		xtest("parse action response type that inherit from expected response type", () => {
			pending("TBD");
		});


		xtest("throw error when provided action response doesnt inherit from expected action response type", () => {
			pending("TBD");
		});

		test("parse object response property", (done) => {
			expect.assertions(3);
			vidiunClient.request(new BaseEntryListAction()).subscribe(
				(response) => {
					asyncAssert(() => {
						expect(response instanceof VidiunBaseEntryListResponse).toBeTruthy();
						expect(response.objects).toBeDefined();
						const object1 = response.objects[0];
						expect(object1).toBeDefined();
					});
					done();
				},
				(error) => {
					done.fail(error);
				}
			);
		});

		test("parse object response property that inherit from expected property type", (done) => {
			expect.assertions(4);
			vidiunClient.request(new BaseEntryListAction({
				filter: new VidiunMediaEntryFilter()
			})).subscribe(
				(response) => {

					asyncAssert(() => {
						expect(response).toBeDefined();
						expect(response.objects).toBeDefined();

						const object0 = response.objects[0];
						expect(object0).toBeDefined();
						expect(object0 instanceof VidiunMediaEntry).toBeTruthy();
					});
					done();
				},
				(error) => {
					done.fail(error);
				}
			);
		});

		xtest("throw error when provided property value doesnt inherit from expected property type", () => {
			pending("TBD");
		});

		test("parse number response property", (done) => {
			expect.assertions(3);
			vidiunClient.request(new BaseEntryListAction()).subscribe(
				(response) => {
					asyncAssert(() => {
						expect(response).toBeDefined();
						expect(response.objects).toBeDefined();
						const object0 = response.objects[0];
						expect(object0).toBeDefined();
					});
					done();
				},
				(error) => {
					done.fail(error);
				}
			);
		});

		test("parse number response property while provided value is boolean", (done) => {
			expect.assertions(2);
			vidiunClient.request(new PartnerGetAction({id: TestsConfig.partnerId})).subscribe(
				(response) => {
					asyncAssert(() => {
						expect(response).toBeDefined();
						expect(typeof response.allowMultiNotification === 'number').toBeTruthy();
					});
					done();
				},
				(error) => {
					done.fail(error);
				}
			);
		});

		test("parse number response property while provided value is valid number as string", (done) => {
			expect.assertions(4);
			vidiunClient.request(new BaseEntryListAction()).subscribe(
				(response) => {
					asyncAssert(() => {
						expect(response).toBeDefined();
						expect(response.objects).toBeDefined();
						const object0 = response.objects[0];
						expect(object0).toBeDefined();
						expect(typeof object0.version === 'number').toBeTruthy();
					});
					done();
				},
				(error) => {
					done.fail(error);
				}
			);
		});

		xtest("throw error when response property of type number and the provided value is not a number", () => {
			pending("TBD");
		});

		test("parse string response property", (done) => {
			expect.assertions(3);
			vidiunClient.request(new BaseEntryListAction()).subscribe(
				(response) => {
					asyncAssert(() => {
						expect(response).toBeDefined();
						expect(response.objects).toBeDefined();
						const object0 = response.objects[0];
						expect(object0).toBeDefined();
					});
					done();
				},
				(error) => {
					done.fail(error);
				}
			);
		});

		test("parse string response property while provided value is of type number", (done) => {
			expect.assertions(2);
			vidiunClient.request(new PartnerGetAction({id: TestsConfig.partnerId})).subscribe(
				(response) => {
					asyncAssert(() => {
						expect(response).toBeDefined();
						expect(response.defConversionProfileType).toBe("1001");
					});
					done();
				},
				(error) => {
					done.fail(error);
				}
			);
		});

		test("parse array response property", (done) => {
			expect.assertions(5);
			vidiunClient.request(new BaseEntryListAction({
				pager: new VidiunFilterPager({
					pageSize: 30
				})
			})).subscribe(
				(response) => {

					asyncAssert(() => {
						expect(response).toBeDefined();
						expect(response.totalCount).toBeGreaterThan(30);
						expect(response.objects).toBeDefined();
						expect(response.objects.length).toBe(30);
						const object1 = response.objects[0];
						expect(object1).toBeDefined();
					});
					done();
				},
				(error) => {
					done.fail(error);
				}
			);
		});

		xtest("parse boolean response property", () => {
			pending("TBD");
		});


		test("parse boolean response property while provided value is valid number as string", (done) => {
			expect.assertions(2);
			vidiunClient.request(new PartnerGetAction({id: TestsConfig.partnerId})).subscribe(
				(response) => {
					asyncAssert(() => {
						expect(response).toBeDefined();
						expect(typeof response.adultContent === 'boolean').toBeTruthy();
					});
					done();
				},
				(error) => {
					done.fail(error);
				}
			);
		});

		xtest("parse file response property", () => {
			pending("TBD");
		});

		xtest("parse void response property", () => {
			pending("TBD");
		});

		xtest("parse date response property", () => {
			pending("waiting to a server support for dates");
			// expect.assertions(4);
			// vidiunClient.request(new BaseEntryListAction()).then(
			//     (response) =>
			//     {
			// asyncAssert(() => {
			//   const vidiunMediaEntry : VidiunMediaEntry = <VidiunMediaEntry>response.objects[0];
			//   expect(vidiunMediaEntry.createdAt instanceof Date).toBeTruthy();// known dates are converted by the api
			//   expect(vidiunMediaEntry.createdAt.getTime() ).toBe((new Date(1450013576 * 1000)).getTime()); // TODO [vmc] response.{typed array}.{DATE VALUE}
			// });

			// done();
			//     },
			//     () =>
			//     {
			//         done.fail("should not reach this part");
			//     }
			// );
		});

		test("parse enum of type int response property", (done) => {
			expect.assertions(4);
			vidiunClient.request(new PlaylistListAction()).subscribe(
				(response) => {
					asyncAssert(() => {
						expect(response).toBeDefined();
						expect(response.objects).toBeDefined();
						const object0: VidiunPlaylist = <VidiunPlaylist>response.objects[0];
						expect(object0).toBeDefined();
						expect([VidiunPlaylistType.dynamic, VidiunPlaylistType.external, VidiunPlaylistType.staticList]).toContain(object0.playlistType);
					});
					done();
				},
				(error) => {
					done.fail(error);
				}
			);
		});

		xtest("parse enum of type string response property when the provided value is of type int", (done) => {
			expect.assertions(1);
			vidiunClient.request(new BaseEntryListAction()).subscribe(
				(response) => {
					asyncAssert(() => {
						const vidiunMediaEntry: VidiunMediaEntry = <VidiunMediaEntry>response.objects[0];
						expect(vidiunMediaEntry.replacementStatus).toBe(VidiunEntryReplacementStatus.none);
					});
					done();
				},
				() => {
					done.fail("should not reach this part");
				}
			);
		});

		xtest("parse enum of type string response property when the provided value is of type string", () => {
			pending("TBD");
		});

		xtest("parse array of simple types response property", () => {
			pending("TBD");
		});

		test("parse array of objects response property", (done) => {
			expect.assertions(6);
			vidiunClient.request(new BaseEntryListAction(
				{
					pager: new VidiunFilterPager({
						pageSize: 30
					})
				}
			)).subscribe(
				(response) => {
					asyncAssert(() => {
						expect(response instanceof VidiunBaseEntryListResponse).toBeTruthy();

						// verify length of array and totalCount
						expect(response.totalCount).toBeGreaterThan(0);
						expect(response.objects).toBeDefined();
						expect(response.objects.length).toBeGreaterThan(0);

						// verify item is of the right type
						const vidiunMediaEntry: VidiunMediaEntry = <VidiunMediaEntry>response.objects[0];
						expect(vidiunMediaEntry).toBeDefined();

						const vidiunPlaylist: VidiunPlaylist = <VidiunPlaylist>response.objects[4];
						expect(vidiunPlaylist).toBeDefined();
					});
					done();
				},
				(error) => {
					done.fail(error);
				}
			);
		});

		test("parse vidiun api exception response", (done) => {
			const listAction: BaseEntryListAction = new BaseEntryListAction();
			listAction.setRequestOptions({vs: "invalid vs"});
			expect.assertions(1);
			vidiunClient.request(listAction).subscribe(
				(response) => {
					done.fail(`should not reach this part: ${response}`);
				},
				(error) => {
					asyncAssert(() => {
						expect(error instanceof VidiunAPIException).toBeTruthy();
					});
					done();
				}
			);

		});

		xtest("reflect network exceptions as vidiun api exception", () => {
			pending("TBD");
		});

		xtest("reflect missing requst argument as vidiun api exception", () => {
			pending("TBD");
		});

		test("process request without setting completion to that request", (done) => {
			expect.assertions(1);
			vidiunClient.request(new BaseEntryListAction()).subscribe(
				(response) => {
					asyncAssert(() => {
						expect(response instanceof VidiunBaseEntryListResponse).toBeTruthy();
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
