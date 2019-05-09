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
#import "VidiunXmlParsers.h"
#import "VidiunClientBase.h"
#import <libxml/parser.h>

@interface VidiunLibXmlWrapper()

- (void)startElement:(const xmlChar *)aName;
- (void)endElement:(const xmlChar *)aName;
- (void)characters:(const xmlChar *)aChars withLength:(int)aLen;
- (void)error:(const char *)aFormat withArgs:(va_list)aArgs;

@end

/*
 Libxml callbacks
 */
static void saxCallbackStartElement (void *ctx,
                                     const xmlChar *name,
                                     const xmlChar **atts);

static void saxCallbackEndElement (void *ctx,
                                   const xmlChar *name);

static void saxCallbackCharacters (void *ctx,
                                   const xmlChar *ch,
                                   int len);

static void XMLCDECL saxCallbackError (void *ctx,
                                       const char *msg, ...);

static void saxCallbackStartElement (void *ctx,
                                     const xmlChar *name,
                                     const xmlChar **atts)
{
    [(VidiunLibXmlWrapper*)ctx startElement:name];
}

static void saxCallbackEndElement (void *ctx,
                                   const xmlChar *name)
{
    [(VidiunLibXmlWrapper*)ctx endElement:name];
}

static void saxCallbackCharacters (void *ctx,
                                   const xmlChar *ch,
                                   int len)
{
    [(VidiunLibXmlWrapper*)ctx characters:ch withLength:len];
}

static void XMLCDECL saxCallbackError (void *ctx,
                                       const char *msg, ...)
{
    va_list vaArgs;
    va_start(vaArgs, msg);
    [(VidiunLibXmlWrapper*)ctx error:msg withArgs:vaArgs];
    va_end(vaArgs);
}

/*
 Class VidiunLibXmlWrapper
 */
@implementation VidiunLibXmlWrapper

@synthesize delegate = _delegate;

- (id)init
{
    self = [super init];
    if (self == nil)
        return nil;
    
    xmlSAXHandler tSaxHandler;
    
    memset(&tSaxHandler, 0, sizeof(tSaxHandler));
    tSaxHandler.startElement = &saxCallbackStartElement;
    tSaxHandler.endElement = &saxCallbackEndElement;
    tSaxHandler.characters = &saxCallbackCharacters;
    tSaxHandler.error = &saxCallbackError;
    tSaxHandler.initialized = XML_SAX2_MAGIC;
    
    self->_xmlCtx = xmlCreatePushParserCtxt(&tSaxHandler, self, NULL, 0, NULL);
        
    return self;
}

- (void)dealloc
{
    [self->_foundChars release];
    xmlFreeParserCtxt(self->_xmlCtx);
    [super dealloc];
}

- (void)processData:(NSData*)aData
{
    [self retain];      // make sure we don't release _xmlCtx from within xmlParseChunk
    xmlParseChunk(self->_xmlCtx, aData.bytes, (int)aData.length, 0);
    [self release];
}

- (void)noMoreData
{
    [self retain];      // make sure we don't release _xmlCtx from within xmlParseChunk
    xmlParseChunk(self->_xmlCtx, NULL, 0, 1);
    [self release];
}

- (void)flushChars
{
    if (self->_foundChars == nil)
        return;
    
    if ([self.delegate respondsToSelector:@selector(parser:foundCharacters:)])
    {
        [self.delegate parser:self foundCharacters:self->_foundChars];
    }
    [self->_foundChars release];
    self->_foundChars = nil;
}

- (void)startElement:(const xmlChar *)aName
{
    [self flushChars];
    
    if (![self.delegate respondsToSelector:@selector(parser:didStartElement:)])
        return;
    
    NSString* elem = [[NSString alloc] initWithUTF8String:(const char*)aName];
    
    [self.delegate parser:self didStartElement:elem];
    
    [elem release];
}

- (void)endElement:(const xmlChar *)aName
{
    [self flushChars];
    
    if (![self.delegate respondsToSelector:@selector(parser:didEndElement:)])
        return;
    
    NSString* elem = [[NSString alloc] initWithUTF8String:(const char*)aName];
    
    [self.delegate parser:self didEndElement:elem];
    
    [elem release];
}

