#include "IapBridge.hpp"
#include "Iap.hpp"
#include "base/ccMacros.h"
#include "scripting/js-bindings/manual/jsb_conversions.hpp"

bool iap_sku_list_query(se::State& s) {
    const auto& args = s.args();
    size_t argc = args.size();
    CC_UNUSED bool ok = true;
    if (0 == argc) {
        SE_PRECONDITION2(ok, false, "iap_sku_list_query : Error processing arguments");
        CuisineMaster::Iap::queryIapSkuList(NULL);
        return true;
    }
    SE_REPORT_ERROR("wrong number of arguments: %d, was expecting %d", (int)argc, 0);
    
    return true;
}
SE_BIND_FUNC(iap_sku_list_query)

bool iap_unfinished_transactions_query(se::State& s) {
    const auto& args = s.args();
    size_t argc = args.size();
    CC_UNUSED bool ok = true;
    if (0 == argc) {
        SE_PRECONDITION2(ok, false, "iap_unfinished_transactions_query : Error processing arguments");
        CuisineMaster::Iap::queryIapUnfinishedTransactions(NULL);
        return true;
    }
    SE_REPORT_ERROR("wrong number of arguments: %d, was expecting %d", (int)argc, 0);

    return true;
}
SE_BIND_FUNC(iap_unfinished_transactions_query)

bool iap_sku_purchase(se::State& s) {
    // The passed in "s" is only a "productIdentifier" which will be used to locate the corresponding "SKProduct", which is in turn used to create an instance of "SKPayment". Reference https://developer.apple.com/documentation/storekit/skpayment.
    
    const auto& args = s.args();
    size_t argc = args.size();
    CC_UNUSED bool ok = true;
    if (1 == argc) {
        SE_PRECONDITION2(ok, false, "iap_sku_purchase : Error processing arguments");
        std::string theProductIdentifier = args[0].toString();
        CuisineMaster::Iap::purchaseIapSku(theProductIdentifier.c_str());
        return true;
    }
    SE_REPORT_ERROR("wrong number of arguments: %d, was expecting %d", (int)argc, 1);
    
    return true;
}
SE_BIND_FUNC(iap_sku_purchase);

bool finish_transaction(se::State& s) {
    const auto& args = s.args();
    size_t argc = args.size();
    CC_UNUSED bool ok = true;
    if (1 == argc) {
        SE_PRECONDITION2(ok, false, "finish_transaction: Error processing arguments");
        std::string theTransactionIdentifier = args[0].toString();
        CuisineMaster::Iap::finishTransaction(theTransactionIdentifier.c_str());
        return true;
    }
    SE_REPORT_ERROR("wrong number of arguments: %d, was expecting %d", (int)argc, 1);
    
    return true;
}
SE_BIND_FUNC(finish_transaction);

static bool iap_finalize(se::State& s)
{
    CCLOGINFO("jsbindings: finalizing JS object %p (CuisineMaster::Iap)", s.nativeThisObject());
    auto iter = se::NonRefNativePtrCreatedByCtorMap::find(s.nativeThisObject());
    if (iter != se::NonRefNativePtrCreatedByCtorMap::end()) {
        se::NonRefNativePtrCreatedByCtorMap::erase(iter);
        CuisineMaster::Iap* cobj = (CuisineMaster::Iap*)s.nativeThisObject();
        delete cobj;
    }
    return true;
}

SE_BIND_FINALIZE_FUNC(iap_finalize)

se::Object* __jsb_Iap_proto = nullptr;
se::Class* __jsb_Iap_class = nullptr;
bool register_Iap(se::Object* obj)
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
    auto cls = se::Class::create("Iap", ns, nullptr, nullptr);
    
    cls->defineStaticFunction("iap_sku_list_query", _SE(iap_sku_list_query));
    cls->defineStaticFunction("iap_sku_purchase", _SE(iap_sku_purchase));
    cls->defineStaticFunction("finish_transaction", _SE(finish_transaction));
    cls->defineStaticFunction("iap_unfinished_transactions_query", _SE(iap_unfinished_transactions_query));
    cls->defineFinalizeFunction(_SE(iap_finalize));
    cls->install();
    
    JSBClassType::registerClass<CuisineMaster::Iap>(cls);
    __jsb_Iap_proto = cls->getProto();
    __jsb_Iap_class = cls;
    se::ScriptEngine::getInstance()->clearException();
    return true;
}
