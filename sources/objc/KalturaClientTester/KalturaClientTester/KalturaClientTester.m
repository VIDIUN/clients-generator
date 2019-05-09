// ===================================================================================================
//                           _  __     _ _
//                          | |/ /__ _| | |_ _  _ _ _ __ _
//                          | ' </ _` | |  _| || | '_/ _` |
//                          |_|\_\__,_|_|\__|\_,_|_| \__,_|
//
// This file is part of the Vidiun Collaborative Media Suite which allows users
// to do with audio, video, and animation what Wiki platfroms allow them to do with
// text.
//
// Copyright (C) 2006-2011  Vidiun Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
//
// @ignore
// ===================================================================================================
#import <objc/runtime.h>
#import "VidiunMetadataClientPlugin.h"
#import "VidiunClientTester.h"
#import "VidiunClient.h"
#import "ASIHTTPRequest.h"

// Account specific constants
// TODO: update this
#define ADMIN_SECRET (@"@YOUR_ADMIN_SECRET@")
#define PARTNER_ID (@YOUR_PARTNER_ID@)
#define USER_ID (@"testUser")

// Fixed constants
#define UPLOAD_FILENAME (@"DemoVideo.flv")
#define ENTRY_NAME (@"Media entry uploaded from ObjC client")
#define DEFAULT_SERVICE_URL (@"@SERVICE_URL@")
#define VIDIUN_CLIENT_TEST_URL (@"@SERVICE_URL@/clientTest")

/*
 VidiunTestDetails
 */
@interface VidiunTestDetails : NSObject

@property (nonatomic, retain) NSString* name;
@property (nonatomic, assign) SEL sel;
@property (nonatomic, assign) BOOL isSync;

@end

@implementation VidiunTestDetails

@synthesize name = _name;
@synthesize sel = _sel;
@synthesize isSync = _isSync;

- (void) dealloc
{
    [self->_name release];
    [super dealloc];
}

@end

/*
 VidiunCallbackDelegate
 */
@implementation VidiunCallbackDelegate

@synthesize target = _target;
@synthesize failedSel = _failedSel;
@synthesize finishedSel = _finishedSel;

- (void)requestFailed:(VidiunClientBase *)aClient
{
    [self.target performSelector:self.failedSel withObject:aClient];
}

- (void)requestFinished:(VidiunClientBase *)aClient withResult:(id)result
{
    [self.target performSelector:self.finishedSel withObject:aClient withObject:result];
}

@end

/*
 VidiunDownloadDelegate
 */
@interface VidiunProgressDelegate : NSObject <ASIProgressDelegate> 

@property (nonatomic, assign) BOOL receiveBytesCalled;
@property (nonatomic, assign) BOOL sendBytesCalled;

@end

@implementation VidiunProgressDelegate

@synthesize receiveBytesCalled = _receiveBytesCalled;
@synthesize sendBytesCalled = _sendBytesCalled;

- (void)request:(ASIHTTPRequest *)request didReceiveBytes:(long long)bytes
{
    self.receiveBytesCalled = TRUE;
}

- (void)request:(ASIHTTPRequest *)request didSendBytes:(long long)bytes
{
    self.sendBytesCalled = TRUE;
}

@end


/*
 VidiunClientTester
 */
@interface VidiunClientTester()

- (void)setUp;
- (void)tearDown;

@end

@implementation VidiunClientTester

@synthesize delegate = _delegate;

- (void)initTestsArray
{
    unsigned int methodCount = 0;
    
    self->_tests = [[NSMutableArray alloc] init];
    
    Method* methodList = class_copyMethodList(object_getClass(self), &methodCount);
    for (int i = 0; i < methodCount; i++)
    {
        SEL curSel = method_getName(methodList[i]);
        const char* curName = sel_getName(curSel);
        
        if (0 != strncmp(curName, "test", 4))
            continue;
        
        VidiunTestDetails* details = [[VidiunTestDetails alloc] init];
        details.name = [NSString stringWithUTF8String:curName];
        details.sel = curSel;
        details.isSync = (0 != strncmp(curName, "testAsync", 9));
        [self->_tests addObject:details];
        [details release];
    }
    
    free(methodList);
}

- (id)initWithDelegate:(id <VidiunClientTesterDelegate>)aDelegate;
{
    self = [super init];
    if (self == nil)
        return nil;
    
    self->_delegate = aDelegate;
    
    VidiunConfiguration* config = [[VidiunConfiguration alloc] init];
    VidiunNSLogger* logger = [[VidiunNSLogger alloc] init];
    config.logger = logger;
    config.serviceUrl = DEFAULT_SERVICE_URL;
    [logger release];           // retained on config
    config.partnerId = PARTNER_ID;
    self->_client = [[VidiunClient alloc] initWithConfig:config];
    [config release];           // retained on the client
    
    self->_client.vs = [VidiunClient generateSessionWithSecret:ADMIN_SECRET withUserId:USER_ID withType:[VidiunSessionType ADMIN] withPartnerId:PARTNER_ID withExpiry:86400 withPrivileges:@""];
    
    self->_clientDelegate = [[VidiunCallbackDelegate alloc] init];
    self->_clientDelegate.target = self;

    [self initTestsArray];

    return self;
}

- (void)dealloc
{
    [self->_tests release];
    [self->_clientDelegate release];
    [self->_client release];
    [super dealloc];
}

