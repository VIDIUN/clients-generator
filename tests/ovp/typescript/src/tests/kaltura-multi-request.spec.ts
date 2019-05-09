import { VidiunResponse } from "../api/vidiun-response";
import { VidiunMultiRequest } from "../api/vidiun-multi-request";
import { UserLoginByLoginIdAction } from "../api/types/UserLoginByLoginIdAction";
import { UserGetByLoginIdAction } from "../api/types/UserGetByLoginIdAction";
import { PermissionListAction } from "../api/types/PermissionListAction";
import { PartnerGetAction } from "../api/types/PartnerGetAction";
import { VidiunAPIException } from "../api/vidiun-api-exception";
import { VidiunMultiResponse } from "../api/vidiun-multi-response";
import { VidiunUser } from "../api/types/VidiunUser";
import { getClient, asyncAssert } from "./utils";
import { LoggerSettings, LogLevels } from "../api/vidiun-logger";
import { VidiunClient } from "../vidiun-client-service";


describe("Vidiun server API multi request", () => {
	const fakeUserName = "login";
	const fakePassword = "pass";

	let vidiunClient: VidiunClient = null;

	beforeAll(async () => {
		LoggerSettings.logLevel = LogLevels.error; // suspend warnings

		return new Promise((resolve => {
			getClient()
				.then(client => {
					vidiunClient = client;
					resolve(client);
				});
		}));
	});

	afterAll(() => {
		vidiunClient = null;
	});

	describe("Building request", () => {
		test("execute multi request with only ond inner requests", () => {
			const multiRequest = new VidiunMultiRequest(
				new UserLoginByLoginIdAction({
					loginId: fakeUserName,
					password: fakePassword
				})
			);

			const pojoRequest = multiRequest.buildRequest(null);

			expect(multiRequest instanceof VidiunMultiRequest).toBeTruthy();
			expect(pojoRequest instanceof VidiunMultiRequest).toBeFalsy();
			expect(pojoRequest["0"]).toBeDefined();
			expect(pojoRequest["1"]).toBeUndefined();
		});

		test("executes multi request with multiple inner requests", () => {
			const multiRequest = new VidiunMultiRequest(
				new UserLoginByLoginIdAction({
					loginId: fakeUserName,
					password: fakePassword
				}),
				new UserGetByLoginIdAction({ loginId: fakeUserName }),
				new PermissionListAction(),
				new PartnerGetAction({id: 12})
			);

			const pojoRequest = multiRequest.buildRequest(null);

			expect(pojoRequest["0"]).toBeDefined();
			expect(pojoRequest["1"]).toBeDefined();
			expect(pojoRequest["2"]).toBeDefined();
			expect(pojoRequest["3"]).toBeDefined();
			expect(pojoRequest["4"]).toBeUndefined();
		});

		test("set completion on inner requests (optional)", () => {
			const multiRequest = new VidiunMultiRequest(
				new UserLoginByLoginIdAction({
					loginId: fakeUserName,
					password: fakePassword
				})
					.setCompletion(() => {
					}),
				new UserGetByLoginIdAction({ loginId: fakeUserName }),
				new PermissionListAction()
					.setCompletion(() => {
					}),
				new PartnerGetAction({ id: 12})
			);

			expect(multiRequest.requests).toBeDefined();
			expect(multiRequest.requests["0"]["callback"]).toBeDefined();
			expect(multiRequest.requests["1"]["callback"]).toBeUndefined();
			expect(multiRequest.requests["2"]["callback"]).toBeDefined();
			expect(multiRequest.requests["3"]["callback"]).toBeUndefined();
		});

		test("supports vidiun api parameter dependency between inner requests", () => {

			const multiRequest1 = new VidiunMultiRequest(
				new UserLoginByLoginIdAction({
					loginId: fakeUserName,
					password: fakePassword
				}),
				new UserGetByLoginIdAction({ loginId: fakeUserName }).setDependency(["vs", 0, ""]),
				new PartnerGetAction().setDependency(["vs", 1, ""], ["id", 1, "partnerId"])
			);

			const pojoRequest = multiRequest1.buildRequest(null);
			expect(pojoRequest).toBeDefined();

			const multiRequest1Request1 = pojoRequest["1"];
			const multiRequest1Request2 = pojoRequest["2"];

			expect(multiRequest1Request1).toBeDefined();
			expect(multiRequest1Request2).toBeDefined();
			expect(multiRequest1Request2.id).toBe("{2:result:partnerId}");

			const multiRequest2 = new VidiunMultiRequest(
				new UserLoginByLoginIdAction({
					loginId: fakeUserName,
					password: fakePassword
				}),
				new UserGetByLoginIdAction({ loginId: fakeUserName }),
				new PartnerGetAction(null)
					.setDependency({ property: "vs", request: 0 }, { property: "id", request: 1, targetPath: ["partnerId"] })
			);

			const pojoRequest2 = multiRequest2.buildRequest(null);
			expect(pojoRequest2).toBeDefined();

			const multiRequest2request1 = pojoRequest2["1"];
			const multiRequest2Request2 = pojoRequest2["2"];

			expect(multiRequest2request1).toBeDefined();
			expect(multiRequest2Request2).toBeDefined();
			expect(multiRequest2Request2.id).toBe("{2:result:partnerId}");
		});
	});

	describe("Invoking multi request", () => {
		test("executes multi request set completion on some requests and on the multi request instance", (done) => {
			expect.assertions(4);
			vidiunClient.multiRequest(new VidiunMultiRequest(
				new PermissionListAction(),
				new PermissionListAction()
					.setCompletion((response) => {
						asyncAssert(() => {
							expect(response).toBeDefined();
							expect(response.result).toBeDefined();
							expect(response.error).toBeUndefined();
						});
					})
			).setCompletion(responses => {
				asyncAssert(() => {
					expect(responses.hasErrors()).toBeFalsy();
				});
			})).then(
				(responses) => {
					done();
				},
				(error) => {
					done.fail(error);
				}
			);
		});

		test("handles multi request response with failure on some inner requests", (done) => {
			expect.assertions(7);
			vidiunClient.multiRequest(new VidiunMultiRequest(
				new UserLoginByLoginIdAction({
					loginId: fakeUserName,
					password: fakePassword
				}).setCompletion((response) => {
					asyncAssert(() => {
						expect(response).toBeDefined();
						expect(response.result).toBeUndefined();
						expect(response.error).toBeDefined();
					});
				}),
				new PermissionListAction()
					.setCompletion((response) => {
						asyncAssert(() => {
							expect(response).toBeDefined();
							expect(response.result).toBeDefined();
							expect(response.error).toBeUndefined();
						});
					}),
			).setCompletion(responses => {
				asyncAssert(() => {
					expect(responses.hasErrors()).toBe(true);
				});
			})).then(
				(responses) => {
					done();
				},
				(error) => {
					done.fail(error);
				}
			);
		});


		test("returns error if server response is not an array or got unexpected number of items in array", () => {
			const request = new VidiunMultiRequest(
				new UserLoginByLoginIdAction({
					loginId: fakeUserName,
					password: fakePassword
				}),
				new UserGetByLoginIdAction({ loginId: fakeUserName })
			);

			expect(request.handleResponse(null).hasErrors()).toBeTruthy();
			expect(request.handleResponse(null).length).toBe(2);
			// TODO [vmc] investigate
			// expect(request.handleResponse(null)[0].error instanceof VidiunAPIException).toBeTruthy();
			// expect(request.handleResponse(null)[0].error.code).toBe("client::response_type_error");

			expect(request.handleResponse([{}]).hasErrors()).toBeTruthy();
			expect(request.handleResponse([{}]).length).toBe(2);
			// TODO [vmc] investigate
			// expect(request.handleResponse([{}])[0].error instanceof VidiunAPIException).toBeTruthy();
			// expect(request.handleResponse([{}])[0].error.code).toBe("client::response_type_error");
		});

		test("exposes a function that return if one or more responses returned with errors.", () => {
			// response with errors
			const response1 = new VidiunMultiResponse([
				new VidiunResponse<any>(null, new VidiunAPIException("12", "222",null)),
			]);

			expect(response1).toBeDefined();
			expect(typeof response1.hasErrors).toBe("function");
			expect(response1.hasErrors()).toBe(true);

			// response without errors
			const response2 = new VidiunMultiResponse([
				new VidiunResponse<any>(new VidiunUser(), null),
				new VidiunResponse<any>(new VidiunUser(), null),
			]);

			expect(response2).toBeDefined();
			expect(typeof response2.hasErrors).toBe("function");
			expect(response2.hasErrors()).toBe(false);
		});
	});
});
