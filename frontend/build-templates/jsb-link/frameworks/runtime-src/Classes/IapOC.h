#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <GameKit/GameKit.h>
#import "GameCenter.hpp"

NS_ASSUME_NONNULL_BEGIN

@interface IapOC<SKProductsRequestDelegate, SKPaymentTransactionObserver> : NSObject
+ (IapOC*)sharedInstance;
- (bool) queryIapSkuList:(void*) aParameter;
- (bool) queryUnfinishedTransactions:(void*) aParameter;
- (bool) purchaseIapSku:(char const * const) productIdentifier;
- (bool) finishTransaction:(char const * const) transactionIdentifier;
@end

NS_ASSUME_NONNULL_END
