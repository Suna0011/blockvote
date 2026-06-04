


<p align="center">
  <img src="https://github.com/user-attachments/assets/7e13c504-32ba-4519-b009-ea40469e8d28" style="width:100%;">
</p>



# BlockVote — Ứng dụng bầu cử Blockchain

DApp bầu cử phi tập trung trên Ethereum, xây dựng với React + TypeScript + Solidity.

---

## Phần mềm cần cài đặt

| Phần mềm | Mục đích | Link tải |
|----------|----------|----------|
| **Node.js** (v18+) | Chạy npm và Hardhat | https://nodejs.org |
| **MetaMask** (browser extension) | Kết nối ví Ethereum với dApp | https://metamask.io/download |
| **Alchemy** (tài khoản miễn phí) | Cung cấp RPC endpoint cho Sepolia | https://alchemy.com |

> **Lưu ý:** Cần ETH test để deploy và vote trên Sepolia → nhận miễn phí tại https://sepoliafaucet.com hoặc https://faucets.chain.link/sepolia

---

## Cài đặt dependencies

```bash
cd ~/BlockVote-main/BlockVote-main
npm install
```

---

## Cách 1: Chạy Local (nhanh, không cần ETH thật)

### Lần đầu cài đặt

**1. Compile smart contract:**
```bash
cd ~/BlockVote-main/BlockVote-main
npx hardhat compile
```

