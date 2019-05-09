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
#import <Foundation/Foundation.h>
#import "ASIHTTPRequestDelegate.h"
#import "ASIProgressDelegate.h"
#import "VidiunXmlParsers.h"

/*
 Constants
 */
#define VIDIUN_UNDEF_BOOL      ([VidiunBool UNDEF_VALUE])
#define VIDIUN_UNDEF_INT       INT_MIN
#define VIDIUN_UNDEF_FLOAT     NAN
#define VIDIUN_UNDEF_STRING    (nil)
#define VIDIUN_UNDEF_OBJECT    (nil)

#define VIDIUN_NULL_BOOL   ([VidiunBool NULL_VALUE])
#define VIDIUN_NULL_INT    INT_MAX
#define VIDIUN_NULL_FLOAT  INFINITY
#define VIDIUN_NULL_STRING (@"__null_string__")
#define VIDIUN_NULL_OBJECT ([[[VidiunObjectBase alloc] init] autorelease])

extern NSString* const VidiunClientErrorDomain;

typedef int VIDIUN_BOOL;

typedef enum {
    VidiunClientErrorAPIException = 1,
    VidiunClientErrorInvalidHttpCode = 2,
    VidiunClientErrorUnknownObjectType = 3,
    VidiunClientErrorXmlParsing = 4,
    VidiunClientErrorUnexpectedTagInSimpleType = 5,
    VidiunClientErrorUnexpectedArrayTag = 6,
    VidiunClientErrorUnexpectedMultiReqTag = 7,
    VidiunClientErrorMissingMultiReqItems = 8,
    VidiunClientErrorMissingObjectTypeTag = 9,
    VidiunClientErrorExpectedObjectTypeTag = 10,
    VidiunClientErrorExpectedPropertyTag = 11,
    VidiunClientErrorStartTagInSimpleType = 12,
    VidiunClientErrorEmptyObject = 13,
} VidiunClientErrorType;

typedef enum 
{
    VFT_Invalid,
    VFT_Bool,
    VFT_Int,
    VFT_Float,
    VFT_String,
    VFT_Object,
    VFT_Array,
	VFT_Dictionary,
} VidiunFieldType;

/*
 Forward declarations
 */
@protocol VidiunXmlParserDelegate;
@class ASIFormDataRequest;
@class VidiunXmlParserBase;
@class VidiunLibXmlWrapper;
@class VidiunParams;
@class VidiunClientBase;

/*
 Class VidiunBool
 */
@interface VidiunBool : NSObject
+ (VIDIUN_BOOL)NO_VALUE;
+ (VIDIUN_BOOL)YES_VALUE;
+ (VIDIUN_BOOL)NULL_VALUE;
+ (VIDIUN_BOOL)UNDEF_VALUE;
@end

/*
 Class VidiunClientException
 */
@interface VidiunClientException : NSException
@end

/*
 Class VidiunSimpleTypeParser
 */
@interface VidiunSimpleTypeParser : NSObject

+ (VIDIUN_BOOL)parseBool:(NSString*)aStr;
+ (int)parseInt:(NSString*)aStr;
+ (double)parseFloat:(NSString*)aStr;

@end

/*
 Class VidiunObjectBase
 */
@interface VidiunObjectBase : NSObject

- (void)toParams:(VidiunParams*)aParams isSuper:(BOOL)aIsSuper;

@end

/*
 Class VidiunException
 */
@interface VidiunException : VidiunObjectBase

@property (nonatomic, copy) NSString* code;
@property (nonatomic, copy) NSString* message;

- (NSError*)error;

@end

/*
 Class VidiunObjectFactory
 */
@interface VidiunObjectFactory : NSObject

+ (VidiunObjectBase*)createByName:(NSString*)aName withDefaultType:(NSString*)aDefaultType;

@end

/*
 Class VidiunParams
 */
@interface VidiunParams : NSObject
{
    NSMutableArray* _params;
    NSMutableArray* _files;
    NSMutableString* _prefix;
}

