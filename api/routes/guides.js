const express = require('express');
const router = express.Router(),
    negotiate = require('express-negotiate');
const _und = require('underscore')

// /guides/frequencies?regions=23:28008620-28008716&interval=97
router.get('/frequencies', function (req, res, next) {
    //"23:27946750-27946874,23:27946875-27946999,23:27947000-27947124"
  //TODO check if interval is valid
    req.app.get('storage').guidesFrequencies('drerio', req.param('regions'), parseInt(req.param('interval'))).then(
      function (data) {
          render(res, "application/json", data);
      },
      function (err) {
          //TODO handle error!
          log.error(err, 'failed to load guide frequencies %s - %s', 'drerio', regions);
          return next(new Error('failed to load guides: ' + err.message));
      });
});


router.param('gene', function (req, res, next, gene) {
    req.gene = gene;
    next();
})

router.get('/gene/:gene', function (req, res, next) {
    req.app.get('storage').geneGuides('drerio', req.gene).then(
      function (data) {
          req.negotiate({
              'application/ld+json': function () {
                  render(res, "application/ld+json", data);
              },
              'application/json': function () {
                  //TODO add Link header to @context
                  render(res, "application/json", data);
              },
              'default': function () {
                  render(res, "application/json", data);
              }
          })
      },
      function (err) {
          //TODO handle error!
          log.error(err, 'failed to load guides for %s - %s', 'drerio', req.gene)
          return next(new Error('failed to load guides: ' + err.message));
      });
});


router.param('chromosome', function (req, res, next, chromosome) {
    // once validation is done save the new item in the req
    req.chromosome = chromosome;
    // go to the next thing
    next();
});

router.get('/chromosome/:chromosome', function (req, res, next) {
    req.app.get('storage').guidesInGenomicRegion('drerio', req.chromosome, parseInt(req.query.start), parseInt(req.query.end)).then(
        function (data) {
            req.negotiate({
                'application/ld+json': function () {
                    render(res, "application/ld+json", data);
                },
                'application/json': function () {
                    //TODO add Link header to @context
                    render(res, "application/json", data);
                },
                'default': function () {
                    render(res, "application/json", data);
                }
            })
        },
        function (err) {
            //TODO handle error!
            log.error(err, 'failed to load domains [%s, %s, %s]', req.chromosome, req.query.start, req.query.end)
            return next(new Error('failed to load domains: ' + err.message));
        });
});


//TODO
//router.get('/:gene', function (req, res, next) {

function render(res, contentType, params) {
    res.header('content-type', contentType);
    res.header('Access-Control-Allow-Origin', '*');
    res.json(params);
}

module.exports = router;
//TODO
//exports = module.exports = function (options) {
//    return router
//}