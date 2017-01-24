# Version: 0.1
FROM ubuntu:xenial
MAINTAINER Milan Simonovic <milan.simonovic@imls.uzh.ch>

# update to invalidate docker's cache and force apt-get update
ENV REFRESHED_AT 2017-01-24

#TODO check if python is v2.7 because some modules will warn compile with python 3
RUN apt-get update && apt-get install -y  libc-dev build-essential curl python

RUN curl -sL https://deb.nodesource.com/setup_6.x |  bash -
# will also install npm v3.x:
RUN apt-get install -y nodejs


EXPOSE 3000
ENV WD /var/ga-domains
WORKDIR  $WD
COPY . $WD
RUN npm install

# DEFAULTS, override when creating a container:
#ENV CONSUL_HOST '127.0.0.1'

# VOLUME $WD

CMD ["./run.sh"]