- (void)characters:(const xmlChar *)aChars withLength:(int)aLen
{
    NSMutableString* chars = [[NSMutableString alloc] initWithBytes:aChars length:aLen encoding:NSUTF8StringEncoding];
    
    if (self->_foundChars != nil)
    {
        [self->_foundChars appendString:chars];
        [chars release];
    }
    else
    {
        self->_foundChars = chars;
    }
}

- (void)error:(const char *)aFormat withArgs:(va_list)aArgs
{
    [self flushChars];
    
    if (![self.delegate respondsToSelector:@selector(parser:parseErrorOccurred:)])
        return;
    
    xmlErrorPtr xmlError = xmlCtxtGetLastError(self->_xmlCtx);

    NSString *message = [NSString stringWithUTF8String:xmlError->message];
    NSNumber *libXmlDomain = [NSNumber numberWithInt:xmlError->domain];
    NSNumber *libXmlCode = [NSNumber numberWithInt:xmlError->code];
    NSError *nsError = [NSError errorWithDomain:VidiunClientErrorDomain code:VidiunClientErrorXmlParsing userInfo:[NSDictionary dictionaryWithObjectsAndKeys:message, NSLocalizedDescriptionKey, libXmlDomain, @"LibXmlDomain", libXmlCode, @"LibXmlCode", nil]]; 
    
    [self.delegate parser:self parseErrorOccurred:nsError];
}

@end

/*
 Class VidiunXmlParserBase
 */
@implementation VidiunXmlParserBase

@synthesize parser = _parser;
@synthesize delegate = _delegate;
@synthesize error = _error;

- (void)dealloc 
{
    [self detach];
    [self->_error release];
    [super dealloc];
}

- (void)attachToParser:(VidiunLibXmlWrapper*)aParser withDelegate:(id <VidiunXmlParserDelegate>)aDelegate
{
    if (self->_attached)
    {
        @throw [VidiunClientException exceptionWithName:@"ParserAlreadyAttached" reason:@"VidiunXmlParserBase already attached to LibXmlWrapper" userInfo:nil];
    }
    
    self.parser = aParser;
    self.delegate = aDelegate;
    
    self->_origDelegate = self.parser.delegate;
    self.parser.delegate = self;
    self->_attached = YES;
}

- (void)detach
{
    if (self->_attached) 
    {
        self->_attached = NO;
        self.parser.delegate = self->_origDelegate;
        self->_origDelegate = nil;
        self.parser = nil;
        self.delegate = nil;
    }
}

- (void)callDelegateAndDetach
{
    id<VidiunXmlParserDelegate> delegate = self.delegate;
    [self detach];
    [delegate parsingFinished:self];
}

- (void)parser:(VidiunLibXmlWrapper *)aParser parseErrorOccurred:(NSError *)aError
{
    self.error = aError;
    [self.delegate parsingFailed:self];
}

- (void)parsingFailed:(VidiunXmlParserBase*)aParser
{
    self.error = [aParser error];
    [self.delegate parsingFailed:self];
}

- (id)result
{
    return nil;
}

@end

/*
 Class VidiunXmlParserSkipTag
 */
@implementation VidiunXmlParserSkipTag

- (id)init
{
    self = [super init];
    if (self == nil)
        return nil;
    
    self->_level = 1;

    return self;
}

- (void)parser:(VidiunLibXmlWrapper *)aParser didStartElement:(NSString *)aElementName
{
    self->_level++;
}

- (void)parser:(VidiunLibXmlWrapper *)aParser didEndElement:(NSString *)aElementName
{
    self->_level--;
    if (self->_level > 0)
        return;
    
    [self callDelegateAndDetach];
}

@end

/*
 Class VidiunXmlParserSimpleType
 */
@implementation VidiunXmlParserSimpleType

- (void)dealloc
{
    [self->_value release];
    [super dealloc];
}

