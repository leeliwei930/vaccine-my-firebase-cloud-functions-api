const axios = require('axios');
module.exports = async (req, res, functions, db) => {
	const snapshot = await db.collection('vaccination_centre').listDocuments()
	let states = [];
	snapshot.forEach( (record) => {
		states.push(record.id)
	})
	let data = [];
	for (var i = 0; i < states.length; i++) {
		let zones = await db.collection('vaccination_centre').doc(states[i]).collection("locations").listDocuments()
		let firstZone = await zones[0].get();
		data.push({
			state: states[i],
			state_fullname: firstZone.data().st,
			total_vaccination_locations : zones.length
		})
	}

	return res.status(200).json({status: 200, message: "success", data })
}
