# Version: 0.1
FROM ubuntu:trusty
MAINTAINER Milan Simonovic <milan.simonovic@imls.uzh.ch>

# update to invalidate docker's cache and force apt-get update
ENV REFRESHED_AT 2015-09-03

RUN apt-get update && apt-get install -y  npm curl

RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.26.1/install.sh | bash && \
    export NVM_DIR="/root/.nvm" && \
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && \
    nvm install v0.12 && nvm use v0.12


EXPOSE 3000
ENV WD /var/ga-domains
WORKDIR  $WD
COPY . $WD
RUN npm install

# DEFAULTS, override when creating a container:
#ENV CONSUL_HOST '127.0.0.1'

# VOLUME $WD

CMD ["./run.sh"]

