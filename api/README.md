# Overview

This is the GeneAssassin CRISPR-related (guides, proteins, ...) backend service.
   
# Installation

 - use ansible to deploy
 
 sudo docker build -t gene_assassin/api .
 sudo docker run -d -p 19000:3000 --restart=always --name ga_api  --link crispr_mongo:crispr_mongo gene_assassin/api 


# Versioning
It should be versioned following the rules from
 [Semantic versioning](http://semver.org/).

All versions are `<major>.<minor>.<patch>`.

# License

MIT. See "LICENSE.txt".

# Maintainers
* Milan simonovic (milan.simonovic@imls.uzh.ch)


