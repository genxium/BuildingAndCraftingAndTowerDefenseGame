declare module sdkbox {     module IAPListener {        /**        * Called when IAP initialized        */        export function onInitialized(success : boolean) : object;
        /**        * Called when an IAP processed successfully        */        export function onSuccess(p : object) : object;
        /**        * Called when an IAP fails        */        export function onFailure(p : object , msg : string) : object;
        /**        * Called when user canceled the IAP        */        export function onCanceled(p : object) : object;
        /**        * Called when server returns the IAP items user already purchased        * @note this callback will be called multiple times if there are multiple IAP        */        export function onRestored(p : object) : object;
        /**        * Called the product request is successful, usually developers use product request to update the latest info(title, price) from IAP        */        export function onProductRequestSuccess(products : object) : object;
        /**        * Called when the product request fails        */        export function onProductRequestFailure(msg : string) : object;
        /**        * Called when the restore completed        */        export function onRestoreComplete(ok : boolean , msg : string) : object;
        export function onShouldAddStorePayment(productName : string) : boolean;
        export function onFetchStorePromotionOrder(productNames : object , error : string) : object;
        export function onFetchStorePromotionVisibility(productName : string , visibility : boolean , error : string) : object;
        export function onUpdateStorePromotionOrder(error : string) : object;
        export function onUpdateStorePromotionVisibility(error : string) : object;
    }     module Product {        export function Product() : object;
    }     module IAP {        /**        * Initialize SDKBox IAP        */        export function init(jsonconfig : object) : object;
        /**        * Enable/disable debug logging        */        export function setDebug(debug : boolean) : object;
        /**        * Get all the products        */        export function getProducts() : object;
        /**        * Make a purchase request        *        * @Param name is the name of the item specified in sdkbox_config.json        */        export function purchase(name : string) : object;
        /**        * Refresh the IAP data(title, price, description)        */        export function refresh() : object;
        /**        * Restore purchase        */        export function restore() : object;
        /**        * Set listener for IAP        */        export function setListener(listener : object) : object;
        /**        * Remove listener for IAP        */        export function removeListener() : object;
        export function enableUserSideVerification( : boolean) : object;
        /**        * get auto invoke finishTransaction flag        */        export function isAutoFinishTransaction() : boolean;
        /**        * set auto invoke finishTransaction flag        */        export function setAutoFinishTransaction(b : boolean) : object;
        /**        * to invoke ios finishTransaction api        */        export function finishTransaction(productid : string) : object;
        export function fetchStorePromotionOrder() : object;
        export function updateStorePromotionOrder(productNames : object) : object;
        export function fetchStorePromotionVisibility(productName : string) : object;
        export function updateStorePromotionVisibility(productName : string , visibility : boolean) : object;
    }}