- (void)setPrefix:(NSString*)aPrefix;
- (NSString*)get:(NSString*)aKey;
- (void)putKey:(NSString*)aKey withString:(NSString*)aVal;
- (void)putNullKey:(NSString*)aKey;
- (void)addIfDefinedKey:(NSString*)aKey withFileName:(NSString*)aFileName;
- (void)addIfDefinedKey:(NSString*)aKey withBool:(VIDIUN_BOOL)aVal;
- (void)addIfDefinedKey:(NSString*)aKey withInt:(int)aVal;
- (void)addIfDefinedKey:(NSString*)aKey withFloat:(double)aVal;
- (void)addIfDefinedKey:(NSString*)aKey withString:(NSString*)aVal;
- (void)addIfDefinedKey:(NSString*)aKey withObject:(VidiunObjectBase*)aVal;
- (void)addIfDefinedKey:(NSString*)aKey withArray:(NSArray*)aVal;
- (void)addIfDefinedKey:(NSString*)aKey withDictionary:(NSDictionary*)aVal;
- (void)sign;
- (void)addToRequest:(ASIFormDataRequest*)aRequest;
- (void)appendQueryString:(NSMutableString*)output;

@end

/*
 Protocol VidiunLogger
 */
@protocol VidiunLogger <NSObject>

- (void)logMessage:(NSString*)aMsg;

@end

/*
 Class VidiunNSLogger
 */
@interface VidiunNSLogger: NSObject <VidiunLogger>

@end

/*
 Class VidiunServiceBase
 */
@interface VidiunServiceBase : NSObject

@property (nonatomic, assign) VidiunClientBase* client;

- (id)initWithClient:(VidiunClientBase*)aClient;

@end

/*
 Class VidiunClientPlugin
 */
@interface VidiunClientPlugin : NSObject
@end

/*
 Class VidiunConfiguration
 */
@interface VidiunConfiguration : NSObject

@property (nonatomic, copy) NSString* serviceUrl;
@property (nonatomic, copy) NSString* clientTag;
@property (nonatomic, assign) int partnerId;
@property (nonatomic, assign) int requestTimeout;
@property (nonatomic, retain) id<VidiunLogger> logger;
@property (nonatomic, copy) NSDictionary* requestHeaders;

@end

/*
 Protocol VidiunClientDelegate
 */
@protocol VidiunClientDelegate

- (void)requestFinished:(VidiunClientBase*)aClient withResult:(id)result;
- (void)requestFailed:(VidiunClientBase*)aClient;

@end

/*
 Class VidiunClientBase
 */
@interface VidiunClientBase : NSObject <ASIHTTPRequestDelegate, VidiunXmlParserDelegate>
{
    BOOL _isMultiRequest;
    VidiunXmlParserBase* _reqParser;
    VidiunXmlParserBase* _skipParser;
    ASIFormDataRequest *_request;
    VidiunLibXmlWrapper* _xmlParser;
    NSDate* _apiStartTime;
}

@property (nonatomic, retain) VidiunConfiguration* config;
@property (nonatomic, retain) NSError* error;
@property (nonatomic, assign) id<VidiunClientDelegate> delegate;
@property (nonatomic, assign) id<ASIProgressDelegate> uploadProgressDelegate;
@property (nonatomic, assign) id<ASIProgressDelegate> downloadProgressDelegate;
@property (nonatomic, copy) NSString* vs;
@property (nonatomic, copy) NSString* apiVersion;
@property (nonatomic, readonly) VidiunParams* params;
@property (nonatomic, readonly) NSDictionary* responseHeaders;

    // public messages
- (id)initWithConfig:(VidiunConfiguration*)aConfig;
- (void)startMultiRequest;
- (NSArray*)doMultiRequest;
- (void)cancelRequest;
+ (NSString*)generateSessionWithSecret:(NSString*)aSecret withUserId:(NSString*)aUserId withType:(int)aType withPartnerId:(int)aPartnerId withExpiry:(int)aExpiry withPrivileges:(NSString*)aPrivileges;

    // messages for use of auto-gen service code
- (NSString*)queueServeService:(NSString*)aService withAction:(NSString*)aAction;
- (void)queueVoidService:(NSString*)aService withAction:(NSString*)aAction;
- (VIDIUN_BOOL)queueBoolService:(NSString*)aService withAction:(NSString*)aAction;
- (int)queueIntService:(NSString*)aService withAction:(NSString*)aAction;
- (double)queueFloatService:(NSString*)aService withAction:(NSString*)aAction;
- (NSString*)queueStringService:(NSString*)aService withAction:(NSString*)aAction;
- (id)queueObjectService:(NSString*)aService withAction:(NSString*)aAction withExpectedType:(NSString*)aExpectedType;
- (NSMutableArray*)queueArrayService:(NSString*)aService withAction:(NSString*)aAction withExpectedType:(NSString*)aExpectedType;

@end
