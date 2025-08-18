import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, 
  Store, 
  Bell, 
  Palette, 
  Shield, 
  Database, 
  Mail,
  DollarSign,
  Clock,
  Globe
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { toast } = useToast();
  
  // Business Settings State
  const [businessSettings, setBusinessSettings] = useState({
    companyName: "Liu Stock",
    address: "123 Business Street, City, State 12345",
    phone: "+1 (555) 123-4567",
    email: "contact@liustock.com",
    website: "www.liustock.com",
    taxId: "123-45-6789",
    currency: "USD",
    timezone: "America/New_York"
  });

  // System Settings State
  const [systemSettings, setSystemSettings] = useState({
    enableNotifications: true,
    enableEmailAlerts: true,
    enableSMSAlerts: false,
    autoBackup: true,
    lowStockThreshold: 10,
    orderEmailTemplate: "Dear customer, your order #{orderNumber} has been processed.",
    enableTwoFactor: false,
    sessionTimeout: 30
  });

  // Theme Settings State
  const [themeSettings, setThemeSettings] = useState({
    theme: "light",
    primaryColor: "blue",
    sidebarCollapsed: false,
    showAnimations: true,
    compactMode: false
  });

  const handleSaveBusinessSettings = () => {
    // In a real app, save to backend/database
    toast({
      title: "Business settings saved",
      description: "Your business information has been updated successfully.",
    });
  };

  const handleSaveSystemSettings = () => {
    // In a real app, save to backend/database
    toast({
      title: "System settings saved",
      description: "Your system preferences have been updated successfully.",
    });
  };

  const handleSaveThemeSettings = () => {
    // In a real app, save to backend/database and apply theme
    toast({
      title: "Theme settings saved",
      description: "Your appearance preferences have been updated successfully.",
    });
  };

  const handleExportData = () => {
    toast({
      title: "Data export started",
      description: "Your data export will be ready for download shortly.",
    });
  };

  const handleBackupNow = () => {
    toast({
      title: "Backup initiated",
      description: "System backup has been started and will complete in a few minutes.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your application preferences and configuration</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <SettingsIcon className="h-4 w-4" />
          Admin Panel
        </Badge>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Business
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Business Information
              </CardTitle>
              <CardDescription>
                Update your company details and business configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={businessSettings.companyName}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, companyName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input
                    id="taxId"
                    value={businessSettings.taxId}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, taxId: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={businessSettings.address}
                  onChange={(e) => setBusinessSettings({ ...businessSettings, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={businessSettings.phone}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={businessSettings.email}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={businessSettings.website}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, website: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select value={businessSettings.currency} onValueChange={(value) => setBusinessSettings({ ...businessSettings, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={businessSettings.timezone} onValueChange={(value) => setBusinessSettings({ ...businessSettings, timezone: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSaveBusinessSettings}>Save Business Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Configuration
              </CardTitle>
              <CardDescription>
                Configure system behavior and operational settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Automatic Backup</Label>
                    <p className="text-sm text-muted-foreground">Enable daily automatic backups</p>
                  </div>
                  <Switch
                    checked={systemSettings.autoBackup}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, autoBackup: checked })}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold">Low Stock Alert Threshold</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    value={systemSettings.lowStockThreshold}
                    onChange={(e) => setSystemSettings({ ...systemSettings, lowStockThreshold: parseInt(e.target.value) })}
                  />
                  <p className="text-sm text-muted-foreground">Alert when product stock falls below this number</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={systemSettings.sessionTimeout}
                    onChange={(e) => setSystemSettings({ ...systemSettings, sessionTimeout: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orderEmailTemplate">Order Email Template</Label>
                  <Textarea
                    id="orderEmailTemplate"
                    value={systemSettings.orderEmailTemplate}
                    onChange={(e) => setSystemSettings({ ...systemSettings, orderEmailTemplate: e.target.value })}
                    placeholder="Email template for order confirmations..."
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={handleSaveSystemSettings}>Save System Settings</Button>
                <Button variant="outline" onClick={handleBackupNow}>
                  <Database className="mr-2 h-4 w-4" />
                  Backup Now
                </Button>
                <Button variant="outline" onClick={handleExportData}>
                  <Globe className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>System Notifications</Label>
                    <p className="text-sm text-muted-foreground">Enable in-app notifications</p>
                  </div>
                  <Switch
                    checked={systemSettings.enableNotifications}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, enableNotifications: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Alerts
                    </Label>
                    <p className="text-sm text-muted-foreground">Receive alerts via email</p>
                  </div>
                  <Switch
                    checked={systemSettings.enableEmailAlerts}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, enableEmailAlerts: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>SMS Alerts</Label>
                    <p className="text-sm text-muted-foreground">Receive critical alerts via SMS</p>
                  </div>
                  <Switch
                    checked={systemSettings.enableSMSAlerts}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, enableSMSAlerts: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Two-Factor Authentication
                    </Label>
                    <p className="text-sm text-muted-foreground">Enable 2FA for enhanced security</p>
                  </div>
                  <Switch
                    checked={systemSettings.enableTwoFactor}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, enableTwoFactor: checked })}
                  />
                </div>
              </div>

              <Button onClick={handleSaveSystemSettings}>Save Notification Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance & Theme
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={themeSettings.theme} onValueChange={(value) => setThemeSettings({ ...themeSettings, theme: value })}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto (System)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <Select value={themeSettings.primaryColor} onValueChange={(value) => setThemeSettings({ ...themeSettings, primaryColor: value })}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="orange">Orange</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Collapse Sidebar by Default</Label>
                    <p className="text-sm text-muted-foreground">Start with a collapsed sidebar</p>
                  </div>
                  <Switch
                    checked={themeSettings.sidebarCollapsed}
                    onCheckedChange={(checked) => setThemeSettings({ ...themeSettings, sidebarCollapsed: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Enable Animations</Label>
                    <p className="text-sm text-muted-foreground">Show smooth transitions and animations</p>
                  </div>
                  <Switch
                    checked={themeSettings.showAnimations}
                    onCheckedChange={(checked) => setThemeSettings({ ...themeSettings, showAnimations: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Compact Mode</Label>
                    <p className="text-sm text-muted-foreground">Use smaller spacing and components</p>
                  </div>
                  <Switch
                    checked={themeSettings.compactMode}
                    onCheckedChange={(checked) => setThemeSettings({ ...themeSettings, compactMode: checked })}
                  />
                </div>
              </div>

              <Button onClick={handleSaveThemeSettings}>Save Appearance Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;