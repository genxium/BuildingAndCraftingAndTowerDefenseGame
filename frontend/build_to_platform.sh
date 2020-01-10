#!/bin/bash

if [ $# -lt 1 ]; then 
  echo "Usage: $0 [bytedance|wechatgame|android|ios] [debug]" 
  exit 1
fi

basedir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
cocosdir="/c/CocosCreator_2.2.1"

platform=$1
buildstr="platform=$platform"

if [[ ! -z $platform && "wechatgame" == $platform ]]; then
  buildstr="platform=wechatgame;configPath=$basedir/settings/wechatgame-extra.json"
elif [[ ! -z $platform && "bytedance" == $platform ]]; then
  buildstr="platform=wechatgame;configPath=$basedir/settings/bytedance.json"
fi

if [[ ! -z $2 && "debug" == $2 ]]; then
  buildstr="$buildstr;debug=true"
else
  buildstr="$buildstr;encryptJs=true"
fi

#echo $buildstr
$cocosdir/CocosCreator --path $basedir --build $buildstr
