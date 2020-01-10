#import "Iap.hpp"
#import "IapOC.h"
#import <StoreKit/StoreKit.h>
#include "jsb_helper.hpp"

@interface IapOC() <SKProductsRequestDelegate, SKPaymentTransactionObserver>

@property NSMutableDictionary<NSString*, SKProduct*> *products;
@property NSMutableDictionary<NSString*, SKPaymentTransaction*> *unfinishedTransactions;
@property SKProductsRequest* productsReq;

@end

@implementation IapOC

+ (IapOC*)sharedInstance
{
    static IapOC *sharedInstance;
    
    @synchronized(self)
    {
        if (!sharedInstance) {
            sharedInstance = [[IapOC alloc] init];
        }
        return sharedInstance;
    }
}

bool CuisineMaster::Iap::initSKPaymentObserver() {
    NSLog(@"initSKPaymentObserver.");
    [[SKPaymentQueue defaultQueue] addTransactionObserver: [IapOC sharedInstance]];
    return true;
}

bool CuisineMaster::Iap::queryIapUnfinishedTransactions(void* aParameter) {
    return [[IapOC sharedInstance] queryUnfinishedTransactions:aParameter];
}

- (bool) queryUnfinishedTransactions:(void *)aParameter
{
    if (nil == self.unfinishedTransactions) {
        self.unfinishedTransactions = [[NSMutableDictionary alloc] init];
    }
    
    NSArray<SKPaymentTransaction *> *unfinishedTransactions = [[SKPaymentQueue defaultQueue] transactions];
    se::HandleObject transactionsToBePassedIntoJsRuntime(se::Object::createArrayObject([unfinishedTransactions count]));
    uint32_t index = 0;
    for (SKPaymentTransaction *trx in unfinishedTransactions) {
        if (NULL == trx.transactionIdentifier || nil == trx.transactionIdentifier) continue;
        
        if (SKPaymentTransactionStatePurchasing == trx.transactionState) continue;
        self.unfinishedTransactions[trx.transactionIdentifier] = trx;
        
        // The memory occupied by the following object should be released when used.
        se::HandleObject singleTrxToBePassedIntoJsRuntime(se::Object::createPlainObject());
        singleTrxToBePassedIntoJsRuntime->setProperty("transactionIdentifier", se::Value([trx.transactionIdentifier UTF8String]));
        singleTrxToBePassedIntoJsRuntime->setProperty("transactionState", se::Value((long)trx.transactionState));
        singleTrxToBePassedIntoJsRuntime->setProperty("productIdentifier", se::Value([trx.payment.productIdentifier UTF8String]));
        
        transactionsToBePassedIntoJsRuntime->setArrayElement(index, se::Value(singleTrxToBePassedIntoJsRuntime));
        ++index;
    }
    
    se::HandleObject trxObjToBPassedIntoJsRuntime(se::Object::createPlainObject());
    trxObjToBPassedIntoJsRuntime->setProperty("UnfinishedTransactions", se::Value(transactionsToBePassedIntoJsRuntime));
    CuisineMaster::Iap::onIapUnfinishedTransactionsObtained(trxObjToBPassedIntoJsRuntime);
    
    return true;
}


bool CuisineMaster::Iap::queryIapSkuList(void* aParameter) {
    return [[IapOC sharedInstance] queryIapSkuList:aParameter];
}

- (bool) queryIapSkuList:(void*) aParameter
{
    /* Hardcoded temporarily. */
    NSArray *productIdentifiers = @[@"LittleDiamondPackage", @"MediumDiamondPackage", @"LargeDiamondPackage", @"HugeDiamondPackage", @"TremendousDiamondPackage"];
    
    SKProductsRequest *productsRequest = [[SKProductsRequest alloc]
                                          initWithProductIdentifiers:[NSSet setWithArray:productIdentifiers]];
    
    // Keep a strong reference to the request.
    self.productsReq = productsRequest;
    productsRequest.delegate = self;
    [productsRequest start];
    
    return true;
}

