#!/bin/bash

set -e
cd `dirname "$0"`
cd ..

rm -rf ./target
./node_modules/.bin/imploder --tsconfig tsconfig.json
mv ./target/fontello-wrapper.js ./target/_fontello-wrapper.js
echo "#!/usr/bin/node" > ./target/fontello-wrapper.js
cat ./target/_fontello-wrapper.js >> ./target/fontello-wrapper.js
rm ./target/_fontello-wrapper.js
chmod +x ./target/fontello-wrapper.js
cp ./LICENSE ./target/
cp ./README.MD ./target/
cp ./package.json ./target/