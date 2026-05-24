// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    struct Candidate {
        uint256 id;
        string name;
        string party;
        string imageURL;
        string slogan;
        string[] platform;
        uint256 voteCount;
        bool active;
    }

    address public owner;
    Candidate[] public candidates;
    mapping(address => bool) public hasVoted;
    mapping(address => bool) public registeredVoters;
    address[] private voterList;
    mapping(address => bool) public pendingRequests;
    address[] private pendingList;
    bool public voterRegistrationRequired;

    event VoteCast(address indexed voter, uint256 indexed candidateIndex, uint256 timestamp);
    event VoterRegistered(address indexed voter);
    event VoterRemoved(address indexed voter);
    event RegistrationRequested(address indexed voter);
    event RegistrationApproved(address indexed voter);
    event RegistrationRejected(address indexed voter);
    event CandidateAdded(uint256 indexed candidateId, string name);
    event CandidateDeactivated(uint256 indexed candidateId);
    event RegistrationRequirementChanged(bool required);

    modifier onlyOwner() {
        require(msg.sender == owner, "Chi admin moi co quyen thuc hien");
        _;
    }

    constructor() {
        owner = msg.sender;
        voterRegistrationRequired = false;

        string[] memory platform1 = new string[](3);
        platform1[0] = "Kinh te & Viec lam";
        platform1[1] = "An ninh quoc gia";
        platform1[2] = "America First";

        candidates.push(
            Candidate({
                id: 0,
                name: "Donald Trump",
                party: "Dang Cong hoa",
                imageURL: "https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg",
                slogan: "Hay lam cho nuoc My vi dai tro lai",
                platform: platform1,
                voteCount: 0,
                active: true
            })
        );

        string[] memory platform2 = new string[](3);
        platform2[0] = "Quyen binh dang";
        platform2[1] = "Cham soc suc khoe";
        platform2[2] = "Bao ve moi truong";

        candidates.push(
            Candidate({
                id: 1,
                name: "Kamala Harris",
                party: "Dang Dan chu",
                imageURL: "https://upload.wikimedia.org/wikipedia/commons/4/41/Kamala_Harris_Vice_Presidential_Portrait.jpg",
                slogan: "Khi chung ta chien dau, chung ta chien thang",
                platform: platform2,
                voteCount: 0,
                active: true
            })
        );
    }

    // === CỬ TRI: GỬI YÊU CẦU ĐĂNG KÝ ===

    function requestRegistration() external {
        require(!registeredVoters[msg.sender], "Ban da duoc dang ky quyen bo phieu");
        require(!pendingRequests[msg.sender], "Ban da gui yeu cau, vui long cho admin duyet");
        pendingRequests[msg.sender] = true;
        pendingList.push(msg.sender);
        emit RegistrationRequested(msg.sender);
    }

    function getPendingRequests() external view returns (address[] memory) {
        return pendingList;
    }

    function hasPendingRequest(address voter) public view returns (bool) {
        return pendingRequests[voter];
    }

    // === ADMIN: DUYỆT / TỪ CHỐI YÊU CẦU ===

    function approveVoter(address voter) external onlyOwner {
        require(pendingRequests[voter], "Khong co yeu cau dang ky tu dia chi nay");
        require(!registeredVoters[voter], "Dia chi nay da duoc dang ky");
        pendingRequests[voter] = false;
        _removePending(voter);
        registeredVoters[voter] = true;
        voterList.push(voter);
        emit RegistrationApproved(voter);
        emit VoterRegistered(voter);
    }

    function rejectVoter(address voter) external onlyOwner {
        require(pendingRequests[voter], "Khong co yeu cau dang ky tu dia chi nay");
        pendingRequests[voter] = false;
        _removePending(voter);
        emit RegistrationRejected(voter);
    }

    function _removePending(address voter) internal {
        for (uint256 i = 0; i < pendingList.length; i++) {
            if (pendingList[i] == voter) {
                pendingList[i] = pendingList[pendingList.length - 1];
                pendingList.pop();
                break;
            }
        }
    }

    // === ADMIN: QUẢN LÝ CỬ TRI ===

    function setVoterRegistrationRequired(bool _required) external onlyOwner {
        voterRegistrationRequired = _required;
        emit RegistrationRequirementChanged(_required);
    }

    function registerVoter(address voter) external onlyOwner {
        require(!registeredVoters[voter], "Dia chi nay da duoc dang ky");
        if (pendingRequests[voter]) {
            pendingRequests[voter] = false;
            _removePending(voter);
        }
        registeredVoters[voter] = true;
        voterList.push(voter);
        emit VoterRegistered(voter);
    }

    function removeVoter(address voter) external onlyOwner {
        require(registeredVoters[voter], "Dia chi nay chua duoc dang ky");
        registeredVoters[voter] = false;
        for (uint256 i = 0; i < voterList.length; i++) {
            if (voterList[i] == voter) {
                voterList[i] = voterList[voterList.length - 1];
                voterList.pop();
                break;
            }
        }
        emit VoterRemoved(voter);
    }

    function getRegisteredVoters() external view returns (address[] memory) {
        return voterList;
    }

    function getRegisteredVoterCount() public view returns (uint256) {
        return voterList.length;
    }

    function isRegisteredVoter(address voter) public view returns (bool) {
        return registeredVoters[voter];
    }

    // === ADMIN: QUẢN LÝ ỨNG VIÊN ===

    function addCandidate(
        string memory name,
        string memory party,
        string memory imageURL,
        string memory slogan,
        string[] memory platform
    ) external onlyOwner {
        uint256 newId = candidates.length;
        candidates.push(
            Candidate({
                id: newId,
                name: name,
                party: party,
                imageURL: imageURL,
                slogan: slogan,
                platform: platform,
                voteCount: 0,
                active: true
            })
        );
        emit CandidateAdded(newId, name);
    }

    function deactivateCandidate(uint256 index) external onlyOwner {
        require(index < candidates.length, "Ung vien khong ton tai");
        require(candidates[index].active, "Ung vien da bi vo hieu hoa");
        candidates[index].active = false;
        emit CandidateDeactivated(index);
    }

    // === BỎ PHIẾU ===

    function vote(uint256 candidateIndex) public {
        require(candidateIndex < candidates.length, "Ung vien khong hop le");
        require(candidates[candidateIndex].active, "Ung vien nay khong con hoat dong");
        require(!hasVoted[msg.sender], "Ban da bo phieu roi");

        if (voterRegistrationRequired) {
            require(registeredVoters[msg.sender], "Ban chua duoc dang ky quyen bo phieu");
        }

        candidates[candidateIndex].voteCount += 1;
        hasVoted[msg.sender] = true;
        emit VoteCast(msg.sender, candidateIndex, block.timestamp);
    }

    // === TRUY VẤN DỮ LIỆU ===

    function getCandidateCount() public view returns (uint256) {
        return candidates.length;
    }

    function getCandidate(uint256 index) public view returns (
        uint256 id,
        string memory name,
        string memory party,
        string memory imageURL,
        string memory slogan,
        string[] memory platform,
        uint256 voteCount,
        bool active
    ) {
        require(index < candidates.length, "Index khong hop le");
        Candidate storage c = candidates[index];
        return (c.id, c.name, c.party, c.imageURL, c.slogan, c.platform, c.voteCount, c.active);
    }

    function getVoteCount(uint256 candidateIndex) public view returns (uint256) {
        require(candidateIndex < candidates.length, "Ung vien khong hop le");
        return candidates[candidateIndex].voteCount;
    }

    function checkIfVoted(address voter) public view returns (bool) {
        return hasVoted[voter];
    }

    function getTotalVotes() public view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < candidates.length; i++) {
            total += candidates[i].voteCount;
        }
        return total;
    }
}