- (void)parser:(VidiunLibXmlWrapper *)aParser didStartElement:(NSString *)aElementName
{
    self.error = [NSError errorWithDomain:VidiunClientErrorDomain code:VidiunClientErrorStartTagInSimpleType userInfo:[NSDictionary dictionaryWithObjectsAndKeys:@"Got a start tag while parsing a simple type element", NSLocalizedDescriptionKey, aElementName, @"ElementName", nil]];
    [self.delegate parsingFailed:self];
}

- (void)parser:(VidiunLibXmlWrapper *)aParser didEndElement:(NSString *)aElementName
{
    [self callDelegateAndDetach];
}

- (void)parser:(VidiunLibXmlWrapper *)aParser foundCharacters:(NSString *)aString
{
    self->_value = [aString copy];
}

- (id)result
{
    if (self->_value == nil)
        return @"";
        
    return self->_value;
}

@end

/*
 Class VidiunXmlParserException
 */
@implementation VidiunXmlParserException

- (id)initWithSubParser:(VidiunXmlParserBase*)aSubParser
{
    self = [super init];
    if (self == nil)
        return nil;

    self->_subParser = [aSubParser retain];
    
    return self;
}

- (void)dealloc
{
	self->_excObjParser.delegate = nil;
    [self->_excObjParser release];
    [self->_targetException release];
	self->_subParser.delegate = nil;
    [self->_subParser release];
    [super dealloc];
}

- (void)parser:(VidiunLibXmlWrapper *)aParser didStartElement:(NSString *)aElementName
{
    if ([aElementName compare:@"error"] == NSOrderedSame)
    {
        self->_targetException = [[VidiunException alloc] init];
        self->_excObjParser = [[VidiunXmlParserObject alloc] initWithObject:self->_targetException];
        [self->_excObjParser attachToParser:self.parser withDelegate:self];
    }
    else
    {
        [self->_subParser attachToParser:self.parser withDelegate:self];
        [self->_subParser parser:aParser didStartElement:aElementName];
    }
}

- (void)parser:(VidiunLibXmlWrapper *)aParser didEndElement:(NSString *)aElementName
{
    if (self->_targetException == nil && self->_subParser.result == nil)
    {
        self.error = [NSError errorWithDomain:VidiunClientErrorDomain code:VidiunClientErrorEmptyObject userInfo:[NSDictionary dictionaryWithObjectsAndKeys:@"Got an empty object element", NSLocalizedDescriptionKey, nil]];        
        [self.delegate parsingFailed:self];
        return;
    }
    [self callDelegateAndDetach];
}

- (void)parser:(VidiunLibXmlWrapper *)aParser foundCharacters:(NSString *)aString
{
    [self->_subParser attachToParser:self.parser withDelegate:self];
    [self->_subParser parser:aParser foundCharacters:aString];
}

- (void)parsingFinished:(VidiunXmlParserBase*)aParser
{
    if (self->_targetException != nil)
        return;         // consume the error end tag before calling the delegate
    
    [self callDelegateAndDetach];
}

- (id)result
{
    if (self->_targetException != nil)
    {
        return [self->_targetException error];
    }
    else
    {
        return self->_subParser.result;
    }
}

@end

/*
 Class VidiunXmlParserObject
 */
@implementation VidiunXmlParserObject

- (id)initWithObject:(VidiunObjectBase*)aObject
{
    self = [super init];
    if (self == nil)
        return nil;

    self->_targetObj = [aObject retain];

    return self;
}

- (id)initWithExpectedType:(NSString*)aExpectedType
{
    self = [super init];
    if (self == nil)
        return nil;

    self->_expectedType = [aExpectedType copy];

    return self;
}

- (void)dealloc
{
	self->_subParser.delegate = nil;
    [self->_subParser release];
    [self->_lastTagCapitalized release];
    [self->_targetObj release];
	[self->_expectedType release];
    [super dealloc];
}

