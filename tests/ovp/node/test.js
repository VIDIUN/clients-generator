var vidiun = require('vidiun');

partner_id=102;
service_url='https://www.vidiun.com';
secret='';
var vidiun_conf = new vidiun.vc.VidiunConfiguration(partner_id);
vidiun_conf.serviceUrl = service_url ;
var client = new vidiun.vc.VidiunClient(vidiun_conf);
var type = vidiun.vc.enums.VidiunSessionType.ADMIN;

var expiry = null;
var privileges = null;
var vs = client.session.start(print_vs,secret , 'some@user.com', type, partner_id, expiry, privileges);

function print_vs(result)
{
	console.log(result);
}
