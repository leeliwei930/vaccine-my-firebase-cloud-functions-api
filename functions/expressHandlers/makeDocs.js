const process = require('process')
module.exports = async (req, res, functions, db, log) => {
	let domain = "https://" + req.get('host') + "/vaccineMY101api";
	let response = [
		{
			method: "GET",
			path: `${domain}/statistics`,
			example: `${domain}/statistics`,
			description: "List Malaysia latest vaccination statistics",
		},
		{
			method: "GET",
			path: `${domain}/statistics/:id`,
			example: `${domain}/statistics/johor`,
			description: "List vaccination statistics based on state",
		},
		{
			method: "GET",
			path: `${domain}/vaccination-centre`,
			example: `${domain}/vaccination-centre`,
			description: "List vaccination centre count for each state",
		},
		{
			method: "GET",
			path: `${domain}/vaccination-centre/:state`,
			example: `${domain}/vaccination-centre/johor`,
			description: "List all vaccination centre on selected state"
		}
	]

	return res.status(200).json({
		status: 200,
		message: "success",
		data: response
	})
}
