#!/bin/bash

sudo docker build -t crispr/load_guides .

#sudo docker run -d -P --name crispr_mongo -h mongodb crispr/mongo 
sudo docker run --rm  --name crispr_load_guides --link crispr_mongo crispr/load_guides
