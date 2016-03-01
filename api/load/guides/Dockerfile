FROM        ubuntu:14.04
MAINTAINER  Milan Simonovic <milan.simonovic@imls.uzh.ch>

# update to invalidate docker's cache and force apt-get update
ENV REFRESHED_AT 2015-09-02

RUN apt-get update && apt-get install -y build-essential python-dev  python-pip
RUN pip install pymongo

COPY . /var/guides
WORKDIR /var/guides

CMD ["python", "main.py"]
