#include "AppDelegate.h"

#include "cocos2d.h"

#include "cocos/scripting/js-bindings/manual/jsb_module_register.hpp"
#include "cocos/scripting/js-bindings/manual/jsb_global.h"
#include "cocos/scripting/js-bindings/jswrapper/SeApi.h"
#include "cocos/scripting/js-bindings/event/EventDispatcher.h"
#include "cocos/scripting/js-bindings/manual/jsb_classtype.hpp"

#if (CC_TARGET_PLATFORM == CC_PLATFORM_ANDROID || CC_TARGET_PLATFORM == CC_PLATFORM_IOS) && PACKAGE_AS
#include "SDKManager.h"
#include "jsb_anysdk_protocols_auto.hpp"
#include "manualanysdkbindings.hpp"
using namespace anysdk::framework;
#endif

USING_NS_CC;

#include "GameCenterBridge.hpp"
#include "GameCenter.hpp"

#if CC_TARGET_PLATFORM == CC_PLATFORM_IOS && PACKAGE_AS
#include "IapBridge.hpp"
#include "Iap.hpp"
#include "DarwinDevice.hpp"
#include "DarwinDeviceBridge.hpp"
#endif

AppDelegate::AppDelegate(int width, int height) : Application("Cocos Game", width, height)
{
}

AppDelegate::~AppDelegate()
{
#if (CC_TARGET_PLATFORM == CC_PLATFORM_ANDROID || CC_TARGET_PLATFORM == CC_PLATFORM_IOS) && PACKAGE_AS
   SDKManager::getInstance()->purge();
#endif
}

bool AppDelegate::applicationDidFinishLaunching()
{
#if CC_TARGET_PLATFORM == CC_PLATFORM_IOS && PACKAGE_AS
   SDKManager::getInstance()->loadAllPlugins();
#endif

    se::ScriptEngine* se = se::ScriptEngine::getInstance();

    jsb_set_xxtea_key("");
    jsb_init_file_operation_delegate();

#if defined(COCOS2D_DEBUG) && (COCOS2D_DEBUG > 0)
    // Enable debugger here
    jsb_enable_debugger("0.0.0.0", 6086, false);
#endif

    se->setExceptionCallback([](const char* location, const char* message, const char* stack){
        // Send exception information to server like Tencent Bugly.

    });

    jsb_register_all_modules();

#if (CC_TARGET_PLATFORM == CC_PLATFORM_ANDROID || CC_TARGET_PLATFORM == CC_PLATFORM_IOS) && PACKAGE_AS
   se->addRegisterCallback(register_all_anysdk_framework);
   se->addRegisterCallback(register_all_anysdk_manual);
#endif

#if CC_TARGET_PLATFORM == CC_PLATFORM_IOS && PACKAGE_AS
    se->addRegisterCallback(register_GameCenter);
    se->addRegisterCallback(register_Iap);
    
    se->addRegisterCallback(register_DarwinDevice);
#endif

    se->addAfterCleanupHook([](){
        JSBClassType::destroy();
    });

#if CC_TARGET_PLATFORM == CC_PLATFORM_IOS && PACKAGE_AS
    // Note that "se->addAfterInitHook" must be added before "se->start()".
    se->addAfterInitHook([](){
        /*
         * For the first call of "se->getGlobalObject()->getProperty("onIapTransactionsStateUpdated", &func);" to yield "NULL != func", you have to define "window.onIapTransactionsStateUpdated" in global scope BEFORE "ctor()" and "onLoad()" of all "cc.Component subclasses"!
         */
        CuisineMaster::Iap::initSKPaymentObserver();
    });
#endif

    se->start();

    se::AutoHandleScope hs;
    jsb_run_script("jsb-adapter/jsb-builtin.js");
    jsb_run_script("main.js");


    return true;
}

// This function will be called when the app is inactive. When comes a phone call,it's be invoked too
void AppDelegate::applicationDidEnterBackground()
{
    EventDispatcher::dispatchEnterBackgroundEvent();
}

// This function will be called when the app is active again
void AppDelegate::applicationWillEnterForeground()
{
    EventDispatcher::dispatchEnterForegroundEvent();
}

