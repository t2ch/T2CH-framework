## API

 * ### GET /blockhashes

    Returns array with indexes and hashes of blocks

   Response body example:
	```json
	[
        {
            "index":0,
            "hash":"17196b4d2309946989aaa05d67d161e5d5fb64da3b421654c430c9c36a87b690"
        }
    ]
	```

 * ### GET /blockhashes/:index

   Returns hash of block by index

   Params:  
   
    index -- index of block 

   Response body example:
	```
        17196b4d2309946989aaa05d67d161e5d5fb64da3b421654c430c9c36a87b690
	```
* ### POST /blockhashes

    Returns array with indexes and hashes of blocks with limit
    
    Params:  
    
    start -- start index
    
    end -- end index

    Response body example:
	```json
	[
        {
            "index":0,
            "hash":"17196b4d2309946989aaa05d67d161e5d5fb64da3b421654c430c9c36a87b690"
        }
    ]
	```

 * ### GET /blocks

   Returns array with blocks 

   Response body example:
	```json
    [
        {
            "index":0,
            "previousHash":"77f426b14df7efdd084ba2fcea803240e46b3128680ece747b573bca990dd139",
            "timestamp":1532599409,
            "txs": ["14ce2e2dac37eee6601eaa526054a8e641483c92af052980510a14ca867e71a2"],
            "hash":"17196b4d2309946989aaa05d67d161e5d5fb64da3b421654c430c9c36a87b690",
            "baseTarget":153722867,
            "generationSignature":1,
            "cumulativeDifficulty":0,
            "generator":"0x4b5aeb308b066a889da78139118d574ca6817315",
            "publicKey":"a285ddb6fa09450d683c254e61b9409a62e5128c4d0420d636f7f13491de112c420a6873357723847527b94de6e7732f3298afef3956de71554c793f3c10587f"      
        }
    ]
	```

* ### GET /blocks/:hash

    Returns block by hash

   Params:  
   
    hash -- hash of block 

   Response body example:
	```json
    {
        "index":0,
        "previousHash":"77f426b14df7efdd084ba2fcea803240e46b3128680ece747b573bca990dd139",
        "timestamp":1532599409,
        "txs":["14ce2e2dac37eee6601eaa526054a8e641483c92af052980510a14ca867e71a2"],
        "hash":"17196b4d2309946989aaa05d67d161e5d5fb64da3b421654c430c9c36a87b690",
        "baseTarget":153722867,
        "generationSignature":1,
        "cumulativeDifficulty":0,
        "generator":"0x4b5aeb308b066a889da78139118d574ca6817315",
        "publicKey":"a285ddb6fa09450d683c254e61b9409a62e5128c4d0420d636f7f13491de112c420a6873357723847527b94de6e7732f3298afef3956de71554c793f3c10587f"
    }
	```

* ### POST /blocks

    Returns array with blocks with limit
    
    Params:  
    
    start -- start index
    
    end -- end index

    Returns: array

    Response body example:
	```json
    [
        {
            "index":0,
            "previousHash":"77f426b14df7efdd084ba2fcea803240e46b3128680ece747b573bca990dd139",
            "timestamp":1532599409,
            "txs": ["14ce2e2dac37eee6601eaa526054a8e641483c92af052980510a14ca867e71a2"],
            "hash":"17196b4d2309946989aaa05d67d161e5d5fb64da3b421654c430c9c36a87b690",
            "baseTarget":153722867,
            "generationSignature":1,
            "cumulativeDifficulty":0,
            "generator":"0x4b5aeb308b066a889da78139118d574ca6817315",
            "publicKey":"a285ddb6fa09450d683c254e61b9409a62e5128c4d0420d636f7f13491de112c420a6873357723847527b94de6e7732f3298afef3956de71554c793f3c10587f"      
        }
    ]
	```

* ### GET /transactions

    Returns array of transactions

   Response body example:
	```json
    [
        {
            "from":"0x4b5aeb308b066a889da78139118d574ca6817315",
            "data":
            {
                "type":"coin",
                "inputs":
                [
                    {
                        "address":"0x4b5aeb308b066a889da78139118d574ca6817315",
                        "amount":250000000000
                    }
                ],
                "outputs":
                [
                    {
                        "address":"0x4b5aeb308b066a889da78139118d574ca6817315",
                        "amount":250000000000
                    }
                ],
                "comission":0
            },
            "timestamp":1532599409,"_signature":"556deac5d94adcdde2a471bb8f5db484518332add70c25c3d2560e14dc80feb24518c74c3c966083dc62e1f592e01ec5d86edc5f1fc0cb799c3a2941ea69a195",
            "blockIndex":0
        },
        {
            "blockIndex":1,
            "hash":"9f4f96ccd9557d03dd4a55dfe33b1cfee6ab461bbdd2c5ca5b0afc6ad638ee02",
            "from":"0xf049898e298843fea9e46a49c75b10778425bd38",
            "data":
            {
                "type":"message",
                "message":"hi"
            },
            "timestamp":1540135796253,
            "publicKey":"bf6c5afdaca9900c32db98c83dd6de06e38434b80b165d621f40c92d246499f03a72ca0581e2901b147ea73623c1fd58c66908e34c1e4884257acedd97c7408b",
            "signature":"3045022100e8230207d7b26d1daa5aa1e1471ffd9fb926320a0a9e6dbe0d3388603f13f4c202202c90b217beb65ac61e2020e82775fe1ba294122d69038b9bf9dab60b29cb5892"
        }
    ]
	```

