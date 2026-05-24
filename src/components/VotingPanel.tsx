import React, { useState, useEffect } from "react";
import { Vote, Zap, Users, AlertTriangle, Lock, Send, Clock, History } from "lucide-react";
import {
    getCandidates,
    voteForCandidate,
    getVoteCounts,
    hasVoted,
    isVoterRegistrationRequired,
    isVoterRegistered,
    hasPendingRequest,
    requestVoterRegistration,
    getVoteHistory,
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

interface Props {
    walletAddress: string;
}

const VotingPanel: React.FC<Props> = ({ walletAddress }) => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [voteCount, setVoteCount] = useState<number[]>([]);
    const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
    const [hasUserVoted, setHasUserVoted] = useState<boolean>(false);
    const [registrationRequired, setRegistrationRequired] = useState<boolean>(false);
    const [isRegistered, setIsRegistered] = useState<boolean>(false);
    const [isPending, setIsPending] = useState<boolean>(false);
    const [requestLoading, setRequestLoading] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [myHistory, setMyHistory] = useState<VoteRecord[]>([]);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            setError(null);

            try {
                const [candidatesFromChain, counts, voted, regRequired, registered, pending, allHistory] = await Promise.all([
                    getCandidates(),
                    getVoteCounts(),
                    hasVoted(walletAddress),
                    isVoterRegistrationRequired(),
                    isVoterRegistered(walletAddress),
                    hasPendingRequest(walletAddress),
                    getVoteHistory(),
                ]);

                setCandidates(candidatesFromChain);
                setVoteCount(counts);
                setHasUserVoted(voted);
                setRegistrationRequired(regRequired);
                setIsRegistered(registered);
                setIsPending(pending);
                setMyHistory(allHistory.filter(r => r.voter.toLowerCase() === walletAddress.toLowerCase()));
            } catch (err: any) {
                setError(err.message || "Không thể tải dữ liệu blockchain");
            }

            setLoading(false);
        }

        loadData();

        const interval = setInterval(async () => {
            try {
                const counts = await getVoteCounts();
                setVoteCount(counts);
            } catch {
                // silently fail
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [walletAddress]);

    const handleVote = async (candidateId: number) => {
        if (hasUserVoted) return alert("Bạn đã bỏ phiếu rồi!");
        if (registrationRequired && !isRegistered)
            return alert("Bạn chưa được đăng ký quyền bỏ phiếu. Liên hệ admin để được cấp quyền.");

        try {
            setSelectedCandidate(candidateId);
            await voteForCandidate(candidateId);

            const [counts, allHistory] = await Promise.all([getVoteCounts(), getVoteHistory()]);
            setVoteCount(counts);
            setHasUserVoted(true);
            setMyHistory(allHistory.filter(r => r.voter.toLowerCase() === walletAddress.toLowerCase()));

            alert("Bỏ phiếu thành công!");
        } catch (err: any) {
            alert(err.reason || err.message || "Bỏ phiếu thất bại");
        } finally {
            setSelectedCandidate(null);
        }
    };

    if (loading) {
        return (
            <div className="text-center text-lg mt-10 text-blue-400">
                Đang tải dữ liệu blockchain...
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-lg mt-10 text-red-500">
                Lỗi: {error}
            </div>
        );
    }

    const activeCandidates = candidates.filter(c => c.active);
    const totalVotes = voteCount.reduce((a, b) => a + b, 0);
    const canVote = !hasUserVoted && (!registrationRequired || isRegistered);

    return (
        <div className="space-y-12">
            <div className="text-center">
                <h2 className="text-3xl font-bold mb-2">Bầu cử tổng thống Mỹ</h2>
                <p className="text-gray-400">Bỏ phiếu an toàn trên blockchain</p>

                {hasUserVoted && (
                    <p className="text-green-400 mt-2 font-semibold">✅ Bạn đã bỏ phiếu</p>
                )}

                {registrationRequired && !isRegistered && !hasUserVoted && !isPending && (
                    <div className="mt-4 flex flex-col items-center gap-3">
                        <div className="inline-flex items-center bg-orange-500/20 border border-orange-500/50 text-orange-300 px-4 py-2 rounded-xl text-sm">
                            <Lock className="w-4 h-4 mr-2" />
                            Cuộc bầu cử yêu cầu đăng ký trước khi bỏ phiếu
                        </div>
                        <button
                            onClick={async () => {
                                setRequestLoading(true);
                                try {
                                    await requestVoterRegistration();
                                    setIsPending(true);
                                } catch (err: any) {
                                    alert(err.reason || err.message || "Gửi yêu cầu thất bại");
                                }
                                setRequestLoading(false);
                            }}
                            disabled={requestLoading}
                            className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl font-semibold transition-all duration-200"
                        >
                            {requestLoading ? (
                                <Zap className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4 mr-2" />
                            )}
                            Gửi yêu cầu đăng ký bỏ phiếu
                        </button>
                    </div>
                )}

                {registrationRequired && !isRegistered && !hasUserVoted && isPending && (
                    <div className="inline-flex items-center mt-3 bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 px-4 py-2 rounded-xl text-sm">
                        <Clock className="w-4 h-4 mr-2" />
                        Yêu cầu đăng ký của bạn đang chờ admin duyệt
                    </div>
                )}

                {registrationRequired && isRegistered && !hasUserVoted && (
                    <p className="text-blue-400 mt-2 text-sm">✓ Bạn đã được đăng ký quyền bỏ phiếu</p>
                )}
            </div>

            {activeCandidates.length === 0 ? (
                <div className="text-center py-12">
                    <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                    <p className="text-gray-400">Hiện tại không có ứng viên nào đang hoạt động</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    {activeCandidates.map((candidate) => {
                        const candidateVotes = voteCount[candidate.id] || 0;
                        const isProcessing = selectedCandidate === candidate.id;
                        return (
                            <div
                                key={candidate.id}
                                className={`relative bg-gray-800/30 backdrop-blur-sm border-2 rounded-2xl p-8 transition-all duration-500 hover:scale-105 ${
                                    isProcessing
                                        ? "border-green-400 shadow-2xl shadow-green-400/25 animate-pulse"
                                        : "border-gray-700 hover:border-blue-400"
                                }`}
                            >
                                {isProcessing && (
                                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-bounce">
                                        Đã ghi nhận!
                                    </div>
                                )}

                                <div className="text-center mb-6">
                                    <div className="relative inline-block">
                                        <img
                                            src={candidate.image}
                                            alt={candidate.name}
                                            className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-purple-400/50"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src =
                                                    "https://ui-avatars.com/api/?name=" + encodeURIComponent(candidate.name) + "&background=4f46e5&color=fff&size=128";
                                            }}
                                        />
                                        <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-2">
                                            <Vote className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-1">{candidate.name}</h3>
                                    <p className="text-purple-400 font-semibold">{candidate.party}</p>
                                    {candidate.slogan && (
                                        <p className="text-gray-400 italic mt-1">"{candidate.slogan}"</p>
                                    )}
                                </div>

                                {candidate.platform.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="text-lg font-semibold mb-3 text-blue-400">Chương trình hành động:</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {candidate.platform.map((item, index) => (
                                                <span
                                                    key={index}
                                                    className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 px-3 py-1 rounded-full text-sm"
                                                >
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => handleVote(candidate.id)}
                                    disabled={!canVote || isProcessing}
                                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 transform shadow-xl ${
                                        hasUserVoted
                                            ? "bg-gradient-to-r from-green-600 to-green-700 scale-100 cursor-default"
                                            : !canVote
                                            ? "bg-gradient-to-r from-gray-600 to-gray-700 scale-100 cursor-not-allowed opacity-60"
                                            : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:scale-105"
                                    }`}
                                >
                                    {isProcessing ? (
                                        <span className="flex items-center justify-center">
                                            <Zap className="w-5 h-5 mr-2 animate-spin" />
                                            Đang xử lý...
                                        </span>
                                    ) : hasUserVoted ? (
                                        "✅ Đã bỏ phiếu"
                                    ) : !canVote ? (
                                        <span className="flex items-center justify-center">
                                            <Lock className="w-5 h-5 mr-2" />
                                            Chưa được cấp quyền
                                        </span>
                                    ) : (
                                        `Bỏ phiếu cho ${candidate.name}`
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Kết quả trực tiếp */}
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 max-w-4xl mx-auto">
                <div className="flex items-center justify-center mb-6">
                    <Users className="w-8 h-8 text-blue-400 mr-3" />
                    <h3 className="text-2xl font-bold">Kết quả bầu cử trực tiếp</h3>
                </div>

                {activeCandidates.length === 0 ? (
                    <p className="text-center text-gray-500">Không có ứng viên</p>
                ) : (
                    <div className="grid md:grid-cols-2 gap-8">
                        {activeCandidates.map((candidate) => {
                            const candidateVotes = voteCount[candidate.id] || 0;
                            const percentage = totalVotes ? (candidateVotes / totalVotes) * 100 : 0;

                            return (
                                <div key={candidate.id} className="text-center">
                                    <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6">
                                        <h4 className="text-xl font-semibold mb-2">{candidate.name}</h4>
                                        <div className="text-4xl font-bold text-blue-400 mb-2">
                                            {candidateVotes.toLocaleString()}
                                        </div>
                                        <p className="text-gray-400">phiếu bầu</p>

                                        <div className="mt-4 bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <p className="text-sm text-gray-400 mt-2">{percentage.toFixed(1)}%</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="text-center mt-6 pt-6 border-t border-gray-700">
                    <p className="text-gray-400">
                        Tổng số phiếu đã bầu:{" "}
                        <span className="text-white font-semibold">{totalVotes.toLocaleString()}</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        🔒 Tất cả phiếu bầu được mã hóa và lưu trữ vĩnh viễn trên blockchain
                    </p>
                </div>
            </div>

            {/* Lịch sử bỏ phiếu của tôi */}
            {myHistory.length > 0 && (
                <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 max-w-4xl mx-auto">
                    <div className="flex items-center mb-6">
                        <History className="w-6 h-6 text-purple-400 mr-3" />
                        <h3 className="text-xl font-bold">Lịch sử bỏ phiếu của tôi</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-400 border-b border-gray-700">
                                    <th className="text-left py-3 px-3">#</th>
                                    <th className="text-left py-3 px-3">Ứng viên</th>
                                    <th className="text-left py-3 px-3">Thời gian</th>
                                    <th className="text-left py-3 px-3">Block</th>
                                    <th className="text-left py-3 px-3">TX Hash</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myHistory.map((record, i) => {
                                    const candidate = candidates[record.candidateIndex];
                                    const date = new Date(record.timestamp * 1000);
                                    return (
                                        <tr key={record.txHash} className="border-b border-gray-800">
                                            <td className="py-3 px-3 text-gray-500">{i + 1}</td>
                                            <td className="py-3 px-3 text-white font-medium">
                                                {candidate ? candidate.name : `Ứng viên #${record.candidateIndex}`}
                                            </td>
                                            <td className="py-3 px-3 text-gray-400">
                                                <div className="flex items-center">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {record.timestamp > 0 ? date.toLocaleString("vi-VN") : "—"}
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
                </div>
            )}
        </div>
    );
};

export default VotingPanel;
