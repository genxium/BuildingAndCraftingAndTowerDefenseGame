#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <GameKit/GameKit.h>
#import "DarwinDevice.hpp"

NS_ASSUME_NONNULL_BEGIN

@interface DarwinDeviceOC : NSObject
- (bool) obtainUuid:(void *) aParameter;
@end

NS_ASSUME_NONNULL_END
