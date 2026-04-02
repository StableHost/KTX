# 1. Cấu hình các đầu API
$userSearchUrl = "http://localhost:8800/api/user/search"
$roomApiUrl = "http://localhost:8800/api/rooms"
$csvPath = "C:\Users\dthie\OneDrive\Desktop\danh_sach_tong_hop_ktx_final.csv"

if (-not (Test-Path $csvPath)) {
    Write-Host "✗ Không tìm thấy file tại: $csvPath" -ForegroundColor Yellow
    return
}

# 2. Đọc dữ liệu từ file tổng hợp
$data = Import-Csv -Path $csvPath
$successCount = 0
$failCount = 0

Write-Host "--- Bắt đầu gán $($data.Count) học sinh vào phòng (Sử dụng API Search) ---" -ForegroundColor Cyan

foreach ($row in $data) {
    $tenHS = $row."Họ và tên".Trim()
    $tenPhong = $row."Phòng".Trim()
    $lopHS = $row."Lớp".Trim()

    try {
        # BƯỚC 1: Tìm học sinh qua API Search mới
        # Cấu trúc: /users/search?hoTen=... $([uri]::EscapeDataString($tenHS))
        $apiUrl = "http://localhost:8800/api/user/search?hoTen="
        Write-Host "DEBUG - URL đang gọi: '$apiUrl'" -ForegroundColor Gray
        $response = Invoke-RestMethod -Uri $apiUrl -Method Get

        # Kiểm tra nếu success=true và có dữ liệu trong mảng data
        if ($response.success -eq $true -and $response.data.Count -gt 0) {
            # Lấy học sinh đầu tiên trong mảng tìm thấy
            $user = $response.data[0]
            
            # BƯỚC 2: Đóng gói đối tượng member theo key của API trả về
            $memberObj = @{
                id    = $user.id      # Lấy từ JSON: "id"
                name  = $user.hoTen   # Lấy từ JSON: "hoTen"
                code  = $user.mssv    # Lấy từ JSON: "mssv"
                class = $lopHS        # Lấy trực tiếp từ file CSV
                phone = $user.phone   # Lấy từ JSON: "phone"
                email = $user.email   # Lấy từ JSON: "email"
            }

            # BƯỚC 3: Đẩy vào mảng roomMembers của Phòng
            $updateUrl = "$roomApiUrl/add-member/$([uri]::EscapeDataString($tenPhong))"
            $jsonBody = $memberObj | ConvertTo-Json -Depth 5
            $postData = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)

            $res = Invoke-WebRequest -Uri $updateUrl `
                -Method POST `
                -Headers @{"Content-Type" = "application/json"} `
                -Body $postData

            Write-Host "✓ Đã gán $tenHS -> $tenPhong" -ForegroundColor Green
            $successCount++
        } 
        else {
            Write-Host "⚠ Không tìm thấy: $tenHS (API trả về 0 kết quả)" -ForegroundColor Yellow
            $failCount++
        }

    } catch {
        Write-Host "✗ Lỗi xử lý $tenHS : $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
}

# 3. Tổng kết
Write-Host "`n" + ("=" * 45)
Write-Host "      HOÀN TẤT GÁN THÀNH VIÊN" -ForegroundColor Yellow
Write-Host ("-" * 45)
Write-Host "  Thành công : $successCount"
Write-Host "  Thất bại   : $failCount"
Write-Host ("=" * 45)