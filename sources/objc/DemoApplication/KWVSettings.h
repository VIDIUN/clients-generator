//
//  WVSettings.h
//  Vidiun
//
//  Created by Eliza Sapir on 6/3/13.
//
//

#import <Foundation/Foundation.h>

@interface VWVSettings : NSObject {
    
    NSString* drmServer;
	NSString* portalId;
	
	BOOL nativeAdapting;
    BOOL initialized;
}

@property (nonatomic, retain) NSString* drmServer;
@property (nonatomic, retain) NSString* portalId;

- (BOOL) isNativeAdapting;
-(NSDictionary*) initializeDictionary:(NSString *)flavorId andVS: (NSString*) vs;

@end
