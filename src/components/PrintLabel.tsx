import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer, Download, X, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/DatePicker";
import { format } from "date-fns";

interface Order {
  id: string;
  order_code: string;
  customer_contact: string;
  delivery_round?: string;
  delivery_date: string;
}

interface OrderItem {
  order_id: string;
  product_name: string;
  quantity: number;
}

interface OrderWithItems extends Order {
  items: OrderItem[];
}

const PrintLabel = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersWithItems, setOrdersWithItems] = useState<OrderWithItems[]>([]);
  const [deliveryRounds, setDeliveryRounds] = useState<string[]>([]);
  const [selectedRound, setSelectedRound] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [customRound, setCustomRound] = useState("");
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState<Date | undefined>(undefined);
  const [previewMode, setPreviewMode] = useState(false);
  const labelsPerPage = 6; // Fixed at 6 labels per page (2x3 layout)
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_code, customer_contact, delivery_round, delivery_date')
        .order('delivery_date', { ascending: true });
      
      if (error) throw error;
      
      setOrders(data || []);
      
      // Extract unique delivery rounds
      const rounds = Array.from(new Set(
        data?.map(order => order.delivery_round).filter(Boolean) || []
      )) as string[];
      setDeliveryRounds(rounds);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive"
      });
    }
  };

  const handleRoundSelection = (round: string) => {
    setSelectedRound(round);
    if (round === "custom") {
      setSelectedOrders([]);
    } else {
      const roundOrders = orders
        .filter(order => order.delivery_round === round)
        .map(order => order.id);
      setSelectedOrders(roundOrders);
    }
  };

  const handleOrderSelection = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const filteredOrders = getFilteredOrders();
      setSelectedOrders(filteredOrders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const getFilteredOrders = () => {
    let filtered = orders;

    // Filter by delivery round
    if (selectedRound && selectedRound !== "custom") {
      filtered = filtered.filter(order => order.delivery_round === selectedRound);
    } else if (!selectedRound) {
      // If no round selected and no date filter, return empty
      if (!selectedDeliveryDate) {
        return [];
      }
    }

    // Filter by delivery date
    if (selectedDeliveryDate) {
      const formattedDate = format(selectedDeliveryDate, "yyyy-MM-dd");
      filtered = filtered.filter(order => order.delivery_date === formattedDate);
    }

    return filtered;
  };

  const updateDeliveryRound = async () => {
    if (!customRound.trim() || selectedOrders.length === 0) {
      toast({
        title: "Error",
        description: "Please enter a delivery round name and select orders",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({ delivery_round: customRound.trim() })
        .in('id', selectedOrders);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Updated ${selectedOrders.length} orders with delivery round: ${customRound}`
      });

      setCustomRound("");
      fetchOrders();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update delivery round",
        variant: "destructive"
      });
    }
  };

  const fetchOrderItems = async (orderIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('order_id, product_name, quantity')
        .in('order_id', orderIds);
      
      if (error) throw error;
      
      const ordersWithItems: OrderWithItems[] = orders
        .filter(order => selectedOrders.includes(order.id))
        .map(order => ({
          ...order,
          items: data?.filter(item => item.order_id === order.id) || []
        }));
      
      setOrdersWithItems(ordersWithItems);
      return ordersWithItems;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch order items",
        variant: "destructive"
      });
      return [];
    }
  };

  const generatePrintView = async () => {
    console.log('Print button clicked, selectedOrders:', selectedOrders);
    
    if (selectedOrders.length === 0) {
      console.log('No orders selected');
      toast({
        title: "No Orders Selected",
        description: "Please select orders to print labels",
        variant: "destructive"
      });
      return;
    }

    console.log('Fetching order items for orders:', selectedOrders);
    const selectedOrdersData = await fetchOrderItems(selectedOrders);
    console.log('Fetched order data:', selectedOrdersData);
    
    if (selectedOrdersData.length === 0) {
      console.log('No order data returned');
      toast({
        title: "Error", 
        description: "Failed to fetch order data for printing",
        variant: "destructive"
      });
      return;
    }

    // Create a new window with print styles
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      toast({
        title: "Popup Blocked - Please Enable Popups",
        description: "To print labels, please enable popups for this site in your browser settings. Look for the popup icon in your address bar and click 'Always allow popups from this site'.",
        variant: "destructive"
      });
      
      // Try alternative method - create a temporary page
      const printContent = generatePrintContent(selectedOrdersData);
      const blob = new Blob([printContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Create temporary link to download/view the print content
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = `shipping-labels-${new Date().toISOString().split('T')[0]}.html`;
      
      toast({
        title: "Alternative Download",
        description: "Since popups are blocked, the print file has been downloaded. Open it and use Ctrl+P to print.",
      });
      
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    const printContent = generatePrintContent(selectedOrdersData);
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const getLayoutConfig = (perPage: 4 | 6 | 8) => {
    switch (perPage) {
      case 4:
        return {
          labelsPerRow: 2,
          labelsPerPage: 4,
          labelWidth: 'calc(50% - 0.3cm)',
          labelHeight: '13.5cm',
          margin: '0 0.3cm 0.3cm 0'
        };
      case 8:
        return {
          labelsPerRow: 2,
          labelsPerPage: 8,
          labelWidth: 'calc(50% - 0.15cm)',
          labelHeight: '6.5cm',
          margin: '0 0.15cm 0.15cm 0'
        };
      case 6:
      default:
        return {
          labelsPerRow: 2,
          labelsPerPage: 6,
          labelWidth: 'calc(50% - 0.15cm)',
          labelHeight: '8.5cm',
          margin: '0 0.15cm 0.15cm 0'
        };
    }
  };

  const generatePrintContent = (selectedOrdersData: OrderWithItems[]) => {
    const layoutConfig = getLayoutConfig(labelsPerPage);
    const { labelsPerRow, labelsPerPage: perPage, labelWidth, labelHeight, margin } = layoutConfig;
    
    const labelStyle = `
      <style>
        @page {
          size: A4;
          margin: 0.4cm;
        }
        body {
          font-family: 'Sarabun', 'Noto Sans Thai', 'Arial Unicode MS', Arial, sans-serif;
          margin: 0;
          padding: 0;
          font-size: 10px;
        }
        /* Use inline-block to prevent label splitting across pages */
        .labels-container {
          width: 100%;
          font-size: 0; /* remove inline-block gaps */
        }
        .label {
          display: inline-block;
          vertical-align: top;
          width: ${labelWidth};
          height: ${labelHeight};
          border: 1px solid #333;
          padding: 0.15cm;
          margin: ${margin};
          box-sizing: border-box;
          page-break-inside: avoid;
          break-inside: avoid;
          overflow: hidden;
          font-size: 10px; /* reset font size for children */
        }
        .label:nth-child(2n) {
          margin-right: 0;
        }
        .label-header {
          text-align: center;
          margin-bottom: 0.1cm;
          padding-bottom: 0.08cm;
          border-bottom: 1px solid #333;
        }
        .order-code {
          font-size: 11px;
          font-weight: bold;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        .address-section {
          margin-bottom: 0.1cm;
        }
        .address-title {
          font-size: 8px;
          font-weight: bold;
          background-color: #f0f0f0;
          padding: 0.08cm;
          margin-bottom: 0.03cm;
          border: 1px solid #333;
        }
        .address-content {
          font-size: 7px;
          line-height: 1.15;
          padding: 0.06cm;
          border: 1px solid #333;
          height: 1cm;
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
        }
        .sender-address {
          background-color: #f9f9f9;
        }
        .receiver-address {
          background-color: white;
        }
        .items-section {
          margin-top: 0.08cm;
        }
        .items-title {
          font-size: 8px;
          font-weight: bold;
          background-color: #f0f0f0;
          padding: 0.08cm;
          border: 1px solid #333;
          margin-bottom: 0.03cm;
        }
        .items-content {
          border: 1px solid #333;
          padding: 0.08cm;
          background-color: white;
          min-height: 2.2cm;
          word-wrap: break-word;
          overflow-wrap: break-word;
          overflow: hidden;
        }
        .item-row {
          display: flex;
          justify-content: space-between;
          font-size: 7px;
          line-height: 1.15;
          margin-bottom: 0.04cm;
        }
        .item-name {
          flex-grow: 1;
          margin-right: 0.2cm;
          word-wrap: break-word;
          overflow-wrap: break-word;
          max-width: 70%;
        }
        .item-qty {
          font-weight: bold;
          min-width: 1cm;
          text-align: right;
        }
        .page-break {
          break-before: page;
          width: 100%;
          height: 0;
          display: block;
        }
        @media print {
          .no-print {
            display: none;
          }
        }
      </style>
    `;

    const senderAddress = "หลิวเหล่าซือ 145 Summer Hotel ถ.ปฏิพัทธ์ ต.ตลาดเหนือ อ.เมือง จ.ภูเก็ต 83000 0647545296";
    
    const labelsHtml = selectedOrdersData.map((order, index) => {
      const receiverAddress = order.customer_contact || '';
      const shouldPageBreak = index > 0 && index % perPage === 0;
      
      const itemsHtml = order.items.map(item => `
        <div class="item-row">
          <div class="item-name">${item.product_name}</div>
          <div class="item-qty">จำนวน ${item.quantity}</div>
        </div>
      `).join('');
      
      return `
        ${shouldPageBreak ? '<div class="page-break"></div>' : ''}
        <div class="label">
          <div class="label-header">
            <div class="order-code">ORDER-${order.order_code}</div>
          </div>
          
          <div class="address-section">
            <div class="address-title">ที่อยู่ผู้ส่ง (FROM)</div>
            <div class="address-content sender-address">${senderAddress}</div>
          </div>
          
          <div class="address-section">
            <div class="address-title">ที่อยู่ผู้รับ (TO)</div>
            <div class="address-content receiver-address">${receiverAddress}</div>
          </div>
          
          <div class="items-section">
            <div class="items-title">รายการสั่งซื้อ (ORDER ITEMS)</div>
            <div class="items-content">
              ${itemsHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html lang="th">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Delivery Labels</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&family=Noto+Sans+Thai:wght@400;600;700&display=swap" rel="stylesheet">
          ${labelStyle}
        </head>
        <body>
          <div class="no-print" style="text-align: center; padding: 1cm; background: #f5f5f5; margin-bottom: 1cm;">
            <h2>Shipping Labels Preview</h2>
            <p>${selectedOrdersData.length} ใบปะหน้า selected</p>
            <button onclick="window.print()" style="padding: 0.5cm 1cm; font-size: 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Print Shipping Labels</button>
          </div>
          <div class="labels-container">
            ${labelsHtml}
          </div>
        </body>
      </html>
    `;
  };

  const filteredOrders = getFilteredOrders();

  const togglePreview = async () => {
    if (!previewMode && selectedOrders.length > 0) {
      await fetchOrderItems(selectedOrders);
    }
    setPreviewMode(!previewMode);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold">Print Labels</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={togglePreview} 
            disabled={selectedOrders.length === 0}
          >
            {previewMode ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Preview ({selectedOrders.length})
              </>
            )}
          </Button>
          <Button onClick={generatePrintView} disabled={selectedOrders.length === 0}>
            <Printer className="h-4 w-4 mr-2" />
            Print Labels ({selectedOrders.length})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Delivery Date</Label>
              <div className="flex gap-2">
                <DatePicker
                  date={selectedDeliveryDate}
                  onDateChange={setSelectedDeliveryDate}
                  placeholder="Filter by delivery date"
                />
                {selectedDeliveryDate && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSelectedDeliveryDate(undefined)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label>Delivery Round</Label>
              <Select value={selectedRound} onValueChange={handleRoundSelection}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose delivery round" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Selection</SelectItem>
                  {deliveryRounds.map(round => (
                    <SelectItem key={round} value={round}>{round}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRound === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="custom-round">New Delivery Round</Label>
                <Input
                  id="custom-round"
                  placeholder="Enter delivery round name"
                  value={customRound}
                  onChange={(e) => setCustomRound(e.target.value)}
                />
                <Button 
                  onClick={updateDeliveryRound} 
                  disabled={!customRound.trim() || selectedOrders.length === 0}
                  className="w-full"
                >
                  Assign to Selected Orders
                </Button>
              </div>
            )}
            
            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <strong>Layout:</strong> 6 labels per page (2×3)
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Orders 
                {selectedRound && selectedRound !== "custom" && ` - ${selectedRound}`}
              </CardTitle>
              {filteredOrders.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all">Select All</Label>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {selectedDeliveryDate || selectedRound 
                  ? "No orders found for the selected filters" 
                  : "Please select a delivery date or delivery round"}
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredOrders.map(order => {
                  const lines = order.customer_contact.split('\n');
                  const customerName = lines[0] || '';
                  const customerPhone = lines[1] || '';
                  
                  return (
                    <div key={order.id} className="flex items-start space-x-3 p-3 border rounded">
                      <Checkbox
                        id={order.id}
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={(checked) => handleOrderSelection(order.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{order.order_code}</p>
                            <p className="text-sm">{customerName}</p>
                            <p className="text-sm text-muted-foreground">{customerPhone}</p>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <p>Delivery: {order.delivery_date}</p>
                            {order.delivery_round && (
                              <p>Round: {order.delivery_round}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Section */}
      {previewMode && ordersWithItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Label Preview (6 labels per page - 2×3 layout)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-background">
              <div 
                className="grid gap-4" 
                style={{ 
                  gridTemplateColumns: 'repeat(2, 1fr)',
                }}
              >
                {ordersWithItems.map((order) => {
                  const senderAddress = "หลิวเหล่าซือ 145 Summer Hotel ถ.ปฏิพัทธ์ ต.ตลาดเหนือ อ.เมือง จ.ภูเก็ต 83000 0647545296";
                  const receiverAddress = order.customer_contact || '';
                  
                  return (
                    <div 
                      key={order.id} 
                      className="border-2 border-border rounded p-3 text-xs"
                      style={{
                        aspectRatio: '1/0.9'
                      }}
                    >
                      <div className="text-center border-b border-border pb-2 mb-2">
                        <div className="font-bold text-sm">ORDER-{order.order_code}</div>
                      </div>
                      
                      <div className="mb-2">
                        <div className="text-[10px] font-bold bg-muted px-2 py-1 mb-1 border border-border">
                          ที่อยู่ผู้ส่ง (FROM)
                        </div>
                        <div className="text-[9px] leading-tight px-2 py-1 border border-border bg-muted/30 line-clamp-3">
                          {senderAddress}
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <div className="text-[10px] font-bold bg-muted px-2 py-1 mb-1 border border-border">
                          ที่อยู่ผู้รับ (TO)
                        </div>
                        <div className="text-[9px] leading-tight px-2 py-1 border border-border line-clamp-3">
                          {receiverAddress}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-[10px] font-bold bg-muted px-2 py-1 mb-1 border border-border">
                          รายการสั่งซื้อ (ORDER ITEMS)
                        </div>
                        <div className="border border-border px-2 py-1 text-[9px] space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="truncate mr-2">{item.product_name}</span>
                              <span className="font-bold whitespace-nowrap">จำนวน {item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PrintLabel;