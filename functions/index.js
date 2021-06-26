const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

const config = functions.config();
const bucket = admin.storage().bucket('vaccinemy-101.appspot.com');
const express = require('express');
const handleCrawlEvent = require('./expressHandlers/handleCrawlEvent.js')
const showAllStatistics = require('./expressHandlers/showAllStatistics.js')
const findStatisticByState = require('./expressHandlers/findStatisticByState.js');

const autoImportVaccinationCentre = require('./triggers/cloud-storage/autoImportVaccinationCentre.js');
const showAllVaccinationCentre = require("./expressHandlers/showAllVaccinationCentre.js");
const findVaccinationCentreByState = require("./expressHandlers/findVaccinationCentreByState.js")
const makeDocs = require("./expressHandlers/makeDocs.js");
const log = functions.logger.log
const app = express();

app.get('/', (req, res) => makeDocs(req, res, functions, db, log))
app.post('/crawl', (req, res) => handleCrawlEvent(req, res, functions, db, log));
app.get('/statistics', (req, res) => showAllStatistics(req, res, functions, db));
app.get('/statistics/:state', (req, res) => findStatisticByState(req, res, functions, db));
app.get('/vaccination-centre',  (req, res) =>  showAllVaccinationCentre(req, res, functions, db));
app.get('/vaccination-centre/:state', (req, res) => findVaccinationCentreByState(req, res, functions, db));
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
// Cloud function deploy spec
const runtimeOpts = {
  timeoutSeconds: 90,
  memory: '512MB'
}
// Express App Instance run on cloud function HTTP trigger
exports.vaccineMY101api = functions.runWith(runtimeOpts).region('asia-southeast2').https.onRequest(app);

exports.autoImportVaccinationCentre = functions.runWith({
  timeoutSeconds: 90,
  memory: '512MB'
}).region('asia-southeast2').storage.object().onFinalize(async (object) => {
  if (object.name == "centre.json" ) {
     await autoImportVaccinationCentre(functions, object, bucket, db, log)
  }
});
