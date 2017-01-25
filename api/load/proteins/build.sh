#!/bin/bash

sudo docker build -t crispr/load_proteins .
sudo docker run --rm  --name crispr_load_proteins --link crispr_mongo crispr/load_proteins