**2. Cấu hình MetaMask** (chỉ làm 1 lần):
- Thêm mạng mới: Network Name: `Hardhat Local` | RPC URL: `http://127.0.0.1:8545` | Chain ID: `31337` | Currency Symbol: `ETH`
- Import ví Admin (Account #0):
  ```
  0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
  ```
- Import ví cử tri (Account #1 → #6):
  ```
  0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
  0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
  0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
  0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a
  0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba
  0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e
  ```

> Account #0 là **Admin** — có quyền truy cập trang quản trị. Hardhat tự tạo sẵn mỗi ví **10.000 ETH ảo**.

---

### Mỗi lần chạy chương trình

**Terminal 1** — Khởi động blockchain local (giữ mở suốt):
```bash
cd ~/BlockVote-main/BlockVote-main
npx hardhat node
```

**Terminal 2** — Deploy contract rồi chạy frontend:
```bash
cd ~/BlockVote-main/BlockVote-main
npx hardhat run scripts/deploy.js --network localhost
npm run dev
```

Mở trình duyệt: `http://localhost:5173`

> **Lưu ý:** Địa chỉ contract luôn cố định là `0x5FbDB2315678afecb367f032d93F642f64180aa3` khi deploy lần đầu vào hardhat node mới — **không cần cập nhật** `blockchainHelpers.ts`.

> Sau mỗi lần restart: MetaMask → Settings → Advanced → **Clear activity and nonce data**

---

## Cách 2: Deploy lên Sepolia Testnet

**1. Tạo file `.env`** tại thư mục gốc:
```env
SEPOLIA_RPC="https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY"
PRIVATE_KEY="0xYOUR_METAMASK_PRIVATE_KEY"
```

**2. Compile và deploy:**
```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```

**3. Cập nhật `CONTRACT_ADDRESS`** trong `src/utils/blockchainHelpers.ts` và chạy `npm run dev`

---

## Tính năng

| Tính năng | Trạng thái |
|-----------|-----------|
| Kết nối ví MetaMask | ✅ Hoàn thành |
| Hiển thị thông tin ứng viên từ blockchain | ✅ Hoàn thành |
| Bỏ phiếu trên blockchain | ✅ Hoàn thành |
| Ngăn bỏ phiếu 2 lần | ✅ Hoàn thành |
| Kết quả cập nhật tự động mỗi 10 giây | ✅ Hoàn thành |
| Giao diện tiếng Việt | ✅ Hoàn thành |
| Ứng viên: Donald Trump & Kamala Harris | ✅ Hoàn thành |
| Chạy local không cần ETH thật | ✅ Hoàn thành |
| Trang quản trị Admin | ✅ Hoàn thành |
| Cử tri gửi yêu cầu đăng ký → Admin duyệt / từ chối | ✅ Hoàn thành |
| Đăng ký cử tri thủ công / xóa cử tri | ✅ Hoàn thành |
| Thêm / vô hiệu hóa ứng viên động | ✅ Hoàn thành |
| Lịch sử giao dịch bỏ phiếu | ✅ Hoàn thành |

---

## Trang quản trị Admin

Tài khoản **Account #0** (ví dùng để deploy contract) được tự động nhận quyền Admin.

Sau khi kết nối ví Admin, nút **"Trang quản trị"** xuất hiện bên cạnh nút "Trang bầu cử":

| Tab | Chức năng |
|-----|-----------|
| **Cử tri** | Bật/tắt yêu cầu đăng ký trước khi bỏ phiếu; thêm/xóa cử tri được duyệt |
| **Ứng viên** | Thêm ứng viên mới không cần deploy lại; vô hiệu hóa ứng viên cũ |
| **Lịch sử** | Xem toàn bộ giao dịch bỏ phiếu (voter address, ứng viên, thời gian, tx hash) |
| **Thống kê** | Tổng quan số phiếu, số cử tri, biểu đồ kết quả theo ứng viên |

### Chế độ đăng ký cử tri

Mặc định **tắt** — bất kỳ ví nào cũng có thể bỏ phiếu.

Khi Admin **bật** chế độ này, flow đăng ký diễn ra như sau:

1. Cử tri vào trang bầu cử → nhấn **"Gửi yêu cầu đăng ký bỏ phiếu"**
2. Giao dịch được ghi lên blockchain — cử tri thấy trạng thái **"Đang chờ admin duyệt"**
3. Admin vào **Tab Cử tri** → thấy danh sách yêu cầu chờ (badge số lượng màu vàng)
4. Admin nhấn **"Duyệt"** hoặc **"Từ chối"** cho từng yêu cầu
5. Cử tri được duyệt có thể bỏ phiếu bình thường

Admin cũng có thể **đăng ký thủ công** bằng cách nhập địa chỉ ví vào ô bên dưới.

---

## Cấu trúc dự án

```
contracts/
  Voting.sol            Smart contract chính (admin, bỏ phiếu, đăng ký cử tri, sự kiện)
scripts/
  deploy.js             Script deploy contract lên blockchain
src/
  components/
    WalletConnector.tsx   Kết nối ví MetaMask
    VotingPanel.tsx       Giao diện bỏ phiếu & kết quả
    AdminPanel.tsx        Trang quản trị Admin (4 tab)
  utils/
    blockchainHelpers.ts  Tất cả hàm tương tác blockchain (ethers.js)
  types.d.ts            Khai báo window.ethereum cho TypeScript
  App.tsx               Component gốc, phát hiện Admin tự động
  main.tsx              Điểm khởi động React
  index.css             Import Tailwind CSS
hardhat.config.cjs      Cấu hình Hardhat & mạng Sepolia
vite.config.ts          Cấu hình Vite (host: 0.0.0.0, port: 5173)
tailwind.config.js      Cấu hình Tailwind CSS
```

---

## Bảo mật phiếu bầu

- **1 ví = 1 phiếu** — contract enforce bằng `mapping(address => bool) hasVoted`
- **Không thể sửa phiếu** — giao dịch đã ghi lên blockchain là bất biến
- **Không thể giả mạo** — mỗi phiếu phải ký bằng private key của ví qua MetaMask
- **Bằng chứng minh bạch** — mỗi phiếu có transaction hash (txHash) công khai, ai cũng kiểm tra được

---

## Hạn chế đã biết

| # | Vấn đề | Mức độ | Mô tả |
|---|--------|--------|-------|
| 1 | Cử tri không thể huỷ yêu cầu đăng ký | Trung bình | Sau khi gửi yêu cầu, cử tri phải đợi Admin duyệt hoặc từ chối — không có nút tự huỷ |
| 2 | Thông báo dùng `alert()` | Thấp | Trang bỏ phiếu dùng `alert()` thay vì toast notification như trang Admin |
| 3 | Kiểu `window.ethereum` là `any` | Thấp | Chưa có TypeScript type đầy đủ cho ethereum provider |
| 4 | Ảnh fallback dùng API ngoài | Thấp | Khi ảnh ứng viên không tải được, fallback dùng `ui-avatars.com` — phụ thuộc dịch vụ bên ngoài |

---

## Lưu ý khi chạy lại sau khi tắt máy

Mỗi lần khởi động lại cần chạy lại đầy đủ:

**Terminal 1** (giữ mở):
```bash
cd ~/BlockVote-main/BlockVote-main
npx hardhat node
```

**Terminal 2:**
```bash
cd ~/BlockVote-main/BlockVote-main
npx hardhat run scripts/deploy.js --network localhost
npm run dev
```

Sau đó: MetaMask → Settings → Advanced → **Clear activity and nonce data**

> Địa chỉ contract luôn cố định `0x5FbDB2315678afecb367f032d93F642f64180aa3` — **không cần cập nhật code**.
