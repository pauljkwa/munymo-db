import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, RefreshCw, AlertTriangle, Smartphone, Laptop, Tablet, HelpCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  LineChart,
  Line,
} from "recharts";
import { format } from "date-fns";
import brain from "brain";

// Types to match the backend API response
interface DeviceTypeAnalytics {
  desktop: number;
  mobile: number;
  tablet: number;
  unknown: number;
  total: number;
}

interface DeviceActivityAnalytics {
  daily_active: number;
  weekly_active: number;
  monthly_active: number;
  total_active: number;
  total_registered: number;
}

interface BrowserAnalytics {
  name: string;
  count: number;
  percentage: number;
}

interface OSAnalytics {
  name: string;
  count: number;
  percentage: number;
}

interface NotificationAnalytics {
  total_sent: number;
  delivery_success_rate: number;
  opt_in_rate: number;
  category_preferences: Record<string, number>;
}

interface DeviceAnalyticsData {
  device_types: DeviceTypeAnalytics;
  activity: DeviceActivityAnalytics;
  browsers: BrowserAnalytics[];
  operating_systems: OSAnalytics[];
  notifications: NotificationAnalytics;
  timestamp: string;
}

interface AnalyticsDashboardProps {
  setError: (error: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#8dd1e1'];

export function AnalyticsDashboard({ setError, setIsLoading }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<DeviceAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // Used to trigger refreshes

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        setIsLoading(true);
        
        const response = await brain.get_device_analytics();
        const data = await response.json();
        
        if (data.success && data.data.analytics) {
          setAnalytics(data.data.analytics);
        } else {
          throw new Error(data.message || "Failed to fetch analytics data");
        }
      } catch (err: any) {
        console.error("Error fetching device analytics:", err);
        setError(err.message || "An error occurred while fetching analytics data");
        toast.error("Failed to load analytics data");
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [setError, setIsLoading, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Prepare data for the charts
  const deviceTypeData = analytics ? [
    { name: "Desktop", value: analytics.device_types.desktop },
    { name: "Mobile", value: analytics.device_types.mobile },
    { name: "Tablet", value: analytics.device_types.tablet },
    { name: "Unknown", value: analytics.device_types.unknown },
  ] : [];

  const deviceActivityData = analytics ? [
    { name: "Daily Active", value: analytics.activity.daily_active },
    { name: "Weekly Active", value: analytics.activity.weekly_active },
    { name: "Monthly Active", value: analytics.activity.monthly_active },
    { name: "Total Active", value: analytics.activity.total_active },
    { name: "Total Registered", value: analytics.activity.total_registered },
  ] : [];

  const notificationCategoryData = analytics ? 
    Object.entries(analytics.notifications.category_preferences).map(([key, value]) => ({
      name: key,
      value,
    })) : [];

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Device Analytics</h2>
          <p className="text-muted-foreground mt-1">
            Comprehensive analytics for device usage across the platform
          </p>
          {analytics && (
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: {format(new Date(analytics.timestamp), "PPpp")}
            </p>
          )}
        </div>
        <Button onClick={handleRefresh} className="self-end md:self-auto">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Devices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.activity.total_registered || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics?.activity.total_active || 0} active devices
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Daily Active Devices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.activity.daily_active || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics?.activity.total_registered ? 
                    Math.round((analytics.activity.daily_active / analytics.activity.total_registered) * 100) :
                    0}% of total devices
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Most Common Device
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center">
                  {analytics ? (
                    <>
                      {analytics.device_types.desktop >= analytics.device_types.mobile && 
                       analytics.device_types.desktop >= analytics.device_types.tablet ? (
                        <>
                          <Laptop className="mr-2 h-5 w-5 text-primary" />
                          Desktop
                        </>
                      ) : analytics.device_types.mobile >= analytics.device_types.tablet ? (
                        <>
                          <Smartphone className="mr-2 h-5 w-5 text-primary" />
                          Mobile
                        </>
                      ) : (
                        <>
                          <Tablet className="mr-2 h-5 w-5 text-primary" />
                          Tablet
                        </>
                      )}
                    </>
                  ) : (
                    "Unknown"
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on active devices
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Notification Opt-in Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.notifications.opt_in_rate || 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Users who enabled push notifications
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Device Type Distribution</CardTitle>
                <CardDescription>
                  Breakdown of device types used on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {deviceTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} devices`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Device Activity</CardTitle>
                <CardDescription>
                  Active device metrics across different time periods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={deviceActivityData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" name="Devices" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Browser Usage</CardTitle>
                <CardDescription>
                  Distribution of browsers across all devices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics?.browsers || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {(analytics?.browsers || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name, props) => [
                        `${value} devices (${props.payload.percentage.toFixed(1)}%)`,
                        props.payload.name
                      ]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Operating System Usage</CardTitle>
                <CardDescription>
                  Distribution of operating systems across all devices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics?.operating_systems || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {(analytics?.operating_systems || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name, props) => [
                        `${value} devices (${props.payload.percentage.toFixed(1)}%)`,
                        props.payload.name
                      ]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Device Details</CardTitle>
              <CardDescription>
                Detailed breakdown of device types, browsers, and operating systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Device Types</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col items-center p-4 border rounded-lg">
                      <Laptop className="h-8 w-8 mb-2 text-primary" />
                      <span className="text-xl font-bold">{analytics?.device_types.desktop || 0}</span>
                      <span className="text-sm text-muted-foreground">Desktop</span>
                    </div>
                    <div className="flex flex-col items-center p-4 border rounded-lg">
                      <Smartphone className="h-8 w-8 mb-2 text-primary" />
                      <span className="text-xl font-bold">{analytics?.device_types.mobile || 0}</span>
                      <span className="text-sm text-muted-foreground">Mobile</span>
                    </div>
                    <div className="flex flex-col items-center p-4 border rounded-lg">
                      <Tablet className="h-8 w-8 mb-2 text-primary" />
                      <span className="text-xl font-bold">{analytics?.device_types.tablet || 0}</span>
                      <span className="text-sm text-muted-foreground">Tablet</span>
                    </div>
                    <div className="flex flex-col items-center p-4 border rounded-lg">
                      <HelpCircle className="h-8 w-8 mb-2 text-muted-foreground" />
                      <span className="text-xl font-bold">{analytics?.device_types.unknown || 0}</span>
                      <span className="text-sm text-muted-foreground">Unknown</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-2">Top Browsers</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="text-left py-2 px-4 bg-muted font-medium">Browser</th>
                          <th className="text-right py-2 px-4 bg-muted font-medium">Users</th>
                          <th className="text-right py-2 px-4 bg-muted font-medium">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(analytics?.browsers || []).slice(0, 5).map((browser, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-2 px-4">{browser.name}</td>
                            <td className="py-2 px-4 text-right">{browser.count}</td>
                            <td className="py-2 px-4 text-right">{browser.percentage.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-2">Top Operating Systems</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="text-left py-2 px-4 bg-muted font-medium">OS</th>
                          <th className="text-right py-2 px-4 bg-muted font-medium">Users</th>
                          <th className="text-right py-2 px-4 bg-muted font-medium">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(analytics?.operating_systems || []).slice(0, 5).map((os, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-2 px-4">{os.name}</td>
                            <td className="py-2 px-4 text-right">{os.count}</td>
                            <td className="py-2 px-4 text-right">{os.percentage.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Daily Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.activity.daily_active || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Weekly Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.activity.weekly_active || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last 7 days
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Monthly Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.activity.monthly_active || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last 30 days
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Activity Metrics</CardTitle>
              <CardDescription>
                Comparison of active devices across different time periods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={deviceActivityData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Number of Devices" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active vs. Inactive Devices</CardTitle>
              <CardDescription>
                Comparison of active and inactive devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Active", value: analytics?.activity.total_active || 0 },
                        { name: "Inactive", value: (analytics?.activity.total_registered || 0) - (analytics?.activity.total_active || 0) },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#0088FE" />
                      <Cell fill="#FF8042" />
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} devices`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Notification Opt-in Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.notifications.opt_in_rate || 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Users who enabled push notifications
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Notification Delivery Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.notifications.delivery_success_rate || 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Successfully delivered notifications
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Notifications Sent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.notifications.total_sent || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  All-time total
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Most Popular Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics && notificationCategoryData.length > 0 ? (
                  <>
                    <div className="text-xl font-bold capitalize">
                      {notificationCategoryData.sort((a, b) => b.value - a.value)[0]?.name.replace('_', ' ') || "None"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notificationCategoryData.sort((a, b) => b.value - a.value)[0]?.value || 0} users
                    </p>
                  </>
                ) : (
                  <div className="text-xl font-bold">No data</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Notification Category Preferences</CardTitle>
              <CardDescription>
                Distribution of user preferences for notification categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={notificationCategoryData.map(item => ({
                      ...item,
                      // Make category names more readable
                      name: item.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                    }))}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Number of Users" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Status</CardTitle>
              <CardDescription>
                Current status of notification service and delivery metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Push Notification Service</span>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                    Operational
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Email Notification Service</span>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                    Operational
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Notification Tracking System</span>
                  </div>
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
                    Limited Data
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
