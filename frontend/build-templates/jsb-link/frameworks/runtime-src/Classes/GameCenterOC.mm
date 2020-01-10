#import "GameCenterOC.h"
#import "AppController.h"
#import "RootViewController.h"

@implementation GameCenterOC

int const SHOULD_RESTART_APP_OR_ENABLE_GAME_CENTER_EXTERNALLY_IN_SYSTEM_SETTINGS = 7778;
int const GAME_CENTER_IDENTITY_NOT_GENERATED = 7779;

+ (GameCenterOC*)sharedInstance
{
    static GameCenterOC *sharedInstance;
    
    @synchronized(self)
    {
        if (!sharedInstance) {
            sharedInstance = [[GameCenterOC alloc] init];
        }
        return sharedInstance;
    }
}

bool CuisineMaster::GameCenter::authenticate(void* aParameter) {
    return [[GameCenterOC sharedInstance] initLocalPlayer:aParameter];
}

- (bool) actuallyGenerateIdentityAfterAuthenticated
{
    [[GKLocalPlayer localPlayer] generateIdentityVerificationSignatureWithCompletionHandler:^(NSURL * _Nullable publicKeyUrl, NSData * _Nullable signature, NSData * _Nullable salt, uint64_t timestamp, NSError * _Nullable error) {
        
        if (nil == error) {
            char const * const playerIdStr = [[[GKLocalPlayer localPlayer] playerID] UTF8String];
            char const * const publicKeyUrlStr = [publicKeyUrl.absoluteString UTF8String];
            char const * const signatureB64Str = [[signature base64EncodedStringWithOptions: NSDataBase64Encoding64CharacterLineLength] UTF8String];
            char const * const saltB64Str = [[salt base64EncodedStringWithOptions: NSDataBase64Encoding64CharacterLineLength] UTF8String];
            // NSLog(@"playerId: %s\npublicKeyUrl: %s\nsignature(b64encoded): %s\nsalt(b64encoded): %s\ntimestamp: %llu\n", playerIdStr, publicKeyUrlStr, signatureB64Str, saltB64Str, timestamp);
            
            CuisineMaster::GameCenter::onIdentityObtained(playerIdStr, publicKeyUrlStr, signatureB64Str, saltB64Str, timestamp, error);
        } else {
            CuisineMaster::GameCenter::onIdentityNotObtained(GAME_CENTER_IDENTITY_NOT_GENERATED);
        }
    }];
    
    return true;
}

- (bool) initLocalPlayer:(void *) aParameter
{
    // Reference https://developer.apple.com/documentation/gamekit/gklocalplayer/1515399-authenticatehandler?language=objc.
    if (nil == [GKLocalPlayer localPlayer].authenticateHandler) {
        [GKLocalPlayer localPlayer].authenticateHandler = ^(UIViewController *viewController, NSError *error) {
            if (viewController != nil)
            {
                NSLog(@"GameCenter is not yet turned on. Go to iPhone `Settings->Game Center` to turn it on!");
                UIApplication* theSharedApp = [UIApplication sharedApplication];
                AppController* theCcAppController = (AppController*)[theSharedApp delegate];
                RootViewController* theRootVc = [theCcAppController viewController];
                [theRootVc presentViewController: viewController animated:true completion:nil]; CuisineMaster::GameCenter::onIdentityNotObtained(SHOULD_RESTART_APP_OR_ENABLE_GAME_CENTER_EXTERNALLY_IN_SYSTEM_SETTINGS);
                
            } else if ([GKLocalPlayer localPlayer].authenticated)
            {
                [self actuallyGenerateIdentityAfterAuthenticated];
            } else {
                if ([GKLocalPlayer localPlayer].authenticated)
                {
                    [self actuallyGenerateIdentityAfterAuthenticated];
                } else {
                    if (nil != error) {
                        switch (error.code) {
                            case GKErrorGameUnrecognized:
                                NSLog(@"You have not enabled Game Center for your app in App Store Connect.");
                                break;
                            case GKErrorNotSupported:
                                NSLog(@"The device your game is running on does not support Game Center. You should disable all Game Center related features.");
                                break;
                            case GKErrorCancelled:                        
                                CuisineMaster::GameCenter::onIdentityNotObtained(SHOULD_RESTART_APP_OR_ENABLE_GAME_CENTER_EXTERNALLY_IN_SYSTEM_SETTINGS);
                                break;
                            default:
                                break;
                        }
                    } else {
                        CuisineMaster::GameCenter::onIdentityNotObtained(SHOULD_RESTART_APP_OR_ENABLE_GAME_CENTER_EXTERNALLY_IN_SYSTEM_SETTINGS);
                    }
                }
            }
        };
    } else {
        NSLog(@"authenticateHandler is null when second time call the initLocalPlayer");
        [self actuallyGenerateIdentityAfterAuthenticated];
    }
    
    return true;
}
@end
