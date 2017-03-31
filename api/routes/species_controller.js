const express = require('express');
const router = express.Router();
const _und = require('underscore')
const bunyan = require('bunyan');
const logger = bunyan.createLogger({
  name: "ga-API-domains",
  module: "species_router"
});

const AVAILABLE_SPECIES = {
    'drerio': 'drerio-85'
    ,'celegans': 'celegans-85'
    ,'cintestinalis': 'cintestinalis-85'
    // 'hsapiens': 'hsapiens-85',
    // 'mmusculus': 'mmusculus-85',
    // 'scerevisiae': 'scerevisiae-85',
};
//maintain mongodb clients, one per species
const storagePool = {};

router.param('species', function (req, res, next, species) {
  logger.debug({ species });

  if (!(species in AVAILABLE_SPECIES)) {
    res.status(404);
    res.render('error', { message: `Unknown species: ${species}`,error:{} });
    return;
  }
  // once validation is done save in the req
  req.species = species;
  if (!(species in storagePool)) {
    const mongodbUrl = req.app.get('mongodb_url');
    const url = `${mongodbUrl}/${AVAILABLE_SPECIES[species]}${req.app.get('mongodb_rs')}`;
    require('../lib/storage')(url, function(err, storage) {
      if (err) {
        res.status(404);
        res.render('error', { message: `Unknown species: ${species}` });
        return;
      }
      storagePool[species] = storage;
      req.storage = storage;
      // go to the next thing
      next();

    });
  } else {
    req.storage = storagePool[species];
    // go to the next thing
    next();
  }
});

_und.forEach(['proteins','domains','guides','primers'], function(place) {
  router.use(`/:species/${place}`, require(`./${place}`));
});
router.use('/:species/', require('./index'));


module.exports = router;
//TODO
//exports = module.exports = function (options) {
//    return router
//}