- (void)startNextTest
{
    if (self->_curTestIndex >= self->_tests.count)
    {
        self->_curTestIndex = 0;
        self->_client.config.serviceUrl = DEFAULT_SERVICE_URL;   
        self->_client.delegate = nil;
        [self tearDown];
        
        NSString* message = [NSString stringWithFormat:@"Done - %lu tests !", (unsigned long)self->_tests.count];
        [self->_delegate updateProgressWithMessage:message];
        return;
    }
    
    self->_curTestDetails = [self->_tests objectAtIndex:self->_curTestIndex];
    self->_curTestIndex++;
    
    if (self->_curTestDetails.isSync)
    {
        self->_client.delegate = nil;
    }
    else
    {
        self->_client.delegate = self->_clientDelegate;
        NSString* failedSelName = [NSString stringWithFormat:@"callback_%@_RequestFailed:", self->_curTestDetails.name];
        NSString* finishedSelName = [NSString stringWithFormat:@"callback_%@_RequestFinished:withResult:", self->_curTestDetails.name];
        SEL failedSel = NSSelectorFromString(failedSelName);
        SEL finishedSel = NSSelectorFromString(finishedSelName);
        
        if (failedSel != nil && [self respondsToSelector:failedSel])
        {
            self->_clientDelegate.failedSel = failedSel;
        }
        else
        {
            self->_clientDelegate.failedSel = @selector(unexpRequestFailed:);
        }

        if (finishedSel != nil && [self respondsToSelector:finishedSel])
        {
            self->_clientDelegate.finishedSel = finishedSel;
        }
        else
        {
            self->_clientDelegate.finishedSel = @selector(unexpRequestFinished:withResult:);
        }
    }
    
    NSString* message = [NSString stringWithFormat:@"Running %@ (%d/%lu)...", self->_curTestDetails.name, self->_curTestIndex, (unsigned long)self->_tests.count];
    NSLog(@"%@", message);
    [self->_delegate updateProgressWithMessage:message];
        
    [NSTimer scheduledTimerWithTimeInterval:0.1 target:self selector:@selector(dispatchTest) userInfo:nil repeats:NO];
}

- (void)dispatchTest
{
    self->_client.config.serviceUrl = DEFAULT_SERVICE_URL;   

    BOOL shouldRunNextTest = self->_curTestDetails.isSync;
    
    if (![self respondsToSelector:self->_curTestDetails.sel])
        assert(NO);
    
    [self performSelector:self->_curTestDetails.sel];
    
    if (shouldRunNextTest)
        [self startNextTest];
}

- (void)run
{
    if (self->_curTestIndex != 0)
        return;
    
    self->_client.config.serviceUrl = DEFAULT_SERVICE_URL;   
    self->_client.delegate = nil;
    [self setUp];
    [self startNextTest];
}

- (VidiunBaseEntry*)uploadEntryWithFileName:(NSString*)fileBase withFileExt:(NSString*)fileExt withMediaType:(int)mediaType
{
    NSString* fileName = [NSString stringWithFormat:@"%@.%@", fileBase, fileExt];
    
    // return: object, params: object
    VidiunUploadToken* token = [[[VidiunUploadToken alloc] init] autorelease];
    token.fileName = fileName;
    token = [self->_client.uploadToken addWithUploadToken:token];
    assert(self->_client.error == nil);
    
    // return: object, params: object
    VidiunMediaEntry* entry = [[[VidiunMediaEntry alloc] init] autorelease];
    entry.name = fileName;
    entry.mediaType = mediaType;
    entry = [self->_client.media addWithEntry:entry];
    assert(self->_client.error == nil);
   
    // return: object, params: string, object
    VidiunUploadedFileTokenResource* resource = [[[VidiunUploadedFileTokenResource alloc] init] autorelease];
    resource.token = token.id;
    entry = [self->_client.media addContentWithEntryId:entry.id withResource:resource];
    assert(self->_client.error == nil);
    
    // return: object, params: string, file
    NSString* uploadFilePath = [[NSBundle mainBundle] pathForResource:fileBase ofType:fileExt];
    [self->_client.uploadToken uploadWithUploadTokenId:token.id withFileData:uploadFilePath];
    assert(self->_client.error == nil);
    
    // approve the entry, required when the account has content moderation enabled
    [self->_client.media approveWithEntryId:entry.id];
    assert(self->_client.error == nil);
    
    return entry;
}

- (void)unexpRequestFailed:(VidiunClientBase *)aClient
{
    assert(NO);
}

- (void)unexpRequestFinished:(VidiunClientBase *)aClient withResult:(id)result
{
    assert(NO);
}

- (void)setUp
{
    // -- create an image entry since it's immediately ready
    self->_imageEntry = [[self uploadEntryWithFileName:@"DemoImage" withFileExt:@"jpg" withMediaType:[VidiunMediaType IMAGE]] retain];

    // -- create a video entry
    self->_videoEntry = [[self uploadEntryWithFileName:@"DemoVideo" withFileExt:@"flv" withMediaType:[VidiunMediaType VIDEO]] retain];
    
    VidiunFlavorAsset* firstFlavor = nil;
    for(;;)
    {
        NSArray* flavorArray = [self->_client.flavorAsset getByEntryIdWithEntryId:self->_videoEntry.id];
        assert(self->_client.error == nil);
        assert(flavorArray.count > 0);
        firstFlavor = [flavorArray objectAtIndex:0];
        if (firstFlavor.status == [VidiunFlavorAssetStatus READY])
            break;
        
        [NSThread sleepForTimeInterval:10];     
    }
}

- (void)tearDown
{
    // -- delete the video entry
    [self->_client.media deleteWithEntryId:self->_videoEntry.id];
    assert(self->_client.error == nil);
    [self->_videoEntry release];
    self->_videoEntry = nil;

    // -- delete the image entry
    [self->_client.media deleteWithEntryId:self->_imageEntry.id];
    assert(self->_client.error == nil);
    [self->_imageEntry release];
    self->_imageEntry = nil;
}

///////////////// Sync tests /////////////////

