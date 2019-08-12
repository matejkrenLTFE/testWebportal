#!/usr/bin/env bash
#
# TODO: This script prepares webmng release ready for PRODUCTION.
# @author LTFE
#
PATH_RELEASE="../webmng"
#svn update
BUILD_VERSION=`cd ../webmng && svn info | grep "Revision:"`

echo -e "Preparing the release: $PATH_RELEASE \n"
echo -e "Compiling application for PRODUCTION using webpack -p ... \n"
webpack -p
echo -e "Done.\n\n"

read -e -i "AC750" -p "Please enter device type (default AC750): " DEVICE

echo -e "Creating build.info ..."
echo "module.exports={\"version\": \"$BUILD_VERSION\", \"device\": \"$DEVICE\"}" > build.info
echo -e "Done."

echo -e "Moving compiled application to PRODUCTION folder ... $PATH_RELEASE \n"
cp -Rvf views/ etc/ dist/ index.html index-login.html build.info auth.json $PATH_RELEASE
echo -e "Done."

echo -e "Preparing webmng.tar packet ... \n"
cd ..
rm webmng.tar
tar -cvf webmng.tar webmng
echo -e "... webmng.tar packet completed."

#echo -e "Commit build into PRODUCTION svn repo \n"
#cd $PATH_RELEASE
#svn ci -m "build"
#echo -e "Done."
