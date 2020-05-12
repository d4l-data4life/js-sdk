# How to release

As soon as you push a tagged commit to the master branch, it triggers the release to Github.com.

As it is not possible to push to the master directly, you must create a tagged release branch and create a pull request to the master from there. 

You can use the bash commands stored in __scripts/release_sdk.sh__. If you use __scripts/release_sdk.sh__, 
ensure that you updated the __CHANGELOG.md__ file accordingly. For more information, look into __scripts/release_sdk.sh__.

```bash
# example: scripts/release_sdk.sh "1.0.0"
scripts/release_sdk.sh VERSION
```

## TODO
- Adjust env to production when ENDPOINT and CDN are working with prod value
