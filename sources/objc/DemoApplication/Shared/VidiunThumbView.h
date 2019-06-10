//
//  VidiunThumbView.h
//  Vidiun
//
//  Created by Pavel on 02.04.12.
//  Copyright (c) 2012 Vidiun. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface VidiunThumbView : UIImageView {
    
    VidiunMediaEntry *mediaEntry;
    
    int width;
    int height;
    
    BOOL isLoading;
    ASIHTTPRequest *request;
}

- (void)updateWithMediaEntry:(VidiunMediaEntry *)_mediaEntry;
- (void)updateWithMediaEntry:(VidiunMediaEntry *)_mediaEntry withSize:(CGSize)size;

@property (nonatomic, assign) VidiunMediaEntry *mediaEntry;

@end