- (void)testSyncFlow
{
    // return: bool, params: N/A
    assert([self->_client.system ping]);
    assert(self->_client.error == nil);
    
    // return: object, params: object
    VidiunUploadToken* token = [[[VidiunUploadToken alloc] init] autorelease];
    token.fileName = UPLOAD_FILENAME;
    token = [self->_client.uploadToken addWithUploadToken:token];
    assert(self->_client.error == nil);
    assert(token.id.length > 0);
    assert([token.fileName compare:UPLOAD_FILENAME] == NSOrderedSame);
    assert(token.status == [VidiunUploadTokenStatus PENDING]);
    assert(token.partnerId == PARTNER_ID);
    assert([token.userId compare:USER_ID] == NSOrderedSame);
    assert(isnan(token.fileSize));
    
    // return: object, params: object
    VidiunMediaEntry* entry = [[[VidiunMediaEntry alloc] init] autorelease];
    entry.name = ENTRY_NAME;
    entry.mediaType = [VidiunMediaType VIDEO];
    entry = [self->_client.media addWithEntry:entry];
    assert(self->_client.error == nil);
    assert(entry.id.length > 0);
    assert([[VidiunEntryStatus NO_CONTENT] compare:entry.status] == NSOrderedSame);
    assert([entry.name compare:ENTRY_NAME] == NSOrderedSame);
    assert(entry.partnerId == PARTNER_ID);
    assert([entry.userId compare:USER_ID] == NSOrderedSame);
    
    // return: object, params: string, object
    VidiunUploadedFileTokenResource* resource = [[[VidiunUploadedFileTokenResource alloc] init] autorelease];
    resource.token = token.id;
    entry = [self->_client.media addContentWithEntryId:entry.id withResource:resource];
    assert(self->_client.error == nil);
    assert([[VidiunEntryStatus IMPORT] compare:entry.status] == NSOrderedSame);
    
    // approve the entry, required when the account has content moderation enabled
    [self->_client.media approveWithEntryId:entry.id];
    assert(self->_client.error == nil);
    
    // return: object, params: string, file
    NSString* uploadFilePath = [[NSBundle mainBundle] pathForResource:@"DemoVideo" ofType:@"flv"];
    token = [self->_client.uploadToken uploadWithUploadTokenId:token.id withFileData:uploadFilePath];
    assert(self->_client.error == nil);
    assert(token.status == [VidiunUploadTokenStatus CLOSED]);
    
    // return: array, params: string
    NSArray* flavorArray = [self->_client.flavorAsset getByEntryIdWithEntryId:entry.id];
    assert(self->_client.error == nil);
    assert(flavorArray.count > 0);
    BOOL foundSource = NO;
    for (VidiunFlavorAsset* asset in flavorArray)
    {
        if (asset.flavorParamsId != 0)
            continue;
        
        assert(asset.isOriginal);
        assert([asset.entryId compare:entry.id] == NSOrderedSame);
        foundSource = YES;
        break;
    }
    assert(foundSource);
    
    // return: int, params: object
    VidiunMediaEntryFilter* mediaFilter = [[[VidiunMediaEntryFilter alloc] init] autorelease];
    mediaFilter.idEqual = entry.id;
    mediaFilter.statusNotEqual = [VidiunEntryStatus DELETED];
    int entryCount = [self->_client.media countWithFilter:mediaFilter];
    assert(self->_client.error == nil);
    assert(entryCount == 1);
    
    // return: void
    [self->_client.media deleteWithEntryId:entry.id];
    assert(self->_client.error == nil);

    [NSThread sleepForTimeInterval:5];          // wait for the status to update
    entryCount = [self->_client.media countWithFilter:mediaFilter];
    assert(self->_client.error == nil);
    assert(entryCount == 0);
    
    // return: object, params: array, int
    VidiunMediaEntryFilterForPlaylist* playlistFilter = [[[VidiunMediaEntryFilterForPlaylist alloc] init] autorelease];
    playlistFilter.idEqual = self->_imageEntry.id;
    NSArray* filterArray = [NSArray arrayWithObject:playlistFilter];
    /*NSArray* playlistExecute = */ [self->_client.playlist executeFromFiltersWithFilters:filterArray withTotalResults:10];
    assert(self->_client.error == nil);
    /* TODO: fix this test
	assert(playlistExecute.count == 1);
    VidiunBaseEntry* firstPlaylistEntry = [playlistExecute objectAtIndex:0];
    assert([firstPlaylistEntry.id compare:self->_imageEntry.id] == NSOrderedSame);*/
    
    // return: file, params: string, int, bool
    NSString *serveUrl = [self->_client.data serveWithEntryId:@"12345" withVersion:5 withForceProxy:YES];
    NSString *encodedVs = (NSString*)CFURLCreateStringByAddingPercentEscapes(
        NULL, 
        (CFStringRef)self->_client.vs, 
        NULL, 
        (CFStringRef)@"!*'();:@&=+$,/?%#[] \"\\<>{}|^~`", 
        vCFStringEncodingUTF8);
    NSString *encodedClientTag = (NSString*)CFURLCreateStringByAddingPercentEscapes(
        NULL, 
        (CFStringRef)self->_client.config.clientTag, 
        NULL, 
        (CFStringRef)@"!*'();:@&=+$,/?%#[] \"\\<>{}|^~`", 
        vCFStringEncodingUTF8);
    NSString* expectedPrefix = [NSString stringWithFormat:@"%@/api_v3/service/data/action/serve?vidsig=", self->_client.config.serviceUrl];
    NSString* expectedPostfix = [NSString stringWithFormat:@"&version=5&partnerId=%d&vs=%@&ignoreNull=1&format=2&forceProxy=1&entryId=12345&clientTag=%@&apiVersion=%@&", PARTNER_ID, encodedVs, encodedClientTag, self->_client.apiVersion];
    [encodedVs release];
    [encodedClientTag release];
    assert([serveUrl hasPrefix:expectedPrefix]);
    assert([serveUrl hasSuffix:expectedPostfix]);
}

- (NSArray*)buildSyncMultiReqFlow
{
    // start the multi request
    [self->_client startMultiRequest];
    
    // return: bool
    [self->_client.system ping];
    
    // return: object, params: object
    VidiunUploadToken* token = [[[VidiunUploadToken alloc] init] autorelease];
    token.fileName = UPLOAD_FILENAME;
    [self->_client.uploadToken addWithUploadToken:token];
    NSString* tokenId = @"{2:result:id}";
    
    // return: object, params: object
    VidiunMediaEntry* entry = [[[VidiunMediaEntry alloc] init] autorelease];
    entry.name = ENTRY_NAME;
    entry.mediaType = [VidiunMediaType VIDEO];
    [self->_client.media addWithEntry:entry];
    NSString* entryId = @"{3:result:id}";
    
    // return: object, params: string, object
    VidiunUploadedFileTokenResource* resource = [[[VidiunUploadedFileTokenResource alloc] init] autorelease];
    resource.token = tokenId;
    [self->_client.media addContentWithEntryId:entryId withResource:resource];
    
    // return: object, params: string, file
    NSString* uploadFilePath = [[NSBundle mainBundle] pathForResource:@"DemoVideo" ofType:@"flv"];
    [self->_client.uploadToken uploadWithUploadTokenId:tokenId withFileData:uploadFilePath];
    
    // return: array, params: string
    [self->_client.flavorAsset getByEntryIdWithEntryId:entryId];
    
    // return: int, params: object
    VidiunMediaEntryFilter* mediaFilter = [[[VidiunMediaEntryFilter alloc] init] autorelease];
    mediaFilter.idEqual = entryId;
    mediaFilter.statusNotEqual = [VidiunEntryStatus DELETED];
    [self->_client.media countWithFilter:mediaFilter];
    
    // return: void
    [self->_client.media deleteWithEntryId:entryId];
    
    // return: object, params: array, int
    VidiunMediaEntryFilterForPlaylist* playlistFilter = [[[VidiunMediaEntryFilterForPlaylist alloc] init] autorelease];
    playlistFilter.idEqual = self->_imageEntry.id;
    NSArray* filterArray = [NSArray arrayWithObject:playlistFilter];
    [self->_client.playlist executeFromFiltersWithFilters:filterArray withTotalResults:10];
    
    // validate the results
    return [self->_client doMultiRequest];
}

