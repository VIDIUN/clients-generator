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
/*
 Forward declarations
 */
@class VidiunLibXmlWrapper;
@class VidiunXmlParserBase;
@class VidiunObjectBase;
@class VidiunException;

/*
 Protocol VidiunXmlParserDelegate
 */
@protocol VidiunLibXmlWrapperDelegate <NSObject>

@optional

- (void)parser:(VidiunLibXmlWrapper *)aParser didStartElement:(NSString *)aElementName;
- (void)parser:(VidiunLibXmlWrapper *)aParser didEndElement:(NSString *)aElementName;
- (void)parser:(VidiunLibXmlWrapper *)aParser foundCharacters:(NSString *)aString;
- (void)parser:(VidiunLibXmlWrapper *)aParser parseErrorOccurred:(NSError *)aParseError;

@end

/*
 Class VidiunLibXmlWrapper
 */
@interface VidiunLibXmlWrapper : NSObject
{
    struct _xmlParserCtxt* _xmlCtx;
    NSMutableString* _foundChars;
}

@property (nonatomic, assign) id<VidiunLibXmlWrapperDelegate> delegate;

- (void)processData:(NSData*)aData;
- (void)noMoreData;

@end

/*
 Protocol VidiunXmlParserDelegate
 */
@protocol VidiunXmlParserDelegate <NSObject>

- (void)parsingFinished:(VidiunXmlParserBase*)aParser;
- (void)parsingFailed:(VidiunXmlParserBase*)aParser;

@end

/*
 Class VidiunXmlParserBase
 */
@interface VidiunXmlParserBase : NSObject <VidiunLibXmlWrapperDelegate>
{
    id <VidiunLibXmlWrapperDelegate> _origDelegate;
    BOOL _attached;
}

@property (nonatomic, retain) VidiunLibXmlWrapper* parser;
@property (nonatomic, assign) id <VidiunXmlParserDelegate> delegate;
@property (nonatomic, retain) NSError* error;

- (void)attachToParser:(VidiunLibXmlWrapper*)aParser withDelegate:(id <VidiunXmlParserDelegate>)aDelegate;
- (void)detach;
- (void)callDelegateAndDetach;
- (void)parsingFailed:(VidiunXmlParserBase*)aParser;
- (id)result;

@end

/*
 Class VidiunXmlParserSkipTag
 */
@interface VidiunXmlParserSkipTag : VidiunXmlParserBase
{
    int _level;
}
@end

/*
 Class VidiunXmlParserSimpleType
 */
@interface VidiunXmlParserSimpleType : VidiunXmlParserBase
{
    NSString* _value;
}
@end

/*
 Class VidiunXmlParserException
 */
@interface VidiunXmlParserException : VidiunXmlParserBase <VidiunXmlParserDelegate>
{
    VidiunXmlParserBase* _subParser;
    VidiunXmlParserBase* _excObjParser;
    VidiunException* _targetException;
}

- (id)initWithSubParser:(VidiunXmlParserBase*)aSubParser;

@end

/*
 Class VidiunXmlParserObject
 */
@interface VidiunXmlParserObject : VidiunXmlParserBase <VidiunXmlParserDelegate>
{
    VidiunXmlParserBase* _subParser;
    VidiunObjectBase* _targetObj;
    NSString* _expectedType;
    NSString* _lastTagCapitalized;
    BOOL _lastIsObjectType;
    int _lastPropType;     // VidiunFieldType
}

- (id)initWithObject:(VidiunObjectBase*)aObject;
- (id)initWithExpectedType:(NSString*)aExpectedType;

@end

/*
 Class VidiunXmlParserArray
 */
@interface VidiunXmlParserArray : VidiunXmlParserBase <VidiunXmlParserDelegate>
{
    VidiunXmlParserBase* _subParser;
    NSString* _expectedType;
    NSMutableArray* _targetArr;
}

- (id)initWithExpectedType:(NSString*)aExpectedType;

@end

/*
 Class VidiunXmlParserMultirequest
 */
@interface VidiunXmlParserMultirequest : VidiunXmlParserBase <VidiunXmlParserDelegate>
{
    NSMutableArray* _subParsers;
    int _reqIndex;
}

- (void)addSubParser:(VidiunXmlParserBase*)aParser;
- (int)reqCount;

@end

/*
 Class VidiunXmlParserSkipPath
 */
@interface VidiunXmlParserSkipPath : VidiunXmlParserBase <VidiunXmlParserDelegate>
{
    VidiunXmlParserBase* _subParser;
    NSArray* _path;
    int _pathPosition;
    int _skipLevel;
}

- (id)initWithSubParser:(VidiunXmlParserBase*)aSubParser withPath:(NSArray*)aPath;

@end
