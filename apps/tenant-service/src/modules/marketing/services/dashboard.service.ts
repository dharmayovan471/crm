import { Injectable } from '@nestjs/common';
import { eq, and, sql, desc, asc, lte, gte } from 'drizzle-orm';
import { TenantContext } from '../../common/context/tenant.context';
import {
  leads,
  customers,
  quotations,
  activities,
  salesTeams,
  salesTeamMembers,
  salesTargets,
  products,
  quotationItems,
  leadStatuses,
  users,
  regions,
  zones
} from '../../database/schemas/tenant.schema';

@Injectable()
export class DashboardService {
  // ==========================================
  // Summary Cards
  // ==========================================
  async getSummary() {
    const db = TenantContext.getDb();

    // Fetch counts from leads, customers, quotes, etc.
    const allLeads = await db.select().from(leads);
    const allCustomers = await db.select().from(customers);
    const allQuotes = await db.select().from(quotations);
    const statuses = await db.select().from(leadStatuses);

    const getStatusCount = (code: string) => {
      const statusObj = statuses.find((s) => s.code === code);
      if (!statusObj) return 0;
      return allLeads.filter((l) => l.leadStatusId === statusObj.id).length;
    };

    const newLeads = getStatusCount('NEW');
    const qualifiedLeads = getStatusCount('QUALIFIED');
    const disqualifiedLeads = getStatusCount('DISQUALIFIED');
    const noGoLeads = getStatusCount('NO_GO');
    const wonLeads = getStatusCount('WON');
    const lostLeads = getStatusCount('LOST');

    // Prospects = Leads not Won/Lost/Dropped
    const dropStatusIds = statuses.filter((s) => s.isDrop || s.isWon).map((s) => s.id);
    const prospects = allLeads.filter((l) => !l.leadStatusId || !dropStatusIds.includes(l.leadStatusId)).length;

    // Hot Leads = Score > 70 or activity in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentActivities = await db
      .select()
      .from(activities)
      .where(gte(activities.activityDate, sevenDaysAgo));
    
    const recentLeadIds = recentActivities.map((a) => a.leadId).filter(Boolean);
    const hotLeads = allLeads.filter((l) => l.leadScore > 70 || recentLeadIds.includes(l.id)).length;

    const activeQuotes = allQuotes.filter((q) => q.status === 'SENT' || q.status === 'DRAFT').length;

    return {
      totalLeads: allLeads.length,
      newLeads,
      qualifiedLeads,
      disqualifiedLeads,
      noGoLeads,
      prospects,
      customers: allCustomers.length,
      hotLeads,
      activeQuotations: activeQuotes,
      wonDeals: wonLeads,
      lostDeals: lostLeads,
    };
  }

  // ==========================================
  // Pipeline Stage Distribution
  // ==========================================
  async getPipeline() {
    const db = TenantContext.getDb();
    const allLeads = await db.select().from(leads);
    const statuses = await db.select().from(leadStatuses);

    // Sum of expected values of all opportunities
    let pipelineValue = 0;
    const stages = statuses.map((status) => {
      const stageLeads = allLeads.filter((l) => l.leadStatusId === status.id);
      const count = stageLeads.length;
      
      const value = stageLeads.reduce((sum, l) => {
        const val = l.expectedValue ? parseFloat(l.expectedValue.toString()) : 0;
        return sum + val;
      }, 0);

      pipelineValue += value;

      return {
        stageCode: status.code,
        stageName: status.name,
        count,
        value,
        percentage: 0,
      };
    });

    // Populate percentages
    stages.forEach((s) => {
      s.percentage = pipelineValue > 0 ? Math.round((s.value / pipelineValue) * 100) : 0;
    });

    return {
      pipelineValue,
      stages,
    };
  }