- (void)productsRequest:(nonnull SKProductsRequest *)request didReceiveResponse:(nonnull SKProductsResponse *)response {
    self.products = [[NSMutableDictionary alloc] init];
    
    se::HandleObject productsToBePassedIntoJsRuntime(se::Object::createArrayObject([response.products count]));
    
    NSLog(@"There're %lu SKProducts in the response.", (unsigned long)response.products.count);
    uint32_t index = 0;
    for (SKProduct *product in response.products) {
        NSNumberFormatter *currencyFormatter = [[NSNumberFormatter alloc] init];
        [currencyFormatter setNumberStyle:NSNumberFormatterCurrencyStyle];
        [currencyFormatter setLocale:product.priceLocale];
        
        NSString *currencyString = [currencyFormatter internationalCurrencySymbol]; // EUR, GBP, USD...
        NSString *format = [currencyFormatter positiveFormat];
        format = [format stringByReplacingOccurrencesOfString:@"¤" withString:currencyString];
        // ¤ is a placeholder for the currency symbol
        [currencyFormatter setPositiveFormat:format];
        
        NSString *formattedCurrency = [currencyFormatter stringFromNumber:product.price];
        
        NSLog(@"product.id == %@, product.title == %@, product.price.floatValue == %.2f. Localized price is %@.\n", product.productIdentifier, product.localizedTitle, product.price.floatValue, formattedCurrency);
        
        
        self.products[product.productIdentifier] = product;

        // The memory occupied by the following object should be released when used.
        se::HandleObject singleProductToBePassedIntoJsRuntime(se::Object::createPlainObject());
        singleProductToBePassedIntoJsRuntime->setProperty("productIdentifier", se::Value([product.productIdentifier UTF8String]));
        singleProductToBePassedIntoJsRuntime->setProperty("title", se::Value([product.localizedTitle UTF8String]));
        singleProductToBePassedIntoJsRuntime->setProperty("price", se::Value(product.price.floatValue));
        singleProductToBePassedIntoJsRuntime->setProperty("localizedPrice", se::Value([formattedCurrency UTF8String]));

        productsToBePassedIntoJsRuntime->setArrayElement(index, se::Value(singleProductToBePassedIntoJsRuntime));
        ++index;
    }
    
    CuisineMaster::Iap::onIapSkuListObtained(productsToBePassedIntoJsRuntime);
}

bool CuisineMaster::Iap::purchaseIapSku(char const * const productIdentifier) {
    return [[IapOC sharedInstance] purchaseIapSku:productIdentifier];
}

- (bool) purchaseIapSku:(char const * const) productIdentifier {
    if (!self.products) return false;
    SKProduct* targetProduct = self.products[[NSString stringWithUTF8String:productIdentifier]];
    if (nil == targetProduct) return false;
    SKPayment* payment = [SKPayment paymentWithProduct:targetProduct];
    [[SKPaymentQueue defaultQueue] addPayment:payment];
    return true;
}

bool CuisineMaster::Iap::finishTransaction(char const * const transactionIdentifier) {
    return [[IapOC sharedInstance] finishTransaction:transactionIdentifier];
}

- (bool) finishTransaction:(char const * const) transactionIdentifier{
    if (!self.unfinishedTransactions) return false;
    NSString* key = [NSString stringWithUTF8String:transactionIdentifier];
    SKPaymentTransaction* targetTransaction = self.unfinishedTransactions[key];
    if (nil == targetTransaction) return false;
    
    [[SKPaymentQueue defaultQueue] finishTransaction:targetTransaction];
    [self.unfinishedTransactions removeObjectForKey: key];
    return true;
}

