
var config = new VidiunConfiguration();
config.serviceUrl = serviceUrl;
config.setLogger(new IVidiunLogger());

var client = new VidiunClient(config);

describe("Start session", function() {
    describe("User VS", function() {
    	var userId = null;
    	var type = 0; // VidiunSessionType.USER
    	var expiry = null;
    	var privileges = null;

    	it('not null', function(done) {
    		VidiunSessionService.start(secret, userId, type, partnerId, expiry, privileges)
        	.completion(function(success, vs) {
        		expect(success).toBe(true);
        		expect(vs).not.toBe(null);
        		client.setVs(vs);
        		done();
        	})
        	.execute(client);
        });
    });
});


describe("media", function() {

    describe("multi-request", function() {
    	var entry = {
    		mediaType: 1, // VidiunMediaType.VIDEO
    		name: 'test'
    	};

    	var uploadToken = {
    	};

    	var mediaResource = {
    		objectType: 'VidiunUploadedFileTokenResource',
			token: '{2:result:id}'
    	};

		var filename = './DemoVideo.mp4';
		
    	jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
    	it('create entry', function(done) {
    		VidiunMediaService.add(entry)
    		.add(VidiunUploadTokenService.add(uploadToken))
    		.add(VidiunMediaService.addContent('{1:result:id}', mediaResource))
//    		Karma doesn't support creating <input type=file>
//    		.add(VidiunUploadTokenService.upload('{2:result:id}', filename))
    		.completion(function(success, results) {
        		expect(success).toBe(true);
        		
    			entry = results[0];
        		expect(entry).not.toBe(null);
        		expect(entry.id).not.toBe(null);
        		expect(entry.status.toString()).toBe('7'); // VidiunEntryStatus.NO_CONTENT

    			uploadToken = results[1];
        		expect(uploadToken).not.toBe(null);
        		expect(uploadToken.id).not.toBe(null);
        		expect(uploadToken.status).toBe(0); // VidiunUploadTokenStatus.PENDING

    			entry = results[2];
        		expect(entry.status.toString()).toBe('0'); // VidiunEntryStatus.IMPORT

//        		Karma doesn't support creating <input type=file>
//    			uploadToken = results[3];
//        		expect(uploadToken).not.toBe(null);
//        		expect(uploadToken.id).not.toBe(null);
//        		expect(uploadToken.fileSize).toBeGreaterThan(0);
//        		expect(uploadToken.status).toBe(3); // VidiunUploadTokenStatus.CLOSED
        		
        		done();
    		})
    		.execute(client);
    	});
    });
});
