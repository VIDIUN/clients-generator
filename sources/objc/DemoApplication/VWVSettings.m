//
//  WVSettings.m
//  Vidiun
//
//  Created by Eliza Sapir on 6/3/13.
//
//

#import "VWVSettings.h"
#import "WViPhoneAPI.h"

@implementation VWVSettings

@synthesize drmServer, portalId;

-(BOOL) isNativeAdapting{
    return nativeAdapting;
}

-(NSDictionary*) initializeDictionary:(NSString *)flavorId andVS: (NSString*) vs{
    NSString* hostName;
    hostName= [[NSString alloc] initWithString: @"http://www.vidiun.com"];
//    NSString* portalId, *drmServer;
    self.portalId = [[NSString alloc] initWithString: @"vidiun"];

    //EMM
    self.drmServer = [[NSString alloc] initWithFormat: @"%@/api_v3/service/widevine_widevinedrm/action/getLicense?format=widevine&flavorAssetId=%@&vs=%@" , hostName, flavorId, vs];
    
//    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
//    nativeAdapting = [defaults boolForKey:@"native_adapting"];
    
    [hostName release];

    NSDictionary* dictionary = [NSDictionary dictionaryWithObjectsAndKeys:
                                self.drmServer, WVDRMServerKey,
                                self.portalId, WVPortalKey,
//                                ((nativeAdapting == YES)?@"1":@"0"), WVPlayerDrivenAdaptationKey,
                                NULL];
    
    return dictionary;
}

- (void) dealloc{
	if(drmServer){
		[drmServer release];
	}
	
	if(portalId){
		[portalId release];
	}
	[super dealloc];
}

@end
