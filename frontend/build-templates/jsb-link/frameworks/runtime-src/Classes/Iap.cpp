#include "Iap.hpp"
#include "base/ccMacros.h"
#include "cocos/scripting/js-bindings/jswrapper/SeApi.h"
#include <stdio.h>
#include <string>

bool CuisineMaster::Iap::onIapSkuListObtained(se::HandleObject &products) {
    se::ScriptEngine* se = se::ScriptEngine::getInstance();
    
    se::Value func;
    se->getGlobalObject()->getProperty("onIapSkuListObtained", &func);
    
    se::ValueArray args;
    args.push_back(se::Value(products));
    if (func.isObject() && func.toObject()->isFunction()) {
        bool ok = func.toObject()->call(args, NULL /* Temporarily assume that the "this" ptr within callback is NULL. */);
        if (!ok) {
            se::ScriptEngine::getInstance()->clearException();
        }
    }
    
    return true;
}

bool CuisineMaster::Iap::onIapTransactionsStateUpdated(se::HandleObject &transactions) {
    se::ScriptEngine* se = se::ScriptEngine::getInstance();
    
    se::Value func;
    se->getGlobalObject()->getProperty("onIapTransactionsStateUpdated", &func);
    
    se::ValueArray args;
    args.push_back(se::Value(transactions));
    if (func.isObject() && func.toObject()->isFunction()) {
        bool ok = func.toObject()->call(args, NULL /* Temporarily assume that the "this" ptr within callback is NULL. */);
        if (!ok) {
            se::ScriptEngine::getInstance()->clearException();
        }
    }
    
    return true;
}

bool CuisineMaster::Iap::onIapUnfinishedTransactionsObtained(se::HandleObject &unfinishedTransactions) {
    se::ScriptEngine* se = se::ScriptEngine::getInstance();

    se::Value func;
    se->getGlobalObject()->getProperty("onIapUnfinishedTransactionsObtained", &func);

    se::ValueArray args;
    args.push_back(se::Value(unfinishedTransactions));
    if (func.isObject() && func.toObject()->isFunction()) {
        bool ok = func.toObject()->call(args, NULL /* Temporarily assume that the "this" ptr within callback is NULL. */);
        if (!ok) {
            se::ScriptEngine::getInstance()->clearException();
        }
    }

    return true;
}

bool CuisineMaster::Iap::onIapTransactionsRemoved(se::HandleObject &transactions) {
    se::ScriptEngine* se = se::ScriptEngine::getInstance();

    se::Value func;
    se->getGlobalObject()->getProperty("onIapTransactionsRemoved", &func);

    se::ValueArray args;
    args.push_back(se::Value(transactions));
    if (func.isObject() && func.toObject()->isFunction()) {
        bool ok = func.toObject()->call(args, NULL /* Temporarily assume that the "this" ptr within callback is NULL. */);
        if (!ok) {
            se::ScriptEngine::getInstance()->clearException();
        }
    }

    return true;
}
