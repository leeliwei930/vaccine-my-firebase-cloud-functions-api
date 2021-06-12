module.exports = async (req, res, functions, db) => {
	const snapshot = await db.collection('vaccination_centre').get()
	let states = [];
	snapshot.forEach( (record) => {
		states.push(record.data())
	})

	let data = [];
	for (var i = 0; i < states.length; i++) {
		data.push({
			state: states[i].state,
			state_fullname: states[i].state_fullname,
			total_vaccination_locations : states[i].count
		})
	}

	return res.status(200).json({status: 200, message: "success", data })
}
