#ifndef darwin_device_hpp
#define darwin_device_hpp

#include <string>
#include "cocos/scripting/js-bindings/jswrapper/SeApi.h"

namespace CuisineMaster {
    class DarwinDevice {
    public:
        static bool queryDarwinDeviceUuid(void* aParam);
        static bool onDarwinDeviceUuidObtained(char const * const deviceUuid);
    };
}
#endif