- (void)validateSyncMultiReqFlow:(NSArray*)results
{
    // system.ping
    NSString* pingResult = [results objectAtIndex:0];
    assert([pingResult compare:@"1"] == NSOrderedSame);
    
    // uploadToken.add
    VidiunUploadToken* token = [results objectAtIndex:1];
    assert(token.id.length > 0);
    assert([token.fileName compare:UPLOAD_FILENAME] == NSOrderedSame);
    assert(token.status == [VidiunUploadTokenStatus PENDING]);
    assert(token.partnerId == PARTNER_ID);
    assert([token.userId compare:USER_ID] == NSOrderedSame);
    assert(isnan(token.fileSize));
    
    // media.add
    VidiunMediaEntry* entry = [results objectAtIndex:2];
    assert(entry.id.length > 0);
    assert([[VidiunEntryStatus NO_CONTENT] compare:entry.status] == NSOrderedSame);
    assert([entry.name compare:ENTRY_NAME] == NSOrderedSame);
    assert(entry.partnerId == PARTNER_ID);
    assert([entry.userId compare:USER_ID] == NSOrderedSame);
    
    // media.addContent
    entry = [results objectAtIndex:3];
    assert([[VidiunEntryStatus IMPORT] compare:entry.status] == NSOrderedSame);
    
    // uploadToken.upload
    token = [results objectAtIndex:4];
    assert(token.status == [VidiunUploadTokenStatus CLOSED]);
    
    // flavorAsset.getByEntryId
    NSArray* flavorArray = [results objectAtIndex:5];
    assert(flavorArray.count > 0);
    BOOL foundSource = NO;
    for (VidiunFlavorAsset* asset in flavorArray)
    {
        if (asset.flavorParamsId != 0)
            continue;
        
        assert(asset.isOriginal);
        assert([asset.entryId compare:entry.id] == NSOrderedSame);
        foundSource = YES;
        break;
    }
    assert(foundSource);
    
    // media.count
    NSString* entryCount = [results objectAtIndex:6];
    assert([entryCount compare:@"0"] == NSOrderedSame || 
           [entryCount compare:@"1"] == NSOrderedSame);
    
    // playlist.executeWithFilters
    /* TODO: fix this test
	NSArray* playlistExecute = [results objectAtIndex:8];
    assert(playlistExecute.count == 1);
    VidiunBaseEntry* firstPlaylistEntry = [playlistExecute objectAtIndex:0];
    assert([firstPlaylistEntry.id compare:self->_imageEntry.id] == NSOrderedSame);*/
}

- (void)testSyncMultiReqFlow
{
    NSArray* results = [self buildSyncMultiReqFlow];
    
    assert(self->_client.error == nil);

    [self validateSyncMultiReqFlow:results];
}

- (void)testEmptyMultirequest
{
    [self->_client startMultiRequest];
    NSArray* result = [self->_client doMultiRequest];
    assert(result.count == 0);
}

// validates: 
//      vidsig is generated
//      objectType is included for objects
//      serialization of all types
//      serialization of empty/null variables
- (void)testPremadeRequest
{
    // init a client with fixed values
    VidiunConfiguration* config = [[VidiunConfiguration alloc] init];
    VidiunNSLogger* logger = [[VidiunNSLogger alloc] init];
    config.logger = logger;
    config.serviceUrl = DEFAULT_SERVICE_URL;
    config.clientTag = @"testTag";
    [logger release];           // retained on config
    config.partnerId = 56789;
    VidiunClient* client = [[VidiunClient alloc] initWithConfig:config];
    [config release];           // retained on the client
    client.apiVersion = @"9.8.7";
    client.vs = @"abcdef";
    
    // add all basic types
    // Note: not testing float since its formatting may change between platforms
    [client.params addIfDefinedKey:@"bool" withBool:NO];
    [client.params addIfDefinedKey:@"int" withInt:1234];
    [client.params addIfDefinedKey:@"string" withString:@"strVal"];
    
    // object
    VidiunMediaEntry* entry = [[[VidiunMediaEntry alloc] init] autorelease];
    entry.name = @"abcd";
    [client.params addIfDefinedKey:@"object" withObject:entry];
    
    // array
    VidiunString* string = [[[VidiunString alloc] init] autorelease];
    string.value = @"dummy";
    NSArray* array = [NSArray arrayWithObject:string];
    [client.params addIfDefinedKey:@"array" withArray:array];
    
    // null / empty items
    [client.params addIfDefinedKey:@"emptyBool" withBool:VIDIUN_NULL_BOOL];
    [client.params addIfDefinedKey:@"emptyInt" withInt:VIDIUN_NULL_INT];
    [client.params addIfDefinedKey:@"emptyFloat" withFloat:VIDIUN_NULL_FLOAT];
    [client.params addIfDefinedKey:@"emptyString" withString:VIDIUN_NULL_STRING];
    [client.params addIfDefinedKey:@"emptyObject" withObject:VIDIUN_NULL_OBJECT];
    [client.params addIfDefinedKey:@"emptyArray" withArray:[NSArray array]];
    
    // verify
    NSString* result = [client queueServeService:@"test" withAction:@"testAct"];
    NSString* expectedResult = [NSString stringWithFormat:@"%@/api_v3/service/test/action/testAct?vidsig=b2e9bd151b7edf43c2e210e45ffb15fd&string=strVal&partnerId=56789&object%%3AobjectType=VidiunMediaEntry&object%%3Aname=abcd&vs=abcdef&int=1234&ignoreNull=1&format=2&emptyString__null=&emptyObject__null=&emptyInt__null=&emptyFloat__null=&emptyBool__null=&emptyArray%%3A-=&clientTag=testTag&bool=0&array%%3A0%%3Avalue=dummy&array%%3A0%%3AobjectType=VidiunString&apiVersion=9.8.7", DEFAULT_SERVICE_URL];
    assert([result compare:expectedResult] == NSOrderedSame);
    
    // cleanup
    [client release];
}

