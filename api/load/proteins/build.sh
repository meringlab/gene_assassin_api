#!/bin/bash

sudo docker build -t crispr/mongo mongodb
sudo docker build -t crispr/load_proteins load

sudo docker run -d -P --name crispr_mongo -h mongodb crispr/mongo 
sudo docker run --rm  --name crispr_load_proteins --link crispr_mongo crispr/load_proteins
