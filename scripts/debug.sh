#!/bin/bash

set -e
cd `dirname "$0"`
cd ..

./scripts/prepare_release.sh
echo "/home/nartallax/soft/fontello/server.js" > ./target/FONTELLO_PATH.TXT
./target/fontello-wrapper.js /tmp/wrapper-config.json