- (void)testHttps
{
    self->_client.config.serviceUrl = @"https://www.vidiun.com";
    [self testSyncFlow];
}

- (void)testInvalidServerIp
{
    self->_client.config.serviceUrl = @"http://1.1.1.1";
    [self->_client.system ping];
    NSError* error = self->_client.error;
    
    assert(error != nil);
    assert([error.domain compare:NetworkRequestErrorDomain] == NSOrderedSame);
}

- (void)testInvalidServerDnsName
{
    self->_client.config.serviceUrl = @"http://www.nonexistingvidiun.com";
    [self->_client.system ping];
    NSError* error = self->_client.error;
    
    assert(error != nil);
    assert([error.domain compare:NetworkRequestErrorDomain] == NSOrderedSame);
}

- (void)testSendNonExistingFile
{
    [self->_client.uploadToken uploadWithUploadTokenId:@"12345" withFileData:@"NonExistingFile.dat"];
    NSError* error = self->_client.error;

    assert(error != nil);
    assert([error.domain compare:NetworkRequestErrorDomain] == NSOrderedSame);
    assert(error.code == ASIInternalErrorWhileBuildingRequestType);
}

- (void)assertVidiunError:(NSError*)error withCode:(int)code
{
    assert(error != nil);
    assert([error.domain compare:VidiunClientErrorDomain] == NSOrderedSame);
    assert(error.code == code);
}

- (void)testSyncApiError
{
    VidiunBaseEntry* entry = [self->_client.baseEntry getWithEntryId:@"NonExistingEntry"];
    assert(entry == nil);
    [self assertVidiunError:self->_client.error withCode:VidiunClientErrorAPIException];
}

- (void)testSyncMultiReqApiError
{
    [self->_client startMultiRequest];
    [self->_client.system ping];
    [self->_client.baseEntry getWithEntryId:@"NonExistingEntry"];
    [self->_client.system ping];
    NSArray* results = [self->_client doMultiRequest];
    assert(self->_client.error == nil);
    assert(results.count == 3);
    
    NSString* res1 = [results objectAtIndex:0];
    assert([res1 compare:@"1"] == NSOrderedSame);
    
    NSError* res2 = [results objectAtIndex:1];
    [self assertVidiunError:res2 withCode:VidiunClientErrorAPIException];
    
    NSString* res3 = [results objectAtIndex:2];
    assert([res3 compare:@"1"] == NSOrderedSame);
}

- (void)testXmlParsingError
{
    self->_client.config.serviceUrl = VIDIUN_CLIENT_TEST_URL;
    [self->_client.params addIfDefinedKey:@"responseBuffer" withString:@"<xml>"];
    [self->_client.system ping];
    
    [self assertVidiunError:self->_client.error withCode:VidiunClientErrorXmlParsing];
}

- (void)testTagInSimpleType
{
    self->_client.config.serviceUrl = VIDIUN_CLIENT_TEST_URL;
    [self->_client.params addIfDefinedKey:@"responseBuffer" withString:@"<xml><result><sometag></sometag></result></xml>"];
    [self->_client.system ping];
    
    [self assertVidiunError:self->_client.error withCode:VidiunClientErrorStartTagInSimpleType];
}

- (void)testEmptyObjectOrException
{
    self->_client.config.serviceUrl = VIDIUN_CLIENT_TEST_URL;
    [self->_client.params addIfDefinedKey:@"responseBuffer" withString:@"<xml><result></result></xml>"];
    [self->_client.baseEntry getWithEntryId:@"1234"];
    
    [self assertVidiunError:self->_client.error withCode:VidiunClientErrorEmptyObject];
}

- (void)testEmptyObject
{
    self->_client.config.serviceUrl = VIDIUN_CLIENT_TEST_URL;
    [self->_client.params addIfDefinedKey:@"responseBuffer" withString:@"<xml><result><objectType>VidiunPlaylist</objectType><filters><item/></filters></result></xml>"];
    [self->_client.playlist getWithId:@"1234"];
    
    [self assertVidiunError:self->_client.error withCode:VidiunClientErrorMissingObjectTypeTag];
}

- (void)testTagInSimpleObjectProperty
{
    self->_client.config.serviceUrl = VIDIUN_CLIENT_TEST_URL;
    [self->_client.params addIfDefinedKey:@"responseBuffer" withString:@"<xml><result><objectType>VidiunPlaylist</objectType><id><sometag/></id></result></xml>"];
    [self->_client.playlist getWithId:@"1234"];
    
    [self assertVidiunError:self->_client.error withCode:VidiunClientErrorUnexpectedTagInSimpleType];
}

- (void)testTagInObjectDoesntStartWithType
{
    self->_client.config.serviceUrl = VIDIUN_CLIENT_TEST_URL;
    [self->_client.params addIfDefinedKey:@"responseBuffer" withString:@"<xml><result><id>1234</id></result></xml>"];
    [self->_client.playlist getWithId:@"1234"];
    
    [self assertVidiunError:self->_client.error withCode:VidiunClientErrorExpectedObjectTypeTag];
}

- (void)testCharsInsteadOfObject
{
    self->_client.config.serviceUrl = VIDIUN_CLIENT_TEST_URL;
    [self->_client.params addIfDefinedKey:@"responseBuffer" withString:@"<xml><result>1234</result></xml>"];
    [self->_client.playlist getWithId:@"1234"];
    
    [self assertVidiunError:self->_client.error withCode:VidiunClientErrorExpectedPropertyTag];
}

