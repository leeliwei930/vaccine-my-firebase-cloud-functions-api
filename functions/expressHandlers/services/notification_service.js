const moment = require("moment");
const axios = require("axios");
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
            en_GB: [],
            zh: [],
        };

        localSubscribers.forEach((snapshot) => {
            let record = snapshot.data();
            if (record.language.includes("zh")) {
                subscribers.zh.push(record.device_token);
            } else {
                subscribers.en_GB.push(record.device_token);
            }
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
            while (nextBatches.size > 0) {
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
                    if (record.language.includes("zh")) {
                        subscribers.zh.push(record.device_token);
                    } else {
                        subscribers.en_GB.push(record.device_token);
                    }
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
                    en_GB: [],
                    zh: [],
                };
            }
            if (record.language.includes("zh")) {
                subscribers[state].zh.push(record.device_token);
            } else {
                subscribers[state].en_GB.push(record.device_token);
            }
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
            while (nextBatches.size > 0) {
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
                            en_GB: [],
                            zh: [],
                        };
                    }
                    if (record.language.includes("zh")) {
                        subscribers[state].zh.push(record.device_token);
                    } else {
                        subscribers[state].en_GB.push(record.device_token);
                    }
                });
            }
        }
        return subscribers;
    },
    async pushLocalStatisticNotification(subscribers, firebaseAdmin, language) {
        let latestLocalStatResponse = await axios.get(
            "https://citf-express-api.techrino.net/api/vaccination/stats/malaysia/latest"
        );
        let record = latestLocalStatResponse.data.data;
        let date = moment(record.date).format("DD MMM YYYY");
        let message = {
            en_GB: {
                title: `Local Vaccination Progression Update`,
                body: `As of yesterday [${date}] ${this.formatNumber(
                    record.daily_partial
                )} people receive their first dose vaccine and ${this.formatNumber(
                    record.daily_full
                )} people receive second dose vaccine in Malaysia.`,
            },
            zh: {
                title: `国内疫苗接种计划进展`,
                body: `截至昨日 [${date}] 国内已有${this.formatNumber(
                    record.daily_partial
                )} 人接种首剂与 ${this.formatNumber(
                    record.daily_full
                )}人接种次剂疫苗。`,
            },
        };
        let responses = {
            results: [],
            failed_tokens: [],
        };
        if (subscribers.length > 0) {
            let subscriberChunks = this.splitNotificationBatchSubscribers(
                subscribers,
                500
            );

            let failedTokens = [];
            for (tokens of subscriberChunks) {
                let notificationPayload = this.generateLocalStatisticNotificationPayload(
                    language,
                    record.date,
                    message[language].title,
                    message[language].body,
                    subscribers
                );
                let response = await firebaseAdmin
                    .messaging()
                    .sendMulticast(notificationPayload);
                responses.results.push({
                    status: "accepted",
                    success_count: response.successCount,
                    responses: response.responses,
                    failed_count: response.failureCount,
                    message_title: message[language].title,
                    message_body: message[language].body,
                });
                if (response.failureCount > 0) {
                    response.responses.forEach((notificationResponse, idx) => {
                        if (!notificationResponse.success) {
                            failedTokens.push(tokens[idx]);
                        }
                    });
                }
            }
        }
        return responses;
    },

    async pushStateStatisticNotification(subscribers, firebaseAdmin) {
        let responses = {
            results: [],
            failed_tokens: [],
        };

        for (state of Object.keys(subscribers)) {
            for (lang of Object.keys(subscribers[state])) {
                try {
                    let response = await axios.get(
                        `https://citf-express-api.techrino.net/api/vaccination/stats/state/${state}/latest`
                    );
                    let record = response.data.data;
                    let date = moment(record.date).format("DD MMM YYYY");
                    let tokens = subscribers[state][lang];
                    let message = {
                        en_GB: {
                            title: `State Vaccination Progression Update`,
                            body: `${
                                record.state
                            } - As of yesterday [${date}] ${this.formatNumber(
                                record.daily_partial
                            )} people received their first dose and ${this.formatNumber(
                                record.daily_full
                            )} people received second dose vaccines.`,
                        },
                        zh: {
                            title: `州内疫苗接种进展`,
                            body: `${
                                record.state
                            } - 截至昨日 [${date}] 已有${this.formatNumber(
                                record.daily_partial
                            )} 人接种首剂疫苗 和${this.formatNumber(
                                record.daily_full
                            )} 人接种 次剂疫苗疫苗。`,
                        },
                    };
                    let title = message[lang].title;
                    let body = message[lang].body;
                    if (tokens.length > 0) {
                        let tokenBatch = this.splitNotificationBatchSubscribers(
                            tokens,
                            500
                        );
                        for (_tokens of tokenBatch) {
                            let notificationPayload = this.generateStateStatisticNotificationPayload(
                                record.date,
                                lang,
                                state,
                                title,
                                body,
                                _tokens
                            );
                            let notificationResponse = await firebaseAdmin
                                .messaging()
                                .sendMulticast(notificationPayload);
                            responses.results.push({
                                status: "accepted",
                                success_count:
                                    notificationResponse.successCount,
                                responses: notificationResponse.responses,
                                failed_count: notificationResponse.failureCount,
                                message_title: message[lang].title,
                                message_body: message[lang].body,
                            });
                            if (notificationResponse.failureCount > 0) {
                                notificationResponse.responses.forEach(
                                    (_notificationResponse, idx) => {
                                        if (!_notificationResponse.success) {
                                            responses.failed_tokens.push(
                                                tokens[idx]
                                            );
                                        }
                                    }
                                );
                            }
                        }
                    }
                } catch (error) {
                    console.log(error);
                }
            }
        }

        return responses;
        // en
    },
    generateLocalStatisticNotificationPayload(
        language,
        date,
        title,
        body,
        subscribers
    ) {
        return {
            name: `${language}_${date}_local_statistic_notification`,
            tokens: subscribers,
            notification: {
                title: title,
                body: body,
            },
            android: {
                notification: {
                    priority: "HIGH",
                    channel_id: "daily_local_statistic_channel",
                    sound: "default",
                },
            },
        };
    },

    generateStateStatisticNotificationPayload(
        date,
        lang,
        state,
        title,
        body,
        subscribers
    ) {
        return {
            name: `${lang}_${state}_${date}_state_statistic_notification`,
            tokens: subscribers,
            data: {
                state: state,
            },
            notification: {
                title: title,
                body: body,
            },
            android: {
                notification: {
                    priority: "HIGH",
                    channel_id: "daily_state_based_statistic_channel",
                    sound: "default",
                },
            },
        };
    },

    formatNumber(number) {
        return Intl.NumberFormat("en-US").format(number);
    },

    splitNotificationBatchSubscribers(subscribers, chunk) {
        let i,
            size = subscribers.length;
        let results = [];
        let tokens = [...subscribers];
        for (i = 0; i < size; i += chunk) {
            results.push([...tokens.slice(i, i + chunk)]);
        }
        return results;
    },
    async clearInvalidToken(db, tokens) {
        let response = {
            invalid_devices: [],
            deleted_devices: [],
        };
        if (tokens.length > 0) {
            for (token of tokens) {
                let invalidTokenSnapshot = await db
                    .collection("devices")
                    .where("device_token", "==", token)
                    .get();
                if (invalidTokenSnapshot.size > 0) {
                    let invalidToken = invalidTokenSnapshot.docs[0];
                    let isSuccess = await db
                        .collection("devices")
                        .doc(invalidToken.id)
                        .delete();
                    if (!isSuccess) {
                        response.invalid_devices.push(invalidToken.id);
                    } else {
                        response.deleted_devices.push(invalidToken.data());
                    }
                }
            }
        }
        return response;
    },
};
