#!/usr/bin/env bash
set -euxo pipefail

####################################################################################################
#
# Releases given version to github release indirectly by setting a tag and triggering travis
#
####################################################################################################

VERSION=$1

git commit -m "releasing ${VERSION}" && \
    git tag "$VERSION" -m "$(cat CHANGELOG.md | scripts/read_changelog.sh ${VERSION})" && \
    git push origin release --tag
