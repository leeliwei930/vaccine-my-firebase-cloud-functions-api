module.exports = async (req, res, functions, db) => {

	const vaccinationCentreCollection =  db.collection('vaccination_centre');

	const snapshot = await vaccinationCentreCollection.where('cd', '==', req.params.state).get();

	if (!snapshot.empty) {
		let data = [];
		snapshot.forEach((record) => {
			data.push(record.data())
		})
		return res.status(200).json({status: 200, message: "success", data})
	}
	return res.status(404).json({status: 404, message: `unable to locate ${req.params.state} state`})
}
