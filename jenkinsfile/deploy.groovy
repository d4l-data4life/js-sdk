#!groovy

@Library(value='pipeline-lib@master', changelog=false) _

deployPipeline projectName: 'hc-sdk-js', env: "$ENV"
