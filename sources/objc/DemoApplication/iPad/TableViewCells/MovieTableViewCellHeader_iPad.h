//
//  MovieTableViewCellHeader_iPad.h
//  Vidiun
//
//  Created by Pavel on 14.03.12.
//  Copyright (c) 2012 Vidiun. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface MovieTableViewCellHeader_iPad : UITableViewCell {
    
    IBOutlet UIView *cell1View;
    IBOutlet VidiunThumbView *cell1Image;
    IBOutlet UILabel *cell1Label1;
    IBOutlet UILabel *cell1Label2;
    
    IBOutlet UIView *cell2View;
    IBOutlet VidiunThumbView *cell2Image;
    IBOutlet UILabel *cell2Label1;
    IBOutlet UILabel *cell2Label2;
    
    IBOutlet UIView *cell3View;
    IBOutlet VidiunThumbView *cell3Image;
    IBOutlet UILabel *cell3Label1;
    IBOutlet UILabel *cell3Label2;
    
    int index;
    
    UIViewController *parentController;

}

- (void)updateCell1:(VidiunMediaEntry *)mediaEntry;
- (void)updateCell2:(VidiunMediaEntry *)mediaEntry;
- (void)updateCell3:(VidiunMediaEntry *)mediaEntry;

- (IBAction)selectCellView:(UIButton *)button;
- (IBAction)playButtonPressed:(UIButton *)button;

@property (nonatomic, retain) IBOutlet UIView *cell1View;
@property (nonatomic, retain) IBOutlet UIView *cell2View;
@property (nonatomic, retain) IBOutlet UIView *cell3View;
@property int index;
@property (nonatomic, retain) UIViewController *parentController;

@end
