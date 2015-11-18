#! /bin/bash

#if [ -n "$TIME_ZONE" ]
#then
#  echo $TIME_ZONE | sudo tee /etc/timezone;
#  sudo dpkg-reconfigure -f noninteractive tzdata;
#fi

. ~/.nvm/nvm.sh && nvm use v0.12;  NODE_ENV=production ./bin/www
