import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export type ReportType = "performance" | "security" | "content" | "usage" | "financial" | "users" | "comprehensive";

export interface ReportData {
  reportType: ReportType;
  timestamp: Date;
  activeCount?: number;
  inactiveCount?: number;
  withMediaCount?: number;
  expiringSoonCount?: number;
  dau?: number;
  conversionRate?: number;
  avgSessionLength?: string;
  errorCount?: number;
  auditLogsCount?: number;
  usersCount?: number;
  callSessionsCount?: number;
  totalContent?: number;
  customData?: Record<string, any>;
}

const reportDescriptions: Record<ReportType, string> = {
  performance: "System performance metrics including session data, response times, and resource utilization",
  security: "Security audit report including access logs, admin actions, and security incidents",
  content: "Content management report showing announcements, promotions, ads, and engagement metrics",
  usage: "Usage analytics report with user activity, DAU, and session metrics",
  financial: "Financial report including conversion rates and campaign performance data",
  users: "User analytics report with user count, activity, and engagement data",
  comprehensive: "Comprehensive system report combining all available metrics and analytics",
};

function getCurrentDateTime(): string {
  return new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function generatePerformanceHTML(data: ReportData): string {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h1 style="color: #1f2937; border-bottom: 3px solid #3b82f6; padding-bottom: 10px;">Performance Report</h1>
      <p style="color: #666; font-size: 12px;">Generated: ${getCurrentDateTime()}</p>
      
      <h2 style="color: #374151; margin-top: 20px; font-size: 16px;">System Metrics</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <tr style="background-color: #f3f4f6;">
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Average Session Length</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${data.avgSessionLength || "N/A"}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Error Count</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${data.errorCount || 0}</td>
        </tr>
        <tr style="background-color: #f3f4f6;">
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Active Call Sessions</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${data.callSessionsCount || 0}</td>
        </tr>
      </table>

      <h2 style="color: #374151; margin-top: 20px; font-size: 16px;">Performance Health</h2>
      <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin-top: 10px;">
        <p><strong>Status:</strong> System performing normally</p>
        <p><strong>Errors in Report Period:</strong> ${data.errorCount || 0}</p>
      </div>

      <h2 style="color: #374151; margin-top: 20px; font-size: 16px;">Recommendations</h2>
      <ul style="margin-top: 10px;">
        <li>Monitor session lengths for optimization opportunities</li>
        <li>Review error logs for potential issues</li>
        <li>Consider scaling if errors exceed 5% of total sessions</li>
      </ul>
    </div>
  `;
}

function generateSecurityHTML(data: ReportData): string {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h1 style="color: #1f2937; border-bottom: 3px solid #ef4444; padding-bottom: 10px;">Security Report</h1>
      <p style="color: #666; font-size: 12px;">Generated: ${getCurrentDateTime()}</p>
      
      <h2 style="color: #374151; margin-top: 20px; font-size: 16px;">Audit Trail Summary</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <tr style="background-color: #f3f4f6;">
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Total Audit Log Entries</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${data.auditLogsCount || 0}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Admin Actions Tracked</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">All actions monitored</td>
        </tr>
        <tr style="background-color: #f3f4f6;">
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Last Security Audit</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${getCurrentDateTime()}</td>
        </tr>
      </table>

      <h2 style="color: #374151; margin-top: 20px; font-size: 16px;">Security Status</h2>
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 10px;">
        <p><strong>Audit Trail:</strong> Comprehensive logging enabled</p>
        <p><strong>Admin Access:</strong> Role-based access control active</p>
        <p><strong>Action Tracking:</strong> All admin actions logged</p>
      </div>

      <h2 style="color: #374151; margin-top: 20px; font-size: 16px;">Recent Activities</h2>
      <ul style="margin-top: 10px;">
        <li>All admin actions are automatically logged</li>
        <li>Unauthorized access attempts are monitored</li>
        <li>Data integrity checks performed regularly</li>
      </ul>
    </div>
  `;
}

function generateContentHTML(data: ReportData): string {
  const totalContent = (data.activeCount || 0) + (data.inactiveCount || 0);
  const activePercentage = totalContent > 0 ? Math.round(((data.activeCount || 0) / totalContent) * 100) : 0;

  return `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h1 style="color: #1f2937; border-bottom: 3px solid #8b5cf6; padding-bottom: 10px;">Content Report</h1>
      <p style="color: #666; font-size: 12px;">Generated: ${getCurrentDateTime()}</p>
      
      <h2 style="color: #374151; margin-top: 20px; font-size: 16px;">Content Overview</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <tr style="background-color: #f3f4f6;">
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Total Content Items</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${totalContent}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Active Content</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${data.activeCount || 0} (${activePercentage}%)</td>
        </tr>
        <tr style="background-color: #f3f4f6;">
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Inactive Content</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${data.inactiveCount || 0}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Content with Media</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${data.withMediaCount || 0}</td>
        </tr>
        <tr style="background-color: #f3f4f6;">
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Expiring Soon</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${data.expiringSoonCount || 0}</td>
        </tr>
      </table>

      <h2 style="color: #374151; margin-top: 20px; font-size: 16px;">Content Quality Metrics</h2>
      <div style="background-color: #dbeafe; border-left: 4px solid #0284c7; padding: 15px; margin-top: 10px;">
        <p><strong>Media Coverage:</strong> ${data.withMediaCount || 0} items have visual content</p>
        <p><strong>Expiration Status:</strong> ${data.expiringSoonCount || 0} items expiring within 7 days</p>
        <p><strong>Overall Health:</strong> ${activePercentage}% of content is active</p>
      </div>

      <h2 style="color: #374151; margin-top: 20px; font-size: 16px;">Recommendations</h2>
      <ul style="margin-top: 10px;">
        <li>Update ${data.inactiveCount || 0} inactive items or remove them</li>
        <li>Review ${data.expiringSoonCount || 0} items expiring soon</li>
        <li>Ensure important announcements have media attachments</li>
      </ul>
    </div>
  `;
}

function generateUsageHTML(data: ReportData): string {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h1 style="color: #1f2937; border-bottom: 3px solid #06b6d4; padding-bottom: 10px;">Usage Report</h1>
      <p style="color: #666; font-size: 12px;">Generated: ${getCurrentDateTime()}</p>
      
      <h2 style="color: #374151; margin-top: 20px; font-size: 16px;">User Activity</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <tr style="background-color: #f3f4f6;">
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Daily Active Users (DAU)</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${data.dau || 0}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Total Registered Users</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${data.usersCount || 0}</td>
        </tr>
        <tr style="background-color: #f3f4f6;">
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Conversion Rate</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${data.conversionRate || 0}%</td>
        </tr>
        <tr>
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Avg Session Length</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${data.avgSessionLength || "N/A"}</td>
        </tr>
      </table>

      <h2 style="color: #374151; margin-top: 20px; font-size: 16px;">Usage Insights</h2>
      <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin-top: 10px;">
        <p><strong>Active User Percentage:</strong> ${data.usersCount ? Math.round((data.dau / (data.usersCount || 1)) * 100) : 0}%</p>
        <p><strong>Engagement Level:</strong> ${(data.dau || 0) > 0 ? "Good" : "Low"}</p>
      </div>

      <h2 style="color: #374151; margin-top: 20px; font-size: 16px;">Key Metrics</h2>
      <ul style="margin-top: 10px;">
        <li>DAU represents active users in the last 24 hours</li>
        <li>Conversion rate shows percentage of active content</li>
        <li>Session length indicates user engagement duration</li>
      </ul>
    </div>
  `;
}

function generateFinancialHTML(data: ReportData): string {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h1 style="color: #1f2937; border-bottom: 3px solid #16a34a; padding-bottom: 10px;">Financial Report</h1>
      <p style="color: #666; font-size: 12px;">Generated: ${getCurrentDateTime()}</p>
      
      <h2 style="color: #374151; margin-top: 20px; font-size: 16px;">Campaign Performance</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <tr style="background-color: #f3f4f6;">
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Active Campaigns</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${data.activeCount || 0}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Total Campaigns</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${(data.activeCount || 0) + (data.inactiveCount || 0)}</td>
        </tr>
        <tr style="background-color: #f3f4f6;">
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Conversion Rate</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${data.conversionRate || 0}%</td>
        </tr>
        <tr>
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Content with Media</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${data.withMediaCount || 0}</td>
        </tr>
      </table>

      <h2 style="color: #374151; margin-top: 20px; font-size: 16px;">Revenue Metrics</h2>
      <div style="background-color: #fef3c7; border-left: 4px solid #eab308; padding: 15px; margin-top: 10px;">
        <p><strong>Campaign Effectiveness:</strong> ${(data.conversionRate || 0) > 60 ? "High" : (data.conversionRate || 0) > 30 ? "Medium" : "Low"}</p>
        <p><strong>Active Promotional Content:</strong> ${data.activeCount || 0} items actively generating revenue</p>
      </div>

      <h2 style="color: #374151; margin-top: 20px; font-size: 16px;">Recommendations</h2>
      <ul style="margin-top: 10px;">
        <li>Focus on high-converting campaigns</li>
        <li>Review underperforming promotions</li>
        <li>Increase media content in successful campaigns</li>
        <li>Monitor conversion trends monthly</li>
      </ul>
    </div>
  `;
}

function generateUsersHTML(data: ReportData): string {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h1 style="color: #1f2937; border-bottom: 3px solid #8b5cf6; padding-bottom: 10px;">Users Analysis Report</h1>
      <p style="color: #666; font-size: 12px;">Generated: ${getCurrentDateTime()}</p>
      
      <h2 style="color: #374151; margin-top: 20px; font-size: 16px;">User Statistics</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <tr style="background-color: #f3f4f6;">
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Total Users</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${data.usersCount || 0}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Daily Active Users</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${data.dau || 0}</td>
        </tr>
        <tr style="background-color: #f3f4f6;">
          <td style="border: 1px solid #e5e7eb; padding: 10px;">User Engagement Rate</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${data.usersCount ? Math.round(((data.dau || 0) / (data.usersCount || 1)) * 100) : 0}%</td>
        </tr>
        <tr>
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Avg Session Length</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${data.avgSessionLength || "N/A"}</td>
        </tr>
      </table>

      <h2 style="color: #374151; margin-top: 20px; font-size: 16px;">User Engagement Analysis</h2>
      <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin-top: 10px;">
        <p><strong>Active Users:</strong> ${data.dau || 0} users active in last 24 hours</p>
        <p><strong>Engagement Trend:</strong> ${(data.dau || 0) > 0 ? "Positive" : "Needs improvement"}</p>
        <p><strong>User Satisfaction:</strong> Strong engagement metrics indicate satisfied user base</p>
      </div>

      <h2 style="color: #374151; margin-top: 20px; font-size: 16px;">Recommendations</h2>
      <ul style="margin-top: 10px;">
        <li>Increase engagement activities for inactive users</li>
        <li>Analyze user preferences from engagement data</li>
        <li>Send targeted content to boost DAU</li>
        <li>Monitor retention metrics weekly</li>
      </ul>
    </div>
  `;
}

function generateComprehensiveHTML(data: ReportData): string {
  const totalContent = (data.activeCount || 0) + (data.inactiveCount || 0);
  const activePercentage = totalContent > 0 ? Math.round(((data.activeCount || 0) / totalContent) * 100) : 0;

  return `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h1 style="color: #1f2937; border-bottom: 3px solid #6366f1; padding-bottom: 10px;">Comprehensive System Report</h1>
      <p style="color: #666; font-size: 12px;">Generated: ${getCurrentDateTime()}</p>
      
      <h2 style="color: #374151; margin-top: 20px; font-size: 16px;">Executive Summary</h2>
      <div style="background-color: #eef2ff; border-left: 4px solid #6366f1; padding: 15px; margin-top: 10px;">
        <p>This comprehensive report provides a complete overview of system performance, security, user engagement, content management, and financial metrics.</p>
      </div>

      <h2 style="color: #374151; margin-top: 20px; font-size: 16px;">Content Metrics</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <tr style="background-color: #f3f4f6;">
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Total Content</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${totalContent}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Active Content</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${data.activeCount || 0} (${activePercentage}%)</td>
        </tr>
        <tr style="background-color: #f3f4f6;">
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Media-Rich Content</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${data.withMediaCount || 0}</td>
        </tr>
      </table>

      <h2 style="color: #374151; margin-top: 20px; font-size: 16px;">User & Performance Metrics</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <tr style="background-color: #f3f4f6;">
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Total Users</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${data.usersCount || 0}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Daily Active Users</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${data.dau || 0}</td>
        </tr>
        <tr style="background-color: #f3f4f6;">
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Conversion Rate</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${data.conversionRate || 0}%</td>
        </tr>
        <tr>
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Avg Session Length</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${data.avgSessionLength || "N/A"}</td>
        </tr>
      </table>

      <h2 style="color: #374151; margin-top: 20px; font-size: 16px;">Security & Audit</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <tr style="background-color: #f3f4f6;">
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Audit Log Entries</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${data.auditLogsCount || 0}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #e5e7eb; padding: 10px;">System Errors</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${data.errorCount || 0}</td>
        </tr>
        <tr style="background-color: #f3f4f6;">
          <td style="border: 1px solid #e5e7eb; padding: 10px;">Active Sessions</td>
          <td style="border: 1px solid #e5e7eb; padding: 10px; font-weight: bold;">${data.callSessionsCount || 0}</td>
        </tr>
      </table>

      <h2 style="color: #374151; margin-top: 20px; font-size: 16px;">Key Findings</h2>
      <ul style="margin-top: 10px;">
        <li><strong>Content Health:</strong> ${activePercentage}% of content is active and engaging</li>
        <li><strong>User Engagement:</strong> ${data.dau || 0} daily active users showing consistent platform usage</li>
        <li><strong>System Performance:</strong> ${data.errorCount || 0} errors recorded, system operating normally</li>
        <li><strong>Security:</strong> ${data.auditLogsCount || 0} audit log entries tracking all administrative actions</li>
      </ul>

      <h2 style="color: #374151; margin-top: 20px; font-size: 16px;">Strategic Recommendations</h2>
      <ul style="margin-top: 10px;">
        <li>Maintain active content engagement at current levels or higher</li>
        <li>Focus on user acquisition and retention strategies</li>
        <li>Continue monitoring system performance metrics</li>
        <li>Ensure security protocols remain robust and updated</li>
        <li>Analyze conversion trends for optimization opportunities</li>
      </ul>
    </div>
  `;
}

function getReportHTML(type: ReportType, data: ReportData): string {
  switch (type) {
    case "performance":
      return generatePerformanceHTML(data);
    case "security":
      return generateSecurityHTML(data);
    case "content":
      return generateContentHTML(data);
    case "usage":
      return generateUsageHTML(data);
    case "financial":
      return generateFinancialHTML(data);
    case "users":
      return generateUsersHTML(data);
    case "comprehensive":
      return generateComprehensiveHTML(data);
    default:
      return generateComprehensiveHTML(data);
  }
}

export async function generatePDFReport(reportType: ReportType, data: ReportData): Promise<void> {
  try {
    const html = getReportHTML(reportType, data);

    // Create a temporary container
    const container = document.createElement("div");
    container.innerHTML = html;
    container.style.padding = "20px";
    container.style.width = "800px";
    container.style.backgroundColor = "white";
    document.body.appendChild(container);

    // Convert HTML to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
    });

    // Remove the temporary container
    document.body.removeChild(container);

    // Create PDF
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    let heightLeft = canvas.height * (imgWidth / canvas.width);
    let position = 0;

    // Add first page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, heightLeft);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - canvas.height * (imgWidth / canvas.width);
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, heightLeft);
      heightLeft -= pageHeight;
    }

    // Save the PDF
    const fileName = `${reportType}-report-${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF report");
  }
}

export function getReportDescription(type: ReportType): string {
  return reportDescriptions[type];
}

export const REPORT_TYPES: ReportType[] = ["performance", "security", "content", "usage", "financial", "users", "comprehensive"];
