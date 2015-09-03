FROM        ubuntu:14.04
MAINTAINER  Milan Simonovic <milan.simonovic@imls.uzh.ch>

# update to invalidate docker's cache and force apt-get update
ENV REFRESHED_AT 2015-09-02

RUN apt-get update && apt-get install -y nodejs npm

COPY . /var/domains
WORKDIR /var/domains
RUN npm install

CMD ["nodejs", "main.js"]
