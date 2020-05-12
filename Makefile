.PHONY: push

IMAGE_NAME := sdk
IMAGE_NAME_BUILT := sdk_build
TIMESTAMP := $(shell date +%s)
CONTAINER_NAME := $(IMAGE_NAME)$(TIMESTAMP)
RELEASE_TAG := $(shell git describe --exact-match --tags HEAD)
PUBLISH_FOLDER := /sdk/dest
CDN_CACHE_MAX_AGE := 31536000

ifeq ($(RELEASE_TAG),)
	BUILD_COMMAND := VERSION=nightly npm run build
	SDK_VERSION := nightly
else
	BUILD_COMMAND := VERSION=$(RELEASE_TAG) npm run build:prod && VERSION=$(RELEASE_TAG) npm run build:prod:crypto
	SDK_VERSION := $(RELEASE_TAG)
endif

WATCH_FILES = find . -type f -not -path '*/\.*' | grep -v node_modules | grep -i '.*.[jt]s$$' 2> /dev/null

watch_test: ## Watches on file changes and then runs the tests.
	if command -v entr > /dev/null; then ${WATCH_FILES} | entr -c npm run karma:prod:web; else npm run karma:prod:web; fi

watch_lint: ## Watches on file changes and then runs the linter.
	if command -v entr > /dev/null; then ${WATCH_FILES} | entr -c npm run lint; else npm run lint; fi

docker-build:
	docker build --build-arg GITHUB_TOKEN=${GITHUB_USER_TOKEN} -f ./test.Dockerfile -t $(IMAGE_NAME) .

test: docker-build
	docker run --rm $(IMAGE_NAME) sh -c 'npm test'

build:
	docker run --name $(CONTAINER_NAME) $(IMAGE_NAME) sh -c '\
	  	$(BUILD_COMMAND);\
		sha256sum dest/healthcloud_sdk.js > dest/healthcloud_sdk.js.sha256;\
		cp fhir/fhir.schema.v301.min.json dest/;\
		sha256sum dest/fhir.schema.v301.min.json > dest/fhir.schema.v301.min.json.sha256;\
	'
	docker commit $(CONTAINER_NAME) $(IMAGE_NAME_BUILT)

push:
	docker run --rm $(IMAGE_NAME_BUILT) bash -c '\
		az cloud set --name ${AZURE_CLOUD}; \
		gzip $(PUBLISH_FOLDER)/*; \
		for FILE in $(PUBLISH_FOLDER)/*; \
		do \
			FILE_NAME=$${FILE##*/}; \
			FILE_NAME=$${FILE_NAME/.gz/}; \
			echo "Uploading $${FILE} as $(SDK_VERSION)/$${FILE_NAME} to CDN"; \
			az storage blob upload --file "$${FILE}" --container-name "javascript" --name "$(SDK_VERSION)/$${FILE_NAME}" --content-type "application/javascript" --content-encoding gzip --account-name "${STORAGE_NAME}" --account-key "${STORAGE_KEY}" --content-cache-control "public, max-age=$(CDN_CACHE_MAX_AGE)"; \
		done; \
'

clean:
	@echo "skipping"

