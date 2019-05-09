#!/bin/bash - 
set -o nounset
if [ -r `dirname $0`/colors.sh ];then
    . `dirname $0`/colors.sh
fi
if [ $# -lt 2 ];then
    echo -e "${BRIGHT_RED}Usage: $0 </path/cli/lib/prefix> <partner_id>${NORMAL}"
    exit 1
fi
PREFIX=$1
PARTNER_ID=$2
shopt -s expand_aliases
. $PREFIX/vidcliAutoComplete
. $PREFIX/vidcliAliases.sh
PASSED=0
FAILED=0
report()
{
    TEST_NAME=$1
    RC=$2
    if [ $RC -eq 0 ];then
	PASSED=`expr $PASSED + 1`
	echo -e "${BRIGHT_GREEN}${TEST_NAME} PASSED${NORMAL}"
    else
	FAILED=`expr $FAILED + 1`
	echo -e "${BRIGHT_RED}${TEST_NAME} FAILED${NORMAL}"
    fi
}
TEST_FLV="$PREFIX/tests/DemoVideo.flv"
echo -e "${BRIGHT_BLUE}######### Running tests ###########${NORMAL}"
VS=`genvs -b $PARTNER_ID`
vidcli -x media list vs=$VS
report "media->list()" $?
SOME_ENTRY_ID=`vidcli -x baseentry list pager:objectType=VidiunFilterPager pager:pageSize=1 filter:objectType=VidiunBaseEntryFilter   filter:typeEqual=1 vs=$VS|awk '$1 == "id" {print $2}'`
report "baseentry->list()" $?
vidcli -x baseentry updateThumbnailFromSourceEntry  entryId=$SOME_ENTRY_ID sourceEntryId=$SOME_ENTRY_ID vs=$VS  timeOffset=3
report "baseentry->updateThumbnailFromSourceEntry()" $? 
TOKEN=`vidcli -x uploadtoken add uploadToken:objectType=VidiunUploadToken uploadToken:fileName=$TEST_FLV  vs=$VS|awk '$1 == "id" {print $2}'`
report "uploadtoken->add()" $?
vidcli -x uploadtoken upload fileData=@$TEST_FLV uploadTokenId=$TOKEN vs=$VS
report "uploadtoken->upload()" $?
ENTRY_ID=`vidcli -x baseentry addFromUploadedFile uploadTokenId=$TOKEN partnerId=$PARTNER_ID vs=$VS entry:objectType=VidiunBaseEntry |awk '$1 == "id" {print $2}'`
report "baseentry->addFromUploadedFile()" $?
TEST_CAT_NAM='testme'+$RANDOM
CAT_ID=`vidcli -x category add category:objectType=VidiunCategory category:name=$TEST_CAT_NAM  vs=$VS|awk '$1 == "id" {print $2}'`
report "category->add()" $?
if [ $RC -eq 0 ];then
    sleep 5
    TOTALC=`vidcli -x category list filter:objectType=VidiunCategoryFilter filter:fullNameEqual=$TEST_CAT_NAM vs=$VS|awk '$1 == "totalCount" {print $2}'`
    if [ $TOTALC -eq 1 ];then
	report "category->list()" 0
    else
	report "category->list()" 1
    fi
    vidcli -x category delete  id=$CAT_ID vs=$VS
    report "category->delete()" $?
fi
echo -e "${BRIGHT_GREEN}PASSED tests: $PASSED ${NORMAL}, ${BRIGHT_RED}FAILED tests: $FAILED ${NORMAL}"
if [ "$FAILED" -gt 0 ];then
    exit 1
fi