* ### GET /transactions/:hash

  Returns transaction by hash

   Params:  
   
    hash -- hash of transaction 

   Response body example:
	```json
    {
        "blockIndex":1,
        "hash":"9f4f96ccd9557d03dd4a55dfe33b1cfee6ab461bbdd2c5ca5b0afc6ad638ee02",
        "from":"0xf049898e298843fea9e46a49c75b10778425bd38",
        "data":
        {
            "type":"message",
            "message":"hi"
        },
        "timestamp":1540135796253,
        "publicKey":"bf6c5afdaca9900c32db98c83dd6de06e38434b80b165d621f40c92d246499f03a72ca0581e2901b147ea73623c1fd58c66908e34c1e4884257acedd97c7408b",
        "signature":"3045022100e8230207d7b26d1daa5aa1e1471ffd9fb926320a0a9e6dbe0d3388603f13f4c202202c90b217beb65ac61e2020e82775fe1ba294122d69038b9bf9dab60b29cb5892"
    }
	```

* ### POST /transactions

    Returns array of transactions with limit
    
    Params:  
    
    start -- start index
    
    end -- end index

    Response body example:
	```json
    [
        {
            "from":"0x4b5aeb308b066a889da78139118d574ca6817315",
            "data":
            {
                "type":"coin",
                "inputs":
                [
                    {
                        "address":"0x4b5aeb308b066a889da78139118d574ca6817315",
                        "amount":250000000000
                    }
                ],
                "outputs":
                [
                    {
                        "address":"0x4b5aeb308b066a889da78139118d574ca6817315",
                        "amount":250000000000
                    }
                ],
                "comission":0
            },
            "timestamp":1532599409,"_signature":"556deac5d94adcdde2a471bb8f5db484518332add70c25c3d2560e14dc80feb24518c74c3c966083dc62e1f592e01ec5d86edc5f1fc0cb799c3a2941ea69a195",
            "blockIndex":0
        },
        {
            "blockIndex":1,
            "hash":"9f4f96ccd9557d03dd4a55dfe33b1cfee6ab461bbdd2c5ca5b0afc6ad638ee02",
            "from":"0xf049898e298843fea9e46a49c75b10778425bd38",
            "data":
            {
                "type":"message",
                "message":"hi"
            },
            "timestamp":1540135796253,
            "publicKey":"bf6c5afdaca9900c32db98c83dd6de06e38434b80b165d621f40c92d246499f03a72ca0581e2901b147ea73623c1fd58c66908e34c1e4884257acedd97c7408b",
            "signature":"3045022100e8230207d7b26d1daa5aa1e1471ffd9fb926320a0a9e6dbe0d3388603f13f4c202202c90b217beb65ac61e2020e82775fe1ba294122d69038b9bf9dab60b29cb5892"
        }
    ]
	```

* ### GET /mempool

    Returns array of mempool

   Response body example:
	```json
    [
        {
            "from":"0xf049898e298843fea9e46a49c75b10778425bd38",
            "data":
            {
                "type":"message",
                "message":"hi"
            },
            "publicKey":"bf6c5afdaca9900c32db98c83dd6de06e38434b80b165d621f40c92d246499f03a72ca0581e2901b147ea73623c1fd58c66908e34c1e4884257acedd97c7408b",
            "timestamp":1540147809900,
            "_signature":"30440220212170b73307af8eb33619a494ce01e811ad2e6e8a6eeb1447e6f7965746d1fc02203f1b3d3639fa7e81e66a86f2215fc87a6e4451382fc6767be00dbc6f002a241d",
            "hash":"3ea8ff39a0c9ebcc1c73099d9cf4af2d2db351fe5dd4533d41fc9bee83251036"
        }
    ]
	```
* ### POST /sendTx

    send transaction object to node

    params: {Transaction}

    res success:

        200 'OK'

    res err:

        500 err

* ### GET /peers

    Returns array of  peers with status

    Response body example:

        [
            {
                "key":"127.0.0.1",
                "value": 1
            }
        ]
        


* ### GET /moderators

    Returns array of moderator adresses

    Responce body example:

        [ 
            '0xf58ec4765080096ac6c3e8db4b7dfc4e528f8364',
            '0x1cbeb2c3793e11e841e5f2f7713f49c71f928692'
        ]

* ### GET /compliance/:address

    Returns status of compliance by address (bool)

    Responce body example:

        true



* ### GET /competence/:address

    Returns array of competence by address

    Responce body example:

        [
            {
                name:'Web',
                mark: 0
            }
        ]

* ### GET /comments/:address

    Returns array of competence transactions for selected address

    Responce body example:

        [ 
            { 
                blockIndex: 8,
                hash:'3bd64977fcde7d7e3d1a9d5d2ec1cae63c3723da6aa923ce7da9e995b7bf54db',
                from: '0xf58ec4765080096ac6c3e8db4b7dfc4e528f8364',
                data:{ 
                    type: 'skill',
                    mark: '+',
                    text: 'testing',
                    code: '1',
                    to: '0xf58ec4765080096ac6c3e8db4b7dfc4e528f8364' 
                },
                timestamp: 1542735659523,
                publicKey:'f4586eac1e193fb28bf6bdf8650fe61d3a2090c369ab151de820a0ef3817e5b7fe67289a4b8c79c3a82751022b530364faac5d7389fd0e50e7c767567c17945d',
                signature:'3045022100e7b84d72d1f8479614f03ad5f491cacef98e363c40fff5243db6c0d7fdc909fb022039fb032d97863c8a6276ebd1aa9e0a94081938485b8f17ca5d7afe1a224d7404' 
            } 
        ]


* ### POST prepeare/coin

* ### GET /arbitr/:hash

    Response body example:

        [
            {
                "status": "accept",
                "text": "Обнаружена клевета"
            }
        ]

* ### POST prepeare/coin
