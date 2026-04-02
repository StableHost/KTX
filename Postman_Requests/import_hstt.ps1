$baseUrl = "http://localhost:8800/api/user"
$csvPath = "E:\Project\STUDENT-DORMITORY-MANAGEMENT-SYSTEM\Postman_Requests\hstt.csv"

if (-not (Test-Path $csvPath)) {
    Write-Host "✗ Không tìm thấy file tại: $csvPath" -ForegroundColor Yellow
    return
}

function Get-MongoObjectId {
    # 1. Lấy 4 bytes thời gian hiện tại (Unix Timestamp) -> 8 ký tự hex
    $timestamp = [int][DateTimeOffset]::Now.ToUnixTimeSeconds()
    $hexTimestamp = "{0:x8}" -f $timestamp

    # 2. Tạo 8 bytes ngẫu nhiên còn lại -> 16 ký tự hex
    $randomBytes = New-Object Byte[] 8
    (New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes($randomBytes)
    $hexRandom = ($randomBytes | ForEach-Object { "{0:x2}" -f $_ }) -join ""

    return ($hexTimestamp + $hexRandom)
}

# Sử dụng:
# $matk = Get-MongoObjectId

# 1. Khởi tạo bộ đếm
$successCount = 0
$failureCount = 0

# 2. Đọc file và xử lý UTF-8
$customHeaders = "STT","Lop","Mssv","Vemis","Moet","SoDangBo","HoTen","NgaySinh","NgayVao","GioiTinh","QuocTich","DiaChi","H1","H2","H3","HoKhau","H4","H5","H6","NoiSinh","H7","H8","QueQuan","H9","H10","NoiKhaiSinh","H11","CCCD","NgayCap","NoiCap","DanToc","TonGiao","ChinhSach","CanNgheo","DoanVien","DoiVien","TenCha","NgheCha","NamCha","CccdCha","DvCha","TenMe","NgheMe","NamMe","CccdMe","DvMe","SllPhone","SllEmail","BoPhone","MePhone","HsPhone","KhuyetTat","NtruBtru","GhiChu"

$content = Get-Content -Path $csvPath -Encoding UTF8 | Select-Object -Skip 2
$rawStudents = ConvertFrom-Csv -InputObject $content -Header $customHeaders

$students = foreach ($row in $rawStudents) {
    $tenHS = ($row.HoTen -as [string]).Trim()
    if ([string]::IsNullOrWhiteSpace($tenHS) -or $tenHS -eq "Họ và tên") { continue }

    $dobISO = $null
    if ($row.NgaySinh -match '(\d{1,2})/(\d{1,2})/(\d{4})') {
        $dobISO = "{0}-{1:D2}-{2:D2}T00:00:00.000Z" -f $Matches[3], [int]$Matches[2], [int]$Matches[1]
    }

    @{
        HoTen       = $tenHS
        Mssv        = $row.Mssv
        CMND        = $row.CCCD
        Matk        = [guid]::NewGuid().ToString().Replace("-", "").Substring(0, 24)
        GioiTinh    = $row.GioiTinh
        Truong      = "Trường PTDTNT THCS & THPT Hàm Yên"
        NganHang    = "Agribank"
        Phone       = if ($row.HsPhone) { $row.HsPhone } else { $row.SllPhone }
        Email       = $row.SllEmail
        Photos      = @()
        Address     = $row.DiaChi
        DateOfBirth = $dobISO
        NienKhoa    = "2025-2026"
        room        = @{
            roomId    = Get-MongoObjectId
            roomTitle = $row.Lop
            dateIn    = $null
            dateOut   = $null
            status    = 0
        }
    }
}

$totalToProcess = $students.Count
Write-Host "--- Tìm thấy $totalToProcess học sinh hợp lệ. Bắt đầu đẩy dữ liệu... ---" -ForegroundColor Cyan

# 3. Gửi dữ liệu và đếm kết quả
foreach ($student in $students) {
    try {
        $json = $student | ConvertTo-Json -Depth 5
        $utf8Body = [System.Text.Encoding]::UTF8.GetBytes($json)
        
        $response = Invoke-WebRequest -Uri $baseUrl `
            -Method POST `
            -Headers @{"Content-Type" = "application/json; charset=utf-8"} `
            -Body $utf8Body
        
        Write-Host "✓ Thành công: $($student.HoTen)" -ForegroundColor Green
        $successCount++
    } catch {
        Write-Host "✗ Thất bại: $($student.HoTen) - $($_.Exception.Message)" -ForegroundColor Red
        $failureCount++
    }
}

# 4. In bảng tổng kết
Write-Host "`n" + ("=" * 40) -ForegroundColor Gray
Write-Host "     TỔNG KẾT QUÁ TRÌNH IMPORT" -ForegroundColor Yellow
Write-Host ("-" * 40) -ForegroundColor Gray
Write-Host "Tổng số học sinh xử lý : $totalToProcess"
Write-Host "Số ca THÀNH CÔNG      : $successCount" -ForegroundColor Green
Write-Host "Số ca THẤT BẠI        : $failureCount" -ForegroundColor Red
Write-Host ("=" * 40) -ForegroundColor Gray