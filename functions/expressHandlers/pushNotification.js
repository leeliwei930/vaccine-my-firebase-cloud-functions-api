const notificationService = require("../../services/notification_service");
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
                    language: req.body.device_lang,
                    subscribed_daily_local_statistic_notification:
                        req.body.subscribed_daily_local_statistic_notification,
                    subscribed_daily_state_statistic_notification:
                        req.body.subscribed_daily_state_statistic_notification,
                });
            deviceSnapshot = await deviceSnapshotQuery.get();
            device = deviceSnapshot.docs[0];
            return res.status(202).json({ data: device.data() });
        } else {
            let createdDeviceRef = await db.collection("devices").add({
                device_id: req.body.device_id,
                device_token: req.body.device_token,
                language: req.body.device_lang,
                subscribed_daily_local_statistic_notification:
                    req.body.subscribed_daily_local_statistic_notification,
                subscribed_daily_state_statistic_notification:
                    req.body.subscribed_daily_state_statistic_notification,
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
        let localSubscribers = await notificationService.prepareLocalStatisticSubscribersList(
            db
        );
        let stateSubscribers = await notificationService.prepareStateStatisticSubscribersList(
            db
        );
        let englishNotificationResponse = await notificationService.pushLocalStatisticNotification(
            localSubscribers["en_US"],
            firebaseAdmin,
            "en_US"
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
        return res.status(202).json({
            local_notification_response: {
                en_US: englishNotificationResponse,
                zh: chineseLangNotificationResponse,
            },
            state_subscribers: stateNotificationResponse,
        });
        // english lang
    },
};
