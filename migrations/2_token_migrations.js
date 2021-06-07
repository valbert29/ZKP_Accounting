var HiddenToken = artifacts.require("./HiddenToken.sol");

const addresses = 
[
"0x8dddaaa0c8b11e835ffc0542c160d8a992721cd91950e80158eb4d93ff6a911c",
"0xb54c4a0cfa24b08ee2b9c7f2613cbfbf7f5e44cf37f94d9a03de1cd8b0498cd8",
"0xf4fce738d6ef5813a1b8f231803a3a8d0f8a0378b9e6f1990d5d36179bb2f76b",
];
// "0x6ff9829092f18baebcc4b9fb87693f15e6a4173050c2e9f8bc8e17ba5351f4b1"

module.exports = function(deployer){
    deployer.deploy(HiddenToken, addresses, 0);
}