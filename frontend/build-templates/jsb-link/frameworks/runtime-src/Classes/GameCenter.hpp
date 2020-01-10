#ifndef game_center_hpp
#define game_center_hpp

#include <string>
#include "cocos/scripting/js-bindings/jswrapper/SeApi.h"

namespace CuisineMaster {
    class GameCenter {
    public:
        /**
         * The implementation of the following method "authenticateGameCenter" will be finally carried out in "InvitationOC.mm".
         */
        static bool authenticate(void* aParam);
        static bool onIdentityObtained(char const * const playerId, char const * const publicKeyUrl, char const * const signature, char const * const salt, uint64_t timestamp, void* error);
        static bool onIdentityNotObtained(int const errCode);
    };
}
#endif
