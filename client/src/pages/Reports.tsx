import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Users, Package, FileText, Download } from "lucide-react";
import { api } from "@/lib/api";
import TopBar from "@/components/layout/TopBar";

export default function Reports() {
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: api.getDashboardStats,
  });

  const { data: medicines } = useQuery({
    queryKey: ["/api/medicines"],
    queryFn: api.getMedicines,
  });

  const { data: customers } = useQuery({
    queryKey: ["/api/users", "customer"],
    queryFn: () => api.getUsers("customer"),
  });

  const { data: sales } = useQuery({
    queryKey: ["/api/sales"],
    queryFn: api.getSales,
  });

  const { data: prescriptions } = useQuery({
    queryKey: ["/api/prescriptions"],
    queryFn: api.getPrescriptions,
  });

  const { data: lowStockItems } = useQuery({
    queryKey: ["/api/inventory/low-stock"],
    queryFn: api.getLowStockItems,
  });

  const reportCards = [
    {
      title: "Inventory Report",
      description: "Current stock levels and low stock alerts",
      icon: Package,
      color: "bg-blue-500",
      stats: [
        { label: "Total Medicines", value: medicines?.length || 0 },
        { label: "Low Stock Items", value: lowStockItems?.length || 0 },
      ],
    },
    {
      title: "Sales Report",
      description: "Sales performance and revenue analytics",
      icon: TrendingUp,
      color: "bg-green-500",
      stats: [
        { label: "Total Sales", value: sales?.length || 0 },
        { label: "Today's Revenue", value: stats?.todaysSales || "$"+stats?.totalRevenue },
      ],
    },
    {
      title: "Customer Report",
      description: "Customer demographics and activity",
      icon: Users,
      color: "bg-purple-500",
      stats: [
        { label: "Total Customers", value: customers?.length || 0 },
        { label: "Active Customers", value: customers?.filter((c: any) => c.isActive).length || 0 },
      ],
    },
    {
      title: "Prescription Report",
      description: "Prescription processing and verification status",
      icon: FileText,
      color: "bg-orange-500",
      stats: [
        { label: "Total Prescriptions", value: prescriptions?.length || 0 },
        { label: "Discarded Prescriptions", value: prescriptions?.filter((p: any) => p.status === "discard").length || 0 },
      ],
    },
  ];

  const generateReport = (reportType: string) => {
    // In a real application, this would generate and download actual reports
    alert(`Generating ${reportType} report...`);
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {reportCards.map((report, index) => {
          const Icon = report.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${report.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="text-white h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <p className="text-sm text-gray-500">{report.description}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => generateReport(report.title)}
                    className="flex items-center"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {report.stats.map((stat, statIndex) => (
                    <div key={statIndex} className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-sm text-gray-500">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Analytics Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Quick Analytics Summary
            </CardTitle>
            <Button onClick={() => generateReport("Complete Analytics")}>
              <Download className="h-4 w-4 mr-2" />
              Export All Reports
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top Selling Medicines */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Top Selling Categories</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pain Relief</span>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Supplements</span>
                  <span className="text-sm font-medium">30%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Antibiotics</span>
                  <span className="text-sm font-medium">25%</span>
                </div>
              </div>
            </div>

            {/* Monthly Trends */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">This Month vs Last Month</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Sales</span>
                  <span className="text-sm font-medium text-green-600">+12%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">New Customers</span>
                  <span className="text-sm font-medium text-green-600">+8%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Prescriptions</span>
                  <span className="text-sm font-medium text-blue-600">+5%</span>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Key Performance Indicators</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg. Sale Value</span>
                  <span className="text-sm font-medium">$45.60</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Customer Satisfaction</span>
                  <span className="text-sm font-medium">98.5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Prescription Accuracy</span>
                  <span className="text-sm font-medium">99.8%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
