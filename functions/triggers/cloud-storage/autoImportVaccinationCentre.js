
const os = require('os')
const path = require('path')
const fs = require('fs')
module.exports = async (object, bucket, db, log) => {
	log(object.contentType)
	log(object.bucket)
	log(object.name)
	log(os.tmpdir())
	let filename = path.basename(object.name)
	const tempFilePath = path.join(os.tmpdir(),filename )
	if (object.contentType === "application/json" && object.name.startsWith("centre")) {
		log(`Download to temp file path ${tempFilePath}`)
		try {
			await deleteCollection(db, 'vaccination_centre')
			await bucket.file(object.name).download({ destination: tempFilePath, validation: false })
			let records = require(tempFilePath)
			const batch = db.batch();
			let stateRecorded = {};
			
			let parent = null;
			records.forEach((record, index) => {
				parent = db.collection(`vaccination_centre`).doc(record.cd)
				if (stateRecorded[record.cd] === undefined) {
					batch.set(parent, { state: record.cd, state_fullname: record.st})
					stateRecorded[record.cd] = 1;
				} else {
					stateRecorded[record.cd] += 1;
				}
				let location = parent.collection('locations')
				batch.set(location.doc(), record)
			})
			commitResponse = await batch.commit();

			updateBatch = db.batch();
			Object.keys(stateRecorded).forEach(stateMeta => {
				record = db.collection(`vaccination_centre`).doc(stateMeta)
				updateBatch.update(record, {count: stateRecorded[stateMeta]})
			})

			await updateBatch.commit();

			log(`Completed  ${commitResponse.length} vaccination centre data import at ${Date()}`)
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
