const axios = require('axios');
module.exports = async (req, res, functions, db) => {
	const statistics = db.collection('statistics')
	const result = await statistics.orderBy('nme').get();

	const lastUpdate = await db.collection('meta').doc("statistics").get()
	let responseData = [];
	if (!result.empty && !lastUpdate.empty) {
		result.forEach((statistic) => {
			responseData.push(statistic.data());
		})
		return res.status(200).json({data: responseData, updated:lastUpdate.data()['lastUpdated']})
	}
	let currentUnixTime = Math.floor(Date.now() / 1000)
	return res.status(200).json({data: [] , updated: currentUnixTime})
}