  // ==========================================
  // Target vs Actual Achievements
  // ==========================================
  async getTargetVsActual(yearInput?: number, monthInput?: number) {
    const db = TenantContext.getDb();
    const today = new Date();
    const year = yearInput || today.getFullYear();
    const month = monthInput || today.getMonth() + 1;

    // Get Target values
    const targets = await db
      .select()
      .from(salesTargets)
      .where(and(eq(salesTargets.year, year), eq(salesTargets.month, month)));
    
    const targetValue = targets.reduce((sum, t) => sum + parseFloat(t.targetValue.toString()), 0);

    // Actual Value = Approved quotations in this month/year or expected value of Won leads
    const approvedQuotes = await db
      .select()
      .from(quotations)
      .where(eq(quotations.status, 'APPROVED'));

    const actualValue = approvedQuotes.reduce((sum, q) => {
      const qDate = new Date(q.quoteDate);
      if (qDate.getFullYear() === year && qDate.getMonth() + 1 === month) {
        return sum + parseFloat(q.totalAmount.toString());
      }
      return sum;
    }, 0);

    const gap = targetValue - actualValue;
    const achievementPercent = targetValue > 0 ? Math.round((actualValue / targetValue) * 100) : 0;

    return {
      targetValue,
      actualValue,
      achievementPercentage: achievementPercent,
      gapAmount: gap,
    };
  }

  // ==========================================
  // Team Performance
  // ==========================================
  async getTeamPerformance() {
    const db = TenantContext.getDb();
    const teams = await db.select().from(salesTeams);
    const allLeads = await db.select().from(leads);
    const approvedQuotes = await db.select().from(quotations).where(eq(quotations.status, 'APPROVED'));

    const performance = teams.map((team) => {
      const teamLeads = allLeads.filter((l) => l.teamId === team.id);
      const leadsCount = teamLeads.length;
      
      // Converted/Won Leads count
      const wonStatusCount = teamLeads.filter((l) => l.expectedValue && parseFloat(l.expectedValue.toString()) > 0).length;
      
      const revenue = approvedQuotes
        .filter((q) => teamLeads.map((tl) => tl.id).includes(q.leadId || ''))
        .reduce((sum, q) => sum + parseFloat(q.totalAmount.toString()), 0);

      const pipelineValue = teamLeads.reduce((sum, l) => sum + (l.expectedValue ? parseFloat(l.expectedValue.toString()) : 0), 0);

      const conversion = leadsCount > 0 ? Math.round((wonStatusCount / leadsCount) * 100) : 0;

      return {
        teamName: team.teamName,
        totalLeads: leadsCount,
        qualifiedLeads: teamLeads.filter((l) => l.leadStatusId !== null).length,
        quotationsCount: approvedQuotes.filter((q) => teamLeads.map((tl) => tl.id).includes(q.leadId || '')).length,
        revenue,
        pipelineValue,
        conversionPercentage: conversion,
      };
    });

    // Rank by revenue desc
    return performance.sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }

  // ==========================================
  // Sales Person Performance
  // ==========================================
  async getSalesPersonPerformance() {
    const db = TenantContext.getDb();
    const allLeads = await db.select().from(leads);
    const allQuotes = await db.select().from(quotations).where(eq(quotations.status, 'APPROVED'));
    const allActivities = await db.select().from(activities);
    
    // Select unique assigned users
    const usersResult = await db.select().from(users);

    const performance = usersResult.map((u) => {
      const assigned = allLeads.filter((l) => l.assignedTo === u.id);
      const qualified = assigned.filter((l) => l.leadStatusId !== null);
      
      const revenue = allQuotes
        .filter((q) => assigned.map((l) => l.id).includes(q.leadId || ''))
        .reduce((sum, q) => sum + parseFloat(q.totalAmount.toString()), 0);

      const quoteValue = allQuotes
        .filter((q) => assigned.map((l) => l.id).includes(q.leadId || ''))
        .reduce((sum, q) => sum + parseFloat(q.totalAmount.toString()), 0);

      const hotCalls = allActivities.filter((a) => a.createdBy === u.id && a.type === 'HOT_CALL').length;
      
      const today = new Date();
      const followupsDue = allActivities.filter(
        (a) => a.createdBy === u.id && a.nextFollowupDate && new Date(a.nextFollowupDate) < today && a.status === 'OPEN'
      ).length;

      const conversion = assigned.length > 0 ? Math.round((qualified.length / assigned.length) * 100) : 0;

      return {
        userName: u.email,
        assignedLeads: assigned.length,
        qualifiedLeads: qualified.length,
        customersConverted: allQuotes.filter((q) => assigned.map((l) => l.id).includes(q.leadId || '')).length,
        quotationValue: quoteValue,
        revenueGenerated: revenue,
        hotCalls,
        followupsDue,
        conversionPercentage: conversion,
      };
    });

    const sorted = performance.sort((a, b) => b.revenueGenerated - a.revenueGenerated);
    return {
      topPerformers: sorted.slice(0, 5),
      bottomPerformers: sorted.slice(-5).reverse(),
    };
  }

