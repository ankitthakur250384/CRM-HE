import { Template } from '../../types/template';

export const aspCranesTemplate: Template = {
  id: 'asp-cranes-professional',
  name: 'ASP Cranes Professional Template',
  description: 'Professional quotation template matching ASP Cranes format with equipment breakdown table',
  content: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: white; color: #333;">
    <!-- Header with Logo and Company Details -->
    <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 30px; border-bottom: 3px solid #FF6B00; padding-bottom: 20px;">
      <div style="flex: 1;">
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <div style="background: #FF6B00; color: white; padding: 8px 16px; font-weight: bold; font-size: 18px; margin-right: 15px; border-radius: 4px;">
            ASP
          </div>
          <div>
            <div style="font-size: 24px; font-weight: bold; color: #FF6B00; margin: 0; line-height: 1;">CRANES</div>
            <div style="font-size: 12px; color: #666; margin-top: 2px;">AADISHAKTI PROJECTS</div>
          </div>
        </div>
        <div style="font-size: 11px; color: #666; line-height: 1.4;">
          <strong>{{company_name}}</strong><br>
          {{company_address}}<br>
          Phone: {{company_phone}}<br>
          Email: {{company_email}}<br>
          GST: {{company_gst}}
        </div>
      </div>
      <div style="text-align: center; background: #f8f9fa; padding: 15px; border-radius: 4px; min-width: 200px;">
        <h1 style="margin: 0; font-size: 20px; color: #333; font-weight: bold;">QUOTATION</h1>
        <div style="margin-top: 10px; font-size: 12px;">
          <div><strong>QUOTE/</strong>{{quotation_number}}</div>
          <div style="margin-top: 5px;"><strong>Date:</strong> {{quotation_date}}</div>
        </div>
      </div>
    </div>

    <!-- Customer Information -->
    <div style="margin-bottom: 25px;">
      <div style="background: #f8f9fa; padding: 12px; margin-bottom: 15px; border-left: 4px solid #FF6B00;">
        <strong style="color: #333; font-size: 14px;">M/s. {{customer_name}}</strong><br>
        <div style="margin-top: 5px; font-size: 12px; color: #666;">
          {{customer_company}}<br>
          {{customer_address}}
        </div>
      </div>
      
      <table style="width: 100%; font-size: 12px; margin-bottom: 15px;">
        <tr>
          <td style="width: 50%; vertical-align: top;">
            <strong>Job Location:</strong> {{job_location}}<br>
            <strong>Kind Attn:</strong> {{customer_contact_person}}<br>
            <strong>Mobile:</strong> {{customer_phone}}
          </td>
          <td style="width: 50%; vertical-align: top;">
            <strong>Subject:</strong> {{quotation_subject}}<br>
            <strong>Reference:</strong> {{reference_details}}
          </td>
        </tr>
      </table>
    </div>

    <!-- Equipment Table -->
    <div style="margin-bottom: 25px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #ddd;">
        <thead>
          <tr style="background: #f8f9fa;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">Sr.</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">Capacity</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">Job Type<br>Including</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">Job Duration<br>In Month</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">Rental<br>GST 18%</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">Mob-Demob<br>10,000/-<br>+ GST 18%</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">De-Mob<br>10,000/-<br>+ GST 18%</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">1</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{{equipment_capacity}}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">{{job_type_details}}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{{project_duration}}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{{monthly_rental}}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Included</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Included</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">2</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{{equipment2_capacity}}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">{{job_type2_details}}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{{project2_duration}}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{{monthly2_rental}}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Included</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">Included</td>
          </tr>
        </tbody>
      </table>
      
      <!-- Additional Equipment Details -->
      <div style="margin-top: 15px; font-size: 11px; line-height: 1.5;">
        <ul style="margin: 0; padding-left: 15px;">
          <li>All Rates on "As Hire".</li>
          <li><strong>Duty days = 26 + OT</strong></li>
          <li><strong>Duty Hours 8 hours including lunch + OT on pro-rata basis.</strong></li>
          <li>Fuel required on site will be in the Hirer's Scope.</li>
          <li><strong>OT will be calculated by dividing the month sum by 26 days & 08 hours.</strong></li>
        </ul>
      </div>
    </div>

    <!-- Commercial Terms -->
    <div style="margin-bottom: 25px;">
      <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
        1. COMMERCIAL TERMS
      </h3>
      
      <div style="font-size: 11px; line-height: 1.6; margin-bottom: 15px;">
        <p style="margin: 8px 0;"><strong>a.</strong> Only Electronic Fund Transfer is Acceptable, bank details mentioned below.</p>
        
        <p style="margin: 8px 0;"><strong>b. Matching and Deal Confirmation:</strong> Matching towards the Site is subject to receiving 
        <strong>50% of Monthly Rent (with GST) and Full mobilization and Demobilization charges 
        (with GST), along with Official Work order (with wet seal and signature) by Official 
        Letterhead of your company.</strong></p>
        
        <p style="margin: 8px 0;"><strong>c.</strong> Compliance: <strong>GST</strong> and any other government taxes compliance or duties, if any 
        applicable in your area/region, related to hire and working at site will be applicable as 
        extra on actual. The Service Provider will not be liable for any compliance, other 
        than for the Crew and the equipment. TF and ESIC, if applicable at the site, will 
        be on "The Hirer". TPI required on site will be in the Hirer's scope.</p>
      </div>
    </div>

    <!-- Work Place Requirements -->
    <div style="margin-bottom: 25px;">
      <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
        j) Work Place Requirements and Safety Norms:
      </h3>
      
      <div style="font-size: 11px; line-height: 1.6;">
        <ul style="margin: 0; padding-left: 15px; list-style-type: disc;">
          <li><strong>Safe, Leveled, Solid/hard surface required, mandatory.</strong></li>
          <li><strong>Secured Parking required. Theft, if any, will be Hirer's Responsibility.</strong></li>
          <li><strong>Work Perimeter barricading required, mandatory.</strong></li>
          <li><strong>No human movement around operation area, mandatory.</strong></li>
          <li><strong>Any mis happening due to above is Hirer's responsibility.</strong></li>
          <li><strong>All other safety requirements of Hirer/site, on the Hirer.</strong></li>
          <li><strong>Safety Shoes and Jacket to be provided by the Hirer, mandatory.</strong></li>
          <li><strong>Any other special safety requirements of Hirer/site, on the Hirer.</strong></li>
        </ul>
      </div>
    </div>

    <!-- Force Majeure -->
    <div style="margin-bottom: 25px;">
      <p style="font-size: 11px; line-height: 1.6; margin: 8px 0;">
        <strong>k) Force Majeure:</strong> Any interruption/delay in work or loss of Job hours, due to force 
        majeure, shall not exempt "The Hirer" from paying daily rental, in full. Additionally, 
        "The Hirer" will also to bear the cost of the extra hours/days/weeks to finish the 
        Job, in case of any happenings which are out of control. "The Hirer" will have to pay 
        the additional cost in advance to re-commence the job at once such as this.
      </p>
    </div>

    <!-- Pricing Summary -->
    <div style="margin-bottom: 25px; background: #f8f9fa; padding: 15px; border-radius: 4px;">
      <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #333;">
        Pricing Summary
      </h3>
      <table style="width: 100%; font-size: 12px;">
        <tr>
          <td style="padding: 5px 0; border-bottom: 1px solid #ddd;"><strong>Subtotal:</strong></td>
          <td style="padding: 5px 0; text-align: right; border-bottom: 1px solid #ddd;">{{subtotal}}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; border-bottom: 1px solid #ddd;"><strong>GST (18%):</strong></td>
          <td style="padding: 5px 0; text-align: right; border-bottom: 1px solid #ddd;">{{gst_amount}}</td>
        </tr>
        <tr style="background: #fff; font-weight: bold;">
          <td style="padding: 8px 0; font-size: 14px;"><strong>Total Amount:</strong></td>
          <td style="padding: 8px 0; text-align: right; font-size: 14px; color: #FF6B00;"><strong>{{total_amount}}</strong></td>
        </tr>
      </table>
    </div>

    <!-- Bank Details -->
    <div style="margin-bottom: 25px;">
      <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
        Our Bank Details:
      </h3>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 4px; font-size: 12px;">
        <div style="display: flex; justify-content: space-between;">
          <div style="flex: 1;">
            <strong>AADISHAKTI PROJECTS</strong><br>
            IDFC First Bank<br>
            Main (Raipur) Branch,<br>
            Raipur, Chhattisgarh<br>
            A/c: <strong>{{bank_account}}</strong><br>
            IFSC: <strong>{{bank_ifsc}}</strong>
          </div>
          <div style="text-align: center; padding: 20px;">
            <div style="border: 2px solid #333; padding: 15px; font-size: 10px;">
              <strong>SCAN & PAY</strong><br>
              [QR CODE PLACEHOLDER]<br>
              <small>Use WhatsApp scanner or any UPI QR scanner</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Validity -->
    <div style="text-align: center; margin: 20px 0; font-size: 12px; font-weight: bold;">
      <p style="margin: 0; background: #ffe6e6; padding: 8px; border-radius: 4px; color: #d63384;">
        Offer Validity: 24 hours from this mail
      </p>
    </div>

    <!-- Footer -->
    <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 15px;">
      <p style="margin: 0 0 5px 0; font-weight: bold;">Truly,</p>
      <p style="margin: 0 0 5px 0;"><strong>For, Aadishakti Projects</strong></p>
      <p style="margin: 0 0 15px 0;">(Establishment of Rajdev Group)</p>
      
      <div style="font-size: 11px; color: #888;">
        <p style="margin: 0 0 2px 0;"><strong>GST No: {{company_gst}}</strong></p>
        <div style="margin-top: 10px;">
          <strong>Contact Information:</strong><br>
          📍 {{company_address}}<br>
          📞 {{company_phone}} | 📧 {{company_email}}<br>
          🌐 {{company_website}}
        </div>
      </div>
      
      <div style="margin-top: 15px; background: #FF6B00; color: white; padding: 8px; border-radius: 4px; font-weight: bold;">
        WE LIFT YOU UP
      </div>
    </div>
  </div>`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system',
  isDefault: false
};

export default aspCranesTemplate;
