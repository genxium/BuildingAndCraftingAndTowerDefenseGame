#ifndef darwin_device_bridge_hpp
#define darwin_device_bridge_hpp 

#pragma once
#include "base/ccConfig.h"
#include "cocos/scripting/js-bindings/jswrapper/SeApi.h"

extern se::Object* __jsb_DarwinDevice_proto;
extern se::Class* __jsb_DarwinDevice_class;

bool register_DarwinDevice(se::Object* obj);

SE_DECLARE_FUNC(queryDarwinDeviceUuid);

#endif
