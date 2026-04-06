# Cattle Management API Documentation

## Base URL
```
/api/cattle
```

## Table of Contents
1. [Create Cattle](#create-cattle)
2. [Get All Cattle](#get-all-cattle)
3. [Get Cattle by ID](#get-cattle-by-id)
4. [Update Cattle](#update-cattle)
5. [Delete Cattle](#delete-cattle)
6. [Response Format](#response-format)
7. [Error Handling](#error-handling)

---

## Create Cattle

### Endpoint
```
POST /api/cattle
```

### Description
Create a new cattle entry in the system.

### Request Body
```json
{
  "tag": "CATTLE-001",
  "name": "Bessie",
  "breed": "Holstein",
  "gender": "cow",
  "dateOfBirth": "2020-01-15T00:00:00Z",
  "weight": 650,
  "parity": 2,
  "lactationStage": "mid",
  "reproductiveStatus": "open",
  "purchaseDate": "2021-06-10T00:00:00Z",
  "purchasePrice": 2500,
  "notes": "High milk producer",
  "isActive": true
}
```

### Field Specifications

| Field | Type | Required | Constraints |
|-------|------|----------|------------|
| `tag` | string | No | Unique identifier, must be unique if provided |
| `name` | string | No | Max 100 characters |
| `breed` | string | **Yes** | Max 100 characters |
| `gender` | string | **Yes** | Enum: `cow`, `bull`, `heifer`, `calf` |
| `dateOfBirth` | ISO 8601 Date | No | Valid date format |
| `weight` | number | No | Must be positive |
| `parity` | number | No | Non-negative integer |
| `lactationStage` | string | No | Enum: `early`, `mid`, `late`, `dry` |
| `reproductiveStatus` | string | No | Enum: `pregnant`, `inseminated`, `open` |
| `purchaseDate` | ISO 8601 Date | No | Valid date format |
| `purchasePrice` | number | No | Non-negative, typically in currency units |
| `notes` | string | No | Max 500 characters |
| `isActive` | boolean | No | Default: `true` |

### Success Response (201 Created)
```json
{
  "success": true,
  "status": 201,
  "message": "Cattle created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "tag": "CATTLE-001",
    "name": "Bessie",
    "breed": "Holstein",
    "gender": "cow",
    "dateOfBirth": "2020-01-15T00:00:00Z",
    "weight": 650,
    "parity": 2,
    "lactationStage": "mid",
    "reproductiveStatus": "open",
    "purchaseDate": "2021-06-10T00:00:00Z",
    "purchasePrice": 2500,
    "notes": "High milk producer",
    "isActive": true,
    "createdAt": "2024-04-06T10:30:45.123Z",
    "updatedAt": "2024-04-06T10:30:45.123Z"
  }
}
```

### Error Response (400 Bad Request)
```json
{
  "success": false,
  "status": 400,
  "message": "Invalid request",
  "error": "Cattle with tag \"CATTLE-001\" already exists"
}
```

---

## Get All Cattle

### Endpoint
```
GET /api/cattle
```

### Description
Retrieve all cattle with optional filtering, sorting, and pagination.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|------------|
| `page` | number | 1 | Page number (starts at 1) |
| `limit` | number | 10 | Items per page (max 100) |
| `tag` | string | - | Filter by cattle tag (exact match) |
| `breed` | string | - | Filter by breed (case-insensitive regex search) |
| `gender` | string | - | Filter by gender: `cow`, `bull`, `heifer`, `calf` |
| `isActive` | boolean | - | Filter by active status (true/false) |
| `sort` | string | `-createdAt` | Sort fields (comma-separated, prefix with `-` for descending) |
| `fields` | string | - | Select specific fields (comma-separated) |

### Example Requests

**Basic pagination:**
```
GET /api/cattle?page=1&limit=20
```

**Filter by breed:**
```
GET /api/cattle?breed=Holstein&isActive=true
```

**Sort by multiple fields:**
```
GET /api/cattle?sort=-createdAt,name&limit=10
```

**Select specific fields:**
```
GET /api/cattle?fields=tag,breed,gender,weight&limit=25
```

**Complex query:**
```
GET /api/cattle?breed=Jersey&gender=cow&isActive=true&sort=weight&page=2&limit=15
```

### Success Response (200 OK)
```json
{
  "success": true,
  "status": 200,
  "message": "Cattle retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "tag": "CATTLE-001",
      "name": "Bessie",
      "breed": "Holstein",
      "gender": "cow",
      "weight": 650,
      "parity": 2,
      "lactationStage": "mid",
      "isActive": true,
      "createdAt": "2024-04-06T10:30:45.123Z",
      "updatedAt": "2024-04-06T10:30:45.123Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "tag": "CATTLE-002",
      "name": "Daisy",
      "breed": "Jersey",
      "gender": "cow",
      "weight": 500,
      "parity": 1,
      "lactationStage": "early",
      "isActive": true,
      "createdAt": "2024-04-05T14:22:10.456Z",
      "updatedAt": "2024-04-05T14:22:10.456Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Get Cattle by ID

### Endpoint
```
GET /api/cattle/:id
```

### Description
Retrieve a specific cattle record by its MongoDB ObjectId.

### URL Parameters

| Parameter | Type | Description |
|-----------|------|------------|
| `id` | string | MongoDB ObjectId of the cattle |

### Example Request
```
GET /api/cattle/507f1f77bcf86cd799439011
```

### Success Response (200 OK)
```json
{
  "success": true,
  "status": 200,
  "message": "Cattle retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "tag": "CATTLE-001",
    "name": "Bessie",
    "breed": "Holstein",
    "gender": "cow",
    "dateOfBirth": "2020-01-15T00:00:00Z",
    "weight": 650,
    "parity": 2,
    "lactationStage": "mid",
    "reproductiveStatus": "open",
    "purchaseDate": "2021-06-10T00:00:00Z",
    "purchasePrice": 2500,
    "notes": "High milk producer",
    "isActive": true,
    "createdAt": "2024-04-06T10:30:45.123Z",
    "updatedAt": "2024-04-06T10:30:45.123Z"
  }
}
```

### Error Response (404 Not Found)
```json
{
  "success": false,
  "status": 404,
  "message": "Cattle not found"
}
```

---

## Update Cattle

### Endpoint
```
PATCH /api/cattle/:id
```

### Description
Update one or more fields of an existing cattle record. All fields are optional.

### URL Parameters

| Parameter | Type | Description |
|-----------|------|------------|
| `id` | string | MongoDB ObjectId of the cattle |

### Request Body
```json
{
  "weight": 675,
  "lactationStage": "late",
  "reproductiveStatus": "pregnant",
  "notes": "Currently pregnant, due date June 2024"
}
```

### Field Specifications
Same as [Create Cattle](#field-specifications) - all fields are optional for updates.

### Example Request
```
PATCH /api/cattle/507f1f77bcf86cd799439011
Content-Type: application/json

{
  "weight": 675,
  "parity": 3,
  "lactationStage": "late"
}
```

### Success Response (200 OK)
```json
{
  "success": true,
  "status": 200,
  "message": "Cattle updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "tag": "CATTLE-001",
    "name": "Bessie",
    "breed": "Holstein",
    "gender": "cow",
    "dateOfBirth": "2020-01-15T00:00:00Z",
    "weight": 675,
    "parity": 3,
    "lactationStage": "late",
    "reproductiveStatus": "pregnant",
    "purchaseDate": "2021-06-10T00:00:00Z",
    "purchasePrice": 2500,
    "notes": "Currently pregnant, due date June 2024",
    "isActive": true,
    "createdAt": "2024-04-06T10:30:45.123Z",
    "updatedAt": "2024-04-06T15:45:20.789Z"
  }
}
```

### Error Response (400 Bad Request)
**When tag already exists:**
```json
{
  "success": false,
  "status": 400,
  "message": "Cattle with tag \"CATTLE-002\" already exists"
}
```

### Error Response (404 Not Found)
```json
{
  "success": false,
  "status": 404,
  "message": "Cattle not found"
}
```

---

## Delete Cattle

### Endpoint
```
DELETE /api/cattle/:id
```

### Description
Soft delete a cattle record (sets `isActive` to false). The record is not permanently deleted from the database.

### URL Parameters

| Parameter | Type | Description |
|-----------|------|------------|
| `id` | string | MongoDB ObjectId of the cattle |

### Example Request
```
DELETE /api/cattle/507f1f77bcf86cd799439011
```

### Success Response (200 OK)
```json
{
  "success": true,
  "status": 200,
  "message": "Cattle deleted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "tag": "CATTLE-001",
    "name": "Bessie",
    "breed": "Holstein",
    "gender": "cow",
    "dateOfBirth": "2020-01-15T00:00:00Z",
    "weight": 675,
    "parity": 3,
    "lactationStage": "late",
    "reproductiveStatus": "pregnant",
    "purchaseDate": "2021-06-10T00:00:00Z",
    "purchasePrice": 2500,
    "notes": "Currently pregnant, due date June 2024",
    "isActive": false,
    "createdAt": "2024-04-06T10:30:45.123Z",
    "updatedAt": "2024-04-06T16:00:10.321Z"
  }
}
```

### Error Response (404 Not Found)
```json
{
  "success": false,
  "status": 404,
  "message": "Cattle not found"
}
```

---

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "status": <HTTP_STATUS_CODE>,
  "message": "<Human-readable message>",
  "data": <DataObject or Array>,
  "pagination": {
    "page": <number>,
    "limit": <number>,
    "total": <number>,
    "pages": <number>,
    "hasNext": <boolean>,
    "hasPrev": <boolean>
  }
}
```

**Note:** `pagination` is only included in list endpoints (GET /api/cattle).

### Error Response
```json
{
  "success": false,
  "status": <HTTP_STATUS_CODE>,
  "message": "<Error message>",
  "error": "<Detailed error information>"
}
```

---

## Error Handling

### HTTP Status Codes

| Status Code | Meaning | Scenario |
|-------------|---------|----------|
| `200 OK` | Successful request | GET, PATCH, DELETE success |
| `201 Created` | Resource created | POST success |
| `400 Bad Request` | Invalid input | Validation failed, duplicate tag, etc. |
| `404 Not Found` | Resource not found | Invalid ID, cattle doesn't exist |
| `500 Internal Server Error` | Server error | Database or processing error |

### Common Error Scenarios

**Validation Error:**
```json
{
  "success": false,
  "status": 400,
  "message": "Breed is required",
  "error": "Breed is required"
}
```

**Duplicate Tag:**
```json
{
  "success": false,
  "status": 400,
  "message": "Cattle with tag \"CATTLE-001\" already exists",
  "error": "Cattle with tag \"CATTLE-001\" already exists"
}
```

**Invalid ID Format:**
```json
{
  "success": false,
  "status": 400,
  "message": "Invalid cattle ID",
  "error": "Invalid cattle ID"
}
```

---

## Usage Examples

### cURL Examples

**Create cattle:**
```bash
curl -X POST http://localhost:3000/api/cattle \
  -H "Content-Type: application/json" \
  -d '{
    "tag": "CATTLE-001",
    "name": "Bessie",
    "breed": "Holstein",
    "gender": "cow",
    "weight": 650
  }'
```

**Get all cattle (first 10):**
```bash
curl http://localhost:3000/api/cattle?page=1&limit=10
```

**Get cattle by ID:**
```bash
curl http://localhost:3000/api/cattle/507f1f77bcf86cd799439011
```

**Update cattle:**
```bash
curl -X PATCH http://localhost:3000/api/cattle/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{"weight": 675, "label": "late"}'
```

**Delete cattle:**
```bash
curl -X DELETE http://localhost:3000/api/cattle/507f1f77bcf86cd799439011
```

### JavaScript/Fetch Examples

**Create cattle:**
```javascript
const response = await fetch('http://localhost:3000/api/cattle', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tag: 'CATTLE-001',
    name: 'Bessie',
    breed: 'Holstein',
    gender: 'cow',
    weight: 650
  })
});
const data = await response.json();
console.log(data);
```

**Get all cattle with filters:**
```javascript
const response = await fetch(
  'http://localhost:3000/api/cattle?breed=Holstein&isActive=true&limit=20&sort=-weight'
);
const data = await response.json();
console.log(data);
```

---

## Notes

- **Soft Deletes:** DELETE operations set `isActive` to false. Records are not permanently removed.
- **Pagination:** Default limit is 10, maximum is 100 items per page.
- **Sorting:** Use field names separated by commas. Prefix with `-` for descending order.
- **Validation:** All input is validated against Zod schemas on the server.
- **Timestamps:** All records have `createdAt` and `updatedAt` timestamps in ISO 8601 format.
- **Unique Constraint:** The `tag` field must be unique across all cattle records (if provided).