  // ==========================================
  // Hot Leads Analytics
  // ==========================================
  async getHotLeads() {
    const db = TenantContext.getDb();
    const allLeads = await db.select().from(leads);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hotLeads = allLeads.filter((l) => l.leadScore > 70);
    const hotLeadsValue = hotLeads.reduce((sum, l) => sum + (l.expectedValue ? parseFloat(l.expectedValue.toString()) : 0), 0);

    const allActivities = await db.select().from(activities);
    
    const urgentFollowups = allActivities.filter((a) => a.nextFollowupDate && new Date(a.nextFollowupDate) < new Date() && a.status === 'OPEN').length;
    
    const todayMeetings = allActivities.filter((a) => {
      const aDate = new Date(a.activityDate);
      aDate.setHours(0,0,0,0);
      return a.type === 'MEETING' && aDate.getTime() === today.getTime();
    }).length;

    const todayCalls = allActivities.filter((a) => {
      const aDate = new Date(a.activityDate);
      aDate.setHours(0,0,0,0);
      return a.type === 'CALL' && aDate.getTime() === today.getTime();
    }).length;

    return {
      hotLeadsCount: hotLeads.length,
      hotLeadsValue,
      urgentFollowups,
      todayMeetings,
      todayCalls,
    };
  }

  // ==========================================
  // Monthly Trends Analytics (Last 12 Months)
  // ==========================================
  async getTrends() {
    const db = TenantContext.getDb();
    const allLeads = await db.select().from(leads);
    const allQuotes = await db.select().from(quotations).where(eq(quotations.status, 'APPROVED'));

    const trends = [];
    const today = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      
      const monthVal = d.getMonth();
      const yearVal = d.getFullYear();

      const monthLeads = allLeads.filter((l) => {
        const cDate = new Date(l.createdAt);
        return cDate.getMonth() === monthVal && cDate.getFullYear() === yearVal;
      });

      const monthQuotes = allQuotes.filter((q) => {
        const cDate = new Date(q.quoteDate);
        return cDate.getMonth() === monthVal && cDate.getFullYear() === yearVal;
      });

      const revenue = monthQuotes.reduce((sum, q) => sum + parseFloat(q.totalAmount.toString()), 0);
      const pipelineValue = monthLeads.reduce((sum, l) => sum + (l.expectedValue ? parseFloat(l.expectedValue.toString()) : 0), 0);

      trends.push({
        month: monthLabel,
        leadsCount: monthLeads.length,
        revenue,
        pipelineValue,
      });
    }

