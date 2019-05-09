//
//  Utils.h
//  Vidiun
//
//  Created by Pavel on 22.03.12.
//  Copyright (c) 2012 Vidiun. All rights reserved.
//

#import <Foundation/Foundation.h>

#define CHUNK_SIZE  1048576

@interface Utils : NSObject

+ (NSString *)getTimeStr:(int)time;
+ (NSString *)getStrBitrate:(id)bitrate;
+ (NSString *)getDocPath:(NSString *)fileName;

+ (void)deleteBufferFile;
+ (void)createBuffer:(NSString *)path offset:(long long)offset;


@end
