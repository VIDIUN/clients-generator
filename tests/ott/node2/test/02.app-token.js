
const fs = require('fs');
const md5 = require('md5');
const cache = require('node-shared-cache');
const expect = require("chai").expect;
const shortid = require('shortid');
const vidiun = require('../VidiunClient');

const testConfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const {partnerId, serviceUrl} = testConfig;

let config = new vidiun.Configuration();
config.serviceUrl = serviceUrl;

const client = new vidiun.Client(config);

var userId;

const obj = new cache.Cache("test", 524288);
const username = obj.username;
const password = obj.password;

describe("User", () => {
	
	describe("login", () => {
		
		it('returns valid vs', (done) => {
			vidiun.services.ottUser.login(partnerId, username, password)
			.completion((success, response) => {
				const {executionTime, result} = response;
				const loginResponse = result;
				expect(success).to.equal(true);
				console.dir(loginResponse);
				expect(loginResponse).to.not.be.a('null');
				expect(loginResponse.loginSession).to.not.be.a('null');
				expect(loginResponse.loginSession.vs).to.not.be.a('null');
				expect(loginResponse.user).to.not.be.a('null');
				expect(loginResponse.user.id).to.not.be.a('null');
				
				client.setVs(loginResponse.loginSession.vs);
				userId = loginResponse.user.id
				
				done();
			})
			.execute(client);
		});
	});
	
	describe("app-token", () => {
		var appToken = new vidiun.objects.AppToken({
			hashType: vidiun.enums.AppTokenHashType.MD5
		});
		
		it('App-Token created', (done) => {
			
			vidiun.services.appToken.add(appToken)
			.completion((success, response) => {
				const {executionTime, result} = response;
				appToken = result;
				expect(success).to.equal(true);
				console.dir(appToken);
				expect(appToken).to.not.be.a('null');
				expect(appToken.id).to.not.be.a('null');
				expect(appToken.token).to.not.be.a('null');
				expect(appToken.sessionUserId).to.not.be.a('null');
				expect(appToken.sessionUserId).to.equal(userId);
				done();
			})
			.execute(client);
		});
		
		it('VS created', (done) => {
			
			client.setVs(null);
			vidiun.services.ottUser.anonymousLogin(partnerId)
			.completion((success, response) => {
				const {executionTime, result} = response;
				const loginSession = result;
				expect(success).to.equal(true);
				console.dir(loginSession);
				expect(loginSession).to.not.be.a('null');
				expect(loginSession.vs).to.not.be.a('null');
				
				client.setVs(loginSession.vs);
				
				const tokenHash = md5(loginSession.vs + appToken.token);
				vidiun.services.appToken.startSession(appToken.id, tokenHash)
				.completion((success, response) => {
					const {executionTime, result} = response;
					const sessionInfo = result;
					expect(success).to.equal(true);
					console.dir(sessionInfo);
					expect(sessionInfo).to.not.be.a('null');
					expect(sessionInfo.vs).to.not.be.a('null');
					expect(sessionInfo.userId).to.not.be.a('null');
					expect(sessionInfo.userId).to.equal(userId);
					
					client.setVs(sessionInfo.vs);
					
					done();
				})
				.execute(client);
			})
			.execute(client);
			
		});
		
		it('VS valid', (done) => {
			
			vidiun.services.session.get()
			.completion((success, response) => {
				const {executionTime, result} = response;
				const session = result;
				expect(success).to.equal(true);
				console.dir(session);
				expect(session).to.not.be.a('null');
				expect(session.vs).to.not.be.a('null');
				expect(session.userId).to.not.be.a('null');
				expect(session.userId).to.equal(userId);
				
				done();
			})
			.execute(client);
			
		});
		
		it('App-Token deleted', (done) => {
			
			vidiun.services.appToken.deleteAction(appToken.id)
			.completion((success, response) => {
				const {executionTime, result} = response;
				expect(success).to.equal(true);
				expect(result).to.equal(true);
				done();
			})
			.execute(client);
		});
		
		it('VS invalid', (done) => {
			
			vidiun.services.session.get()
			.completion((success, response) => {
				const {executionTime, result} = response;
				expect(success).to.equal(false);
				console.dir(result);
				expect(result).to.not.be.a('null');
				expect(result.error).to.not.be.a('null');
				expect(result.error.code).to.not.be.a('null');
				expect(result.error.code).to.equal('500016');
				
				done();
			})
			.execute(client);
			
		});
	});
});