- (void)testUnknownObjectType
{
    self->_client.config.serviceUrl = VIDIUN_CLIENT_TEST_URL;
    [self->_client.params addIfDefinedKey:@"responseBuffer" withString:@"<xml><result><objectType>UnknownObjectType</objectType></result></xml>"];
    [self->_client queueObjectService:@"playlist" withAction:@"get" withExpectedType:@"AnotherUnknownObject"];
    
    [self assertVidiunError:self->_client.error withCode:VidiunClientErrorUnknownObjectType];
}

- (void)testNonVidiunObjectType
{
    self->_client.config.serviceUrl = VIDIUN_CLIENT_TEST_URL;
    [self->_client.params addIfDefinedKey:@"responseBuffer" withString:@"<xml><result><objectType>NSString</objectType></result></xml>"];
    [self->_client.playlist getWithId:@"1234"];
    
    [self assertVidiunError:self->_client.error withCode:VidiunClientErrorUnknownObjectType];
}

- (void)testArrayTagIsNotItem
{
    self->_client.config.serviceUrl = VIDIUN_CLIENT_TEST_URL;
    [self->_client.params addIfDefinedKey:@"responseBuffer" withString:@"<xml><result><sometag/></result></xml>"];
    [self->_client.flavorAsset getByEntryIdWithEntryId:@"1234"];
    
    [self assertVidiunError:self->_client.error withCode:VidiunClientErrorUnexpectedArrayTag];
}

- (void)testMultiReqTagNotItem
{
    self->_client.config.serviceUrl = VIDIUN_CLIENT_TEST_URL;
    [self->_client.params addIfDefinedKey:@"responseBuffer" withString:@"<xml><result><sometag/></result></xml>"];
    [self->_client startMultiRequest];
    [self->_client.system ping];
    [self->_client doMultiRequest];
        
    [self assertVidiunError:self->_client.error withCode:VidiunClientErrorUnexpectedMultiReqTag];
}

- (void)testMultiReqTooManyItems
{
    self->_client.config.serviceUrl = VIDIUN_CLIENT_TEST_URL;
    [self->_client.params addIfDefinedKey:@"responseBuffer" withString:@"<xml><result><item>1</item><item>1</item></result></xml>"];
    [self->_client startMultiRequest];
    [self->_client.system ping];
    [self->_client doMultiRequest];
    
    [self assertVidiunError:self->_client.error withCode:VidiunClientErrorUnexpectedMultiReqTag];
}

- (void)testMultiReqNotEnoughItems
{
    self->_client.config.serviceUrl = VIDIUN_CLIENT_TEST_URL;
    [self->_client.params addIfDefinedKey:@"responseBuffer" withString:@"<xml><result></result></xml>"];
    [self->_client startMultiRequest];
    [self->_client.system ping];
    [self->_client doMultiRequest];
    
    [self assertVidiunError:self->_client.error withCode:VidiunClientErrorMissingMultiReqItems];
}

- (void)testInvalidHttpStatus
{
    self->_client.config.serviceUrl = @"http://www.google.com/nonExistingFolder";
    [self->_client.system ping];
    
    [self assertVidiunError:self->_client.error withCode:VidiunClientErrorInvalidHttpCode];
}

- (void)testDoubleMultiReqStart
{
    [self->_client startMultiRequest];
    @try 
    {
        [self->_client startMultiRequest];
    }
    @catch (VidiunClientException *exception) 
    {
        assert([exception.name compare:@"DoubleStartMultiReq"] == NSOrderedSame);
        [self->_client cancelRequest];
        return;
    }
    
    assert(NO);
}

- (void)testDoMultiReqWithoutStart
{
    @try 
    {
        [self->_client doMultiRequest];
    }
    @catch (VidiunClientException *exception) 
    {
        assert([exception.name compare:@"EndWithoutMultiReq"] == NSOrderedSame);
        [self->_client cancelRequest];
        return;
    }
    
    assert(NO);
}

- (void)testApiTimeout
{
    self->_client.config.requestTimeout = 1;
    self->_client.config.serviceUrl = VIDIUN_CLIENT_TEST_URL;
    [self->_client.params addIfDefinedKey:@"sleepTime" withString:@"10"];
    [self->_client.system ping];    
    self->_client.config.requestTimeout = 120;
    
    NSError* error = self->_client.error;
    assert(error != nil);
    assert([error.domain compare:NetworkRequestErrorDomain] == NSOrderedSame);
    assert(error.code == ASIRequestTimedOutErrorType);
}

#define METADATA_XML (@"<metadata><List1>val1</List1><Text1>some text</Text1></metadata>")

- (void)testUsePlugin
{
    VidiunMetadataClientPlugin* metadata = [[VidiunMetadataClientPlugin alloc] initWithClient:self->_client];
    VidiunMetadataProfile* profile = [[[VidiunMetadataProfile alloc] init] autorelease];
    profile.metadataObjectType = [VidiunMetadataObjectType ENTRY];
    profile.name = @"Test metadata profile";
    NSString* xsdFilePath = [[NSBundle mainBundle] pathForResource:@"MetadataSchema" ofType:@"xsd"];
    NSString* xsdFileData = [[[NSString alloc] initWithContentsOfFile:xsdFilePath encoding:NSUTF8StringEncoding error:nil] autorelease];    
    profile = [metadata.metadataProfile addWithMetadataProfile:profile withXsdData:xsdFileData];
    assert(self->_client.error == nil);

    VidiunMetadata* metadataObj = [metadata.metadata addWithMetadataProfileId:profile.id withObjectType:[VidiunMetadataObjectType ENTRY] withObjectId:self->_imageEntry.id withXmlData:METADATA_XML];
    assert(self->_client.error == nil);
    
    metadataObj = [metadata.metadata getWithId:metadataObj.id];
    assert(self->_client.error == nil);
    assert([metadataObj.xml compare:METADATA_XML] == NSOrderedSame);
    
    [metadata.metadata deleteWithId:metadataObj.id];
    assert(self->_client.error == nil);
    
    [metadata.metadataProfile deleteWithId:profile.id];
    assert(self->_client.error == nil);

    [metadata release];                                         
}

