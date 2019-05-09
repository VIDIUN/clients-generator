//
//  MovieCategoryTableViewCell_iPad.h
//  Vidiun
//
//  Created by Pavel on 14.03.12.
//  Copyright (c) 2012 Vidiun. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface MovieCategoryTableViewCell_iPad : UITableViewCell {
    
    IBOutlet UIView *viewSelected;
    IBOutlet UILabel *labelCategory;
    
}

@property (nonatomic, retain) IBOutlet UIView *viewSelected;
@property (nonatomic, retain) IBOutlet UILabel *labelCategory;

@end
