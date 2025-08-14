-- Insert ASP Cranes Professional Template
-- First, ensure the styles column exists
ALTER TABLE quotation_templates ADD COLUMN IF NOT EXISTS styles JSONB DEFAULT '{}'::jsonb;

-- Insert the ASP Cranes Professional Template
INSERT INTO quotation_templates (
    name, 
    description, 
    content,
    styles,
    is_default,
    created_by
) VALUES (
    'ASP Cranes Professional Template',
    'Professional quotation template matching ASP Cranes branding and layout with company header, customer details, equipment table, and terms',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>ASP Cranes Quotation</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: white;
            color: #333;
            line-height: 1.4;
        }
        .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 30px; 
            padding-bottom: 20px; 
            border-bottom: 3px solid #2563eb;
        }
        .logo-section { 
            display: flex; 
            align-items: center; 
            gap: 15px;
        }
        .logo { 
            width: 80px; 
            height: 80px; 
            background: #2563eb; 
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 24px;
        }
        .company-info h1 { 
            margin: 0; 
            color: #2563eb; 
            font-size: 28px; 
            font-weight: bold;
        }
        .company-info p { 
            margin: 5px 0; 
            color: #666; 
            font-size: 14px;
        }
        .quotation-info { 
            text-align: right; 
            color: #333;
        }
        .quotation-info h2 { 
            margin: 0; 
            color: #2563eb; 
            font-size: 24px;
        }
        .quotation-info p { 
            margin: 5px 0; 
            font-size: 14px;
        }
        .content-section { 
            margin: 30px 0;
        }
        .section-title { 
            background: #f8fafc; 
            padding: 12px 20px; 
            margin: 20px 0 10px 0; 
            border-left: 4px solid #2563eb; 
            font-weight: bold; 
            color: #2563eb;
            font-size: 16px;
        }
        .customer-details { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 30px; 
            margin: 20px 0;
        }
        .detail-group h3 { 
            margin: 0 0 15px 0; 
            color: #2563eb; 
            font-size: 16px; 
            font-weight: bold;
        }
        .detail-item { 
            display: flex; 
            margin: 8px 0;
        }
        .detail-label { 
            font-weight: bold; 
            min-width: 120px; 
            color: #374151;
        }
        .detail-value { 
            color: #6b7280;
        }
        .equipment-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .equipment-table th { 
            background: #2563eb; 
            color: white; 
            padding: 12px; 
            text-align: left; 
            font-weight: bold;
            font-size: 14px;
        }
        .equipment-table td { 
            padding: 12px; 
            border-bottom: 1px solid #e5e7eb; 
            color: #374151;
        }
        .equipment-table tr:nth-child(even) { 
            background: #f9fafb;
        }
        .equipment-table tr:hover { 
            background: #f3f4f6;
        }
        .pricing-section { 
            margin: 30px 0; 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 8px;
        }
        .pricing-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 10px 0; 
            padding: 8px 0;
            color: #374151;
        }
        .pricing-row.total { 
            border-top: 2px solid #2563eb; 
            font-weight: bold; 
            font-size: 18px; 
            color: #2563eb;
        }
        .terms-section { 
            margin: 30px 0; 
            padding: 20px; 
            background: #fefefe; 
            border: 1px solid #e5e7eb; 
            border-radius: 8px;
        }
        .terms-section h3 { 
            color: #2563eb; 
            margin: 0 0 15px 0;
        }
        .terms-section ul { 
            margin: 0; 
            padding-left: 20px;
        }
        .terms-section li { 
            margin: 8px 0; 
            color: #374151;
        }
        .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 2px solid #e5e7eb; 
            text-align: center; 
            color: #6b7280; 
            font-size: 14px;
        }
        .signature-section { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 40px; 
            margin: 40px 0;
        }
        .signature-box { 
            text-align: center; 
            padding: 20px; 
            border: 1px solid #e5e7eb; 
            border-radius: 8px;
        }
        .signature-line { 
            border-top: 1px solid #374151; 
            margin: 40px 0 10px 0;
        }
        @media print {
            body { margin: 0; padding: 15px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-section">
            <div class="logo">ASP</div>
            <div class="company-info">
                <h1>ASP CRANES</h1>
                <p>Crane Rental & Equipment Solutions</p>
                <p>📧 contact@aspcranes.com | 📞 +1 (555) 123-4567</p>
                <p>📍 Industrial District, City, State 12345</p>
            </div>
        </div>
        <div class="quotation-info">
            <h2>QUOTATION</h2>
            <p><strong>Quote #:</strong> {{quotation.id}}</p>
            <p><strong>Date:</strong> {{quotation.date}}</p>
            <p><strong>Valid Until:</strong> {{quotation.validUntil}}</p>
        </div>
    </div>

    <div class="content-section">
        <div class="section-title">Customer Information</div>
        <div class="customer-details">
            <div class="detail-group">
                <h3>Bill To:</h3>
                <div class="detail-item">
                    <span class="detail-label">Company:</span>
                    <span class="detail-value">{{customer.name}}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Contact:</span>
                    <span class="detail-value">{{customer.contactPerson}}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Phone:</span>
                    <span class="detail-value">{{customer.phone}}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">{{customer.email}}</span>
                </div>
            </div>
            <div class="detail-group">
                <h3>Project Details:</h3>
                <div class="detail-item">
                    <span class="detail-label">Project:</span>
                    <span class="detail-value">{{project.name}}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Location:</span>
                    <span class="detail-value">{{project.location}}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Duration:</span>
                    <span class="detail-value">{{project.duration}} days</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Start Date:</span>
                    <span class="detail-value">{{project.startDate}}</span>
                </div>
            </div>
        </div>
    </div>

    <div class="content-section">
        <div class="section-title">Equipment & Services</div>
        <table class="equipment-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Duration</th>
                    <th>Rate/Day</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                {{#each equipment}}
                <tr>
                    <td>{{this.name}}</td>
                    <td>{{this.description}}</td>
                    <td>{{this.quantity}}</td>
                    <td>{{this.duration}} days</td>
                    <td>${{this.ratePerDay}}</td>
                    <td>${{this.totalAmount}}</td>
                </tr>
                {{/each}}
            </tbody>
        </table>
    </div>

    <div class="pricing-section">
        <div class="pricing-row">
            <span>Subtotal:</span>
            <span>${{pricing.subtotal}}</span>
        </div>
        <div class="pricing-row">
            <span>Delivery & Setup:</span>
            <span>${{pricing.delivery}}</span>
        </div>
        <div class="pricing-row">
            <span>Insurance ({{pricing.insuranceRate}}%):</span>
            <span>${{pricing.insurance}}</span>
        </div>
        <div class="pricing-row">
            <span>Tax ({{pricing.taxRate}}%):</span>
            <span>${{pricing.tax}}</span>
        </div>
        <div class="pricing-row total">
            <span>Total Amount:</span>
            <span>${{pricing.total}}</span>
        </div>
    </div>

    <div class="terms-section">
        <h3>Terms & Conditions</h3>
        <ul>
            <li>Payment due within 30 days of invoice date</li>
            <li>Equipment must be returned in same condition as delivered</li>
            <li>Customer responsible for fuel and routine maintenance</li>
            <li>Damage beyond normal wear will be charged separately</li>
            <li>Delivery and pickup times subject to availability</li>
            <li>Cancellation fee applies for orders cancelled within 24 hours</li>
            <li>Insurance coverage required for all rentals</li>
            <li>Operator certification required for specialized equipment</li>
        </ul>
    </div>

    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-line"></div>
            <p><strong>Customer Signature</strong></p>
            <p>Date: _______________</p>
        </div>
        <div class="signature-box">
            <div class="signature-line"></div>
            <p><strong>ASP Cranes Representative</strong></p>
            <p>Date: _______________</p>
        </div>
    </div>

    <div class="footer">
        <p>Thank you for choosing ASP Cranes. For questions about this quote, please contact us at the above information.</p>
        <p>© 2025 ASP Cranes. All rights reserved.</p>
    </div>
</body>
</html>',
    '{
        "primaryColor": "#2563eb",
        "secondaryColor": "#f8fafc",
        "textColor": "#333333",
        "accentColor": "#374151",
        "backgroundColor": "#ffffff",
        "borderColor": "#e5e7eb",
        "headerStyle": {
            "backgroundColor": "#ffffff",
            "borderBottom": "3px solid #2563eb",
            "padding": "20px"
        },
        "tableStyle": {
            "headerBackground": "#2563eb",
            "headerTextColor": "#ffffff",
            "alternateRowBackground": "#f9fafb",
            "borderColor": "#e5e7eb"
        },
        "sectionStyle": {
            "titleBackground": "#f8fafc",
            "titleTextColor": "#2563eb",
            "borderLeftColor": "#2563eb"
        },
        "typography": {
            "fontFamily": "Arial, sans-serif",
            "headerFontSize": "28px",
            "subHeaderFontSize": "16px",
            "bodyFontSize": "14px",
            "lineHeight": "1.4"
        }
    }'::jsonb,
    true,
    'usr_admin01'
);
