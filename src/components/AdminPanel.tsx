import React, { useState, useEffect } from "react";
import {
    Users, UserPlus, UserMinus, UserCheck, PlusCircle, XCircle,
    History, BarChart2, AlertCircle, CheckCircle, Loader, RefreshCw,
    ShieldCheck, ToggleLeft, ToggleRight, Clock, ExternalLink, ThumbsUp, ThumbsDown, Bell
} from "lucide-react";
import {
    getCandidates,
    getRegisteredVoters,
    getRegisteredVoterCount,
    getPendingRequests,
    getVoteHistory,
    adminRegisterVoter,
    adminRemoveVoter,
    adminApproveVoter,
    adminRejectVoter,
    adminAddCandidate,
    adminDeactivateCandidate,
    adminSetRegistrationRequired,
    isVoterRegistrationRequired,
    truncateAddress,
} from "../utils/blockchainHelpers";
import type { VoteRecord } from "../utils/blockchainHelpers";

interface Candidate {
    id: number;
    name: string;
    party: string;
    image: string;
    slogan: string;
    platform: string[];
    voteCount: number;
    active: boolean;
}

type Tab = "voters" | "candidates" | "history" | "stats";

interface Props {
    walletAddress: string;
}

const AdminPanel: React.FC<Props> = ({ walletAddress }) => {
    const [activeTab, setActiveTab] = useState<Tab>("voters");

    // Voter state
    const [voters, setVoters] = useState<string[]>([]);
    const [pendingVoters, setPendingVoters] = useState<string[]>([]);
    const [newVoterAddress, setNewVoterAddress] = useState("");
    const [registrationRequired, setRegistrationRequired] = useState(false);
    const [voterLoading, setVoterLoading] = useState(false);

    // Candidate state
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [newCandidate, setNewCandidate] = useState({
        name: "", party: "", imageURL: "", slogan: "", platform: ""
    });
    const [candidateLoading, setCandidateLoading] = useState(false);

    // History state
    const [voteHistory, setVoteHistory] = useState<VoteRecord[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // General
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const showMessage = (type: "success" | "error", text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const loadVoters = async () => {
        setVoterLoading(true);
        try {
            const [list, pending, required] = await Promise.all([
                getRegisteredVoters(),
                getPendingRequests(),
                isVoterRegistrationRequired(),
            ]);
            setVoters(list);
            setPendingVoters(pending);
            setRegistrationRequired(required);
        } catch (err: any) {
            showMessage("error", err.message || "Không thể tải danh sách cử tri");
        }
        setVoterLoading(false);
    };

    const loadCandidates = async () => {
        setCandidateLoading(true);
        try {
            const list = await getCandidates();
            setCandidates(list);
        } catch (err: any) {
            showMessage("error", err.message || "Không thể tải danh sách ứng viên");
        }
        setCandidateLoading(false);
    };

    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const history = await getVoteHistory();
            setVoteHistory(history.reverse());
        } catch (err: any) {
            showMessage("error", err.message || "Không thể tải lịch sử bỏ phiếu");
        }
        setHistoryLoading(false);
    };

    useEffect(() => {
        if (activeTab === "voters") loadVoters();
        else if (activeTab === "candidates" || activeTab === "stats") loadCandidates();
        else if (activeTab === "history") loadHistory();
    }, [activeTab]);

    // === VOTER ACTIONS ===

    const handleApproveVoter = async (address: string) => {
        setActionLoading(true);
        try {
            await adminApproveVoter(address);
            showMessage("success", "Đã duyệt cử tri thành công!");
            await loadVoters();
        } catch (err: any) {
            showMessage("error", err.reason || err.message || "Duyệt thất bại");
        }
        setActionLoading(false);
    };

    const handleRejectVoter = async (address: string) => {
        if (!confirm(`Từ chối yêu cầu của ${truncateAddress(address)}?`)) return;
        setActionLoading(true);
        try {
            await adminRejectVoter(address);
            showMessage("success", "Đã từ chối yêu cầu đăng ký");
            await loadVoters();
        } catch (err: any) {
            showMessage("error", err.reason || err.message || "Thao tác thất bại");
        }
        setActionLoading(false);
    };

    const handleRegisterVoter = async () => {
        if (!newVoterAddress.trim()) return showMessage("error", "Vui lòng nhập địa chỉ ví");
        if (!/^0x[0-9a-fA-F]{40}$/.test(newVoterAddress.trim()))
            return showMessage("error", "Địa chỉ ví không hợp lệ");
        setActionLoading(true);
        try {
            await adminRegisterVoter(newVoterAddress.trim());
            setNewVoterAddress("");
            showMessage("success", "Đã đăng ký cử tri thành công!");
            await loadVoters();
        } catch (err: any) {
            showMessage("error", err.reason || err.message || "Đăng ký thất bại");
        }
        setActionLoading(false);
    };

    const handleRemoveVoter = async (address: string) => {
        if (!confirm(`Xóa cử tri ${truncateAddress(address)}?`)) return;
        setActionLoading(true);
        try {
            await adminRemoveVoter(address);
            showMessage("success", "Đã xóa cử tri thành công!");
            await loadVoters();
        } catch (err: any) {
            showMessage("error", err.reason || err.message || "Xóa thất bại");
        }
        setActionLoading(false);
    };

    const handleToggleRegistration = async () => {
        setActionLoading(true);
        try {
            await adminSetRegistrationRequired(!registrationRequired);
            setRegistrationRequired(!registrationRequired);
            showMessage("success", `Đã ${!registrationRequired ? "bật" : "tắt"} yêu cầu đăng ký`);
        } catch (err: any) {
            showMessage("error", err.reason || err.message || "Thao tác thất bại");
        }
        setActionLoading(false);
    };

    // === CANDIDATE ACTIONS ===

    const handleAddCandidate = async () => {
        const { name, party, imageURL, slogan, platform } = newCandidate;
        if (!name.trim() || !party.trim()) return showMessage("error", "Tên và đảng là bắt buộc");
        const platformArr = platform.split("\n").map(s => s.trim()).filter(Boolean);
        if (platformArr.length === 0) return showMessage("error", "Vui lòng nhập ít nhất 1 chương trình hành động");

        setActionLoading(true);
        try {
            await adminAddCandidate(name.trim(), party.trim(), imageURL.trim(), slogan.trim(), platformArr);
            setNewCandidate({ name: "", party: "", imageURL: "", slogan: "", platform: "" });
            showMessage("success", `Đã thêm ứng viên "${name}" thành công!`);
            await loadCandidates();
        } catch (err: any) {
            showMessage("error", err.reason || err.message || "Thêm ứng viên thất bại");
        }
        setActionLoading(false);
    };

    const handleDeactivateCandidate = async (index: number, name: string) => {
        if (!confirm(`Vô hiệu hóa ứng viên "${name}"? Hành động này không thể hoàn tác.`)) return;
        setActionLoading(true);
        try {
            await adminDeactivateCandidate(index);
            showMessage("success", `Đã vô hiệu hóa ứng viên "${name}"`);
            await loadCandidates();
        } catch (err: any) {
            showMessage("error", err.reason || err.message || "Vô hiệu hóa thất bại");
        }
        setActionLoading(false);
    };

    const tabs = [
        { id: "voters" as Tab, label: "Cử tri", icon: Users },
        { id: "candidates" as Tab, label: "Ứng viên", icon: UserCheck },
        { id: "history" as Tab, label: "Lịch sử", icon: History },
        { id: "stats" as Tab, label: "Thống kê", icon: BarChart2 },
    ];

    const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <ShieldCheck className="w-8 h-8 text-yellow-400 mr-3" />
                    <div>
                        <h2 className="text-2xl font-bold text-yellow-400">Trang Quản Trị Admin</h2>
                        <p className="text-gray-400 text-sm">Địa chỉ: {truncateAddress(walletAddress)}</p>
                    </div>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`flex items-center mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
                    message.type === "success"
                        ? "bg-green-500/20 border border-green-500/50 text-green-300"
                        : "bg-red-500/20 border border-red-500/50 text-red-300"
                }`}>
                    {message.type === "success"
                        ? <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                        : <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />}
                    {message.text}
                </div>
            )}

            {/* Tabs */}
            <div className="flex space-x-2 mb-6 bg-gray-800/50 p-1 rounded-xl">
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${
                            activeTab === id
                                ? "bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg"
                                : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                        }`}
                    >
                        <Icon className="w-4 h-4 mr-2" />
                        {label}
                    </button>
                ))}
            </div>

            {/* ===== TAB: CỬ TRI ===== */}
            {activeTab === "voters" && (
                <div className="space-y-6">
                    {/* Toggle registration */}
                    <div className="bg-gray-800/40 border border-gray-700 rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold mb-1">Yêu cầu đăng ký trước khi bỏ phiếu</h3>
                                <p className="text-gray-400 text-sm">
                                    {registrationRequired
                                        ? "Chỉ cử tri được admin duyệt mới được bỏ phiếu"
                                        : "Bất kỳ ví nào cũng có thể bỏ phiếu (mặc định)"}
                                </p>
                            </div>
                            <button
                                onClick={handleToggleRegistration}
                                disabled={actionLoading}
                                className={`flex items-center px-5 py-3 rounded-xl font-semibold transition-all duration-200 ${
                                    registrationRequired
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-gray-600 hover:bg-gray-500"
                                } disabled:opacity-50`}
                            >
                                {registrationRequired
                                    ? <ToggleRight className="w-5 h-5 mr-2" />
                                    : <ToggleLeft className="w-5 h-5 mr-2" />}
                                {registrationRequired ? "Đang BẬT" : "Đang TẮT"}
                            </button>
                        </div>
                    </div>

                    {/* Pending requests */}
                    <div className="bg-gray-800/40 border border-yellow-600/40 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold flex items-center">
                                <Bell className="w-5 h-5 mr-2 text-yellow-400" />
                                Yêu cầu đăng ký đang chờ duyệt
                                {pendingVoters.length > 0 && (
                                    <span className="ml-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                                        {pendingVoters.length}
                                    </span>
                                )}
                            </h3>
                            <button onClick={loadVoters} disabled={voterLoading} className="text-gray-400 hover:text-white transition-colors">
                                <RefreshCw className={`w-5 h-5 ${voterLoading ? "animate-spin" : ""}`} />
                            </button>
                        </div>

                        {voterLoading ? (
                            <div className="text-center py-6 text-gray-400">
                                <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
                                Đang tải...
                            </div>
                        ) : pendingVoters.length === 0 ? (
                            <div className="text-center py-6 text-gray-500">
                                Không có yêu cầu nào đang chờ duyệt
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {pendingVoters.map((address) => (
                                    <div key={address} className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3">
                                        <span className="font-mono text-sm text-yellow-200">{address}</span>
                                        <div className="flex items-center gap-2 ml-4">
                                            <button
                                                onClick={() => handleApproveVoter(address)}
                                                disabled={actionLoading}
                                                className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg text-sm font-semibold transition-all"
                                                title="Duyệt"
                                            >
                                                <ThumbsUp className="w-4 h-4 mr-1" />
                                                Duyệt
                                            </button>
                                            <button
                                                onClick={() => handleRejectVoter(address)}
                                                disabled={actionLoading}
                                                className="flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg text-sm font-semibold transition-all"
                                                title="Từ chối"
                                            >
                                                <ThumbsDown className="w-4 h-4 mr-1" />
                                                Từ chối
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Register new voter */}
                    <div className="bg-gray-800/40 border border-gray-700 rounded-2xl p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center">
                            <UserPlus className="w-5 h-5 mr-2 text-blue-400" />
                            Đăng ký cử tri thủ công
                        </h3>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={newVoterAddress}
                                onChange={(e) => setNewVoterAddress(e.target.value)}
                                placeholder="0x... địa chỉ ví cử tri"
                                className="flex-1 bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 font-mono text-sm focus:outline-none focus:border-blue-500"
                            />
                            <button
                                onClick={handleRegisterVoter}
                                disabled={actionLoading || !newVoterAddress.trim()}
                                className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl font-semibold transition-all duration-200"
                            >
                                {actionLoading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                                Đăng ký
                            </button>
                        </div>
                    </div>

                    {/* Voter list */}
                    <div className="bg-gray-800/40 border border-gray-700 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold flex items-center">
                                <Users className="w-5 h-5 mr-2 text-purple-400" />
                                Danh sách cử tri đã đăng ký
                                <span className="ml-2 bg-purple-600/40 text-purple-300 text-xs px-2 py-1 rounded-full">
                                    {voters.length}
                                </span>
                            </h3>
                            <button onClick={loadVoters} disabled={voterLoading} className="text-gray-400 hover:text-white transition-colors">
                                <RefreshCw className={`w-5 h-5 ${voterLoading ? "animate-spin" : ""}`} />
                            </button>
                        </div>

                        {voterLoading ? (
                            <div className="text-center py-8 text-gray-400">
                                <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
                                Đang tải...
                            </div>
                        ) : voters.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Chưa có cử tri nào được đăng ký
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {voters.map((address, i) => (
                                    <div key={address} className="flex items-center justify-between bg-gray-700/30 rounded-xl px-4 py-3">
                                        <div className="flex items-center">
                                            <span className="text-gray-500 text-xs w-6">{i + 1}.</span>
                                            <span className="font-mono text-sm text-gray-200">{address}</span>
                                            {address.toLowerCase() === walletAddress.toLowerCase() && (
                                                <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Bạn</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleRemoveVoter(address)}
                                            disabled={actionLoading}
                                            className="text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors ml-4"
                                            title="Xóa cử tri"
                                        >
                                            <UserMinus className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===== TAB: ỨNG VIÊN ===== */}
            {activeTab === "candidates" && (
                <div className="space-y-6">
                    {/* Add new candidate */}
                    <div className="bg-gray-800/40 border border-gray-700 rounded-2xl p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center">
                            <PlusCircle className="w-5 h-5 mr-2 text-green-400" />
                            Thêm ứng viên mới
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Tên ứng viên *</label>
                                <input
                                    type="text"
                                    value={newCandidate.name}
                                    onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                                    placeholder="Nguyễn Văn A"
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Đảng / Tổ chức *</label>
                                <input
                                    type="text"
                                    value={newCandidate.party}
                                    onChange={(e) => setNewCandidate({ ...newCandidate, party: e.target.value })}
                                    placeholder="Đảng ABC"
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">URL ảnh đại diện</label>
                                <input
                                    type="text"
                                    value={newCandidate.imageURL}
                                    onChange={(e) => setNewCandidate({ ...newCandidate, imageURL: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Khẩu hiệu</label>
                                <input
                                    type="text"
                                    value={newCandidate.slogan}
                                    onChange={(e) => setNewCandidate({ ...newCandidate, slogan: e.target.value })}
                                    placeholder="Vì một tương lai tươi sáng"
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm text-gray-400 mb-1 block">Chương trình hành động * (mỗi dòng 1 mục)</label>
                                <textarea
                                    value={newCandidate.platform}
                                    onChange={(e) => setNewCandidate({ ...newCandidate, platform: e.target.value })}
                                    placeholder={"Phát triển kinh tế\nCải cách giáo dục\nBảo vệ môi trường"}
                                    rows={3}
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500 resize-none"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleAddCandidate}
                            disabled={actionLoading || !newCandidate.name.trim() || !newCandidate.party.trim()}
                            className="mt-4 flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-xl font-semibold transition-all duration-200"
                        >
                            {actionLoading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <PlusCircle className="w-4 h-4 mr-2" />}
                            Thêm ứng viên
                        </button>
                    </div>

                    {/* Candidate list */}
                    <div className="bg-gray-800/40 border border-gray-700 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold flex items-center">
                                <UserCheck className="w-5 h-5 mr-2 text-blue-400" />
                                Danh sách ứng viên
                                <span className="ml-2 bg-blue-600/40 text-blue-300 text-xs px-2 py-1 rounded-full">
                                    {candidates.length}
                                </span>
                            </h3>
                            <button onClick={loadCandidates} disabled={candidateLoading} className="text-gray-400 hover:text-white transition-colors">
                                <RefreshCw className={`w-5 h-5 ${candidateLoading ? "animate-spin" : ""}`} />
                            </button>
                        </div>

                        {candidateLoading ? (
                            <div className="text-center py-8 text-gray-400">
                                <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
                                Đang tải...
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {candidates.map((candidate) => (
                                    <div key={candidate.id} className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                                        candidate.active ? "bg-gray-700/30" : "bg-gray-800/50 opacity-60"
                                    }`}>
                                        <div className="flex items-center gap-4">
                                            {candidate.image && (
                                                <img src={candidate.image} alt={candidate.name}
                                                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-600" />
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">{candidate.name}</span>
                                                    {!candidate.active && (
                                                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Đã vô hiệu</span>
                                                    )}
                                                </div>
                                                <span className="text-sm text-gray-400">{candidate.party}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-blue-400 font-bold">{candidate.voteCount} phiếu</span>
                                            {candidate.active && (
                                                <button
                                                    onClick={() => handleDeactivateCandidate(candidate.id, candidate.name)}
                                                    disabled={actionLoading}
                                                    className="text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                                                    title="Vô hiệu hóa ứng viên"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===== TAB: LỊCH SỬ ===== */}
            {activeTab === "history" && (
                <div className="bg-gray-800/40 border border-gray-700 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold flex items-center">
                            <History className="w-6 h-6 mr-2 text-purple-400" />
                            Lịch sử giao dịch bỏ phiếu
                            <span className="ml-2 bg-purple-600/40 text-purple-300 text-xs px-2 py-1 rounded-full">
                                {voteHistory.length}
                            </span>
                        </h3>
                        <button onClick={loadHistory} disabled={historyLoading} className="text-gray-400 hover:text-white transition-colors">
                            <RefreshCw className={`w-5 h-5 ${historyLoading ? "animate-spin" : ""}`} />
                        </button>
                    </div>

                    {historyLoading ? (
                        <div className="text-center py-12 text-gray-400">
                            <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
                            Đang tải lịch sử từ blockchain...
                        </div>
                    ) : voteHistory.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            Chưa có phiếu bầu nào được ghi nhận
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-gray-400 border-b border-gray-700">
                                        <th className="text-left py-3 px-3">#</th>
                                        <th className="text-left py-3 px-3">Địa chỉ cử tri</th>
                                        <th className="text-left py-3 px-3">Ứng viên</th>
                                        <th className="text-left py-3 px-3">Thời gian</th>
                                        <th className="text-left py-3 px-3">Block</th>
                                        <th className="text-left py-3 px-3">TX Hash</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {voteHistory.map((record, i) => {
                                        const candidate = candidates[record.candidateIndex];
                                        const date = new Date(record.timestamp * 1000);
                                        return (
                                            <tr key={record.txHash} className="border-b border-gray-800 hover:bg-gray-700/20 transition-colors">
                                                <td className="py-3 px-3 text-gray-500">{i + 1}</td>
                                                <td className="py-3 px-3">
                                                    <span className="font-mono text-blue-300">{truncateAddress(record.voter)}</span>
                                                    {record.voter.toLowerCase() === walletAddress.toLowerCase() && (
                                                        <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full">Bạn</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className="text-white font-medium">
                                                        {candidate ? candidate.name : `Ứng viên #${record.candidateIndex}`}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-gray-400">
                                                    <div className="flex items-center">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {record.timestamp > 0
                                                            ? date.toLocaleString("vi-VN")
                                                            : "—"}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 text-gray-400">#{record.blockNumber}</td>
                                                <td className="py-3 px-3">
                                                    <span className="font-mono text-gray-500 text-xs break-all">{record.txHash}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ===== TAB: THỐNG KÊ ===== */}
            {activeTab === "stats" && (
                <div className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-2xl p-6 text-center">
                            <div className="text-4xl font-bold text-blue-400 mb-2">{totalVotes}</div>
                            <div className="text-gray-400">Tổng phiếu bầu</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-2xl p-6 text-center">
                            <div className="text-4xl font-bold text-purple-400 mb-2">
                                {candidates.filter(c => c.active).length}
                            </div>
                            <div className="text-gray-400">Ứng viên đang hoạt động</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-2xl p-6 text-center">
                            <div className="text-4xl font-bold text-green-400 mb-2">{voters.length || "—"}</div>
                            <div className="text-gray-400">Cử tri đã đăng ký</div>
                        </div>
                    </div>

                    {/* Biểu đồ kết quả */}
                    <div className="bg-gray-800/40 border border-gray-700 rounded-2xl p-6">
                        <h3 className="text-lg font-bold mb-6 flex items-center">
                            <BarChart2 className="w-5 h-5 mr-2 text-yellow-400" />
                            Kết quả bầu cử theo ứng viên
                        </h3>
                        {candidateLoading ? (
                            <div className="text-center py-8 text-gray-400">
                                <Loader className="w-6 h-6 animate-spin mx-auto" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {candidates
                                    .filter(c => c.active)
                                    .sort((a, b) => b.voteCount - a.voteCount)
                                    .map((candidate, rank) => {
                                        const pct = totalVotes > 0 ? (candidate.voteCount / totalVotes) * 100 : 0;
                                        const colors = ["from-yellow-500 to-orange-500", "from-blue-500 to-purple-500", "from-green-500 to-teal-500", "from-pink-500 to-red-500"];
                                        const color = colors[rank % colors.length];
                                        return (
                                            <div key={candidate.id}>
                                                <div className="flex justify-between mb-1">
                                                    <div className="flex items-center">
                                                        {rank === 0 && totalVotes > 0 && <span className="mr-2 text-yellow-400">🏆</span>}
                                                        <span className="font-semibold">{candidate.name}</span>
                                                        <span className="ml-2 text-gray-500 text-sm">{candidate.party}</span>
                                                    </div>
                                                    <span className="font-bold">{candidate.voteCount} phiếu ({pct.toFixed(1)}%)</span>
                                                </div>
                                                <div className="bg-gray-700 rounded-full h-3">
                                                    <div
                                                        className={`bg-gradient-to-r ${color} h-3 rounded-full transition-all duration-1000`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                {candidates.filter(c => c.active).length === 0 && (
                                    <p className="text-center text-gray-500 py-4">Không có ứng viên đang hoạt động</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