- (void)testOptionalParameters
{
    // int, string
    NSString* vs = [self->_client.session startWithSecret:ADMIN_SECRET withUserId:USER_ID withType:[VidiunSessionType ADMIN] withPartnerId:PARTNER_ID];
    assert(self->_client.error == nil);
    assert(vs.length > 40);     // 40 is the signature length
    
    // bool
    VidiunFlavorAsset* firstFlavor = nil;
    NSArray* flavorArray = [self->_client.flavorAsset getByEntryIdWithEntryId:self->_videoEntry.id];
    firstFlavor = [flavorArray objectAtIndex:0];
    NSString* downloadUrl = [self->_client.flavorAsset getDownloadUrlWithId:firstFlavor.id];
    assert(self->_client.error == nil);
    assert(downloadUrl.length > 0);

    // object
    VidiunMediaEntryFilter* mediaFilter = [[[VidiunMediaEntryFilter alloc] init] autorelease];
    mediaFilter.statusNotEqual = [VidiunEntryStatus DELETED];
    VidiunMediaListResponse* listResult = [self->_client.media listWithFilter:mediaFilter];
    assert(self->_client.error == nil);
    assert(listResult.totalCount > 0);
    
    // array
    int convertJobId = [self->_client.media convertWithEntryId:self->_videoEntry.id];
    assert(self->_client.error == nil);
    assert(convertJobId != 0);
}

///////////////// Async tests /////////////////

- (void)testAsyncCancel
{
    for (int i = 0; i < 3; i++)
    {
        [self->_client startMultiRequest];
        [self->_client cancelRequest];
        
        [self->_client.system ping];
        [self->_client cancelRequest];
    }
    
    [self startNextTest];
}

- (void)callback_testAsyncApiError_RequestFailed:(VidiunClientBase *)aClient
{
    [self assertVidiunError:aClient.error withCode:VidiunClientErrorAPIException];
    
    [self startNextTest];
}

- (void)testAsyncApiError
{
    [self->_client.media getWithEntryId:@"NonExistingEntry"];
}

- (void)callback_testAsyncInvalidServerDnsName_RequestFailed:(VidiunClientBase *)aClient
{
    assert([aClient.error.domain compare:NetworkRequestErrorDomain] == NSOrderedSame);
    
    [self startNextTest];
}

- (void)testAsyncInvalidServerDnsName
{
    self->_client.config.serviceUrl = @"http://www.nonexistingvidiun.com";
    [self->_client.system ping];
}

- (void)callback_testAsyncXmlParsingError_RequestFailed:(VidiunClientBase *)aClient
{
    [self assertVidiunError:self->_client.error withCode:VidiunClientErrorXmlParsing];
    
    [self startNextTest];
}

- (void)testAsyncXmlParsingError
{
    self->_client.config.serviceUrl = VIDIUN_CLIENT_TEST_URL;
    [self->_client.params addIfDefinedKey:@"responseBuffer" withString:@"<xml>"];
    [self->_client.system ping];
}

- (void)callback_testAsyncMultiReqFlow_RequestFinished:(VidiunClientBase *)aClient withResult:(id)aResult
{
    assert(self->_client.error == nil);
    [self validateSyncMultiReqFlow:aResult];
    
    [self startNextTest];
}

- (void)testAsyncMultiReqFlow
{
    [self buildSyncMultiReqFlow];
}

- (void)callback_testAsyncInvalidHttpStatus_RequestFailed:(VidiunClientBase *)aClient
{
    [self assertVidiunError:self->_client.error withCode:VidiunClientErrorInvalidHttpCode];

    [self startNextTest];
}

- (void)testAsyncInvalidHttpStatus
{
    self->_client.config.serviceUrl = @"http://www.google.com/nonExistingFolder";
    [self->_client.system ping];
}

- (void)callback_testAsyncMultiReqXmlParsingError_RequestFailed:(VidiunClientBase *)aClient
{
    [self assertVidiunError:self->_client.error withCode:VidiunClientErrorXmlParsing];
    
    [self startNextTest];
}

- (void)testAsyncMultiReqXmlParsingError
{
    self->_client.config.serviceUrl = VIDIUN_CLIENT_TEST_URL;
    [self->_client.params addIfDefinedKey:@"responseBuffer" withString:@"<xml>"];
    [self->_client startMultiRequest];
    [self->_client.system ping];
    [self->_client doMultiRequest];
}

- (void)callback_testAsyncMultiReqApiError_RequestFinished:(VidiunClientBase *)aClient withResult:(id)aResults
{
    NSArray* results = aResults;
    assert(self->_client.error == nil);
    assert(results.count == 3);
    
    NSString* res1 = [results objectAtIndex:0];
    assert([res1 compare:@"1"] == NSOrderedSame);
    
    NSError* res2 = [results objectAtIndex:1];
    [self assertVidiunError:res2 withCode:VidiunClientErrorAPIException];
    
    NSString* res3 = [results objectAtIndex:2];
    assert([res3 compare:@"1"] == NSOrderedSame);
    
    [self startNextTest];
}

- (void)testAsyncMultiReqApiError
{
    [self->_client startMultiRequest];
    [self->_client.system ping];
    [self->_client.baseEntry getWithEntryId:@"NonExistingEntry"];
    [self->_client.system ping];
    [self->_client doMultiRequest];
}

- (void)callback_testAsyncEmptyMultirequest_RequestFinished:(VidiunClientBase *)aClient withResult:(id)aResults
{
    NSArray* results = aResults;
    assert(self->_client.error == nil);
    assert(results.count == 0);
    
    [self startNextTest];
}

- (void)testAsyncEmptyMultirequest
{
    [self->_client startMultiRequest];
    [self->_client doMultiRequest];
}

- (void)callback_testAsyncBoolType_RequestFinished:(VidiunClientBase *)aClient withResult:(id)aResults
{
    NSString* result = aResults;
    assert([result compare:@"1"] == NSOrderedSame);    
    
    [self startNextTest];
}

- (void)testAsyncBoolType
{
    [self->_client.system ping];
}

- (void)callback_testAsyncIntType_RequestFinished:(VidiunClientBase *)aClient withResult:(id)aResults
{
    NSString* result = aResults;
    assert(self->_client.error == nil);
    assert([result compare:@"1"] == NSOrderedSame);    
    
    [self startNextTest];
}

