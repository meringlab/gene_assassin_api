#  "name"   : "GeneAssassin-primers-load",
#  "version": "0.0.1",
#  "author" : "Milan Simonovic <milan.simonovic@imls.uzh.ch>",
#  "git"    : "https://github.com/meringlab/crispr-guides"
#  "license": "MIT",

FROM        ubuntu:xenial
MAINTAINER  Milan Simonovic <milan.simonovic@imls.uzh.ch>

# update to invalidate docker's cache and force apt-get update
ENV REFRESHED_AT 2017-03-28

RUN apt-get update && apt-get install -y build-essential python-dev  python-pip
RUN pip install pymongo

COPY . /var/primers
WORKDIR /var/primers

CMD ["python", "main.py"]