- (void)setObjectPropertyWithValue:(id)aValue isSimple:(BOOL)aIsSimple
{
    NSString* postfix = @"";
    if (aIsSimple)
        postfix = @"FromString";
    NSMutableString* selName = [[NSMutableString alloc] initWithFormat:@"set%@%@:", self->_lastTagCapitalized, postfix];
    SEL sel = NSSelectorFromString(selName);
    [selName release];
    
    if (![self->_targetObj respondsToSelector:sel])
    {
        // shouldn't happen since the property was already validated by getTypeOfProperty
        @throw [VidiunClientException exceptionWithName:@"MissingObjectSetter" reason:@"Object does not respond to setter" userInfo:[NSDictionary dictionaryWithObjectsAndKeys:self->_lastTagCapitalized, @"TagName", nil]];
    }
    [self->_targetObj performSelector:sel withObject:aValue];
}

- (void)parser:(VidiunLibXmlWrapper *)aParser didStartElement:(NSString *)aElementName
{
    if (self->_lastTagCapitalized != nil || self->_lastIsObjectType)
    {
        self.error = [NSError errorWithDomain:VidiunClientErrorDomain code:VidiunClientErrorUnexpectedTagInSimpleType userInfo:[NSDictionary dictionaryWithObjectsAndKeys:@"Got a start tag while parsing simple type", NSLocalizedDescriptionKey, aElementName, @"ElementName", nil]];
        [self.delegate parsingFailed:self];
        return;
    }
    
    if (self->_targetObj == nil && [aElementName compare:@"objectType"] == NSOrderedSame)
    {
        self->_lastIsObjectType = YES;
        return;
    }
    
    if (self->_targetObj == nil)
    {
        self.error = [NSError errorWithDomain:VidiunClientErrorDomain code:VidiunClientErrorExpectedObjectTypeTag userInfo:[NSDictionary dictionaryWithObjectsAndKeys:@"Object didn't start with an objectType tag", NSLocalizedDescriptionKey, aElementName, @"ElementName", nil]];
        [self.delegate parsingFailed:self];        
        return;
    }
    
    self->_lastTagCapitalized = [[NSMutableString alloc] initWithFormat:@"%@%@", 
                         [[aElementName substringToIndex:1] uppercaseString],
                         [aElementName substringFromIndex:1]];

    NSString* getPropType = [[NSMutableString alloc] initWithFormat:@"getTypeOf%@", self->_lastTagCapitalized];
    SEL getPropTypeSel = NSSelectorFromString(getPropType);
    [getPropType release];
    
    self->_lastPropType = VFT_Invalid;
    if ([self->_targetObj respondsToSelector:getPropTypeSel])
    {
        self->_lastPropType = (VidiunFieldType)[self->_targetObj performSelector:getPropTypeSel];
    }
    
	NSString* expectedObjectType = nil;
	if (self->_lastPropType == VFT_Object || self->_lastPropType == VFT_Array)
	{
		NSString* getObjectType = [[NSMutableString alloc] initWithFormat:@"getObjectTypeOf%@", self->_lastTagCapitalized];
		SEL getObjectTypeSel = NSSelectorFromString(getObjectType);
		[getObjectType release];
	
		expectedObjectType = [self->_targetObj performSelector:getObjectTypeSel];
	}
	
    switch (self->_lastPropType)
    {
		case VFT_Dictionary:		// TODO: implement support for dictionary parsing
        case VFT_Invalid:
            self->_subParser = [[VidiunXmlParserSkipTag alloc] init];
            break;
            
        case VFT_Object:
            self->_subParser = [[VidiunXmlParserObject alloc] initWithExpectedType:expectedObjectType];
            break;
            
        case VFT_Array:
            self->_subParser = [[VidiunXmlParserArray alloc] initWithExpectedType:expectedObjectType];
            break;
            
        default:        // simple types are handled by foundChars
            return;
    }

    [self->_subParser attachToParser:self.parser withDelegate:self];
}

- (void)parser:(VidiunLibXmlWrapper *)aParser didEndElement:(NSString *)aElementName
{
    if (self->_lastTagCapitalized != nil || self->_lastIsObjectType)
    {
        [self->_lastTagCapitalized release];
        self->_lastTagCapitalized = nil;
        self->_lastPropType = VFT_Invalid;
        self->_lastIsObjectType = NO;
        return;
    }

    if (self->_targetObj == nil)
    {
        self.error = [NSError errorWithDomain:VidiunClientErrorDomain code:VidiunClientErrorMissingObjectTypeTag userInfo:[NSDictionary dictionaryWithObjectsAndKeys:@"Missing objectType tag", NSLocalizedDescriptionKey, nil]];
        [self.delegate parsingFailed:self];
        return;
    }
    
    [self callDelegateAndDetach];
}

