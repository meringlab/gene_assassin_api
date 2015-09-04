const express = require('express');
const router = express.Router(),
    negotiate = require('express-negotiate');
const _und = require('underscore')


router.param('chromosome', function (req, res, next, chromosome) {
    // once validation is done save the new item in the req
    req.chromosome = chromosome;
    // go to the next thing
    next();
});

//router.param('optional', function (req, res, next, optional) {
//  if (!optional) {
//    next();
//    return;
//  }
//  // go to the next thing
//  next();
//});

router.get('/chromosome/:chromosome', function (req, res, next) {
    req.app.get('storage').domainsInGenomicRegion('drerio', req.chromosome, parseInt(req.query.start), parseInt(req.query.end)).then(
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

router.get('/', function (req, res, next) {
    res.header('content-type', "text/html");
    res.render('index', {title: ''});
})

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