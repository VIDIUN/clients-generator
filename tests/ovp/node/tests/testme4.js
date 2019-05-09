var Unit = require('deadunit')
var vc = require('../VidiunClient');
var vtypes = require('../VidiunTypes');
var vo = require ('../VidiunVO.js');
var config = require ('./config.js');

var create_session = function (results)
{
    console.log(results);
    if(results){
	    if(results.code && results.message){
		console.log(results.message);
		console.log(results.code);
		//process.exit(1);
	    }else{
		console.log('VS is: '+results);
	    }
    }else{
	console.log('Something went wrong here :(');
    }
}

var create_partner = function (results)
{
    if(results){
	    if(results.code && results.message){
		console.log(results.message);
		console.log(results.code);
		//process.exit(1);
	    }else{
		console.log('Partner created, ID: '+results.id);
	    }
    }else{
	console.log('Something went wrong here :(');
    }
}

var create_upload_token = function (results)
{
console.log(results);
    if(results){
	    if(results.code && results.message){
		console.log(results.message);
		console.log(results.code);
		//process.exit(1);
	    }else{
		console.log('Upload token created. '+results);
	    }
    }else{
	console.log('Something went wrong here :(');
    }
}

var upload_entry = function (results)
{
    if(results){
	    if(results.code && results.message){
		console.log(results.message);
		console.log(results.code);
		//process.exit(1);
	    }else{
		console.log(results);
	    }
    }else{
	console.log('Something went wrong here :(');
    }
}
var vidiun_conf = new vc.VidiunConfiguration(config.minus2_partner_id);
vidiun_conf.serviceUrl = config.service_url ;
var client = new vc.VidiunClient(vidiun_conf);
var type = vtypes.VidiunSessionType.ADMIN;

var expiry = null;
var privileges = null;
var vs = client.session.start(create_session, config.minus2_admin_secret, config.user_id, type, config.minus2_partner_id, expiry, privileges);

var partner = new vo.VidiunPartner();
partner.name = "MBP";
partner.appearInSearch = null;
partner.adminName = "MBP";
partner.adminEmail = "mbp@example.com";
partner.description = "MBP";
var cms_password = 'testit';
var template_partner_id = null;
var silent = null;
var result = client.partner.register(create_partner, partner, cms_password, template_partner_id, silent);

var vidiun_conf = new vc.VidiunConfiguration(config.partner_id);
vidiun_conf.serviceUrl = config.service_url ;
var client1 = new vc.VidiunClient(vidiun_conf);
var type = vtypes.VidiunSessionType.USER;

var expiry = null;
var privileges = null;
var vs = client1.session.start(create_session, config.secret, config.user_id, type, config.partner_id, expiry, privileges);
var uploadToken = new vo.VidiunUploadToken();
//var uploadToken.fileName = "~/downloads/cat.mp4";
var result = client1.uploadToken.add(create_upload_token, uploadToken);
/*var uploadTokenId = result.id;
var fileData = "~/downloads/cat.mp4";
var resume = null;
var finalChunk = null;
var resumeAt = null;
var result = client.uploadToken.upload(upload_entry, uploadTokenId, fileData, resume, finalChunk, resumeAt);*/
