var Unit = require('deadunit')
var vc = require('../VidiunClient');
var vtypes = require('../VidiunTypes');
var vo = require ('../VidiunVO.js');
var config = require ('./config.js');
var cb = function (results)
{
    var test = Unit.test('Create -2 Admin session', function () {
    this.count(2);
    if(results){
	    if(results.code && results.message){
		this.log(results.message);
		this.log(results.code);
		this.ok(false);
	    }else{
		this.log('VS is: '+results);
		this.ok(true);
	    }
    }else{
	console.log('Something went wrong here :(');
    }
    //console.log('writeConsole()');
    test.writeConsole(); // writes colorful output!
	});
}


function init_minus2_session(){
    var vidiun_conf = new vc.VidiunConfiguration(config.minus2_partner_id);
    vidiun_conf.serviceUrl = config.service_url ;
    var client = new vc.VidiunClient(vidiun_conf);
    var type = vtypes.VidiunSessionType.ADMIN;

    var expiry = null;
    var privileges = null;
    var vs = client.session.start(create_partner(config.minus2_partner_id,config.minus2_admin_secret), config.minus2_admin_secret, config.user_id, type, config.minus2_partner_id, expiry, privileges);
    return client;
}

function init_session(){
    var vidiun_conf = new vc.VidiunConfiguration(config.partner_id);
    vidiun_conf.serviceUrl = config.service_url ;
    var client = new vc.VidiunClient(vidiun_conf);
    var type = vtypes.VidiunSessionType.ADMIN;

    var expiry = null;
    var privileges = null;
    var vs = client.session.start(create_partner, config.admin_secret, config.user_id, type, config.partner_id, expiry, privileges);
}

function create_partner(results)
{
    console.log(results);
    process.exit();
    var partner = new vo.VidiunPartner();
    partner.name = "MBP";
    partner.appearInSearch = null;
    partner.adminName = "MBP";
    partner.adminEmail = "mbp@example.com";
    partner.description = "MBP";
    var cms_password = 'testit';
    var template_partner_id = null;
    var silent = null;
    var result = client.partner.register(create_upload_token, partner, cms_password, template_partner_id, silent);
    return result;
}
function create_upload_token(result)
{
	var uploadToken = new vo.VidiunUploadToken();
	uploadToken.fileName = "~/downloads/cat.mp4";
	var result = client.uploadToken.add(upload_entry, uploadToken);
	console.log(result);
}
function upload_entry()
{
    console.log("upload_entry");
}

//    minus2_client=init_minus2_session();
function test()
{
    client=init_session();
    //console.log(client);
}
test();
