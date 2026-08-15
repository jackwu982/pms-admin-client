#!/bin/bash

prod_publish() {
  prompt
  pnpm run build
  ssh root@121.41.27.143 'rm -Rf /var/www/pms/admin-client/dist/*'
  rsync -rvhe ssh dist root@121.41.27.143:/var/www/pms/admin-client/
  echo 'Deploy has been finished for test server'
}

prompt() {
  echo "Are you sure you want to continue with this release?"
  select yn in "Yes! still releasing to production serve" "No! just missed"; do
    case $yn in
    "Yes! still releasing to production serve") break ;;
    "No! just missed") exit ;;
    esac
  done
}

usage() {
  CLEAR='\033[0m'
  RED='\033[0;31m'
  if [ -n "$1" ]; then
    echo -e "${RED}👉 $1${CLEAR}\n"
  fi
  echo "Usage: $0 [ -env env]"
  echo "  -env, --environment   The publish environment, can be test stage or prod"
  echo ""
  echo "Example: $0 -env test"
  exit 1
}

# usage
# parse params
while [[ "$#" > 0 ]]; do case $1 in
  -env | --environment)
    ENV="$2"
    shift
    shift
    ;;
  *)
    usage "Unknown parameter: $1"
    shift
    shift
    ;;
  esac done

#null check
[ -z "$ENV" ] && usage

if [ "$ENV" = "prod" ]; then
  prod_publish
else
  usage "The publish environment, can be stage or prod: $ENV $1 "
fi
