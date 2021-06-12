const axios = require('axios');

module.exports =  (req, res, functions, db, log) => {
	if (req.headers.authorization === `Bearer ${functions.config().server.cronjob_key}`) {
		return handleCrawl(req, res, functions, db, log)
	}
	return res.status(401).json({result: "unauthorized"})
}


async function handleCrawl(req, res, functions, db, log)  {
	let currentUnixTime = Math.floor(Date.now() / 1000)

	let params = {};
	params[currentUnixTime] = null;

	log(`Incoming Request from ${req.ip}`)
	// crawl news
	try {
		let statisticResponse = await axios.get("https://covidbucketbbc.s3-ap-southeast-1.amazonaws.com/heatdata.json", {
			params,
			headers: {
				"User-Agent" : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36 Edg/91.0.864.41"
			}
		});
	
		await deleteCollection(db, "statistics")
		
		const statisticBatch = db.batch();
		statisticResponse.data.data.forEach((record) => {
			let _record = {
				nme: record['nme'] ?? "",
				id: record['nme'] ? record['nme'].toLowerCase().split(" ").join("") : "",
				regtotal: Number(record['regtotal'] ?? 0),
				pop_18: Number(record['pop_18'] ?? 0),
				vakdose1: Number(record['vakdose1'] ?? 0),
				vakdose2: Number(record['vakdose2'] ?? 0),
				vakdosecomplete: Number(record['vakdosecomplete'] ?? 0)
			}
			statisticBatch.set(db.collection('statistics').doc(), _record)
		})
		let statisticCommitResponse = await statisticBatch.commit();
	
		await db.collection('meta').doc('statistics').set({lastUpdated: statisticResponse.data.updated})
		let result = { result: "done", message: `${statisticCommitResponse.length} state statistic records imported` }
		log(result)
		return res.status(200).json(result)
	} catch (error) {
		log(error)
		return res.status(500).json({result: error.toString()})
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
