//
//  MoviesViewController_iPad.h
//  Vidiun
//
//  Created by Pavel on 14.03.12.
//  Copyright (c) 2012 Vidiun. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <MessageUI/MessageUI.h>
#import <MessageUI/MFMailComposeViewController.h>
#import <VIDIUNPlayerSDK/VPViewController.h>

extern const CGRect PlayeriPadCGRect;

@interface MoviesViewController_iPad : UIViewController <UINavigationControllerDelegate, MFMailComposeViewControllerDelegate> {
    
    NSMutableArray *media;
    
    IBOutlet UITableView *mediaTableView;
    
    IBOutlet UILabel *labelTitle;
    VidiunCategory *category;
    
    IBOutlet UITableView *categoriesTableView;
    IBOutlet UIView *categoriesView;
    
    IBOutlet UIActivityIndicatorView *activity;
   
    IBOutlet UITextField *searchText;
    IBOutlet UILabel *searchLabel;
    
    IBOutlet UILabel *labelCategories;
    IBOutlet UIButton *buttonCategories;
    
    BOOL mostPopular;
    int currentCategoryInd;
    
    int currentMovieInd;
    
    IBOutlet UIView *viewInfo;
    
    BOOL isLandscape;
    
    IBOutlet VidiunThumbView *imgInfoThumb;
    
    IBOutlet UILabel *labelInfoTitle;
    IBOutlet UILabel *labelInfoDuration;
    
    IBOutlet UITextView *textInfoDescription;
    VPViewController* playerViewController;
    
}

- (IBAction)menuBarButtonPressed:(UIButton *)button;
- (void)updateMedia:(NSString *)searchStr;
- (IBAction)categoriesButtonPressed:(UIButton *)button;
- (IBAction)closeInfoButtonPressed:(UIButton *)button;
- (IBAction)playInfoButtonPressed:(UIButton *)button;
- (IBAction)shareButtonPressed:(UIButton *)button;

// Supporting PlayerSDK
- (void)stopAndRemovePlayer;
- (void)toggleFullscreen:(NSNotification *)note;

@property (nonatomic, retain) NSMutableArray *media;
@property (nonatomic, retain) VidiunCategory *category;
@property BOOL mostPopular;
@property (retain, nonatomic) IBOutlet UIView *entryInfoView;

@end
