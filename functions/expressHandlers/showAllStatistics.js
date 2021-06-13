const axios = require('axios');
module.exports = async (req, res, functions, db) => {
	const statistics = db.collection('statistics')

	// order by state nme
	const result = await statistics.orderBy('nme').get();

	// fetch the last update statistic UNIX UTC time
	const lastUpdate = await db.collection('meta').doc("statistics").get()
	let responseData = [];

	// if the result is not empty
	if (!result.empty && !lastUpdate.empty) {
		// iterate each data record and push it to response data stack
		result.forEach((statistic) => {
			responseData.push(statistic.data());
		})
		// response all states statistic data
		return res.status(200).json({data: responseData, updated:lastUpdate.data()['lastUpdated']})
	}
	
	let currentUnixTime = Math.floor(Date.now() / 1000)
	return res.status(200).json({data: [] , updated: currentUnixTime})
}
