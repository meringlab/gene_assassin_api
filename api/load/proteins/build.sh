#!/bin/bash

sudo docker build -t crispr/mongo mongodb
sudo docker build -t crispr/load load

sudo docker run -d --name crispr_mongo -h mongodb crispr/mongo 
sudo docker run  --name crispr_load --link crispr_mongo crispr/load
