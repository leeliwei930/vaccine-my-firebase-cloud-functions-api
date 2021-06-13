const axios = require('axios');
module.exports = async (req, res, functions, db) => {
	// make a collection reference to statistics collection
	const stateStatistic =  db.collection(`statistics`);

	// query the state match with input request input state
	const snapshot = await stateStatistic.where('id', '==', req.params.state).limit(1).get();

	// if any result fetched
	if (!snapshot.empty) {
		// response the first query response state statistic
		return res.status(200).json({status: 200, message: "success", data: snapshot.docs[0].data()})
	}

	// return not found
	return res.status(404).json({status: 404, message: `unable to locate ${req.params.state} state`})
}
