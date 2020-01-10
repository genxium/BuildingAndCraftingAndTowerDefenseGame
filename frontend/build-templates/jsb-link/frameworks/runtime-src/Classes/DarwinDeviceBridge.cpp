#include "DarwinDeviceBridge.hpp"
#include "DarwinDevice.hpp"
#include "base/ccMacros.h"
#include "scripting/js-bindings/manual/jsb_conversions.hpp"

bool queryDarwinDeviceUuid(se::State& s)
{
    const auto& args = s.args();
    size_t argc = args.size();
    CC_UNUSED bool ok = true;
    if (argc == 0) {
        SE_PRECONDITION2(ok, false, "queryDarwinDeviceUuid: Error processing arguments");
        CuisineMaster::DarwinDevice::queryDarwinDeviceUuid(NULL);
        return true;
    }
    SE_REPORT_ERROR("wrong number of arguments: %d, was expecting %d", (int)argc, 0);

    return true;
}
SE_BIND_FUNC(queryDarwinDeviceUuid)

static bool darwin_device_finalize(se::State& s)
{
    CCLOGINFO("jsbindings: finalizing JS object %p (CuisineMaster::DarwinDevice)", s.nativeThisObject());
    auto iter = se::NonRefNativePtrCreatedByCtorMap::find(s.nativeThisObject());
    if (iter != se::NonRefNativePtrCreatedByCtorMap::end()) {
        se::NonRefNativePtrCreatedByCtorMap::erase(iter);
        CuisineMaster::DarwinDevice* cobj = (CuisineMaster::DarwinDevice*)s.nativeThisObject();
        delete cobj;
    }
    return true;
}
SE_BIND_FINALIZE_FUNC(darwin_device_finalize)

se::Object* __jsb_DarwinDevice_proto= nullptr;
se::Class* __jsb_DarwinDevice_class = nullptr;
bool register_DarwinDevice(se::Object* obj)
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
    auto cls = se::Class::create("DarwinDevice", ns, nullptr, nullptr);
    
    cls->defineStaticFunction("queryDarwinDeviceUuid", _SE(queryDarwinDeviceUuid));
    cls->defineFinalizeFunction(_SE(darwin_device_finalize));
    cls->install();
    
    JSBClassType::registerClass<CuisineMaster::DarwinDevice>(cls);
    __jsb_DarwinDevice_proto = cls->getProto();
    __jsb_DarwinDevice_class = cls;
    se::ScriptEngine::getInstance()->clearException();
    return true;
}