- (void)parser:(VidiunLibXmlWrapper *)aParser foundCharacters:(NSString *)aString
{
    if (self->_lastIsObjectType)
    {
        self->_targetObj = [VidiunObjectFactory createByName:aString withDefaultType:self->_expectedType];
        if (self->_targetObj == nil)
        {
            self.error = [NSError errorWithDomain:VidiunClientErrorDomain code:VidiunClientErrorUnknownObjectType userInfo:[NSDictionary dictionaryWithObjectsAndKeys:@"Unknown object type", NSLocalizedDescriptionKey, aString, @"ObjectType", nil]];
            [self.delegate parsingFailed:self];
        }

        return;
    }

    switch (self->_lastPropType)
    {
        case VFT_Int:
        case VFT_Bool:
        case VFT_Float:
            [self setObjectPropertyWithValue:aString isSimple:YES];
            break;
            
        case VFT_String:
            [self setObjectPropertyWithValue:aString isSimple:NO];
            break;
            
        default:
            self.error = [NSError errorWithDomain:VidiunClientErrorDomain code:VidiunClientErrorExpectedPropertyTag userInfo:[NSDictionary dictionaryWithObjectsAndKeys:@"Missing object property tag", NSLocalizedDescriptionKey, nil]];
            [self.delegate parsingFailed:self];
            break;
    }
}

- (void)parsingFinished:(VidiunXmlParserBase*)aParser
{
    id parseResult = [self->_subParser result];
    if (parseResult != nil)
    {
        [self setObjectPropertyWithValue:parseResult isSimple:NO];
    }
    [self->_subParser release];
    self->_subParser = nil;
    [self->_lastTagCapitalized release];
    self->_lastTagCapitalized = nil;
    self->_lastIsObjectType = NO;
    self->_lastPropType = VFT_Invalid;
}

- (id)result
{
    return self->_targetObj;
}

@end

/*
 Class VidiunXmlParserArray
 */
@implementation VidiunXmlParserArray

- (id)initWithExpectedType:(NSString*)aExpectedType
{
    self = [super init];
    if (self == nil)
        return nil;

    self->_targetArr = [[NSMutableArray alloc] init];
    self->_expectedType = [aExpectedType copy];

    return self;
}

- (void)dealloc
{
	self->_subParser.delegate = nil;
    [self->_subParser release];
    [self->_targetArr release];
	[self->_expectedType release];
    [super dealloc];
}

- (id)result
{
    return self->_targetArr;
}

- (void)parser:(VidiunLibXmlWrapper *)aParser didStartElement:(NSString *)aElementName
{
    if ([aElementName compare:@"item"] != NSOrderedSame)
    {
        self.error = [NSError errorWithDomain:VidiunClientErrorDomain code:VidiunClientErrorUnexpectedArrayTag userInfo:[NSDictionary dictionaryWithObjectsAndKeys:@"Got unexpected tag while parsing array", NSLocalizedDescriptionKey, aElementName, @"TagName", nil]];
        [self.delegate parsingFailed:self];
        return;
    }
    
    self->_subParser = [[VidiunXmlParserObject alloc] initWithExpectedType:self->_expectedType];
    [self->_subParser attachToParser:self.parser withDelegate:self];
}

- (void)parser:(VidiunLibXmlWrapper *)aParser didEndElement:(NSString *)aElementName
{
    [self callDelegateAndDetach];
}

- (void)parsingFinished:(VidiunXmlParserBase*)aParser
{
    id parseResult = [self->_subParser result];
    [self->_targetArr addObject:parseResult];
    [self->_subParser release];
    self->_subParser = nil;
}

@end

/*
 Class VidiunXmlParserMultirequest
 */
@implementation VidiunXmlParserMultirequest