- (void)testAsyncIntType
{
    VidiunMediaEntryFilter* mediaFilter = [[[VidiunMediaEntryFilter alloc] init] autorelease];
    mediaFilter.idEqual = self->_imageEntry.id;
    mediaFilter.statusNotEqual = [VidiunEntryStatus DELETED];
    [self->_client.media countWithFilter:mediaFilter];
}

- (void)callback_testAsyncStringType_RequestFinished:(VidiunClientBase *)aClient withResult:(id)aResults
{
    NSString* result = aResults;
    assert(self->_client.error == nil);
    assert(result.length > 40);     // 40 is the signature length

    [self startNextTest];
}

- (void)testAsyncStringType
{
    [self->_client.session startWithSecret:ADMIN_SECRET withUserId:USER_ID withType:[VidiunSessionType ADMIN] withPartnerId:PARTNER_ID];
}

- (void)callback_testAsyncObjectType_RequestFinished:(VidiunClientBase *)aClient withResult:(id)aResults
{
    VidiunBaseEntry* result = aResults;
    assert(self->_client.error == nil);
    assert([result.id compare:self->_imageEntry.id] == NSOrderedSame);
    
    [self startNextTest];
}

- (void)testAsyncObjectType
{
    [self->_client.baseEntry getWithEntryId:self->_imageEntry.id];
}

- (void)callback_testAsyncArrayType_RequestFinished:(VidiunClientBase *)aClient withResult:(id)aResults
{
    NSArray* flavorArray = aResults;
    assert(self->_client.error == nil);
    assert(flavorArray.count > 0);
    BOOL foundSource = NO;
    for (VidiunFlavorAsset* asset in flavorArray)
    {
        if (asset.flavorParamsId != 0)
            continue;
        
        assert(asset.isOriginal);
        assert([asset.entryId compare:self->_videoEntry.id] == NSOrderedSame);
        foundSource = YES;
        break;
    }
    assert(foundSource);
    
    [self startNextTest];
}

- (void)testAsyncArrayType
{
    [self->_client.flavorAsset getByEntryIdWithEntryId:self->_videoEntry.id];
}

- (void)callback_testAsyncVoidType_RequestFinished:(VidiunClientBase *)aClient withResult:(id)aResults
{
    NSString* result = aResults;
    assert(self->_client.error == nil);
    assert(result.length == 0);

    self->_client.vs = [VidiunClient generateSessionWithSecret:ADMIN_SECRET withUserId:USER_ID withType:[VidiunSessionType ADMIN] withPartnerId:PARTNER_ID withExpiry:86400 withPrivileges:@""];

    [self startNextTest];
}

- (void)testAsyncVoidType
{
    [self->_client.session end];
}

- (void)testUnknownObjectReturned
{
    self->_client.config.serviceUrl = VIDIUN_CLIENT_TEST_URL;
    [self->_client.params addIfDefinedKey:@"responseBuffer" withString:@"<xml><result><objectType>UnknownObjectType</objectType><id>abcdef</id></result></xml>"];
    VidiunBaseEntry* result = [self->_client.baseEntry getWithEntryId:self->_imageEntry.id];
    assert(self->_client.error == nil);
    assert([result isKindOfClass:[VidiunBaseEntry class]]);
    assert([result.id compare:@"abcdef"] == NSOrderedSame);
}

- (void)testUnknownArrayObjectReturned
{
    self->_client.config.serviceUrl = VIDIUN_CLIENT_TEST_URL;
    [self->_client.params addIfDefinedKey:@"responseBuffer" withString:@"<xml><result><item><objectType>UnknownObjectType</objectType><id>abcdef</id></item></result></xml>"];
    NSArray* result = [self->_client.flavorAsset getByEntryIdWithEntryId:self->_videoEntry.id];
    assert(self->_client.error == nil);
    assert(result.count == 1);
    VidiunFlavorAsset* asset = [result objectAtIndex:0];
    assert([asset isKindOfClass:[VidiunFlavorAsset class]]);
    assert([asset.id compare:@"abcdef"] == NSOrderedSame);
}

- (void)testUnknownNestedObjectObjectReturned
{
    self->_client.config.serviceUrl = VIDIUN_CLIENT_TEST_URL;
    [self->_client.params addIfDefinedKey:@"responseBuffer" withString:@"<xml><result><objectType>VidiunConversionProfile</objectType><cropDimensions><objectType>UnknownObjectType</objectType><left>1234</left></cropDimensions></result></xml>"];
    VidiunConversionProfile* result = [self->_client.conversionProfile getWithId:1];
    assert(self->_client.error == nil);
    VidiunCropDimensions* dimensions = result.cropDimensions;
    assert([dimensions isKindOfClass:[VidiunCropDimensions class]]);
    assert(dimensions.left == 1234);
}

- (void)testUnknownNestedArrayObjectReturned
{
    self->_client.config.serviceUrl = VIDIUN_CLIENT_TEST_URL;
    [self->_client.params addIfDefinedKey:@"responseBuffer" withString:@"<xml><result><objectType>VidiunBaseEntryListResponse</objectType><objects><item><objectType>UnknownObjectType</objectType><id>abcdef</id></item></objects></result></xml>"];
    VidiunBaseEntryListResponse* result = [self->_client.baseEntry list];
    assert(self->_client.error == nil);
    assert(result.objects.count == 1);
    VidiunBaseEntry* entry = [result.objects objectAtIndex:0];
    assert([entry isKindOfClass:[VidiunBaseEntry class]]);
    assert([entry.id compare:@"abcdef"] == NSOrderedSame);
}

- (void)testDownloadDelegateSanity
{
    VidiunProgressDelegate* delegate = [[[VidiunProgressDelegate alloc] init] autorelease];
    self->_client.downloadProgressDelegate = delegate;
    [self->_client.baseEntry getWithEntryId:self->_imageEntry.id];
    self->_client.downloadProgressDelegate = nil;
    
    assert(delegate.receiveBytesCalled);
}

- (void)testUploadDelegateSanity
{
    VidiunProgressDelegate* delegate = [[[VidiunProgressDelegate alloc] init] autorelease];
    self->_client.uploadProgressDelegate = delegate;
    [self->_client.baseEntry getWithEntryId:self->_imageEntry.id];
    self->_client.uploadProgressDelegate = nil;
    
    assert(delegate.sendBytesCalled);
}

@end
