#import "DarwinDeviceOC.h"
#import "UIKit/UIDevice.h"

@implementation DarwinDeviceOC

+ (DarwinDeviceOC*)sharedInstance
{
    static DarwinDeviceOC *sharedInstance;
    
    @synchronized(self)
    {
        if (!sharedInstance) {
            sharedInstance = [[DarwinDeviceOC alloc] init];
        }
        return sharedInstance;
    }
}

bool CuisineMaster::DarwinDevice::queryDarwinDeviceUuid(void* aParameter) {
  NSLog(@"queryDarwinDeviceUuid called");
  return [[DarwinDeviceOC sharedInstance] obtainUuid:aParameter];
}

- (bool) obtainUuid:(void *) aParameter
{
     UIDevice *currentDevice = [UIDevice currentDevice];
     char const * const uuid = [[[currentDevice identifierForVendor] UUIDString] UTF8String];
    NSLog(@"obtainUuid call the onDarwinDeviceUuidObtained");
    NSLog(@"uuid: %s", uuid);
    CuisineMaster::DarwinDevice::onDarwinDeviceUuidObtained(uuid);
    return true;
}
@end
