//
//  invitation_bridge.cpp
//  IAPPrac-mobile
//
//  Created by yflu on 2018/12/24.
//

#include "GameCenterBridge.hpp"
#include "GameCenter.hpp"
#include "base/ccMacros.h"
#include "scripting/js-bindings/manual/jsb_conversions.hpp"

bool authenticate(se::State& s)
{
    const auto& args = s.args();
    size_t argc = args.size();
    CC_UNUSED bool ok = true;
    if (argc == 0) {
        SE_PRECONDITION2(ok, false, "authenticate : Error processing arguments");
        CuisineMaster::GameCenter::authenticate(NULL);
        return true;
    }
    SE_REPORT_ERROR("wrong number of arguments: %d, was expecting %d", (int)argc, 0);

    return true;
}
SE_BIND_FUNC(authenticate)

static bool finalize(se::State& s)
{
    CCLOGINFO("jsbindings: finalizing JS object %p (CuisineMaster::GameCenter)", s.nativeThisObject());
    auto iter = se::NonRefNativePtrCreatedByCtorMap::find(s.nativeThisObject());
    if (iter != se::NonRefNativePtrCreatedByCtorMap::end()) {
        se::NonRefNativePtrCreatedByCtorMap::erase(iter);
        CuisineMaster::GameCenter* cobj = (CuisineMaster::GameCenter*)s.nativeThisObject();
        delete cobj;
    }
    return true;
}

SE_BIND_FINALIZE_FUNC(finalize)

se::Object* __jsb_GameCenter_proto = nullptr;
se::Class* __jsb_GameCenter_class = nullptr;
bool register_GameCenter(se::Object* obj)
{
    // Get the ns
    se::Value nsVal;
    if (!obj->getProperty("CuisineMaster", &nsVal))
    {
        se::HandleObject jsobj(se::Object::createPlainObject());
        nsVal.setObject(jsobj);
        obj->setProperty("CuisineMaster", nsVal);
    }
    
    se::Object* ns = nsVal.toObject();
    auto cls = se::Class::create("GameCenter", ns, nullptr, nullptr);
    
    cls->defineStaticFunction("authenticate", _SE(authenticate));
    cls->defineFinalizeFunction(_SE(finalize));
    cls->install();
    
    JSBClassType::registerClass<CuisineMaster::GameCenter>(cls);
    __jsb_GameCenter_proto = cls->getProto();
    __jsb_GameCenter_class = cls;
    se::ScriptEngine::getInstance()->clearException();
    return true;
}