    return trends;
  }

  // ==========================================
  // Product Performance Rankings
  // ==========================================
  async getProductPerformance() {
    const db = TenantContext.getDb();
    const allProducts = await db.select().from(products);
    const allQuoteItems = await db.select().from(quotationItems);

    const performance = allProducts.map((p) => {
      const items = allQuoteItems.filter((qi) => qi.productId === p.id);
      const qty = items.reduce((sum, qi) => sum + qi.quantity, 0);
      const revenue = items.reduce((sum, qi) => sum + parseFloat(qi.amount.toString()), 0);

      return {
        productCode: p.productCode,
        productName: p.productName,
        quantity: qty,
        revenue,
        quotationCount: items.length,
      };
    });

    const sorted = performance.sort((a, b) => b.revenue - a.revenue);
    return {
      top10Products: sorted.slice(0, 10),
      bottom10Products: sorted.slice(-10).reverse(),
    };
  }

  // ==========================================
  // Regional Performance Analytics
  // ==========================================
  async getRegionalPerformance() {
    const db = TenantContext.getDb();
    const allLeads = await db.select().from(leads);
    const allRegions = await db.select().from(regions);

    const performance = allRegions.map((reg) => {
      const regLeads = allLeads.filter((l) => l.regionId === reg.id);
      const pipeline = regLeads.reduce((sum, l) => sum + (l.expectedValue ? parseFloat(l.expectedValue.toString()) : 0), 0);

      return {
        regionCode: reg.regionCode,
        regionName: reg.regionName,
        leadsCount: regLeads.length,
        pipelineValue: pipeline,
      };
    });

    return performance;
  }

  // ==========================================
  // Customer Analytics & CLV
  // ==========================================
  async getCustomerAnalytics() {
    const db = TenantContext.getDb();
    const allCustomers = await db.select().from(customers);
    const allQuotes = await db.select().from(quotations).where(eq(quotations.status, 'APPROVED'));

    const list = allCustomers.map((cust) => {
      const quotes = allQuotes.filter((q) => q.customerId === cust.id);
      const revenue = quotes.reduce((sum, q) => sum + parseFloat(q.totalAmount.toString()), 0);

      return {
        customerCode: cust.customerCode,
        companyName: cust.companyName,
        ordersCount: quotes.length,
        lifetimeValue: revenue,
        isRepeat: quotes.length > 1,
      };
    });

    const topCustomers = [...list].sort((a, b) => b.lifetimeValue - a.lifetimeValue).slice(0, 10);
    const newCustomersCount = list.filter((c) => c.ordersCount === 1).length;
    const repeatCustomersCount = list.filter((c) => c.ordersCount > 1).length;

    return {
      newCustomers: newCustomersCount,
      repeatCustomers: repeatCustomersCount,
      topCustomers,
    };
  }

  // ==========================================
  // Followups Tracking Details
  // ==========================================
  async getFollowups() {
    const db = TenantContext.getDb();
    const allActivities = await db.select().from(activities).where(eq(activities.status, 'OPEN'));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue = allActivities.filter((a) => a.nextFollowupDate && new Date(a.nextFollowupDate) < today);
    const upcoming = allActivities.filter((a) => a.nextFollowupDate && new Date(a.nextFollowupDate) > new Date(today.getTime() + 86400000));
    
    const todayFollowups = allActivities.filter((a) => {
      if (!a.nextFollowupDate) return false;
      const d = new Date(a.nextFollowupDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });

    return {
      overdueFollowups: overdue,
      todayFollowups: todayFollowups,
      upcomingFollowups: upcoming,
    };
  }

  // ==========================================
  // Weighted Pipeline Forecasting
  // ==========================================
  async getForecast() {
    const db = TenantContext.getDb();
    const allLeads = await db.select().from(leads);
    const statuses = await db.select().from(leadStatuses);

    // Probability settings
    const winProbabilities: Record<string, number> = {
      NEW: 0.1,
      CONTACTED: 0.2,
      FOLLOWUP: 0.3,
      QUALIFIED: 0.5,
      NEGOTIATION: 0.7,
      QUOTATION_SENT: 0.9,
      WON: 1.0,
      LOST: 0.0,
      DISQUALIFIED: 0.0,
      NO_GO: 0.0,
    };

    let weightedPipeline = 0;
    let expectedThisMonth = 0;
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    for (const lead of allLeads) {
      if (!lead.leadStatusId) continue;
      const statusObj = statuses.find((s) => s.id === lead.leadStatusId);
      if (!statusObj) continue;

      const prob = winProbabilities[statusObj.code] || 0;
      const value = lead.expectedValue ? parseFloat(lead.expectedValue.toString()) : 0;
      
      const weightedValue = value * prob;
      weightedPipeline += weightedValue;

      if (lead.expectedClosingDate) {
        const cDate = new Date(lead.expectedClosingDate);
        if (cDate.getMonth() === currentMonth && cDate.getFullYear() === currentYear) {
          expectedThisMonth += weightedValue;
        }
      }
    }

    return {
      weightedPipelineValue: weightedPipeline,
      expectedRevenueThisMonth: expectedThisMonth,
      expectedRevenueNextMonth: expectedThisMonth * 1.15, // Projected scaling
      expectedRevenueQuarter: expectedThisMonth * 3.2,
    };
  }

  // ==========================================
  // Reports Center Details
  // ==========================================
  async getLeadsReport() {
    const db = TenantContext.getDb();
    return db.select().from(leads);
  }

  async getCustomersReport() {
    const db = TenantContext.getDb();
    return db.select().from(customers);
  }

  async getQuotationsReport() {
    const db = TenantContext.getDb();
    return db.select().from(quotations);
  }
}
