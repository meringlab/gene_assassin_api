#  "name"   : "crispr-domains-load",
#  "version": "0.0.2",
#  "author" : "Milan Simonovic <milan.simonovic@imls.uzh.ch>",
#  "git"    : "https://github.com/meringlab/crispr-domains"
#  "license": "MIT",

FROM        ubuntu:xenial
MAINTAINER  Milan Simonovic <milan.simonovic@imls.uzh.ch>

# update to invalidate docker's cache and force apt-get update
ENV REFRESHED_AT 2017-01-24

RUN apt-get update && apt-get install -y build-essential python-dev  python-pip
RUN pip install pymongo

COPY . /var/proteins
WORKDIR /var/proteins

CMD ["python", "main.py"]
