
const fs = require('fs');
const expect = require("chai").expect;
const vidiun = require('../VidiunClient');

const testConfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const {secret, partnerId, serviceUrl} = testConfig;

let config = new vidiun.Configuration();
config.serviceUrl = serviceUrl;

const client = new vidiun.Client(config);


describe("Start session", () => {
    describe("User VS", () => {
    	let userId = null;
    	let type = vidiun.enums.SessionType.USER;
    	let expiry = null;
    	let privileges = null;

    	it('not null', (done) => {
    		vidiun.services.session.start(secret, userId, type, partnerId, expiry, privileges)
        	.completion((success, vs) => {
        		expect(success).to.equal(true);
        		expect(vs).to.not.be.a('null');
        		client.setVs(vs);
        		done();
        	})
        	.execute(client);
        });
    });
});

describe("Add media", () => {
    describe("Multiple requests", () => {

    	let entry = new vidiun.objects.MediaEntry({
    		mediaType: vidiun.enums.MediaType.VIDEO,
    		name: 'test'
    	});

    	let uploadToken = new vidiun.objects.UploadToken({
    	});

    	let createdEntry;
    	let createdUploadToken;

    	it('entry created', (done) => {
    		vidiun.services.media.add(entry)
    		.execute(client)
    		.then((entry) => {
        		expect(entry).to.not.be.a('null');
        		expect(entry.id).to.not.be.a('null');
        		expect(entry.status.toString()).to.equal(vidiun.enums.EntryStatus.NO_CONTENT);

        		createdEntry = entry;
        		return vidiun.services.uploadToken.add(uploadToken)
        		.execute(client);
    		})
    		.then((uploadToken) => {
        		expect(uploadToken).to.not.be.a('null');
        		expect(uploadToken.id).to.not.be.a('null');
        		expect(uploadToken.status).to.equal(vidiun.enums.UploadTokenStatus.PENDING);

        		createdUploadToken = uploadToken;
        		
        		let mediaResource = new vidiun.objects.UploadedFileTokenResource({
        			token: uploadToken.id
            	});
        		
        		return vidiun.services.media.addContent(createdEntry.id, mediaResource)
        		.execute(client);
    		})
    		.then((entry) => {
        		expect(entry.status.toString()).to.equal(vidiun.enums.EntryStatus.IMPORT);

        		let filePath = './test/DemoVideo.mp4';
        		return vidiun.services.uploadToken.upload(createdUploadToken.id, filePath)
        		.execute(client);
    		})
    		.then((uploadToken) => {
        		expect(uploadToken.status).to.equal(vidiun.enums.UploadTokenStatus.CLOSED);
        		done();
    		});
    	});
    });
    

    describe("Single multi-request", () => {
    	let entry = new vidiun.objects.MediaEntry({
    		mediaType: vidiun.enums.MediaType.VIDEO,
    		name: 'test'
    	});

    	let uploadToken = new vidiun.objects.UploadToken({
    	});

		let mediaResource = new vidiun.objects.UploadedFileTokenResource({
			token: '{2:result:id}'
    	});
		
		let filePath = './test/DemoVideo.mp4';

    	it('entry created', (done) => {
    		vidiun.services.media.add(entry)
    		.add(vidiun.services.uploadToken.add(uploadToken))
    		.add(vidiun.services.media.addContent('{1:result:id}', mediaResource))
    		.add(vidiun.services.uploadToken.upload('{2:result:id}', filePath))
    		.execute(client)
    		.then((results) => {
    			
    			entry = results[0];
        		expect(entry).to.not.be.a('null');
        		expect(entry.id).to.not.be.a('null');
        		expect(entry.status.toString()).to.equal(vidiun.enums.EntryStatus.NO_CONTENT);

    			uploadToken = results[1];
        		expect(uploadToken).to.not.be.a('null');
        		expect(uploadToken.id).to.not.be.a('null');
        		expect(uploadToken.status).to.equal(vidiun.enums.UploadTokenStatus.PENDING);

    			entry = results[2];
        		expect(entry.status.toString()).to.equal(vidiun.enums.EntryStatus.IMPORT);

    			uploadToken = results[3];
        		expect(uploadToken.status).to.equal(vidiun.enums.UploadTokenStatus.CLOSED);
        		
        		done();
    		});
    	});
    });
});