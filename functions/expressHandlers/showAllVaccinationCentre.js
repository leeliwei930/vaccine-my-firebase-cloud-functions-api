const axios = require('axios');
module.exports = async (req, res, functions, db) => {
	const stateStatistic =  db.collection('vaccination_centre');
	const snapshot = await stateStatistic.orderBy('cd').get();
	let data = [];
	snapshot.forEach((record) => {
		data.push(record.data())
	})
	return res.status(200).json({status: 200, message: "success", data})
}
