pragma solidity ^0.4.16;
pragma experimental ABIEncoderV2;

import './Verifier.sol';

contract HiddenToken is Verifier{

    //Constructor initially gives money to addresses
    // uint amountEach = amount / members.length;
    // balances[members[i]] = amountEach;   

    mapping (uint => bytes32) addressMap;
    mapping (bytes32 => uint) balances;

    constructor(bytes32[] members,uint amount) public{
        // установка токенов первому клиенту 
        setBalance(members[0], amount);
        for(uint i = 0;i < members.length;i++){
            addressMap[i] = members[i];
        }
    }

    // Генерация валюты в системе только через role = Emission пользователю
    function generateTokens(bytes32 userAddress, uint amount) public returns(uint){
        emit SendEvent("Tokens Generated!");
        require(amount > 0, "Amount must be greater than 0");
        balances[userAddress] += amount;
        return balances[userAddress];
    }

    // получить баланс определенного клиента
    function getBalance(bytes32 userAddress) public view returns (uint){
        return balances[userAddress];
    }

    // установка баланса role = Emission пользователю
    function setBalance(bytes32 userAddress, uint amount) public returns(uint){
        emit SendEvent("Balance setted successfully!");
        require(amount > 0, "Amount must be greater than 0");
        balances[userAddress] = amount;
        return balances[userAddress];
    }

    modifier proveOwnership(
            uint[2] a,
            uint[2] a_p,
            uint[2][2] b,
            uint[2] b_p,
            uint[2] c,
            uint[2] c_p,
            uint[2] h,
            uint[2] k,
            uint[2] input){
                require(verifyTx(a, a_p, b, b_p, c, c_p, h, k, input) == true);
                _;
            }

    event SendEvent(string s);

    function sendToken(uint to,uint amount,
            uint[2] a,
            uint[2] a_p,
            uint[2][2] b,
            uint[2] b_p,
            uint[2] c,
            uint[2] c_p,
            uint[2] h,
            uint[2] k,
            uint[2] input) public returns (bool){
                emit SendEvent("Sent success!");
                // Zk-snark verification
                require(verifyTx(a, a_p, b, b_p, c, c_p, h, k, input) == true);
                bytes32 fromAddress = addressMap[input[0]];
                bytes32 toAddress = addressMap[to];
                require(input[0] != to, "Sender must not be equal reciever!");
                require(amount > 0,"Input value greater than zero!");
                require((balances[fromAddress] - amount) >= 0,"Don't have enough balance to send");

                balances[fromAddress] -= amount;
                balances[toAddress] += amount;
                return true;
            }
    
}
    