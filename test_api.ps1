$base = "http://localhost:5001/api"
$email1 = "owner$(Get-Random)@test.com"
$email2 = "other$(Get-Random)@test.com"
$password = "pass1234"

Write-Host "=== AUTH TESTS ==="

# Signup owner
$signupBody1 = @{
  name = "Owner User"
  email = $email1
  password = $password
} | ConvertTo-Json
$signup1 = Invoke-RestMethod -Method Post -Uri "$base/auth/signup" -ContentType "application/json" -Body $signupBody1
Write-Host "Signup owner OK:" ($signup1.message)

# Signup other user
$signupBody2 = @{
  name = "Other User"
  email = $email2
  password = $password
} | ConvertTo-Json
$signup2 = Invoke-RestMethod -Method Post -Uri "$base/auth/signup" -ContentType "application/json" -Body $signupBody2
Write-Host "Signup other OK:" ($signup2.message)

# Duplicate signup (expect error)
try {
  Invoke-RestMethod -Method Post -Uri "$base/auth/signup" -ContentType "application/json" -Body $signupBody1 | Out-Null
  Write-Host "Duplicate signup unexpectedly passed"
} catch {
  Write-Host "Duplicate signup error OK"
}

# Login owner
$loginBody1 = @{
  email = $email1
  password = $password
} | ConvertTo-Json
$login1 = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType "application/json" -Body $loginBody1
$token1 = $login1.token
Write-Host "Login owner OK, token length:" $token1.Length

# Login other
$loginBody2 = @{
  email = $email2
  password = $password
} | ConvertTo-Json
$login2 = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType "application/json" -Body $loginBody2
$token2 = $login2.token
Write-Host "Login other OK, token length:" $token2.Length

# Login invalid (expect error)
try {
  $badLogin = @{ email = $email1; password = "wrong" } | ConvertTo-Json
  Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType "application/json" -Body $badLogin | Out-Null
  Write-Host "Invalid login unexpectedly passed"
} catch {
  Write-Host "Invalid login error OK"
}

# /me tests
$me = Invoke-RestMethod -Method Get -Uri "$base/auth/me" -Headers @{ Authorization = "Bearer $token1" }
Write-Host "/me with valid token OK:" $me.user.email

try {
  Invoke-RestMethod -Method Get -Uri "$base/auth/me" | Out-Null
  Write-Host "/me without token unexpectedly passed"
} catch {
  Write-Host "/me without token error OK"
}

Write-Host "`n=== PROPERTY TESTS ==="

# Ensure test files exist
if (!(Test-Path "test1.jpg")) { Set-Content -Path "test1.jpg" -Value "fake-image-1" }
if (!(Test-Path "test2.jpg")) { Set-Content -Path "test2.jpg" -Value "fake-image-2" }

# Create property with multiple images
$createForm = @{
  title = "Modern Apartment"
  description = "Great location and amenities"
  price = "7500000"
  city = "Noida"
  locality = "Sector 62"
  type = "buy"
  bedrooms = "3"
  bathrooms = "2"
  area = "1450"
  images = @(
    Get-Item "test1.jpg"
    Get-Item "test2.jpg"
  )
}
$created = Invoke-RestMethod -Method Post -Uri "$base/properties" -Headers @{ Authorization = "Bearer $token1" } -Form $createForm
$propertyId = $created.property._id
Write-Host "Create property OK, id:" $propertyId
Write-Host "Images count in create response:" $created.property.images.Count

# Create property without images (expect error)
try {
  $badCreate = @{
    title = "No Image Property"
    description = "Should fail"
    price = "1000"
    city = "X"
    locality = "Y"
    type = "rent"
    bedrooms = "1"
    bathrooms = "1"
    area = "200"
  }
  Invoke-RestMethod -Method Post -Uri "$base/properties" -Headers @{ Authorization = "Bearer $token1" } -Form $badCreate | Out-Null
  Write-Host "No-image create unexpectedly passed"
} catch {
  Write-Host "No-image create error OK"
}

# Get all properties
$all = Invoke-RestMethod -Method Get -Uri "$base/properties"
Write-Host "GET /properties OK, count:" $all.properties.Count

# Empty list handling via impossible city filter
$none = Invoke-RestMethod -Method Get -Uri "$base/properties?city=__NO_MATCH_CITY__"
Write-Host "GET /properties empty filter count:" $none.properties.Count

# Get my properties
$my = Invoke-RestMethod -Method Get -Uri "$base/properties/my" -Headers @{ Authorization = "Bearer $token1" }
Write-Host "GET /properties/my owner count:" $my.properties.Count

# Property details
$details = Invoke-RestMethod -Method Get -Uri "$base/properties/$propertyId"
Write-Host "GET /properties/:id OK title:" $details.property.title
Write-Host "Details images count:" $details.property.images.Count

# Invalid id
try {
  Invoke-RestMethod -Method Get -Uri "$base/properties/invalidid" | Out-Null
  Write-Host "Invalid id unexpectedly passed"
} catch {
  Write-Host "Invalid id error OK"
}

# Non-owner edit (expect forbidden)
try {
  $editOther = @{
    title = "Edited by other"
    description = "No access"
    price = "8000000"
    city = "Noida"
    locality = "Sector 18"
    type = "buy"
    bedrooms = "3"
    bathrooms = "2"
    area = "1500"
  }
  Invoke-RestMethod -Method Put -Uri "$base/properties/$propertyId" -Headers @{ Authorization = "Bearer $token2" } -Form $editOther | Out-Null
  Write-Host "Non-owner edit unexpectedly passed"
} catch {
  Write-Host "Non-owner edit forbidden OK"
}

# Owner edit with replacement image
if (!(Test-Path "test3.jpg")) { Set-Content -Path "test3.jpg" -Value "fake-image-3" }
$ownerEdit = @{
  title = "Modern Apartment Updated"
  description = "Updated description"
  price = "7600000"
  city = "Noida"
  locality = "Sector 62"
  type = "buy"
  bedrooms = "3"
  bathrooms = "2"
  area = "1450"
  images = @(Get-Item "test3.jpg")
}
$updated = Invoke-RestMethod -Method Put -Uri "$base/properties/$propertyId" -Headers @{ Authorization = "Bearer $token1" } -Form $ownerEdit
Write-Host "Owner edit OK title:" $updated.property.title
Write-Host "Owner edit images count:" $updated.property.images.Count

# Non-owner delete (expect forbidden)
try {
  Invoke-RestMethod -Method Delete -Uri "$base/properties/$propertyId" -Headers @{ Authorization = "Bearer $token2" } | Out-Null
  Write-Host "Non-owner delete unexpectedly passed"
} catch {
  Write-Host "Non-owner delete forbidden OK"
}

# Owner delete
$deleted = Invoke-RestMethod -Method Delete -Uri "$base/properties/$propertyId" -Headers @{ Authorization = "Bearer $token1" }
Write-Host "Owner delete OK:" $deleted.message

Write-Host "`n=== FILE SYSTEM CHECKS ==="
$uploadCount = (Get-ChildItem -Path "uploads" -File -ErrorAction SilentlyContinue | Measure-Object).Count
Write-Host "Uploads folder file count:" $uploadCount

Write-Host "`n=== SUMMARY ==="
Write-Host "Owner email:" $email1
Write-Host "Other email:" $email2
Write-Host "All API tests finished."
