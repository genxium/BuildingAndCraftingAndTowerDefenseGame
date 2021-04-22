PROJECTNAME=server
ROOT_DIR=$(shell pwd)
## Available proxies for downloading go modules are listed in "https://github.com/golang/go/wiki/Modules#how-do-i-use-vendoring-with-modules-is-vendoring-going-away". 
GOPROXY=https://mirrors.aliyun.com/goproxy 
all: help

## ServerEnv == TEST部分 begins
run-test: build-test 
	ServerEnv=TEST ./server

build-test:
	GOPROXY=$(GOPROXY) go build -o $(ROOT_DIR)/server
## ServerEnv == TEST部分 ends


## ServerEnv == PROD部分 begins
run-prod: build-prod
	ServerEnv=PROD ./server

## build-prod: 可执行文件会被压缩，并新增版本号
build-prod:
	GOPROXY=$(GOPROXY) go build  -ldflags "-s -w -X main.VERSION=$(shell git rev-parse --short HEAD)-$(shell date "+%Y%m%d-%H:%M:%S")" -o $(ROOT_DIR)/server
## ServerEnv == PROD部分 ends


## ServerEnv == AnonymousPlayerEnabled Test部分 begins
run-anonymous-test: build-test
	ServerEnv=AnonymousPlayerEnabledTest ./server

## ServerEnv == AnonymousPlayerEnabled Test部分 ends

## ServerEnv == AnonymousPlayerEnabled Prod部分 begins
run-anonymous-prod: build-prod
	ServerEnv=AnonymousPlayerEnabledProd ./server

## ServerEnv == AnonymousPlayerEnabled Prod部分 ends


run-test-and-hotreload:
	ServerEnv=TEST CompileDaemon -log-prefix=false -build="go build"  -command="./server"

.PHONY: help

help: Makefile
	@echo
	@echo " Choose a command run:"
	@echo
	@sed -n 's/^##//p' $< | column -t -s ':' |  sed -e 's/^/ /'
	@echo
 
