module.exports = {
    async prepareLocalStatisticSubscribersList(db) {
        // prepare on local statistic report device subscribers query
        let localSubscribers = await db
            .collection("devices")
            .orderBy("device_id")
            .where("subscribed_daily_local_statistic_notification", "==", true)
            .limit(500)
            .get();

        let tailRecord = localSubscribers.docs[localSubscribers.length - 1];
        let subscribers = {
            en_US: [],
            zh: [],
        };

        localSubscribers.forEach((snapshot) => {
            let record = snapshot.data();
            subscribers[record.language].push(record.device_token);
        });
        if (tailRecord) {
            let nextBatches = await db
                .collection("devices")
                .orderBy("device_id")
                .where(
                    "subscribed_daily_local_statistic_notification",
                    "==",
                    true
                )
                .startAfter(tailRecord)
                .limit(500)
                .get();
            while (nextBatches.size() > 0) {
                let lastRecord = nextBatches.docs[nextBatches.docs.length - 1];
                nextBatches = await db
                    .collection("devices")
                    .orderBy("device_id")
                    .where(
                        "subscribed_daily_local_statistic_notification",
                        "==",
                        true
                    )
                    .startAfter(lastRecord)
                    .limit(500)
                    .get();
                nextBatches.forEach((snapshot) => {
                    let record = snapshot.data();
                    subscribers[record.language].push(record.device_token);
                });
            }
        }
        return subscribers;
    },
    async prepareStateStatisticSubscribersList(db) {
        let stateStatisticEnglishLangSubscribers = await db
            .collection("devices")
            .where("subscribed_daily_state_statistic_notification", "!=", "")
            .limit(500)
            .get();
        let subscribers = {};
        let tailRecord =
            stateStatisticEnglishLangSubscribers.docs[
                stateStatisticEnglishLangSubscribers.length - 1
            ];
        stateStatisticEnglishLangSubscribers.forEach((snapshot) => {
            let record = snapshot.data();
            let state = record.subscribed_daily_state_statistic_notification;
            if (!subscribers[state]) {
                subscribers[state] = {
                    en_US: [],
                    zh: [],
                };
            }
            subscribers[state][record.language].push(record.device_token);
        });
        if (tailRecord) {
            let nextBatches = await db
                .collection("devices")
                .where(
                    "subscribed_daily_state_statistic_notification",
                    "!=",
                    ""
                )
                .startAfter(tailRecord)
                .limit(500)
                .get();
            while (nextBatches.size() > 0) {
                let lastRecord = nextBatches.docs[nextBatches.docs.length - 1];
                nextBatches = await db
                    .collection("devices")
                    .where(
                        "subscribed_daily_state_statistic_notification",
                        "!=",
                        ""
                    )
                    .startAfter(lastRecord)
                    .limit(500)
                    .get();
                nextBatches.forEach((record) => {
                    if (subscribers[state] != undefined) {
                        subscribers[state] = {
                            en_US: [],
                            zh: [],
                        };
                    }
                    subscribers[state][record.language].push(
                        record.device_token
                    );
                });
            }
        }
        return subscribers;
    },
};
