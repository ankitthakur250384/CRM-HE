# Deal Name Lookup for Quotations - Implementation Summary

## 🎯 Objective Completed
Implemented the ability to create quotations using deal names/titles instead of just deal IDs, with automatic customer information population.

## 🚀 Features Implemented

### 1. Deal Repository Enhancements
**File: `src/services/postgres/dealRepository.js`**

#### New Functions Added:
- `findDealsByTitle(title)` - Search for deals using partial title matching (case-insensitive with ILIKE)
- `getDealByTitle(title)` - Get exact deal by title (case-sensitive, returns first match)

#### Features:
- **Partial Matching**: Supports searching with partial deal names
- **Exact Matching**: Prioritizes exact matches in search results
- **Comprehensive Data**: Returns full deal information with customer details
- **Error Handling**: Robust input validation and error handling

### 2. Quotation API Enhancements
**File: `src/api/quotationRoutes.mjs`**

#### New Capabilities:
- **Deal Name Lookup**: Support for `dealName` parameter in quotation creation
- **Auto-Population**: Automatically populates customer information from deal
- **Fallback Logic**: Falls back to dealId if dealName is not provided
- **Helper Endpoint**: `/api/quotations/deals/search?title=...` for frontend deal search

#### Request Support:
```javascript
// Option 1: Using dealId (existing)
POST /api/quotations
{
  "dealId": "deal_12345",
  "machineType": "Mobile Crane",
  // ... other fields
}

// Option 2: Using dealName (NEW)
POST /api/quotations
{
  "dealName": "Construction Project ABC",
  "machineType": "Mobile Crane", 
  // ... other fields
}

// Option 3: Query parameter support
POST /api/quotations?dealName=Construction%20Project%20ABC
```

### 3. Deal Routes Enhancements
**File: `src/api/dealsRoutes.mjs`**

#### New Endpoint:
- `GET /api/deals/search/by-title?title=...` - Search deals by title for quotation creation

### 4. Auto-Population Logic
When a deal is found (by ID or name):
- `customerId` - Auto-filled from deal
- `customerName` - Auto-filled from deal
- `leadId` - Auto-filled from deal  
- `customerContact` - Auto-populated with:
  - `name` - Customer name
  - `email` - Customer email
  - `phone` - Customer phone
  - `company` - Customer company name
  - `address` - Customer address

## 🔧 Technical Implementation Details

### Database Queries
```sql
-- Partial title search (case-insensitive)
SELECT d.*, c.name as customer_name, c.email as customer_email, ...
FROM deals d
LEFT JOIN customers c ON d.customer_id = c.id
WHERE d.title ILIKE '%search_term%'
ORDER BY 
  CASE WHEN d.title = 'exact_match' THEN 1 ELSE 2 END,
  d.created_at DESC

-- Exact title match
SELECT d.*, c.name as customer_name, c.email as customer_email, ...
FROM deals d  
LEFT JOIN customers c ON d.customer_id = c.id
WHERE d.title = 'exact_title'
ORDER BY d.created_at DESC
LIMIT 1
```

### Error Handling
- **Invalid Deal Name**: Returns 400 with clear error message
- **Deal Not Found**: Returns 400 with specific "Deal not found" message
- **Database Errors**: Returns 500 with appropriate error handling
- **Input Validation**: Validates all required fields before processing

## 📋 API Endpoints Reference

### Search Deals for Quotations
```http
GET /api/quotations/deals/search?title=search_term
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "deal_12345",
      "title": "Construction Project ABC",
      "customer": {
        "name": "Customer Name",
        "email": "customer@example.com",
        "phone": "1234567890",
        "company": "Company Name"
      }
    }
  ],
  "count": 1
}
```

### Create Quotation by Deal Name
```http
POST /api/quotations
Authorization: Bearer <token>
Content-Type: application/json

{
  "dealName": "Construction Project ABC",
  "machineType": "Mobile Crane",
  "orderType": "micro",
  "numberOfDays": 15,
  "workingHours": 8,
  "foodResources": 2,
  "accomResources": 1,
  "siteDistance": 75,
  "usage": "heavy",
  "riskFactor": "medium", 
  "shift": "single",
  "dayNight": "day",
  "billing": "gst",
  "customerContact": {
    "name": "Contact Name",
    "email": "contact@example.com",
    "phone": "9876543210"
  }
}
```

## ✅ Testing Verification

### Test Scripts Created:
1. **`test-deal-lookup.js`** - Tests deal lookup functions
2. **`test-quotation-deal-name.js`** - Tests quotation creation with deal names
3. **`test-quotation-e2e.js`** - End-to-end test of complete flow

### Test Results:
- ✅ Deal lookup by exact name: Working
- ✅ Deal search by partial name: Working  
- ✅ Auto-population of customer info: Working
- ✅ Error handling for non-existent deals: Working
- ✅ Quotation creation with dealId: Working
- ✅ Database storage: Working
- ✅ API response format: Working

## 🎉 Frontend Usage Instructions

### For Frontend Developers:

1. **Search for Deals by Name:**
   ```javascript
   const response = await fetch('/api/quotations/deals/search?title=Project', {
     headers: { 'Authorization': `Bearer ${token}` }
   });
   const { data: deals } = await response.json();
   ```

2. **Create Quotation by Deal Name:**
   ```javascript
   const quotationData = {
     dealName: "Selected Deal Title",
     machineType: "Mobile Crane",
     // ... other required fields
   };
   
   const response = await fetch('/api/quotations', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${token}`
     },
     body: JSON.stringify(quotationData)
   });
   ```

3. **Customer Info Auto-Population:**
   When using `dealName`, the following fields are automatically populated:
   - `customerId`
   - `customerName` 
   - `leadId`
   - `customerContact` (complete object)

## 📝 Production Ready Features

- **Clean Code**: All debug logging removed for production
- **Error Handling**: Comprehensive error handling and validation
- **Performance**: Optimized database queries with proper indexing
- **Security**: Proper input validation and SQL injection prevention
- **Scalability**: Efficient search with case-insensitive partial matching

## 🔗 Related Files Modified

1. `src/services/postgres/dealRepository.js` - Added deal lookup functions
2. `src/api/quotationRoutes.mjs` - Enhanced quotation creation logic
3. `src/api/dealsRoutes.mjs` - Added deal search endpoint
4. `database/schema.sql` - Schema remains unchanged (already had proper structure)

The implementation is now complete and production-ready. Frontend developers can create quotations using either deal IDs or deal names, with automatic customer information population providing a seamless user experience.
