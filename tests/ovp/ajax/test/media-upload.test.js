
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
    describe("upload", function() {

    	var entry = {
    		mediaType: 1, // VidiunMediaType.VIDEO
    		name: 'test'
    	};

    	var uploadToken = {};

    	var createdEntry;
    	var createdUploadToken;
    	
    	it('create entry', function(done) {
    		VidiunMediaService.add(entry)
    		.completion(function(success, entry) {
        		expect(success).toBe(true);
        		expect(entry).not.toBe(null);
        		expect(entry.id).not.toBe(null);
        		expect(entry.status.toString()).toBe('7'); // VidiunEntryStatus.NO_CONTENT

        		createdEntry = entry;
        		done();
    		})
    		.execute(client)
        });
        
    	it('create upload-token', function(done) {
    		VidiunUploadTokenService.add(uploadToken)
    		.completion(function(success, uploadToken) {
        		expect(success).toBe(true);
        		expect(uploadToken).not.toBe(null);
        		expect(uploadToken.id).not.toBe(null);
        		expect(uploadToken.status).toBe(0); // VidiunUploadTokenStatus.PENDING

        		createdUploadToken = uploadToken;
        		done();
    		})
    		.execute(client);
        });
        
    	it('add content', function(done) {
    		var mediaResource = {
    			objectType: 'VidiunUploadedFileTokenResource',
    			token: createdUploadToken.id
        	};
    		
    		VidiunMediaService.addContent(createdEntry.id, mediaResource)
    		.completion(function(success, entry) {
        		expect(success).toBe(true);
        		expect(entry.status.toString()).toBe('0'); // VidiunEntryStatus.IMPORT

        		done();
    		})
    		.execute(client);
    	});
        
//    	Karma doesn't support creating <input type=file> 
//    	it('upload file', function(done) {
//    		var filename = './DemoVideo.mp4';
//    		VidiunUploadTokenService.upload(createdUploadToken.id, filename)
//    		.completion(function(success, uploadToken) {
//        		expect(success).toBe(true);
//        		expect(uploadToken).not.toBe(null);
//        		expect(uploadToken.id).not.toBe(null);
//        		expect(uploadToken.fileSize).toBeGreaterThan(0);
//        		expect(uploadToken.status).toBe(3); // VidiunUploadTokenStatus.CLOSED
//
//        		createdUploadToken = uploadToken;
//        		done();
//    		})
//    		.execute(client);
//        });
    });
});
