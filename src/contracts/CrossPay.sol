// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// CONTRACT_ADDRESS - 0x03aBb516722Db6ffc36a33b74B656C876D542D92 Sepolia
// CONTRACT_ADDRESS - 
// Sepolia ---> Arbitrum Sepolia

import "@openzeppelin/contracts/utils/Counters.sol";

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts-ccip/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {IERC20} from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.0/token/ERC20/IERC20.sol";

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/ConfirmedOwner.sol";

contract CrossPay is OwnerIsCreator, VRFConsumerBaseV2  {
    address public admin;

    uint256[] public verificationCodes;

    mapping(string => uint64) public chainSelector;
    mapping(string => address) public ghoTokenAddress;

    function getLatestVerificationId() public view returns(uint256) {
        return verificationCodes[verificationCodes.length - 1];
    }

    // event - initiated, waiting for acceptance, waiting for approval, confirmed

    event TxInitiated(address sender, address receiver, uint256 amount, string chain, uint256 startTime);
    event TxAccepted(address sender, address receiver, uint256 amount, string chain);
    event TxApproved(address sender, address receiver, uint256 amount, string chain);
    event TxCompleted(address sender, address receiver, uint256 amount, string chain, uint256 endTime);

    event RequestSent(uint256 requestId, uint32 numWords);
    event RequestFulfilled(uint256 requestId, uint256[] randomWords);

    bytes32 keyHash = 0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c;  // Sepolia

    uint32 callbackGasLimit = 2500000;

    uint16 requestConfirmations = 3;

    uint32 numWords = 1;

    struct RequestStatus {
        bool fulfilled; // whether the request has been successfully fulfilled
        bool exists; // whether a requestId exists
        uint256[] randomWords;
    }

    mapping(uint256 => RequestStatus) public s_requests; /* requestId --> requestStatus */
    VRFCoordinatorV2Interface COORDINATOR;

    // Your subscription ID.
    uint64 s_subscriptionId;

    // past requests Id.
    uint256[] public requestIds;
    uint256 public lastRequestId;

    IERC20 public immutable token;

    using Counters for Counters.Counter;
    Counters.Counter private _transactionIdCounter;

    receive() payable external{}

    // Custom errors to provide more descriptive revert messages.
    error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees);
    error NothingToWithdraw(); 
    error FailedToWithdrawEth(address owner, address target, uint256 value); 
    error DestinationChainNotAllowlisted(uint64 destinationChainSelector); 
    
    // Event emitted when the tokens are transferred to an account on another chain.
    event TokensTransferred(
        bytes32 indexed messageId, // The unique ID of the message.
        uint64 indexed destinationChainSelector, // The chain selector of the destination chain.
        address receiver, // The address of the receiver on the destination chain.
        address token, // The token address that was transferred.
        uint256 tokenAmount, // The token amount that was transferred.
        address feeToken, // the token address used to pay CCIP fees.
        uint256 fees // The fees paid for sending the message.
    );

    // Mapping to keep track of allowlisted destination chains.
    mapping(uint64 => bool) public allowlistedChains;

    IRouterClient private s_router;

    IERC20 private s_linkToken;

    // Subscription ID: 8748
    // Router: 0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59 Seplolia
    // Link: 0x779877A7B0D9E8603169DdbD7836e478b4624789 Sepolia
    constructor(uint64 subscriptionId, address _router, address _link) 
        VRFConsumerBaseV2(0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625)
    {   
        chainSelector["Mumbai"] = 12532609583862916517;
        chainSelector["Sepolia"] = 16015286601757825753;
        chainSelector["Fuji"] = 14767482510784806043;
        chainSelector["Arbitrum"] = 16015286601757825753;

        ghoTokenAddress["Sepolia"] = 0xc4bF5CbDaBE595361438F8c6a187bDc330539c60;
        ghoTokenAddress["Arbitrum"] = 0xb13Cfa6f8B2Eed2C37fB00fF0c1A59807C585810;

        s_router = IRouterClient(_router);
        s_linkToken = IERC20(_link);
     
        admin = msg.sender;

        token = IERC20(0xc4bF5CbDaBE595361438F8c6a187bDc330539c60); // GHO - sepolia

        COORDINATOR = VRFCoordinatorV2Interface(0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625); // Sepolia
        s_subscriptionId = subscriptionId;
    }

    modifier onlyAdmin(address _user) {
        require(_user == admin, "Not authorized!");
        _;
    }

    struct Transaction {
        uint256 transactionId;
        uint256 verficationId;
        address sender;
        address receiver;
        string receiverStr;
        uint256 amount;
        string chain;
        string status; // "Waiting for acceptance", "Waiting for approval", "Completed", "Cancelled"
        uint256 startTime;
        uint256 endTime; 
    }
    Transaction[] public transactions;

    mapping(uint256 => Transaction) public transactionById;
    mapping(address => Transaction[]) public allMyTransactions;
    mapping(address => Transaction[]) public senderTransactions;
    mapping(address => Transaction[]) public receiverTransactions;


    function balance(address _user) onlyAdmin(_user) public view returns(uint256) { // working
        return address(this).balance;
    }

    function withdraw(address _user, uint256 _txId) onlyAdmin(_user) payable public { // working
        require(transactionById[_txId].amount > 0, "Not enough token balance");

        uint256 _amount = transactionById[_txId].amount;
        token.transfer(_user, _amount);
    }

    // STEP-3
    function executePayment(address _sender, address _receiver, uint256 _amount, string memory _chain, string memory _receiverStr) public payable returns(uint256){
        uint256 _transactionId = _transactionIdCounter.current();
        uint256 _endTime = block.timestamp + 30 minutes;

        uint256 _verficationId = verificationCodes[verificationCodes.length - 1];

        Transaction memory newTransaction = Transaction(_transactionId, _verficationId, _sender, _receiver, _receiverStr, _amount, _chain, "Waiting for acceptance", block.timestamp, _endTime);

        transactions.push(newTransaction);
        transactionById[_transactionId] = newTransaction; // Transaction by ID

        allMyTransactions[_sender].push(newTransaction);
        allMyTransactions[_receiver].push(newTransaction);

        senderTransactions[_sender].push(newTransaction); // Sender list
        receiverTransactions[_receiver].push(newTransaction);  // Receiver list

        // Token transfer to contract address
        token.transferFrom(_sender, address(this), _amount);

        _transactionIdCounter.increment();

        emit TxInitiated(_sender, _receiver, _amount, _chain, block.timestamp);
        
        return _verficationId;
    }

    function cancelPayment(address _sender, uint256 _transactionId) public payable {
        require(transactionById[_transactionId].sender == _sender, "You are not the sender!");

        transactionById[_transactionId].status = "Cancelled";

        uint256 _amount = transactionById[_transactionId].amount;
        token.transfer(_sender, _amount);
    }

    // STEP-4
    function acceptIncomingPayment(address _receiver, uint256 _transactionId, uint256 _verifyPin) public payable {
        require(transactionById[_transactionId].receiver == _receiver, "You are not the receiver!");
        require(transactionById[_transactionId].endTime >= block.timestamp, "You are out of time");
        require(transactionById[_transactionId].verficationId == _verifyPin, "Wrong Pin!");

        bool verifyStatus = keccak256(abi.encode(transactionById[_transactionId].status)) == keccak256(abi.encode("Waiting for acceptance"));
        require(verifyStatus == true, "Status not accepting!");

        transactionById[_transactionId].status = "Waiting for approval";

        emit TxAccepted(transactionById[_transactionId].sender, transactionById[_transactionId].receiver, transactionById[_transactionId].amount, transactionById[_transactionId].chain);
    }

    function transferTokensPayLINK(
        uint64 _destinationChainSelector,
        address _receiver,
        address _token,
        uint256 _amount
    )
        public
        onlyOwner
        onlyAllowlistedChain(_destinationChainSelector)
        returns (bytes32 messageId)
    {
        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        //  address(linkToken) means fees are paid in LINK
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(
            _receiver,
            _token,
            _amount,
            address(s_linkToken)
        );

        // Get the fee required to send the message
        uint256 fees = s_router.getFee(
            _destinationChainSelector,
            evm2AnyMessage
        );

        if (fees > s_linkToken.balanceOf(address(this)))
            revert NotEnoughBalance(s_linkToken.balanceOf(address(this)), fees);

        // approve the Router to transfer LINK tokens on contract's behalf. It will spend the fees in LINK
        s_linkToken.approve(address(s_router), fees);

        // approve the Router to spend tokens on contract's behalf. It will spend the amount of the given token
        IERC20(_token).approve(address(s_router), _amount);

        // Send the message through the router and store the returned message ID
        messageId = s_router.ccipSend(
            _destinationChainSelector,
            evm2AnyMessage
        );

        // Emit an event with message details
        emit TokensTransferred(
            messageId,
            _destinationChainSelector,
            _receiver,
            _token,
            _amount,
            address(s_linkToken),
            fees
        );

        // Return the message ID
        return messageId;
    }

    // STEP-5
    function approveOutgoingPayment(address _sender, uint256 _transactionId) public payable {
        Transaction memory tempTransaction = transactionById[_transactionId];

        require(tempTransaction.sender == _sender, "You are not the sender!");

        bool verifyStatus = keccak256(abi.encode(tempTransaction.status)) == keccak256(abi.encode("Waiting for approval"));
        require(verifyStatus == true, "Status not for approval!");

        transactionById[_transactionId].status = "Completed";

        // send(_sender, tempTransaction.amount, tempTransaction.receiver, tempTransaction.receiverStr, tempTransaction.chain); // 1v1 Tx
        transferTokensPayLINK(3478487238524512106, tempTransaction.receiver, 0xc4bF5CbDaBE595361438F8c6a187bDc330539c60, tempTransaction.amount); // Arbitrum Spolia, Sepolia

        emit TxApproved(transactionById[_transactionId].sender, transactionById[_transactionId].receiver, transactionById[_transactionId].amount, transactionById[_transactionId].chain);
    }


    function getSendingPayments(address _sender) public view returns(Transaction[] memory) {
        Transaction[] memory items = new Transaction[](senderTransactions[_sender].length);

        for(uint256 i = 0; i < senderTransactions[_sender].length; i++) {
            items[i] = transactionById[senderTransactions[_sender][i].transactionId]; // wrong
        }        

        return items;
    }

    function getReceivingPayments(address _receiver) public view returns(Transaction[] memory) {
        Transaction[] memory items = new Transaction[](receiverTransactions[_receiver].length);

        for(uint256 i = 0; i < receiverTransactions[_receiver].length; i++) {
            items[i] = transactionById[receiverTransactions[_receiver][i].transactionId]; // wrong
        }        

        return items;
    }

    // Assumes the subscription is funded sufficiently. STEP-1 
    function requestRandomWords()
        external
        returns (uint256 requestId)
    {
        // Will revert if subscription is not set and funded.
        requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        s_requests[requestId] = RequestStatus({
            randomWords: new uint256[](0),
            exists: true,
            fulfilled: false
        });
        requestIds.push(requestId);
        lastRequestId = requestId;
        emit RequestSent(requestId, numWords);

        return requestId;
    }

    // STEP-2
    function fulfillRandomWords( // Call Send token here
        uint256 _requestId,
        uint256[] memory _randomWords
    ) internal override {
        require(s_requests[_requestId].exists, "request not found");
        s_requests[_requestId].fulfilled = true;
        s_requests[_requestId].randomWords = _randomWords;

        // Update Verification codes
        verificationCodes.push(_randomWords[0]);

        emit RequestFulfilled(_requestId, _randomWords);
    }

    function getRequestStatus(
        uint256 _requestId
    ) external view returns (bool fulfilled, uint256[] memory randomWords) {
        require(s_requests[_requestId].exists, "request not found");
        RequestStatus memory request = s_requests[_requestId];

        return (request.fulfilled, request.randomWords);
    }

    modifier onlyAllowlistedChain(uint64 _destinationChainSelector) {
        if (!allowlistedChains[_destinationChainSelector])
            revert DestinationChainNotAllowlisted(_destinationChainSelector);
        _;
    }

    function allowlistDestinationChain(
        uint64 _destinationChainSelector,
        bool allowed
    ) external onlyOwner {
        allowlistedChains[_destinationChainSelector] = allowed;
    }

    function transferTokensPayNative(
        uint64 _destinationChainSelector,
        address _receiver,
        address _token,
        uint256 _amount
    )
        external
        onlyOwner
        onlyAllowlistedChain(_destinationChainSelector)
        returns (bytes32 messageId)
    {
        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        // address(0) means fees are paid in native gas
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(
            _receiver,
            _token,
            _amount,
            address(0)
        );

        // Get the fee required to send the message
        uint256 fees = s_router.getFee(
            _destinationChainSelector,
            evm2AnyMessage
        );

        if (fees > address(this).balance)
            revert NotEnoughBalance(address(this).balance, fees);

        // approve the Router to spend tokens on contract's behalf. It will spend the amount of the given token
        IERC20(_token).approve(address(s_router), _amount);

        // Send the message through the router and store the returned message ID
        messageId = s_router.ccipSend{value: fees}(
            _destinationChainSelector,
            evm2AnyMessage
        );

        // Emit an event with message details
        emit TokensTransferred(
            messageId,
            _destinationChainSelector,
            _receiver,
            _token,
            _amount,
            address(0),
            fees
        );

        // Return the message ID
        return messageId;
    }

    function _buildCCIPMessage(
        address _receiver,
        address _token,
        uint256 _amount,
        address _feeTokenAddress
    ) internal pure returns (Client.EVM2AnyMessage memory) {
        // Set the token amounts
        Client.EVMTokenAmount[]
            memory tokenAmounts = new Client.EVMTokenAmount[](1);
        tokenAmounts[0] = Client.EVMTokenAmount({
            token: _token,
            amount: _amount
        });

        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        return
            Client.EVM2AnyMessage({
                receiver: abi.encode(_receiver), // ABI-encoded receiver address
                data: "", // No data
                tokenAmounts: tokenAmounts, // The amount and type of token being transferred
                extraArgs: Client._argsToBytes(
                    // Additional arguments, setting gas limit to 0 as we are not sending any data and non-strict sequencing mode
                    Client.EVMExtraArgsV1({gasLimit: 0, strict: false})
                ),
                // Set the feeToken to a feeTokenAddress, indicating specific asset will be used for fees
                feeToken: _feeTokenAddress
            });
    }

    function withdraw(address _beneficiary) public onlyOwner {
        // Retrieve the balance of this contract
        uint256 amount = address(this).balance;

        // Revert if there is nothing to withdraw
        if (amount == 0) revert NothingToWithdraw();

        // Attempt to send the funds, capturing the success status and discarding any return data
        (bool sent, ) = _beneficiary.call{value: amount}("");

        // Revert if the send failed, with information about the attempted transfer
        if (!sent) revert FailedToWithdrawEth(msg.sender, _beneficiary, amount);
    }

    function withdrawToken(
        address _beneficiary,
        address _token
    ) public onlyOwner {
        // Retrieve the balance of this contract
        uint256 amount = IERC20(_token).balanceOf(address(this));

        // Revert if there is nothing to withdraw
        if (amount == 0) revert NothingToWithdraw();

        IERC20(_token).transfer(_beneficiary, amount);
    }
}


