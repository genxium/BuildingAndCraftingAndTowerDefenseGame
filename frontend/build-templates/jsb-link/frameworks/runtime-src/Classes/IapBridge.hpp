#ifndef iap_bridge_hpp
#define iap_bridge_hpp

#pragma once
#include "base/ccConfig.h"
#include "cocos/scripting/js-bindings/jswrapper/SeApi.h"

extern se::Object* __jsb_Iap_proto;
extern se::Class* __jsb_Iap_class;

bool register_Iap(se::Object* obj);

SE_DECLARE_FUNC(iap_sku_list_query);
SE_DECLARE_FUNC(iap_sku_purchase);
SE_DECLARE_FUNC(finish_transaction);
SE_DECLARE_FUNC(iap_unfinished_transactions_query);

#endif
