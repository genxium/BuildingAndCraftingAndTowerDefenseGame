#!/bin/bash

basedir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
outdir=$basedir/assets/scripts/modules

# You have to install the command according to https://www.npmjs.com/package/protobufjs#pbjs-for-javascrip://www.npmjs.com/package/protobufjs#pbjs-for-javascript.

# The specific filename is respected by "frontend/build-templates/wechatgame/game.js".
pbjs -t static-module -w commonjs --keep-case --force-message -o $outdir/buildable_proto_bundle.forcemsg.js $basedir/assets/resources/pbfiles/Buildable.proto

if [ "$(uname)" == "Darwin" ]; then
    # Do something under Mac OS X platform        
# elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
#     # Do something under GNU/Linux platform
# elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW32_NT" ]; then
#     # Do something under 32 bits Windows NT platform
# elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW64_NT" ]; then
#     # Do something under 64 bits Windows NT platform
  sed -i '' -e 's#require("protobufjs/minimal")#require("./protobuf")#g' $outdir/buildable_proto_bundle.forcemsg.js
else
  sed -i 's#require("protobufjs/minimal")#require("./protobuf")#g' $outdir/buildable_proto_bundle.forcemsg.js
fi
 