- (void)paymentQueue:(nonnull SKPaymentQueue *)queue updatedTransactions:(nonnull NSArray<SKPaymentTransaction *> *)transactions {

    if(nil == self.unfinishedTransactions) {
      self.unfinishedTransactions = [[NSMutableDictionary alloc] init];
    }

    /* Garbage collection references
     - https://docs.cocos.com/creator/manual/en/advanced-topics/jsb/JSB2.0-learning.html#seobject
     - https://docs.cocos.com/creator/2.1/manual/en/advanced-topics/jsb/JSB2.0-learning.html#sehandleobject.
     */
    
    se::HandleObject transactionsToBePassedIntoJsRuntime(se::Object::createArrayObject([transactions count]));
    uint32_t index = 0;
    for (SKPaymentTransaction *trx in transactions) {
        if (NULL == trx.transactionIdentifier || nil == trx.transactionIdentifier) continue;

        // Type reference https://developer.apple.com/documentation/storekit/skpaymenttransaction.
        NSLog(@"trx.transactionIdentifier == %@, trx.payment.quantity == %ld, trx.payment.productIdentifier == %@, trx.transactionState == %ld (compared to SKPaymentTransactionStatePurchasing == %ld) \n", trx.transactionIdentifier, (long)trx.payment.quantity, trx.payment.productIdentifier, (long)trx.transactionState, (long)SKPaymentTransactionStatePurchasing);
        
        if (SKPaymentTransactionStatePurchasing == trx.transactionState) continue;
        if (SKPaymentTransactionStateFailed == trx.transactionState) {
            [[IapOC sharedInstance] finishTransaction:[trx.transactionIdentifier UTF8String]];
            continue;
        }
        self.unfinishedTransactions[trx.transactionIdentifier] = trx;
        
        // The memory occupied by the following object should be released when used.
        se::HandleObject singleTrxToBePassedIntoJsRuntime(se::Object::createPlainObject());
        singleTrxToBePassedIntoJsRuntime->setProperty("transactionIdentifier", se::Value([trx.transactionIdentifier UTF8String]));
        singleTrxToBePassedIntoJsRuntime->setProperty("transactionState", se::Value((long)trx.transactionState));
        singleTrxToBePassedIntoJsRuntime->setProperty("productIdentifier", se::Value([trx.payment.productIdentifier UTF8String]));
        
        /**
         * By 2019-01-23, I'm not sure whether or not "setArrayElement"
         * increments "refCount of the child" like what "CCArray" in cocos2d-x did.
         *
         * -- YFLu
         */
        transactionsToBePassedIntoJsRuntime->setArrayElement(index, se::Value(singleTrxToBePassedIntoJsRuntime));
        ++index;
    }
    
    NSURL* appStoreReceiptURL = [[NSBundle mainBundle] appStoreReceiptURL];
    NSData *dataReceipt = [NSData dataWithContentsOfURL: appStoreReceiptURL];
    NSString *receipt = [dataReceipt base64EncodedStringWithOptions:0];
    
//    NSLog(@"The receipt from %@ is: %@", appStoreReceiptURL.absoluteURL, receipt);
    
    // Reference https://developer.apple.com/library/archive/releasenotes/General/ValidateAppStoreReceipt/Chapters/ValidateLocally.html#//apple_ref/doc/uid/TP40010573-CH1-SW18.
    /**
     * To parse and preview the receipt by CLI tools on a remote machine, prepare the followings.
     *
     * - Have AppleRootCertificate installed.
     * - Have CLI programs `openssl` and `base64` installed.
     * - Save the base64 encoded receipt into a file named such as `SampleReceipt.txt` on the remote machine.
     
     * Then try out in a BashShell the following commands.
     * - BashShell> base64 -D /path/to/SampleReceipt.txt
     *  - This step decodes the content in "/path/to/SampleReceipt.txt" back to binary, which is "PKCS#7 signed".
     *
     * - BashShell> base64 -D /path/to/SampleReceipt.txt | openssl pkcs7 -inform der -text
     *  - This step pipes the "PKCS#7 signed binary content" into the "openssl-pkcs7 program" which takes in "DER format content (the binary content)" and outputs "PEM format content".
     *
     * - BashShell> base64 -D /path/to/SampleReceipt.txt | openssl pkcs7 -inform der -print -noout
     *  - This step extracts the "PKCS#7 signed binary content" into ASN.1 structure, without printing "PEM format content".
     *  - By now you HAVEN'T VERIFIED the signature of this receipt yet, but you can already decode the ASN1 messages with specs given by https://developer.apple.com/library/archive/releasenotes/General/ValidateAppStoreReceipt/Chapters/ValidateLocally.html "Listing 1-1", locate attributes with type 17 and then decode again w.r.t. "Listing 1-2", and finally extract needed information by comparing to https://developer.apple.com/library/archive/releasenotes/General/ValidateAppStoreReceipt/Chapters/ReceiptFields.html#//apple_ref/doc/uid/TP40010573-CH106-SW12.
     *
     *
     */
    
    se::HandleObject trxObjToBPassedIntoJsRuntime(se::Object::createPlainObject());
    trxObjToBPassedIntoJsRuntime->setProperty("MainBundleReceipt", se::Value([receipt UTF8String]));
    trxObjToBPassedIntoJsRuntime->setProperty("UpdatedTransactions", se::Value(transactionsToBePassedIntoJsRuntime));
    CuisineMaster::Iap::onIapTransactionsStateUpdated(trxObjToBPassedIntoJsRuntime);
}

