import { db } from "../db";
import { users, subscriptions, subscriptionPlans, aiCostLogs } from "@shared/schema";
import { eq, and, sql, gte, lt, count, sum, desc } from "drizzle-orm";
import { subDays, startOfMonth, format, subMonths } from "date-fns";

export class FinancialService {
    /**
     * Calculate Monthly Recurring Revenue (MRR)
     * Sum of prices of all active subscriptions.
     */
    async calculateMRR() {
        // Get all active subscriptions joined with their plans
        const activeSubs = await db
            .select({
                price: subscriptionPlans.price,
                interval: subscriptionPlans.interval,
            })
            .from(subscriptions)
            .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
            .where(eq(subscriptions.status, 'active'));

        let mrr = 0;
        for (const sub of activeSubs) {
            if (sub.interval === 'month') {
                mrr += sub.price;
            } else if (sub.interval === 'year') {
                mrr += sub.price / 12;
            }
        }

        // Convert cents to dollars (assuming price is in cents as per schema)
        // Actually schema says price is integer (cents).
        return mrr / 100;
    }

    /**
     * Calculate Monthly Active Users (MAU)
     * Proxy: Users who have generated at least one AI cost log in the last 30 days.
     */
    async calculateMAU() {
        const thirtyDaysAgo = subDays(new Date(), 30);

        const result = await db
            .select({ count: count(sql`DISTINCT ${aiCostLogs.userId}`) })
            .from(aiCostLogs)
            .where(gte(aiCostLogs.createdAt, thirtyDaysAgo));

        return result[0]?.count || 0;
    }

    /**
     * Calculate Churn Rate (Monthly)
     * Simplified: (Cancelled this month / Total Active Start of Month) * 100
     * For now, just calc Cancelled in last 30 days vs Current Active.
     */
    async calculateChurn() {
        const thirtyDaysAgo = subDays(new Date(), 30);

        const cancelledCount = await db
            .select({ count: count() })
            .from(subscriptions)
            .where(
                and(
                    eq(subscriptions.status, 'canceled'),
                    gte(subscriptions.canceledAt, thirtyDaysAgo)
                )
            );

        const activeCount = await db
            .select({ count: count() })
            .from(subscriptions)
            .where(eq(subscriptions.status, 'active'));

        const cancelled = cancelledCount[0]?.count || 0;
        const active = activeCount[0]?.count || 0;
        const total = active + cancelled;

        if (total === 0) return 0;
        return (cancelled / total) * 100;
    }

    /**
     * Get AI Cost Metrics (Current Month)
     */
    async getAICostMetrics() {
        const startOfCurrentMonth = startOfMonth(new Date());

        const result = await db
            .select({
                totalCost: sum(aiCostLogs.costUsd),
                totalTokens: sum(aiCostLogs.inputTokens), // + outputTokens ideally
                requests: count(),
                distinctUsers: count(sql`DISTINCT ${aiCostLogs.userId}`)
            })
            .from(aiCostLogs)
            .where(gte(aiCostLogs.createdAt, startOfCurrentMonth));

        const stats = result[0];
        const totalCost = Number(stats.totalCost || 0);
        const requests = Number(stats.requests || 0);
        const distinctUsers = Number(stats.distinctUsers || 0);

        return {
            totalCost,
            requests,
            distinctUsers,
            costPerUser: distinctUsers > 0 ? totalCost / distinctUsers : 0,
            costPerRequest: requests > 0 ? totalCost / requests : 0
        };
    }

    /**
     * Get Top Features by Cost/Usage
     */
    async getFeatureUsageStats() {
        const result = await db
            .select({
                taskType: aiCostLogs.taskType,
                totalCost: sum(aiCostLogs.costUsd),
                count: count()
            })
            .from(aiCostLogs)
            .groupBy(aiCostLogs.taskType)
            .orderBy(desc(sum(aiCostLogs.costUsd)));

        return result.map(r => ({
            feature: r.taskType,
            cost: Number(r.totalCost),
            usageCount: Number(r.count)
        }));
    }

    /**
     * Aggregate all KPIs for the dashboard
     */
    /**
     * Calculate New MRR (Last 30 days)
     * Sum of prices of new subscriptions created in the last 30 days.
     */
    async calculateNewMRR() {
        const thirtyDaysAgo = subDays(new Date(), 30);

        const newSubs = await db
            .select({
                price: subscriptionPlans.price,
                interval: subscriptionPlans.interval,
            })
            .from(subscriptions)
            .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
            .where(
                and(
                    eq(subscriptions.status, 'active'),
                    gte(subscriptions.createdAt, thirtyDaysAgo)
                )
            );

        let newMrr = 0;
        for (const sub of newSubs) {
            if (sub.interval === 'month') {
                newMrr += sub.price;
            } else if (sub.interval === 'year') {
                newMrr += sub.price / 12;
            }
        }
        return newMrr / 100;
    }

    /**
     * Calculate New Users (Last 30 days)
     */
    async calculateNewUsers() {
        const thirtyDaysAgo = subDays(new Date(), 30);

        const result = await db
            .select({ count: count() })
            .from(users)
            .where(gte(users.createdAt, thirtyDaysAgo));

        return result[0]?.count || 0;
    }

    /**
     * Aggregate all KPIs for the dashboard
     */
    async getDashboardKPIs() {
        const mrr = await this.calculateMRR();
        const mau = await this.calculateMAU();
        const churn = await this.calculateChurn(); // returns percentage (e.g. 5.5)
        const aiMetrics = await this.getAICostMetrics();
        const featureStats = await this.getFeatureUsageStats();

        const newMrr = await this.calculateNewMRR();
        const newUsers = await this.calculateNewUsers();

        // Calculate Paying Users Count for ARPPU
        const activeSubsCountResult = await db
            .select({ count: count() })
            .from(subscriptions)
            .where(eq(subscriptions.status, 'active'));
        const payingUsers = activeSubsCountResult[0]?.count || 0;

        // ARPPU (Average Revenue Per Paying User)
        const arppu = payingUsers > 0 ? mrr / payingUsers : 0;

        // ARPU (Average Revenue Per Active User - typical SaaS def varies, sometimes same as ARPPU)
        // Let's keep existing logic of ARPU relative to MAU if we want Revenue Per Active User (including free)
        const arpu = mau > 0 ? mrr / mau : 0;

        // LTV Calculation: ARPU / Churn Rate
        // Churn is in percentage (0-100), need decimal (0-1). Avoid div by zero.
        // Using ARPPU for LTV is more standard for SaaS revenue LTV.
        const churnDecimal = churn > 0 ? churn / 100 : 0.01; // prevent div by zero
        const ltv = arppu / churnDecimal;

        // Net Revenue (Estimated)
        const netRevenue = mrr - aiMetrics.totalCost;

        return {
            financial: {
                mrr,
                arr: mrr * 12,
                churnRate: churn,
                arpu, // Revenue per MAU (Broad)
                arppu, // Revenue per Paying Customer (Specific)
                ltv,
                newMrr,
                netRevenue
            },
            operational: {
                mau,
                activeClinics: 0,
                totalUsers: 0, // Could query total user count if needed
                newUsers
            },
            ai: {
                totalCost: aiMetrics.totalCost,
                costPerAveUser: aiMetrics.costPerUser,
                grossMargin: 0,
                costToRevenueRatio: mrr > 0 ? (aiMetrics.totalCost / mrr) * 100 : 0,
                features: featureStats
            }
        };
    }
}

export const financialService = new FinancialService();
