#include "DarwinDevice.hpp"
#include "base/ccMacros.h"
#include "cocos/scripting/js-bindings/jswrapper/SeApi.h"
#include <stdio.h>
#include <string>

bool CuisineMaster::DarwinDevice::onDarwinDeviceUuidObtained(char const * const deviceUuid) {
    // Calling back to JS ScriptEngine.
    se::ValueArray args;
    args.push_back(se::Value(deviceUuid));
    
    se::ScriptEngine* se = se::ScriptEngine::getInstance();
    
    se::Value func;
    se->getGlobalObject()->getProperty("onDarwinDeviceUuidObtained", &func);
    
    if (func.isObject() && func.toObject()->isFunction()) {
        bool ok = func.toObject()->call(args, NULL /* Temporarily assume that the "this" ptr within callback is NULL. */);
        if (!ok) {
            se::ScriptEngine::getInstance()->clearException();
        }
    }
    
    return true;
}
