module.exports = async (req, res, functions, db) => {

	// vaccination ce
	const vaccinationCentreCollection =  db.collection('vaccination_centre').doc(req.params.state);

	// grab the locations collection from the state
	const snapshot = await vaccinationCentreCollection.collection('locations').get();


	// if snapshot contains any record
	if (!snapshot.empty) {
		let data = [];
		// iterate every snapshot data and push it into data array
		snapshot.forEach((record) => {
			data.push(record.data())
		})
		// return response
		return res.status(200).json({status: 200, message: "success", data})
	}

	// state not found
	return res.status(404).json({status: 404, message: `unable to locate ${req.params.state} state`})
}
