#ifndef game_center_bridge_hpp
#define game_center_bridge_hpp

#pragma once
#include "base/ccConfig.h"
#include "cocos/scripting/js-bindings/jswrapper/SeApi.h"

extern se::Object* __jsb_GameCenter_proto;
extern se::Class* __jsb_GameCenter_class;

bool register_GameCenter(se::Object* obj);

SE_DECLARE_FUNC(authenticate);

#endif