- (void)paymentQueue:(nonnull SKPaymentQueue *)queue removedTransactions:(nonnull NSArray<SKPaymentTransaction *> *)transactions {
    if (nil == self.unfinishedTransactions) {
        self.unfinishedTransactions = [[NSMutableDictionary alloc] init];
    }

    se::HandleObject transactionsToBePassedIntoJsRuntime(se::Object::createArrayObject([transactions count]));
    uint32_t index = 0;
    for (SKPaymentTransaction *trx in transactions) {
        if (NULL == trx.transactionIdentifier || nil == trx.transactionIdentifier) continue;
        
        NSLog(@"trx.transactionIdentifier == %@, trx.transactionState == %ld.\n", trx.transactionIdentifier, (long)trx.transactionState);
        
        if (SKPaymentTransactionStatePurchasing == trx.transactionState) continue;
        if (SKPaymentTransactionStateFailed == trx.transactionState) {
            [[IapOC sharedInstance] finishTransaction:[trx.transactionIdentifier UTF8String]];
            continue;
        }
        
        self.unfinishedTransactions[trx.transactionIdentifier] = trx;
        
        // The memory occupied by the following object should be released when used.
        se::HandleObject singleTrxToBePassedIntoJsRuntime(se::Object::createPlainObject());
        singleTrxToBePassedIntoJsRuntime->setProperty("transactionIdentifier", se::Value([trx.transactionIdentifier UTF8String]));
        singleTrxToBePassedIntoJsRuntime->setProperty("transactionState", se::Value((long)trx.transactionState));
        singleTrxToBePassedIntoJsRuntime->setProperty("productIdentifier", se::Value([trx.payment.productIdentifier UTF8String]));
        
        transactionsToBePassedIntoJsRuntime->setArrayElement(index, se::Value(singleTrxToBePassedIntoJsRuntime));
        ++index;
    }
    
    NSURL* appStoreReceiptURL = [[NSBundle mainBundle] appStoreReceiptURL];
    NSData *dataReceipt = [NSData dataWithContentsOfURL: appStoreReceiptURL];
    NSString *receipt = [dataReceipt base64EncodedStringWithOptions:0];
    
    se::HandleObject trxObjToBPassedIntoJsRuntime(se::Object::createPlainObject());
    trxObjToBPassedIntoJsRuntime->setProperty("MainBundleReceipt", se::Value([receipt UTF8String]));
    trxObjToBPassedIntoJsRuntime->setProperty("RemovedTransactions", se::Value(transactionsToBePassedIntoJsRuntime));
    CuisineMaster::Iap::onIapTransactionsRemoved(trxObjToBPassedIntoJsRuntime);
}

- (void) dealloc
{
    // Reference http://clang.llvm.org/docs/AutomaticReferenceCounting.html#dealloc.
    [super dealloc];
}

@end
