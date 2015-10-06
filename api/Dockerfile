# Version: 0.1
FROM ubuntu:trusty
MAINTAINER Milan Simonovic <milan.simonovic@imls.uzh.ch>

# update to invalidate docker's cache and force apt-get update
ENV REFRESHED_AT 2015-09-03

RUN apt-get update && apt-get install -y nodejs npm

EXPOSE 3000
ENV WD /var/ga-domains
WORKDIR  $WD
COPY . $WD
RUN npm install

# DEFAULTS, override when creating a container:
#ENV CONSUL_HOST '127.0.0.1'

# VOLUME $WD

CMD ["./bin/www"]
