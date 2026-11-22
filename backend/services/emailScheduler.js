const User = require('../models/User');
const Application = require('../models/Application');
const emailService = require('./emailService');

/**
 * Background Scheduler for Automated Transactional Emails
 * 
 * Handles:
 * - Email 5: Interview reminder 24h before
 * - Email 6: Interview reminder 1h before
 * - Email 7: Follow-up reminder (7 days no update)
 * - Email 10: Weekly summary (Mondays)
 * - Email 11: Inactivity nudge (5 days without activity)
 */
class EmailScheduler {
    constructor() {
        this.intervalHandle = null;
        this.lastWeeklySummaryRun = null;
    }

    /**
     * Check and send 24h & 1h interview reminders
     */
    async processInterviewReminders() {
        const now = new Date();
        const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
        const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

        const in45m = new Date(now.getTime() + 45 * 60 * 1000);
        const in75m = new Date(now.getTime() + 75 * 60 * 1000);

        // 1. 24h Reminders
        const upcoming24h = await Application.find({
            interviewDate: { $gte: in23h, $lte: in25h },
            interviewReminder24hSent: { $ne: true }
        }).populate('user');

        for (const app of upcoming24h) {
            if (app.user) {
                try {
                    await emailService.sendInterviewReminder24h(app.user, app);
                    app.interviewReminder24hSent = true;
                    await app.save();
                } catch (e) {
                    console.error(`[Scheduler] 24h reminder error for app ${app._id}:`, e.message);
                }
            }
        }

        // 2. 1h Reminders
        const upcoming1h = await Application.find({
            interviewDate: { $gte: in45m, $lte: in75m },
            interviewReminder1hSent: { $ne: true }
        }).populate('user');

        for (const app of upcoming1h) {
            if (app.user) {
                try {
                    await emailService.sendInterviewReminder1h(app.user, app);
                    app.interviewReminder1hSent = true;
                    await app.save();
                } catch (e) {
                    console.error(`[Scheduler] 1h reminder error for app ${app._id}:`, e.message);
                }
            }
        }
    }

    /**
     * Check and send 7-day follow-up reminders
     */
    async processFollowUpReminders() {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

        const staleApps = await Application.find({
            status: { $in: ['Applied', 'Screening', 'Interviewing'] },
            updatedAt: { $gte: eightDaysAgo, $lte: sevenDaysAgo },
            followUpReminderSent: { $ne: true }
        }).populate('user');

        for (const app of staleApps) {
            if (app.user) {
                try {
                    const days = Math.round((now - new Date(app.updatedAt)) / (24 * 60 * 60 * 1000)) || 7;
                    await emailService.sendFollowUpReminder(app.user, app, days);
                    app.followUpReminderSent = true;
                    await app.save();
                } catch (e) {
                    console.error(`[Scheduler] Follow-up reminder error for app ${app._id}:`, e.message);
                }
            }
        }
    }

    /**
     * Check and send 5-day inactivity nudges
     */
    async processInactivityNudges() {
        const now = new Date();
        const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
        const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

        const inactiveUsers = await User.find({
            lastActiveAt: { $gte: sixDaysAgo, $lte: fiveDaysAgo },
            'emailPreferences.inactivityNudge': { $ne: false }
        });

        for (const user of inactiveUsers) {
            try {
                const pendingFollowUps = await Application.countDocuments({
                    user: user._id,
                    status: { $in: ['Applied', 'Screening'] },
                    updatedAt: { $lte: fiveDaysAgo }
                });

                await emailService.sendInactivityNudgeEmail(user, pendingFollowUps);
            } catch (e) {
                console.error(`[Scheduler] Inactivity nudge error for user ${user._id}:`, e.message);
            }
        }
    }

    /**
     * Check and send Weekly Summaries on Mondays
     */
    async processWeeklySummaries(force = false) {
        const now = new Date();
        const isMonday = now.getDay() === 1; // 1 is Monday
        const todayStr = now.toISOString().split('T')[0];

        if (!isMonday && !force) return;
        if (this.lastWeeklySummaryRun === todayStr && !force) return;

        this.lastWeeklySummaryRun = todayStr;
        const users = await User.find({ 'emailPreferences.weeklySummary': { $ne: false } });

        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        for (const user of users) {
            try {
                const sent = await Application.countDocuments({
                    user: user._id,
                    createdAt: { $gte: sevenDaysAgo }
                });

                const interviews = await Application.countDocuments({
                    user: user._id,
                    interviewDate: { $gte: sevenDaysAgo }
                });

                const responses = await Application.countDocuments({
                    user: user._id,
                    status: { $in: ['Screening', 'Interviewing', 'Offer', 'Rejected'] },
                    updatedAt: { $gte: sevenDaysAgo }
                });

                const goalPercent = Math.min(100, Math.round((sent / 5) * 100));
                const encouragementLine = sent > 0
                    ? `Great momentum this past week with ${sent} new outreach${sent > 1 ? 'es' : ''}!`
                    : "Every week is a fresh start to make high-impact submissions.";

                await emailService.sendWeeklySummaryEmail(user, {
                    sent,
                    responses,
                    interviews,
                    goalPercent,
                    encouragementLine,
                    aiSuggestion: 'Target 2 applications with high ATS alignment and schedule 1 networking outreach.'
                });
            } catch (e) {
                console.error(`[Scheduler] Weekly summary error for user ${user._id}:`, e.message);
            }
        }
    }

    /**
     * Execute all periodic checks
     */
    async runAllChecks() {
        try {
            await this.processInterviewReminders();
            await this.processFollowUpReminders();
            await this.processInactivityNudges();
            await this.processWeeklySummaries();
        } catch (err) {
            console.error('[Scheduler] Error running background checks:', err);
        }
    }

    /**
     * Start background timer
     */
    start(intervalMinutes = 15) {
        if (this.intervalHandle) clearInterval(this.intervalHandle);
        console.log(`[EmailScheduler] Started. Running checks every ${intervalMinutes} minutes.`);
        this.runAllChecks(); // Run on startup
        this.intervalHandle = setInterval(() => this.runAllChecks(), intervalMinutes * 60 * 1000);
    }

    stop() {
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = null;
        }
    }
}

module.exports = new EmailScheduler();
