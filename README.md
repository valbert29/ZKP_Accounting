# ZKP_Accounting

Instructions for truffle + ganache can be found at: https://truffleframework.com

At begining you need to start up a local ethereum node:
```
ganache-cli -d 
```
To restart use:
```
lsof -i:8545
kill -9 <process_id>
```

To compile and deploy the smart contracts:
```
truffle compile
truffle migrate
```
First(0) client has role Emission 
- Can generate tokens in system; 
- Send tokens to clients with role Credit; 
- Cant get transactions from any clients; 


Second(1) client has role Credit
- Can get generated amount of tokens by Emission role client;
- Can transact tokens both ways with clients with role User;
- Cant send and get transactions with client with role Credit;


Third(2) client has role User
- Can transact with other clients with role Credit and User;


To run a client:
```
truffle exec main.js
```
This should spawn an interactive cli with a couple of options:

```
-create_client --i index (specify the client index for the client you want to create)
-get_balance --i index (get balance of the client corresponding to a given index)
-send --a amount --f fromIndex --t toIndex (send amont of token between users)
-info (get users Info: Index, Role, currentBalance'
-get_role --i index (get role of User with specified index)
-generate_token --i index --a amount (to generate for user with role Emission amount of tokens, to operate in system)
```
