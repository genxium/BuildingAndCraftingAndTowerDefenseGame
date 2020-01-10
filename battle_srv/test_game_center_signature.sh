#!/bin/bash

# Reference: Check your local "man curl" for details. 
GKLocalPlayerId="G:1484743399"
###
# An incorrect `playerId` which will produce a verification error.
#GKLocalPlayerId="G:1484743398" 
###

publicKeyUrl="https://static.gc.apple.com/public-key/gc-prod-4.cer"

sep="" # Doesn't matter if changed to "\r".
signatureB64Encoded="cBuIQHSxMJL/B5E9ACtiXfX3injVZJbM2SNlS6UpC/YE8i+GBB+NrFlOVJzncqag${sep}gA02BMs22D/fxdoFtkw+veR8fMUziR3JZ36iaxdKXOwEJMP3VE6pbZ81V++ni/TZ${sep}2dOJ5CHXC7bMWh7fVi8Ttajv/rBX2004cUQLls0eXFNak1/NfM8RahfFLqWiGqaG${sep}OEzwY5dtrFGtyWvQsM3O+ESyQxbBbmC520ys86t9gXdknn5I5NMTtxPuST1TjyEg${sep}EwG7bgY5WpH1wJHqA5EWUZ6yq2EHrSvQE35QWa04uYF6cMGKfP1m828S3GkKrWI+${sep}G/Vgpfyzbi8fPXpxWon9Gg=="
echo $signatureB64Encoded

saltB64Encoded="MtzZYA=="

timestamp="1545979696626"

# Note that the option "--data-urlencode" is deliberately used here for symbols "+" and alike in b64encoded fields.
# The option "" is just deliberately specified here for emphasis.
curl \
  --data-urlencode "playerId=${GKLocalPlayerId}" \
  --data-urlencode "publicKeyUrl=${publicKeyUrl}" \
  --data-urlencode "signatureB64Encoded=${signatureB64Encoded}" \
  --data-urlencode "saltB64Encoded=${saltB64Encoded}" \
  --data-urlencode "timestamp=${timestamp}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  http://localhost:9992/api/player/v1/GameCenter/login 

printf "\n\r"
