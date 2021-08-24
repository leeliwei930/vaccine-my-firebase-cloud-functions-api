const notificationService = require("./services/notification_service.js");
const moment = require("moment");
module.exports = {
    async registerDeviceToken(req, res, functions, db, log, firebaseAdmin) {
        let deviceSnapshotQuery = db
            .collection("devices")
            .where("device_id", "==", req.body.device_id);

        let deviceSnapshot = await deviceSnapshotQuery.get();
        if (deviceSnapshot.size > 0) {
            let device = deviceSnapshot.docs[0];
            await db
                .collection("devices")
                .doc(device.id)
                .set({
                    device_id: req.body.device_id,
                    device_token: req.body.device_token,
                    language: req.body.language,
                    subscribed_daily_local_statistic_notification:
                        req.body.subscribed_daily_local_statistic_notification,
                    subscribed_daily_state_statistic_notification:
                        req.body.subscribed_daily_state_statistic_notification,
                    last_active_at: moment.utc().unix(),
                });
            deviceSnapshot = await deviceSnapshotQuery.get();
            device = deviceSnapshot.docs[0];
            return res.status(202).json({ data: device.data() });
        } else {
            let createdDeviceRef = await db.collection("devices").add({
                device_id: req.body.device_id,
                device_token: req.body.device_token,
                language: req.body.language,
                subscribed_daily_local_statistic_notification:
                    req.body.subscribed_daily_local_statistic_notification,
                subscribed_daily_state_statistic_notification:
                    req.body.subscribed_daily_state_statistic_notification,
                last_active_at: moment.utc().unix(),
            });
            let createdDeviceSnapshot = await createdDeviceRef.get();
            return res.status(201).json({
                data: createdDeviceSnapshot.data(),
            });
        }
    },
    async dispatchPushNotificationsJobs(
        req,
        res,
        functions,
        db,
        log,
        firebaseAdmin
    ) {
        if (
            req.headers.authorization !=
            `Bearer ${functions.config().server.cronjob_key}`
        ) {
            return res.status(401).json({ result: "unauthorized" });
        }
        let localSubscribers = await notificationService.prepareLocalStatisticSubscribersList(
            db
        );
        let stateSubscribers = await notificationService.prepareStateStatisticSubscribersList(
            db
        );
        let englishNotificationResponse = await notificationService.pushLocalStatisticNotification(
            localSubscribers["en_GB"],
            firebaseAdmin,
            "en_GB"
        );
        let chineseLangNotificationResponse = await notificationService.pushLocalStatisticNotification(
            localSubscribers["zh"],
            firebaseAdmin,
            "zh"
        );
        let stateNotificationResponse = await notificationService.pushStateStatisticNotification(
            stateSubscribers,
            firebaseAdmin
        );
        let failed_tokens = [
            ...englishNotificationResponse.failed_tokens,
            ...chineseLangNotificationResponse.failed_tokens,
            ...stateNotificationResponse.failed_tokens,
        ];
        let cleanupResponse = await notificationService.clearInvalidToken(
            db,
            failed_tokens
        );
        return res.status(202).json({
            local_notification_response: {
                en_GB: englishNotificationResponse,
                zh: chineseLangNotificationResponse,
            },
            state_subscribers: stateNotificationResponse,
            device_cleanup: cleanupResponse,
        });
        // english lang
    },
};
