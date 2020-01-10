#!/bin/bash

basedir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

PID_FILE="$basedir/mineralchem.pid"
if [ -f $PID_FILE ]; then
  pid=$( cat "$PID_FILE" )
  if [ -z $pid ]; then
    echo "There's no pid stored in $PID_FILE."
  else 
    echo "Killing process of id $pid."
    kill $pid 
    echo "Removing PidFile $PID_FILE."
    rm $PID_FILE
  fi
else 
  echo "There's no PidFile $PID_FILE."
fi
