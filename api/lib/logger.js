/**
 *
 * A single, centralized logger module for the entire app. Why? For 2 reasons:
 * 1. avoid boilerplate setup
 * 2. all log data should anyway go to the same place and using this model will enforce that
 *
 * It should probably only log to stdout and let the deployment env (docker?)
 * decide where to send them (upstart, multilog, ...).
 * It's also convinient for development to control everything in one place (here).
 *
 * Tip: `NODE_ENV=development node-dev --debug=8011 bin/www |
 *        tee -a log/app.ndjson.log | bunyan -o short`
 * # `node-dev` restarts automatically on code changes (https://github.com/fgnass/node-dev)
 * # `--debug=8011` enables the debugger which can be attached to with node-inspector
 * # tee copies stdout to disk in case you want to go back and look through logs
 * # bunyan -o short gives pretty-printed output in the terminal
 *
 * Created by milans on 13/04/2016.
 */

const bunyan = require('bunyan');
const bunyanEmailStream = require('bunyan-emailstream');

// TODO pass as an arg? or process.env.LOG_LEVEL maybe?
const logLevel = process.env.NODE_ENV !== 'production' ? 'debug' : 'info';

const EmailStream = bunyanEmailStream.EmailStream;
const emailStream = new EmailStream({
  // Nodemailer mailOptions
  from: 'paxdb.team@gmail.com',
  to: 'milan.molbio@gmail.com'
}, {
  // Nodemailer transportOptions
  type: 'SMTP',
  service: 'gmail',
  auth: {
    user: 'geneassassin',
    pass: 'meringlab-t5y6u7i8'
  }
});

const streams = [];
if (process.env.NODE_ENV !== 'production') {
  streams.push({
    type: 'raw',
    stream: emailStream,
    level: 'error',
  });
}


if (process.env.NODE_ENV === 'development') {
  const PrettyStream = require('bunyan-prettystream'); //eslint-disable-line
  const prettyStdOut = new PrettyStream();
  prettyStdOut.pipe(process.stdout);

  streams.push({
    level: logLevel,
    stream: prettyStdOut
  });
} else {
  streams.push({
    level: logLevel,
    stream: process.stdout
  });
}

const config = {
  name: 'geneassassin-api-logger',
  serializers: {
    req: bunyan.stdSerializers.req,     // standard bunyan req serializer
    err: bunyan.stdSerializers.err      // standard bunyan error serializer
  },
  streams
};

const logger = bunyan.createLogger(config);
logger.showErrStack = true;

if (process.env.NODE_ENV !== 'production') {
  logger.src = true;
} else {
  // DO NOT USE src in production!
  logger.src = false;
}

module.exports = logger;
