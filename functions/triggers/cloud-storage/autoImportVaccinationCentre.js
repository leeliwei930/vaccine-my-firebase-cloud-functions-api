
const os = require('os')
const path = require('path')
const fs = require('fs')
const firebase_tools = require('firebase-tools')
module.exports = async (functions, object, bucket, db, log) => {
	log(object.contentType)
	log(object.bucket)
	log(object.name)
	log(os.tmpdir())
	let filename = path.basename(object.name)
	// create temporary centre.json download file path
	const tempFilePath = path.join(os.tmpdir(),filename )
	if (object.contentType === "application/json" && object.name.startsWith("centre")) {
		log(`Download to temp file path ${tempFilePath}`)
		try {
			// clear all the collection

			// download the centre.json file
			await bucket.file(object.name).download({ destination: tempFilePath, validation: false })
			// import the json data file
			let records = require(tempFilePath)
			let batches = [];
			// transaction batch instance
			// use for memoization and storing each state vaccination centre count
			let stateRecorded = {};
			
			let parent = null;
			let token  = ""
			if (functions.config().firebase) {
				token = functions.config().firebase.token
			}
			await firebase_tools.firestore.delete('vaccination_centre', {
				project: process.env.GCLOUD_PROJECT,
				recursive: true,
				yes: true,
				token: token
			})

			// iterate each data record
			records.every(async (record, index) => {
				if (index % 249 == 0) {
					batches.push(db.batch())
				}
				let batch = batches[batches.length - 1]
				parent = db.collection(`vaccination_centre`).doc(record.cd)
				// if there is not state recorded before
				if (stateRecorded[record.cd] === undefined) {
					// start a new collection
					batch.set(parent, { state: record.cd, state_fullname: record.st})
					stateRecorded[record.cd] = 1;
				} else {
					// increase the state recorded count
					stateRecorded[record.cd] += 1;
				}
				let location = parent.collection('locations')
				// append vaccination centre document 
				batch.set(location.doc(), record)
				
			})


			let totalWrites = 0;
			for (batchTx of batches) {
				let commitResponse = await batchTx.commit()
				totalWrites += commitResponse.length
			}
			// update batch for updating vaccination centre count
			updateBatch = db.batch();

			Object.keys(stateRecorded).forEach(stateMeta => {
				record = db.collection(`vaccination_centre`).doc(stateMeta)
				updateBatch.update(record, {count: stateRecorded[stateMeta]})
			})
			// commit transaction
			await updateBatch.commit();

			// log(`Completed  ${totalWrites} vaccination centre data import at ${Date()}`)
			// clear the download file in temporary directory
			return fs.unlinkSync(tempFilePath);
		} catch (error) {
			log(error)
		}
		
	}
}


async function deleteCollection(db, collectionPath) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__');

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(db, query, resolve) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    // When there are no documents left, we are done
    resolve();
    return;
  }

  // Delete documents in a batch
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Recurse on the next process tick, to avoid
  // exploding the stack.
  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve);
  });
}
