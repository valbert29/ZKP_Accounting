module.exports = function(callback){

    const numBytes = 64;
    //Prime modulus used in ZoKrates (for some reason it's fixed :/ )
    const p = 21888242871839275222246405745257275088548364400416034343698204186575808495616;

    var crypto = require('crypto');
    var fs = require('fs');
    var BN = require('bn.js');
    var vorpal = require("vorpal")();


    const addresses = 
    [
    "0x8dddaaa0c8b11e835ffc0542c160d8a992721cd91950e80158eb4d93ff6a911c",
    "0xb54c4a0cfa24b08ee2b9c7f2613cbfbf7f5e44cf37f94d9a03de1cd8b0498cd8",
    "0xf4fce738d6ef5813a1b8f231803a3a8d0f8a0378b9e6f1990d5d36179bb2f76b",
    ];
    // "0x6ff9829092f18baebcc4b9fb87693f15e6a4173050c2e9f8bc8e17ba5351f4b1"
    
    const proofFiles = 
    [
        "proof0.json",
        "proof1.json",
        "proof2.json"   
    ];  

    const roles = 
    [
        "Emission",
        "Credit",
        "User"
    ]


    //Data manipulation helpers

    var padHex = function(str){
        return "0".repeat(128 - str.length) + str;
    }
        
    var genSecret = function(){
        secret = crypto.randomBytes(numBytes);
        secretStr = secret.toString('hex');
        secretInt = parseInt(secretStr,16) % p;
        secretStr = secretInt.toString(16);
        return padHex(secretStr);
    }
 
    var genHash = function(hexStr){
        newBuf = new Buffer(hexStr,"hex");
        h = crypto.createHash('sha256');
        h.update(newBuf,'hex');
        return h.digest().toString('hex');
    }

    var chop = function(str,numBlocks){
        blocks = new Array();
        blockLen = str.length/numBlocks;
        for(i = 0;i<numBlocks;i++){
            blocks.push(str.substring(i*blockLen,(i+1)*blockLen));
        }
        return blocks;
    }

    var genPair = function(){
        secret = genSecret();
        hash = genHash(secret);
        return {secret: secret,hash: hash};
    }

    var genPairs = function(n){
        pairs = new Array();
        for(i =0;i<n;i++){
            pairs.push(genPair());
        }
        return pairs;
    }

    var blockToDec = function(block){
        newBlock = new Array();
        for(i = 0;i< block.length;i++){
            temp = new BN(block[i],16);
            newBlock.push(temp.toString(10));
        }
        return newBlock;
    }


    var printPair = function(pair){
        secretBlocks = chop(pair.secret,4);
        secretBlocks = blockToDec(secretBlocks);
        hashBlocks = chop(pair.hash,2);
        hashBlocks = blockToDec(hashBlocks);
        console.log("SecretBlocks");
        console.log(`${secretBlocks[0]} ${secretBlocks[1]} ${secretBlocks[2]} ${secretBlocks[3]}`);
        console.log("HashBlocks");
        console.log(`${hashBlocks[0]} ${hashBlocks[1]}`);
        console.log(`HexHash: 0x${pair.hash}`);

    }

    var createSecretExample = function(){
        pairs = genPairs(4);
        console.table(pairs);
        console.log("Pair 0");
        printPair(pairs[0]);
        console.log("Pair 1");
        printPair(pairs[1]);
        console.log("Pair 2");
        printPair(pairs[2]);
        console.log("Pair 3");
        printPair(pairs[3]);
    }

    //ZoKrates interaction
    var readProofJSON = function(proofIndex){
        return JSON.parse(fs.readFileSync(proofFiles[proofIndex]));
    }

    //Contract interaction
    var getTokenContractInstance = async function(){
        HiddenToken = artifacts.require("HiddenToken");
        instance = await HiddenToken.deployed();
        return instance;
    }

    // получение баланса
    var getBalance = async function(instance, index){
        balance = await instance.getBalance(addresses[index]);
        numBalance = balance.words[0];
        return numBalance;
    }

    // Создание валюты
    var setBalance = async function(instance, index, amount){
        return await instance.setBalance(addresses[index], amount);
    }
    
    //генерация валюты в системе
    var generateTokens = async function(instance, index, amount){
        return await instance.generateTokens(addresses[index], amount);
    }

    // получение роли
    var getRole = function(index){
        return roles[index];
    }

    // отправить токены
    var sendTokens = async function(instance, fromIndex, toIndex, amt){
      pf = readProofJSON(fromIndex);
      proof = pf.proof;
      input = pf.input;
      console.log(proof);
      response = await instance.sendToken(toIndex, amt, proof.A, proof.A_p, proof.B, proof.B_p, proof.C, proof.C_p, proof.H, proof.K, input);
      if(response.logs != undefined){
          console.log(response.logs[0].args.s);
      }else{
          console.log("Send failed!");
      }
    }

    // Проверка на возможность совершать транзакции между выбранными пользователями 
    var checkRoles = function(fromIndex, toIndex){
        let toRole = getRole(toIndex);
        let fromRole = getRole(fromIndex);
        if (toRole == "Emission") {
            console.log("User with role Emission cant get transactions");
            return false;
        }
        if (fromRole == "Credit") {
            if (toRole == "Credit"){
                console.log("User with role Credit cant send transactions to user with role Credit");
                return false;
            }
            return true;
        }
        return true;
    }

    clientId = 0;
    instance = undefined;

    var main = async function(){
        instance = await getTokenContractInstance();
        //Создание клиентов
        vorpal
            .command('create_client')
            .option('--i <index>,','Account index')
            .action(async function(args,callback){
                if(args.options.i != undefined){
                    console.log(`New client created with id: ${args.options.i}`);
                }else{
                    console.log("Error: Must create client first!");
                }
                callback();
            });
        //Получение баланса
        vorpal
            .command('get_balance')
            .option('--i <index>,','Account index')
            .action(async function(args,callback){
                if((args.options.i != undefined) && (clientId != undefined)){
                    console.log(`Client Id ${args.options.i} balance: ${await getBalance(instance,args.options.i)}`);
                }else{
                    console.log("Error: Usage");
                }
                callback();
            });
        
        vorpal
            .command('get_role')
            .option('--i <index>,','Account index')
            .action(async function(args,callback){
                if(args.options.i != undefined){
                    console.log(`Client Id ${args.options.i} Role: ${getRole(args.options.i)}`);
                }else{
                    console.log("Error: Usage");
                }
                callback();
            });

        vorpal
            .command('set_balance')
            .option('--i <index>,','Account index')
            .option('--a <amount>,','Amount to set')
            .action(async function(args,callback){
                if((args.options.i != undefined) && (args.options.a != undefined)){
                    if(getRole(args.options.i) == getRole(0)){
                        let accountBalance = await setBalance(instance, args.options.i, args.options.a);
                        console.log(`Client Id ${args.options.i} balance set to ${accountBalance}`);   
                    } else {
                        console.log(`Error: User must be Role ${getRole(0)}`);
                    }
                }else{
                    console.log("Error: specified --a and --i options");
                }
                callback();Tokens
            });
        
        vorpal
            .command('generate_token')
            .option('--i <index>,','Account index')
            .option('--a <amount>,','Amount to set')
            .action(async function(args,callback){
                if((args.options.i != undefined) && (args.options.a != undefined)){
                    if(getRole(args.options.i) == getRole(0)){
                        let accountBalance = await generateTokens(instance, args.options.i, args.options.a);
                        console.log(`Generated ${args.options.a} tokens for Client Id ${args.options.i}. Current balance: ${accountBalance}`);   
                    } else {
                        console.log(`Error: User must be Role ${getRole(0)}`);
                    }
                }else{
                    console.log("Error: specified --a and --i options");
                }
                callback();
            });

        vorpal
            .command('send_token')
            .option('--f <from_index>,','From account index')
            .option('--t <to_index>,','To account index')
            .option('--a <amount>,','Amount to send')
            .action(async function(args,callback){
                if((args.options.t != undefined) && (args.options.a != undefined) && (args.options.f != undefined)){
                    let acceptable = checkRoles(args.options.f, args.options.t);
                    if(acceptable){
                        await sendTokens(instance, args.options.f, args.options.t, args.options.a);
                    }
                }else{
                    console.log("Error: specified --a, --t and --f options");
                }
                callback();
            });

        vorpal
            .command('info')
            .action(async function(args,callback){
                var s = [];
                for(var i = 0; i<3; i++){
                    let role = getRole(i);
                    let balance = await getBalance(instance, i); 
                    s.push([role, balance]);
                }
                console.table(s);
                // await createSecretExample();
                callback();
            });

        vorpal
            .delimiter("ZKP-Accounting $ ")
            .show();

        //Used mainly for debugging/testing instead of manually specifying cli arguments
        //Might have to change local vars based on ganache private keys

    }
    main();
}
