const axios = require('axios');
module.exports = async (req, res, functions, db) => {
	const stateStatistic =  db.collection(`statistics`);

	const snapshot = await stateStatistic.where('id', '==', req.params.state).limit(1).get();

	if (!snapshot.empty) {
		return res.status(200).json({status: 200, message: "success", data: snapshot.docs[0].data()})
	}
	return res.status(404).json({status: 404, message: `unable to locate ${req.params.state} state`})
}
