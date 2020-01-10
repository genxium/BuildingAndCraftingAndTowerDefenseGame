#ifndef iap_hpp
#define iap_hpp

#include "cocos/scripting/js-bindings/jswrapper/SeApi.h"

namespace CuisineMaster {
    /**
     * WARNING: DON'T pass "se::Object*" params into either "onIapSkuListObtained" or
     * "onIapTransactionsStateUpdated" to avoid misuse of "rooting or refCounting" by
     * the wrapping of "se::Value" and within the "ScriptEngine instance".
     *
     * Here's the underlying reason. The destructor "~se::Value()" is playing evil if using
     * se::Value(se::Object* toWrapObj) to construct, see. In short the `toWrapObj` will be called to
     * "unroot()" and "deRef()" within "~se::Value() thus se::Value.reset(...)". See source code of
     * `cocos2d_libs/js-bindings/jswrapper/Value.cpp` for details.
     *
     * Using se::Value(se::HandleObject ho) is good because it is like delegating ~se::Value() recursively to
     * each ~se::HandleObject().
     */
    class Iap {
    public:
        static bool initSKPaymentObserver();
        static bool queryIapSkuList(void* aParam);
        static bool onIapSkuListObtained(se::HandleObject &products);
        
        static bool queryIapUnfinishedTransactions(void* aParam);
        static bool onIapUnfinishedTransactionsObtained(se::HandleObject &unfinishedTransactions);
        static bool purchaseIapSku(char const * const productIdentifier);
        static bool onIapTransactionsStateUpdated(se::HandleObject &transactions);
        static bool onIapTransactionsRemoved(se::HandleObject &transactions);
        static bool finishTransaction(char const * const transactionIdentifier);
    };
}
#endif