- (id)init
{
    self = [super init];
    if (self == nil)
        return nil;

    self->_subParsers = [[NSMutableArray alloc] init];
    
    return self;
}

- (void)dealloc
{
    [self->_subParsers release];
    [super dealloc];
}

- (void)addSubParser:(VidiunXmlParserBase*)aParser
{
    [self->_subParsers addObject:aParser];
}

- (int)reqCount
{
    return (int)self->_subParsers.count;
}

- (void)parser:(VidiunLibXmlWrapper *)aParser didStartElement:(NSString *)aElementName
{
    if ([aElementName compare:@"item"] != NSOrderedSame ||
        self->_reqIndex >= self->_subParsers.count)
    {
        self.error = [NSError errorWithDomain:VidiunClientErrorDomain code:VidiunClientErrorUnexpectedMultiReqTag userInfo:[NSDictionary dictionaryWithObjectsAndKeys:@"Got unexpected tag while parsing multirequest", NSLocalizedDescriptionKey, aElementName, @"TagName", nil]];         
        [self.delegate parsingFailed:self];
        return;
    }
    
    VidiunXmlParserBase* curParser = [self->_subParsers objectAtIndex:self->_reqIndex];
    [curParser attachToParser:self.parser withDelegate:self];
}

- (void)parser:(VidiunLibXmlWrapper *)aParser didEndElement:(NSString *)aElementName
{
    if (self->_reqIndex < self->_subParsers.count)
    {
        NSNumber* receivedNum = [NSNumber numberWithInt:(int)self->_reqIndex];
        NSNumber* expectedNum = [NSNumber numberWithInt:(int)self->_subParsers.count];
        self.error = [NSError errorWithDomain:VidiunClientErrorDomain code:VidiunClientErrorMissingMultiReqItems userInfo:[NSDictionary dictionaryWithObjectsAndKeys:@"Didn't get enough multi request items in the response", NSLocalizedDescriptionKey, receivedNum, @"ReceivedNum", expectedNum, @"ExpectedNum", nil]];         
        [self.delegate parsingFailed:self];
        return;
    }
    
    [self callDelegateAndDetach];
}

- (void)parsingFinished:(VidiunXmlParserBase*)aParser
{
    self->_reqIndex++;
}

- (id)result
{
    NSMutableArray* result = [[NSMutableArray alloc] init];
    
    for (VidiunXmlParserBase* curParser in self->_subParsers)
    {
        [result addObject:curParser.result];
    }
    
    [result autorelease];
    
    return result;
}

@end

/*
 Class VidiunXmlParserSkipPath
 */
@implementation VidiunXmlParserSkipPath

- (id)initWithSubParser:(VidiunXmlParserBase*)aSubParser withPath:(NSArray*)aPath
{
    self = [super init];
    if (self == nil)
        return nil;
    
    self->_subParser = [aSubParser retain];
    self->_path = [aPath retain];
    
    return self;
}

- (void)dealloc
{
    [self->_path release];
	self->_subParser.delegate = nil;
    [self->_subParser release];
    [super dealloc];
}

- (void)parser:(VidiunLibXmlWrapper *)aParser didStartElement:(NSString *)aElementName
{
    NSString* expectedElem = (NSString*)[self->_path objectAtIndex:self->_pathPosition];
    if (self->_skipLevel == 0 && [expectedElem compare:aElementName] == NSOrderedSame)
    {
        self->_pathPosition++;
        if (self->_pathPosition >= self->_path.count)
        {
            [self->_subParser attachToParser:self.parser withDelegate:self];
        }
    }
    else
    {
        self->_skipLevel++;
    }
}

- (void)parser:(VidiunLibXmlWrapper *)aParser didEndElement:(NSString *)aElementName
{
    if (self->_skipLevel > 0)
    {
        self->_skipLevel--;
        return;
    }
    
    self->_pathPosition--;
    if (self->_pathPosition <= 0)
    {
        [self callDelegateAndDetach];
    }
}

- (void)parsingFinished:(VidiunXmlParserBase*)aParser
{
    self->_pathPosition--;
}

@end

