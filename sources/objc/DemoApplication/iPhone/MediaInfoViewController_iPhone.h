//
//  MediaInfoViewController_iPhone.h
//  Vidiun
//
//  Created by Pavel on 29.02.12.
//  Copyright (c) 2012 Vidiun. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <MediaPlayer/MediaPlayer.h>
#import <MessageUI/MessageUI.h>
#import <MessageUI/MFMailComposeViewController.h>
#import <VIDIUNPlayerSDK/VPViewController.h>

@class AppDelegate_iPhone;

extern const CGRect PlayerCGRect;

@interface MediaInfoViewController_iPhone : UIViewController <MFMailComposeViewControllerDelegate, UINavigationControllerDelegate> {
    
    AppDelegate_iPhone *app;
    
    VidiunMediaEntry *mediaEntry;
    
    IBOutlet UIScrollView *scrollMain;
    
    IBOutlet UIView *viewIntro;
    IBOutlet UIView *viewDescription;

    IBOutlet VidiunThumbView *imgThumb;
    IBOutlet UILabel *labelTitle;

    IBOutlet UILabel *labelVTitle;
    IBOutlet UILabel *labelVDuration;

    IBOutlet UILabel *textDescription;
    
    IBOutlet UIButton *buttonPlay;
    IBOutlet UIButton *buttonCategory;
    
    IBOutlet UIView *viewShare;
    
    NSString *categoryName;

    VPViewController* playerViewController;
        
}

- (IBAction)menuBarButtonPressed:(UIButton *)button;
- (IBAction)categoryBarButtonPressed:(UIButton *)button;
- (IBAction)playButtonPressed;
- (IBAction)shareButtonPressed:(UIButton *)button;

// Supporting PlayerSDK 
- (void)stopAndRemovePlayer;
- (void)toggleFullscreen:(NSNotification *)note;

@property (nonatomic, retain) VidiunMediaEntry *mediaEntry;
@property (nonatomic, retain) NSString *categoryName;

@end
