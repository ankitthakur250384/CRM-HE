import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Download, 
  Mail, 
  Eye, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Share2,
  Calendar,
  User,
  Phone
} from 'lucide-react';
import { generateAndDownloadPDF, generateAndOpenPDF } from '../../services/pdfGenerator';

interface QuotationData {
  id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  machine_type: string;
  order_type: string;
  number_of_days: number;
  working_hours: number;
  total_cost: number;
  status: string;
  created_at: string;
  site_distance?: number;
  usage?: string;
  shift?: string;
  food_resources?: string;
  accom_resources?: string;
  risk_factor?: string;
  mob_demob_cost?: number;
  working_cost?: number;
  food_accom_cost?: number;
  gst_amount?: number;
  total_rent?: number;
}

interface SuiteCRMQuotationSystemProps {
  quotationId: string;
  quotationData?: QuotationData;
  onClose?: () => void;
}

const SuiteCRMQuotationSystem: React.FC<SuiteCRMQuotationSystemProps> = ({
  quotationId,
  quotationData,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'settings' | 'history'>('preview');
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
    timestamp: Date;
  }>>([]);
  const [defaultTemplate, setDefaultTemplate] = useState<any>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [useTemplateSystem, setUseTemplateSystem] = useState(true);

  const previewRef = useRef<HTMLIFrameElement>(null);

  // Sample quotation data for demonstration
  const defaultData: QuotationData = {
    id: quotationId,
    customer_name: "ABC Construction Ltd.",
    customer_email: "contact@abcconstruction.com",
    customer_phone: "+91-9876543210",
    customer_address: "123 Industrial Area, Delhi - 110001",
    machine_type: "Mobile Crane 50T",
    order_type: "Rental",
    number_of_days: 7,
    working_hours: 8,
    total_cost: 175000,
    status: "draft",
    created_at: new Date().toISOString(),
    site_distance: 45,
    usage: "Construction",
    shift: "Day Shift",
    food_resources: "Client Provided",
    accom_resources: "Client Provided",
    risk_factor: "Medium",
    mob_demob_cost: 15000,
    working_cost: 140000,
    food_accom_cost: 0,
    gst_amount: 20000,
    total_rent: 155000
  };

  const data = quotationData || defaultData;

  // Fetch default template configuration on component mount
  useEffect(() => {
    const fetchDefaultTemplate = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '/api';
        
        // First, get the default template configuration
        const configResponse = await fetch(`${apiUrl}/config/defaultTemplate`, {
          headers: {
            'X-Bypass-Auth': 'development-only-123'
          }
        });
        
        if (configResponse.ok) {
          const configResult = await configResponse.json();
          const config = configResult.data || configResult;
          console.log('🔧 [SuiteCRM] Default template config:', config);
          
          if (config && config.defaultTemplateId) {
            // Fetch the actual template
            const templateResponse = await fetch(`${apiUrl}/templates/enhanced/${config.defaultTemplateId}`, {
              headers: {
                'X-Bypass-Auth': 'development-only-123'
              }
            });
            
            if (templateResponse.ok) {
              const template = await templateResponse.json();
              console.log('📋 [SuiteCRM] Fetched default template:', template);
              setDefaultTemplate(template.data || template);
              setUseTemplateSystem(true);
            } else {
              console.warn('[SuiteCRM] Failed to fetch default template, using fallback');
              setTemplateError('Failed to load default template');
              setUseTemplateSystem(false);
            }
          } else {
            console.warn('[SuiteCRM] No default template configured, using fallback');
            setTemplateError('No default template configured');
            setUseTemplateSystem(false);
          }
        } else {
          console.warn('[SuiteCRM] Failed to fetch default template config, using fallback');
          setTemplateError('Failed to load template configuration');
          setUseTemplateSystem(false);
        }
      } catch (error) {
        console.error('[SuiteCRM] Error fetching default template:', error);
        setTemplateError('Error loading template');
        setUseTemplateSystem(false);
      }
    };

    fetchDefaultTemplate();
  }, []);

  // Generate template-based preview using the enhanced template system
  const generateTemplateBasedPreview = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      
      console.log('🎨 [SuiteCRM] Generating template-based preview with template:', defaultTemplate?.name);
      
      const response = await fetch(`${apiUrl}/quotations/print/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bypass-Auth': 'development-only-123'
        },
        body: JSON.stringify({
          quotationId: data.id,
          templateId: defaultTemplate?.id,
          format: 'html',
          quotationData: data // Pass the current quotation data
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.html) {
          console.log('✅ [SuiteCRM] Template-based preview generated successfully');
          return result.html;
        } else {
          throw new Error(result.error || 'Failed to generate template preview');
        }
      } else {
        throw new Error(`Template preview failed: ${response.status}`);
      }
    } catch (error) {
      console.error('[SuiteCRM] Template preview error:', error);
      setTemplateError(`Template preview failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const generateComprehensiveQuotation = () => {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quotation ${data.id} - ASP Cranes</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8fafc;
          }
          
          .quotation-container {
            max-width: 900px;
            margin: 20px auto;
            background: white;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border-radius: 12px;
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 40px;
            text-align: center;
            position: relative;
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="40" r="1.5" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="80" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="90" cy="70" r="1.5" fill="rgba(255,255,255,0.1)"/></svg>');
          }
          
          .company-logo {
            font-size: 42px;
            font-weight: 900;
            margin-bottom: 10px;
            letter-spacing: 2px;
            position: relative;
            z-index: 1;
          }
          
          .company-tagline {
            font-size: 16px;
            margin-bottom: 25px;
            opacity: 0.9;
            position: relative;
            z-index: 1;
          }
          
          .quotation-title {
            font-size: 28px;
            font-weight: 700;
            background: rgba(255,255,255,0.15);
            padding: 15px 30px;
            border-radius: 8px;
            display: inline-block;
            position: relative;
            z-index: 1;
          }
          
          .content {
            padding: 40px;
          }
          
          .quotation-meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
            padding: 25px;
            background: #f8fafc;
            border-radius: 12px;
            border-left: 5px solid #3b82f6;
          }
          
          .meta-group h3 {
            color: #1e40af;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .meta-item {
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .meta-label {
            font-weight: 600;
            color: #4b5563;
            font-size: 14px;
          }
          
          .meta-value {
            color: #1f2937;
            font-weight: 500;
            text-align: right;
          }
          
          .section {
            margin: 40px 0;
          }
          
          .section-title {
            font-size: 22px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #e5e7eb;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .project-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 25px;
            margin: 25px 0;
          }
          
          .detail-card {
            background: #ffffff;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            transition: all 0.3s ease;
          }
          
          .detail-card:hover {
            border-color: #3b82f6;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
          }
          
          .detail-card-title {
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 15px;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .cost-breakdown {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border-radius: 12px;
            padding: 30px;
            margin: 30px 0;
            border-left: 5px solid #0ea5e9;
          }
          
          .cost-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid rgba(14, 165, 233, 0.2);
          }
          
          .cost-item:last-child {
            border-bottom: none;
          }
          
          .cost-label {
            font-weight: 600;
            color: #0c4a6e;
          }
          
          .cost-value {
            font-weight: 700;
            color: #0c4a6e;
            font-size: 16px;
          }
          
          .total-section {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
          }
          
          .total-amount {
            font-size: 32px;
            font-weight: 900;
            margin-top: 10px;
          }
          
          .terms-conditions {
            background: #fef7ed;
            border: 2px solid #fed7aa;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
          }
          
          .terms-title {
            color: #ea580c;
            font-weight: 700;
            font-size: 18px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .terms-list {
            list-style: none;
            padding: 0;
          }
          
          .terms-list li {
            padding: 8px 0;
            padding-left: 20px;
            position: relative;
            color: #9a3412;
            font-weight: 500;
          }
          
          .terms-list li::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #ea580c;
            font-weight: bold;
          }
          
          .signature-section {
            margin-top: 60px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            padding-top: 30px;
            border-top: 2px solid #e5e7eb;
          }
          
          .signature-box {
            text-align: center;
            padding: 20px;
          }
          
          .signature-line {
            border-bottom: 2px solid #374151;
            margin: 40px auto 10px;
            width: 200px;
          }
          
          .signature-label {
            font-weight: 600;
            color: #6b7280;
            font-size: 14px;
          }
          
          .validity-notice {
            background: #fef3c7;
            border: 2px solid #fbbf24;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
            color: #92400e;
            font-weight: 600;
          }
          
          @media print {
            body {
              background: white;
              font-size: 12pt;
            }
            
            .quotation-container {
              box-shadow: none;
              margin: 0;
              border-radius: 0;
            }
            
            .page-break {
              page-break-before: always;
            }
            
            @page {
              margin: 15mm;
              size: A4;
            }
          }
          
          @media (max-width: 768px) {
            .quotation-meta {
              grid-template-columns: 1fr;
            }
            
            .project-details {
              grid-template-columns: 1fr;
            }
            
            .signature-section {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <div class="quotation-container">
          <div class="header">
            <div class="company-logo">ASP CRANES</div>
            <div class="company-tagline">Professional Crane Services | Your Trusted Lifting Partner</div>
            <div class="quotation-title">QUOTATION</div>
          </div>
          
          <div class="content">
            <div class="quotation-meta">
              <div class="meta-group">
                <h3><svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>Quotation Details</h3>
                <div class="meta-item">
                  <span class="meta-label">Quotation ID:</span>
                  <span class="meta-value">#${data.id}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Date:</span>
                  <span class="meta-value">${new Date(data.created_at).toLocaleDateString('en-IN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Status:</span>
                  <span class="meta-value" style="text-transform: capitalize; color: #059669; font-weight: 700;">${data.status}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Valid Until:</span>
                  <span class="meta-value">${new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
              
              <div class="meta-group">
                <h3><svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>Customer Information</h3>
                <div class="meta-item">
                  <span class="meta-label">Company:</span>
                  <span class="meta-value">${data.customer_name}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Email:</span>
                  <span class="meta-value">${data.customer_email || 'N/A'}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Phone:</span>
                  <span class="meta-value">${data.customer_phone || 'N/A'}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Address:</span>
                  <span class="meta-value">${data.customer_address || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h2 class="section-title">
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path></svg>
                Project Specifications
              </h2>
              
              <div class="project-details">
                <div class="detail-card">
                  <div class="detail-card-title">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10.496 2.132a1 1 0 00-.992 0l-7 4A1 1 0 003 8v7a1 1 0 100 2h14a1 1 0 100-2V8a1 1 0 00.496-1.868l-7-4zM6 9a1 1 0 100 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path></svg>
                    Equipment Details
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Machine Type:</span>
                    <span class="meta-value">${data.machine_type}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Order Type:</span>
                    <span class="meta-value">${data.order_type}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Usage:</span>
                    <span class="meta-value">${data.usage || 'General Construction'}</span>
                  </div>
                </div>
                
                <div class="detail-card">
                  <div class="detail-card-title">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path></svg>
                    Time Schedule
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Duration:</span>
                    <span class="meta-value">${data.number_of_days} days</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Working Hours:</span>
                    <span class="meta-value">${data.working_hours} hrs/day</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Total Hours:</span>
                    <span class="meta-value">${data.number_of_days * data.working_hours} hours</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Shift:</span>
                    <span class="meta-value">${data.shift || 'Day Shift'}</span>
                  </div>
                </div>
                
                <div class="detail-card">
                  <div class="detail-card-title">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path></svg>
                    Site Information
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Site Distance:</span>
                    <span class="meta-value">${data.site_distance || 0} km</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Risk Factor:</span>
                    <span class="meta-value">${data.risk_factor || 'Standard'}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Food Resources:</span>
                    <span class="meta-value">${data.food_resources || 'To be discussed'}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Accommodation:</span>
                    <span class="meta-value">${data.accom_resources || 'To be discussed'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h2 class="section-title">
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"></path><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"></path></svg>
                Cost Breakdown
              </h2>
              
              <div class="cost-breakdown">
                <div class="cost-item">
                  <span class="cost-label">Equipment Rental</span>
                  <span class="cost-value">₹${(data.total_rent || data.working_cost || 100000).toLocaleString('en-IN')}</span>
                </div>
                <div class="cost-item">
                  <span class="cost-label">Mobilization & Demobilization</span>
                  <span class="cost-value">₹${(data.mob_demob_cost || 15000).toLocaleString('en-IN')}</span>
                </div>
                <div class="cost-item">
                  <span class="cost-label">Food & Accommodation</span>
                  <span class="cost-value">₹${(data.food_accom_cost || 0).toLocaleString('en-IN')}</span>
                </div>
                <div class="cost-item">
                  <span class="cost-label">GST (18%)</span>
                  <span class="cost-value">₹${(data.gst_amount || Math.round(data.total_cost * 0.18)).toLocaleString('en-IN')}</span>
                </div>
              </div>
              
              <div class="total-section">
                <div style="font-size: 18px; font-weight: 600;">Grand Total Amount</div>
                <div class="total-amount">₹${data.total_cost.toLocaleString('en-IN')}</div>
                <div style="font-size: 14px; margin-top: 10px; opacity: 0.9;">
                  (${convertToWords(data.total_cost)} Rupees Only)
                </div>
              </div>
            </div>
            
            <div class="validity-notice">
              ⚠️ This quotation is valid for 15 days from the date of issue
            </div>
            
            <div class="terms-conditions">
              <div class="terms-title">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>
                Terms & Conditions
              </div>
              <ul class="terms-list">
                <li>Payment Terms: 50% advance payment required, balance to be paid on completion of work</li>
                <li>Equipment will be delivered within 2-3 working days from advance payment receipt</li>
                <li>Fuel charges will be extra as per actual consumption and current market rates</li>
                <li>All rates are subject to site conditions, accessibility, and final inspection</li>
                <li>Client to provide necessary permits, clearances, and safe working environment</li>
                <li>Insurance coverage as per standard industry practices will be maintained</li>
                <li>Any damage to third party property will be client's responsibility</li>
                <li>Equipment breakdown due to misuse will be charged separately</li>
                <li>All disputes subject to Delhi jurisdiction only</li>
              </ul>
            </div>
            
            <div class="signature-section">
              <div class="signature-box">
                <div style="font-weight: 700; color: #1e40af; margin-bottom: 20px;">Customer Acceptance</div>
                <div class="signature-line"></div>
                <div class="signature-label">Authorized Signatory</div>
                <div style="margin-top: 15px; font-size: 12px; color: #6b7280;">
                  Date: _______________
                </div>
              </div>
              
              <div class="signature-box">
                <div style="font-weight: 700; color: #1e40af; margin-bottom: 20px;">ASP Cranes</div>
                <div class="signature-line"></div>
                <div class="signature-label">Authorized Representative</div>
                <div style="margin-top: 15px; font-size: 12px; color: #6b7280;">
                  Date: ${new Date().toLocaleDateString('en-IN')}
                </div>
              </div>
            </div>
            
            <div style="margin-top: 40px; text-align: center; padding: 20px; background: #f8fafc; border-radius: 8px; border-top: 3px solid #3b82f6;">
              <div style="font-weight: 700; color: #1e40af; margin-bottom: 10px;">ASP Cranes - Professional Lifting Solutions</div>
              <div style="font-size: 14px; color: #6b7280;">
                📧 Email: info@aspcranes.com | 📞 Phone: +91-XXXXXXXXXX | 🌐 Web: www.aspcranes.com
              </div>
              <div style="font-size: 12px; color: #9ca3af; margin-top: 10px;">
                ISO 9001:2015 Certified | All India Service Network Available
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    return html;
  };

  // Function to convert number to words (simplified version)
  const convertToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + convertToWords(num % 100) : '');
    if (num < 100000) return convertToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + convertToWords(num % 1000) : '');
    if (num < 10000000) return convertToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + convertToWords(num % 100000) : '');
    return convertToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 !== 0 ? ' ' + convertToWords(num % 10000000) : '');
  };

  const handlePreview = async () => {
    setIsLoading(true);
    try {
      let html;
      
      // Try to use template-based preview if available and enabled
      if (useTemplateSystem && defaultTemplate) {
        console.log('🎨 [SuiteCRM] Using template-based preview with template:', defaultTemplate.name);
        try {
          html = await generateTemplateBasedPreview();
        } catch (templateError) {
          console.warn('[SuiteCRM] Template-based preview failed, falling back to hardcoded:', templateError);
          html = generateComprehensiveQuotation();
          addNotification('info', 'Using fallback template due to template system error');
        }
      } else {
        console.log('📄 [SuiteCRM] Using fallback hardcoded preview');
        html = generateComprehensiveQuotation();
        if (templateError) {
          addNotification('info', `Template system unavailable: ${templateError}`);
        }
      }
      
      // Update iframe
      setTimeout(() => {
        if (previewRef.current) {
          const iframe = previewRef.current;
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (doc) {
            doc.open();
            doc.write(html);
            doc.close();
          }
        }
      }, 100);
      
      addNotification('success', 'Quotation preview generated successfully');
    } catch (error) {
      console.error('[SuiteCRM] Preview generation error:', error);
      addNotification('error', 'Failed to generate preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = async () => {
    setIsLoading(true);
    try {
      let html;
      
      // Try to use template-based preview if available and enabled
      if (useTemplateSystem && defaultTemplate) {
        console.log('🖨️ [SuiteCRM] Printing with template-based preview');
        try {
          html = await generateTemplateBasedPreview();
        } catch (templateError) {
          console.warn('[SuiteCRM] Template-based print failed, falling back to hardcoded:', templateError);
          html = generateComprehensiveQuotation();
        }
      } else {
        console.log('🖨️ [SuiteCRM] Printing with fallback hardcoded preview');
        html = generateComprehensiveQuotation();
      }
      
      // Use the new PDF generation service
      await generateAndOpenPDF(html, {
        filename: `ASP_Cranes_Quotation_${data.id}.pdf`,
        format: 'a4',
        orientation: 'portrait'
      });
      
      addNotification('success', 'PDF generated and opened for printing');
    } catch (error) {
      console.error('[SuiteCRM] Print error:', error);
      addNotification('error', `Print failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Fallback to old window.open method if PDF generation fails
      try {
        const fallbackHtml = generateComprehensiveQuotation();
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(fallbackHtml);
          printWindow.document.close();
          printWindow.print();
          addNotification('success', 'Fallback print dialog opened');
        }
      } catch (fallbackError) {
        addNotification('error', 'All print methods failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      let html;
      
      // Try to use template-based preview if available and enabled
      if (useTemplateSystem && defaultTemplate) {
        console.log('📥 [SuiteCRM] Downloading with template-based preview');
        try {
          html = await generateTemplateBasedPreview();
        } catch (templateError) {
          console.warn('[SuiteCRM] Template-based download failed, falling back to hardcoded:', templateError);
          html = generateComprehensiveQuotation();
        }
      } else {
        console.log('📥 [SuiteCRM] Downloading with fallback hardcoded preview');
        html = generateComprehensiveQuotation();
      }
      
      // Use the new PDF generation service
      await generateAndDownloadPDF(
        html,
        `ASP_Cranes_Quotation_${data.id}.pdf`,
        {
          format: 'a4',
          orientation: 'portrait'
        }
      );
      
      addNotification('success', 'PDF downloaded successfully');
    } catch (error) {
      console.error('[SuiteCRM] Download error:', error);
      addNotification('error', `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmail = () => {
    const subject = `Quotation ${data.id} - ASP Cranes Professional Services`;
    const body = `Dear ${data.customer_name},

Thank you for your interest in ASP Cranes professional lifting solutions.

Please find attached our detailed quotation for your ${data.machine_type} requirements:

📋 Quotation ID: ${data.id}
🏗️ Equipment: ${data.machine_type}
📅 Duration: ${data.number_of_days} days
💰 Total Amount: ₹${data.total_cost.toLocaleString('en-IN')}

Key highlights of our service:
✅ Professional certified operators
✅ Comprehensive insurance coverage
✅ 24/7 technical support
✅ Timely delivery and setup
✅ Competitive pricing

This quotation is valid for 15 days. We look forward to serving you and building a long-term partnership.

For any queries or clarifications, please feel free to contact us.

Best regards,
ASP Cranes Team
📞 +91-XXXXXXXXXX
📧 info@aspcranes.com
🌐 www.aspcranes.com

---
ASP Cranes - Your Trusted Lifting Partner
ISO 9001:2015 Certified Company`;

    const mailtoLink = `mailto:${data.customer_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
    addNotification('info', 'Email client opened with quotation details');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `ASP Cranes Quotation ${data.id}`,
          text: `Quotation for ${data.machine_type} - ₹${data.total_cost.toLocaleString('en-IN')}`,
          url: window.location.href
        });
        addNotification('success', 'Quotation shared successfully');
      } catch (error) {
        addNotification('info', 'Share cancelled');
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      addNotification('success', 'Quotation URL copied to clipboard');
    }
  };

  // Auto-generate preview on load, but wait for template loading to complete
  useEffect(() => {
    // Add a small delay to ensure template loading useEffect has time to complete
    const timer = setTimeout(() => {
      handlePreview();
    }, 1000);

    return () => clearTimeout(timer);
  }, []); // Empty dependency array for initial load only

  // Auto-refresh preview when template system state changes
  useEffect(() => {
    // Only refresh if we have completed the initial template loading attempt
    if (defaultTemplate !== null || templateError !== null) {
      console.log('🔄 [SuiteCRM] Template system state changed, refreshing preview');
      handlePreview();
    }
  }, [defaultTemplate, templateError, useTemplateSystem]);

  return (
    <div className="suite-crm-quotation-system bg-gray-50 min-h-screen">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg border-l-4 max-w-sm transform transition-all duration-500 ${
              notification.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
              notification.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
              'bg-blue-50 border-blue-500 text-blue-800'
            }`}
          >
            <div className="flex items-start space-x-3">
              {notification.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />}
              {notification.type === 'error' && <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />}
              {notification.type === 'info' && <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />}
              <div className="flex-1">
                <p className="text-sm font-medium">{notification.message}</p>
                <p className="text-xs opacity-75 mt-1">
                  {notification.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Quotation #{data.id}
              </h1>
              <p className="text-gray-600">
                {data.customer_name} • {data.machine_type}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              data.status === 'draft' ? 'bg-gray-100 text-gray-800' :
              data.status === 'sent' ? 'bg-blue-100 text-blue-800' :
              data.status === 'accepted' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
            </span>
            
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="-mb-px flex space-x-8">
            {['preview', 'settings', 'history'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex h-screen">
        {/* Sidebar Actions */}
        <div className="w-80 bg-white border-r border-gray-200 p-6">
          <div className="space-y-6">
            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handlePreview}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                  <span>Refresh Preview</span>
                </button>
                
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center space-x-2 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Quotation</span>
                </button>
                
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700"
                >
                  <Download className="h-4 w-4" />
                  <span>Download HTML</span>
                </button>
                
                <button
                  onClick={handleEmail}
                  className="w-full flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700"
                >
                  <Mail className="h-4 w-4" />
                  <span>Email Customer</span>
                </button>
                
                <button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center space-x-2 bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share Quotation</span>
                </button>
              </div>
            </div>

            {/* Quotation Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Equipment:</span>
                  <span className="font-medium">{data.machine_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{data.number_of_days} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Hours:</span>
                  <span className="font-medium">{data.number_of_days * data.working_hours}h</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-blue-600">₹{data.total_cost.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Customer</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{data.customer_name}</span>
                </div>
                {data.customer_email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{data.customer_email}</span>
                  </div>
                )}
                {data.customer_phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{data.customer_phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          {activeTab === 'preview' && (
            <div className="h-full">
              <div className="bg-white rounded-lg shadow-sm border h-full">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold">Live Preview</h3>
                      
                      {/* Template Status Indicator */}
                      {useTemplateSystem && defaultTemplate && (
                        <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          <CheckCircle className="h-4 w-4" />
                          <span>Template: {defaultTemplate.name}</span>
                        </div>
                      )}
                      
                      {templateError && (
                        <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                          <AlertCircle className="h-4 w-4" />
                          <span>Fallback Mode</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handlePreview}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="h-full p-4">
                  {isPreviewVisible && (
                    <iframe
                      ref={previewRef}
                      className="w-full h-full border-0 rounded-lg"
                      title="Quotation Preview"
                      style={{ minHeight: '600px' }}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Quotation Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Style
                  </label>
                  <select className="w-full p-2 border border-gray-300 rounded-lg">
                    <option>Professional Blue</option>
                    <option>Corporate Gray</option>
                    <option>Modern Green</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency Format
                  </label>
                  <select className="w-full p-2 border border-gray-300 rounded-lg">
                    <option>Indian Rupees (₹)</option>
                    <option>US Dollars ($)</option>
                    <option>Euros (€)</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="include-terms" defaultChecked />
                  <label htmlFor="include-terms" className="text-sm text-gray-700">
                    Include Terms & Conditions
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="include-signature" defaultChecked />
                  <label htmlFor="include-signature" className="text-sm text-gray-700">
                    Include Signature Section
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'history' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Activity History</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="bg-blue-600 text-white p-1 rounded">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Quotation Created</p>
                    <p className="text-sm text-gray-600">
                      {new Date(data.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="bg-green-600 text-white p-1 rounded">
                    <Eye className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Preview Generated</p>
                    <p className="text-sm text-gray-600">
                      {new Date().toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuiteCRMQuotationSystem;
