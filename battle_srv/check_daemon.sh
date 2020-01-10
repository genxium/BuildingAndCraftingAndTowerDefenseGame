#!/bin/bash

basedir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

PID_FILE="$basedir/mineralchem.pid"
if [ -f $PID_FILE ]; then
  pid=$( cat "$PID_FILE" )
  if [ -z $pid ]; then
    echo "There's no pid stored in $PID_FILE."
  else 
    ps aux | grep "$pid"
  fi
else 
  echo "There's no PidFile $PID_FILE."
fi
