import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  order_code: string;
  customer_contact: string;
  delivery_round?: string;
  delivery_date: string;
}

const PrintLabel = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryRounds, setDeliveryRounds] = useState<string[]>([]);
  const [selectedRound, setSelectedRound] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [customRound, setCustomRound] = useState("");
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
    if (selectedRound === "custom") {
      return orders;
    } else if (selectedRound) {
      return orders.filter(order => order.delivery_round === selectedRound);
    }
    return [];
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

  const generatePrintView = () => {
    const selectedOrdersData = orders.filter(order => selectedOrders.includes(order.id));
    
    if (selectedOrdersData.length === 0) {
      toast({
        title: "No Orders Selected",
        description: "Please select orders to print labels",
        variant: "destructive"
      });
      return;
    }

    // Create a new window with print styles
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const labelsPerRow = 2;
    const labelsPerPage = 6;
    
    const labelStyle = `
      <style>
        @page {
          size: A4;
          margin: 0.5cm;
        }
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        .labels-container {
          display: grid;
          grid-template-columns: repeat(${labelsPerRow}, 1fr);
          gap: 0.5cm;
          width: 100%;
        }
        .label {
          border: 2px solid #333;
          padding: 0.5cm;
          height: 8cm;
          box-sizing: border-box;
          break-inside: avoid;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .label-header {
          border-bottom: 1px solid #333;
          padding-bottom: 0.2cm;
          margin-bottom: 0.3cm;
        }
        .order-code {
          font-size: 16px;
          font-weight: bold;
          text-align: center;
        }
        .customer-info {
          flex-grow: 1;
        }
        .customer-name {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 0.2cm;
        }
        .customer-phone {
          font-size: 12px;
          margin-bottom: 0.3cm;
        }
        .customer-address {
          font-size: 11px;
          line-height: 1.3;
          white-space: pre-wrap;
        }
        .page-break {
          page-break-before: always;
        }
        @media print {
          .no-print {
            display: none;
          }
        }
      </style>
    `;

    const labelsHtml = selectedOrdersData.map((order, index) => {
      const lines = order.customer_contact.split('\n');
      const customerName = lines[0] || '';
      const customerPhone = lines[1] || '';
      const customerAddress = lines.slice(2).join('\n') || '';
      
      const shouldPageBreak = index > 0 && index % labelsPerPage === 0;
      
      return `
        ${shouldPageBreak ? '<div class="page-break"></div>' : ''}
        <div class="label">
          <div class="label-header">
            <div class="order-code">${order.order_code}</div>
          </div>
          <div class="customer-info">
            <div class="customer-name">${customerName}</div>
            <div class="customer-phone">${customerPhone}</div>
            <div class="customer-address">${customerAddress}</div>
          </div>
        </div>
      `;
    }).join('');

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Delivery Labels</title>
          ${labelStyle}
        </head>
        <body>
          <div class="no-print" style="text-align: center; padding: 1cm; background: #f5f5f5; margin-bottom: 1cm;">
            <h2>Delivery Labels Preview</h2>
            <p>${selectedOrdersData.length} labels selected</p>
            <button onclick="window.print()" style="padding: 0.5cm 1cm; font-size: 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Print Labels</button>
          </div>
          <div class="labels-container">
            ${labelsHtml}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const filteredOrders = getFilteredOrders();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Print Labels</h1>
        <Button onClick={generatePrintView} disabled={selectedOrders.length === 0}>
          <Printer className="h-4 w-4 mr-2" />
          Print Labels ({selectedOrders.length})
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Delivery Round Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Delivery Round</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Existing Delivery Rounds</Label>
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
                {selectedRound ? "No orders found for this delivery round" : "Please select a delivery round"}
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
    </div>
  );
};

export default PrintLabel;