import { BrowserProvider, ethers } from "ethers";
import VotingContractABI from "../../artifacts/contracts/Voting.sol/Voting.json";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export async function getProviderAndContract() {
    if (!window.ethereum) throw new Error("MetaMask not installed");
    const provider = new BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, VotingContractABI.abi, signer);
    return { contract, signer, provider };
}

export async function getReadOnlyContract() {
    if (!window.ethereum) throw new Error("MetaMask not installed");
    const provider = new BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, VotingContractABI.abi, provider);
    return { contract, provider };
}

// === ỨNG VIÊN ===

export async function getCandidates() {
    const { contract } = await getReadOnlyContract();
    const count = await contract.getCandidateCount();
    const promises = [];
    for (let i = 0; i < count; i++) {
        promises.push(contract.getCandidate(i));
    }
    const rawCandidates = await Promise.all(promises);
    return rawCandidates.map((c, index) => ({
        id: index,
        name: c.name,
        party: c.party,
        image: c.imageURL,
        slogan: c.slogan,
        platform: Array.from(c.platform),
        voteCount: parseInt(c.voteCount.toString()),
        active: c.active,
    }));
}

export async function voteForCandidate(candidateId: number) {
    const { contract } = await getProviderAndContract();
    const tx = await contract.vote(candidateId);
    await tx.wait();
}

export async function getVoteCounts() {
    const { contract } = await getReadOnlyContract();
    const count = await contract.getCandidateCount();
    const promises = [];
    for (let i = 0; i < count; i++) {
        promises.push(contract.getVoteCount(i));
    }
    const counts = await Promise.all(promises);
    return counts.map((c) => parseInt(c.toString()));
}

// === KIỂM TRA BỎ PHIẾU / ĐĂNG KÝ ===

export async function hasVoted(address: string) {
    const { contract } = await getReadOnlyContract();
    return await contract.checkIfVoted(address);
}

export async function isVoterRegistrationRequired() {
    const { contract } = await getReadOnlyContract();
    return await contract.voterRegistrationRequired();
}

export async function isVoterRegistered(address: string) {
    const { contract } = await getReadOnlyContract();
    return await contract.isRegisteredVoter(address);
}

export async function hasPendingRequest(address: string): Promise<boolean> {
    const { contract } = await getReadOnlyContract();
    return await contract.hasPendingRequest(address);
}

export async function requestVoterRegistration() {
    const { contract } = await getProviderAndContract();
    const tx = await contract.requestRegistration();
    await tx.wait();
}

// === ADMIN: YÊU CẦU ĐĂNG KÝ ===

export async function getPendingRequests(): Promise<string[]> {
    const { contract } = await getReadOnlyContract();
    const list = await contract.getPendingRequests();
    return Array.from(list);
}

export async function adminApproveVoter(voterAddress: string) {
    const { contract } = await getProviderAndContract();
    const tx = await contract.approveVoter(voterAddress);
    await tx.wait();
}

export async function adminRejectVoter(voterAddress: string) {
    const { contract } = await getProviderAndContract();
    const tx = await contract.rejectVoter(voterAddress);
    await tx.wait();
}

// === ADMIN: THÔNG TIN ===

export async function getOwner(): Promise<string> {
    const { contract } = await getReadOnlyContract();
    return await contract.owner();
}

export async function getRegisteredVoters(): Promise<string[]> {
    const { contract } = await getReadOnlyContract();
    const voters = await contract.getRegisteredVoters();
    return Array.from(voters);
}

export async function getRegisteredVoterCount(): Promise<number> {
    const { contract } = await getReadOnlyContract();
    const count = await contract.getRegisteredVoterCount();
    return parseInt(count.toString());
}

// === ADMIN: QUẢN LÝ CỬ TRI ===

export async function adminRegisterVoter(voterAddress: string) {
    const { contract } = await getProviderAndContract();
    const tx = await contract.registerVoter(voterAddress);
    await tx.wait();
}

export async function adminRemoveVoter(voterAddress: string) {
    const { contract } = await getProviderAndContract();
    const tx = await contract.removeVoter(voterAddress);
    await tx.wait();
}

export async function adminSetRegistrationRequired(required: boolean) {
    const { contract } = await getProviderAndContract();
    const tx = await contract.setVoterRegistrationRequired(required);
    await tx.wait();
}

// === ADMIN: QUẢN LÝ ỨNG VIÊN ===

export async function adminAddCandidate(
    name: string,
    party: string,
    imageURL: string,
    slogan: string,
    platform: string[]
) {
    const { contract } = await getProviderAndContract();
    const tx = await contract.addCandidate(name, party, imageURL, slogan, platform);
    await tx.wait();
}

export async function adminDeactivateCandidate(index: number) {
    const { contract } = await getProviderAndContract();
    const tx = await contract.deactivateCandidate(index);
    await tx.wait();
}

// === LỊCH SỬ BỎ PHIẾU ===

export interface VoteRecord {
    voter: string;
    candidateIndex: number;
    timestamp: number;
    txHash: string;
    blockNumber: number;
}

export async function getVoteHistory(): Promise<VoteRecord[]> {
    const { contract, provider } = await getProviderAndContract();
    const filter = contract.filters.VoteCast();
    const events = await contract.queryFilter(filter, 0, "latest");
    return events.map((e: any) => ({
        voter: e.args.voter,
        candidateIndex: parseInt(e.args.candidateIndex.toString()),
        timestamp: parseInt(e.args.timestamp.toString()),
        txHash: e.transactionHash,
        blockNumber: e.blockNumber,
    }));
}

// === TIỆN ÍCH ===

export const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
