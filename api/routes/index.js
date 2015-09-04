/**
 * Created by milans on 04/09/15.
 */
var express = require('express'),
    negotiate = require('express-negotiate');
var router = express.Router();

/* GET home page. */

router.get('/', function (req, res, next) {
    res.header('content-type', "text/html");
    res.render('index', {title: ''});
})


module.exports = router;
