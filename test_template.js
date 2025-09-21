// Test the template preview functionality
async function testTemplatePreview() {
  const testTemplateData = {
    id: 'test-template',
    name: 'Test Template',
    theme: 'MODERN',
    elements: [
      {
        id: 'header-1',
        type: 'header',
        visible: true,
        content: {
          title: 'ASP CRANES PVT. LTD.',
          subtitle: 'QUOTATION'
        },
        style: {
          textAlign: 'center',
          fontSize: '24px',
          color: '#0052CC'
        }
      },
      {
        id: 'company-info-1',
        type: 'company_info',
        visible: true,
        content: {
          fields: [
            'ASP Cranes Pvt. Ltd.',
            '123 Industrial Area',
            'Phone: +91 1234567890',
            'Email: info@aspcranes.com'
          ]
        },
        style: {
          fontSize: '14px',
          marginBottom: '20px'
        }
      },
      {
        id: 'quotation-info-1',
        type: 'quotation_info',
        visible: true,
        content: {
          fields: [
            { label: 'Quotation #', value: 'QUO-2024-001' },
            { label: 'Date', value: '2024-01-15' },
            { label: 'Valid Until', value: '2024-02-15' }
          ]
        },
        style: {
          marginBottom: '20px'
        }
      }
    ],
    settings: {
      pageSize: 'A4',
      margins: { top: 20, right: 20, bottom: 20, left: 20 }
    },
    branding: {
      primaryColor: '#0052CC'
    }
  };

  const testQuotationData = {
    quotation: {
      number: 'QUO-2024-001',
      date: '2024-01-15',
      validUntil: '2024-02-15'
    },
    company: {
      name: 'ASP Cranes Pvt. Ltd.',
      address: '123 Industrial Area',
      phone: '+91 1234567890',
      email: 'info@aspcranes.com'
    },
    client: {
      name: 'Test Client',
      company: 'Test Company Ltd.',
      address: '456 Business District',
      phone: '+91 9876543210',
      email: 'client@testcompany.com'
    },
    items: [
      {
        description: 'Crane Model XYZ',
        quantity: 1,
        rate: '₹50,000',
        amount: '₹50,000'
      }
    ],
    totals: {
      subtotal: '₹50,000',
      total: '₹50,000'
    }
  };

  const payload = {
    templateData: testTemplateData,
    quotationData: testQuotationData,
    format: 'html'
  };

  console.log('Testing template preview with test data...');
  console.log('Template elements:', testTemplateData.elements.map(el => ({ type: el.type, visible: el.visible })));

  try {
    const response = await fetch('http://localhost:3001/api/templates/enhanced/preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Bypass-Auth': 'development-only-123'
      },
      body: JSON.stringify(payload)
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }

    const result = await response.json();
    console.log('Success! Generated HTML length:', result.data?.html?.length || 0);
    
    if (result.data?.html) {
      // Check for "Unknown element type" in the HTML
      const unknownCount = (result.data.html.match(/Unknown element type/g) || []).length;
      console.log('Unknown element types found:', unknownCount);
      
      if (unknownCount === 0) {
        console.log('✅ SUCCESS: All elements rendered correctly!');
      } else {
        console.log('❌ ISSUE: Still have unknown element types');
      }
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testTemplatePreview();