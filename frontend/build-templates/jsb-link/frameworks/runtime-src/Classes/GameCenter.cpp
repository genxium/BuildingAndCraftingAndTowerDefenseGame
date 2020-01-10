#include "GameCenter.hpp"
#include "base/ccMacros.h"
#include "cocos/scripting/js-bindings/jswrapper/SeApi.h"
#include <stdio.h>
#include <string>

bool CuisineMaster::GameCenter::onIdentityObtained(char const * const playerId, char const * const publicKeyUrl, char const * const signature, char const * const salt, uint64_t timestamp, void* error) {
    printf("playerId: %s\npublicKeyUrl: %s\nsignature(b64encoded): %s\nsalt(b64encoded): %s\ntimestamp: %llu\n", playerId, publicKeyUrl, signature, salt, timestamp);
    
    // Params of type "char const * const" don't need be freed.
    
    // Calling back to JS ScriptEngine.
    se::ValueArray args;
    args.push_back(se::Value(playerId));
    args.push_back(se::Value(publicKeyUrl));
    args.push_back(se::Value(signature));
    args.push_back(se::Value(salt));
    args.push_back(se::Value(std::to_string(timestamp)));
    
    se::ScriptEngine* se = se::ScriptEngine::getInstance();
    
    se::Value func;
    se->getGlobalObject()->getProperty("onGameCenterIdentityObtained", &func);
    
    if (func.isObject() && func.toObject()->isFunction()) {
        bool ok = func.toObject()->call(args, NULL /* Temporarily assume that the "this" ptr within callback is NULL. */);
        if (!ok) {
            se::ScriptEngine::getInstance()->clearException();
        }
    }
    
    return true;
}

bool CuisineMaster::GameCenter::onIdentityNotObtained(const int errCode) {
    printf("function CuisineMaster::GameCenter::onAuthenticateFaild called");
    
    se::ValueArray args;
    args.push_back(se::Value(errCode));
    se::ScriptEngine* se = se::ScriptEngine::getInstance();
    
    se::Value func;
    se->getGlobalObject()->getProperty("onGameCenterIdentityNotObtained", &func);
    
    if (func.isObject() && func.toObject()->isFunction()) {
        bool ok = func.toObject()->call(args, NULL /* Temporarily assume that the "this" ptr within callback is NULL. */);
        if (!ok) {
            se::ScriptEngine::getInstance()->clearException();
        }
    }
    
    return true;
}
