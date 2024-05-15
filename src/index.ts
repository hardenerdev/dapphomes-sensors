import { format } from 'node:util'

import { promises as fs, writeFileSync } from 'node:fs';
import { createReadStream } from 'node:fs';
import * as dotenv from 'dotenv'
import {
    conditions,
    domains,
    encrypt,
    initialize,
    toBytes,
    toHexString,
} from '@nucypher/taco';
import { ethers } from 'ethers';

dotenv.config()

const rpcProviderUrl = process.env.RPC_PROVIDER_URL;
if (!rpcProviderUrl) {
    throw new Error('RPC_PROVIDER_URL is not set.');
}

const encryptorPrivateKey = process.env.ENCRYPTOR_PRIVATE_KEY;
if (!encryptorPrivateKey) {
    throw new Error('ENCRYPTOR_PRIVATE_KEY is not set.');
}

const domain = process.env.DOMAIN || domains.TESTNET;
const ritualId = parseInt(process.env.RITUAL_ID || '0');
const provider = new ethers.providers.JsonRpcProvider(rpcProviderUrl);

console.log('Domain:', domain);
console.log('Ritual ID:', ritualId);

const getOpenweather = async () => {
    const url = `${process.env.OPENWEATHER_URL}lat=${process.env.OPENWEATHER_LATITUDE}&lon=${process.env.OPENWEATHER_LONGITUDE}&appid=${process.env.OPENWEATHER_TOKEN}&units=metric`
    const response = await fetch(url)
    return await response.json()
}

const encryptToBytes = async (messageString: string) => {
    const encryptorSigner = new ethers.Wallet(encryptorPrivateKey);
    console.log(
        "Encryptor signer's address:",
        await encryptorSigner.getAddress(),
    );

    const message = toBytes(messageString);
    console.log(format('Encrypting message ("%s") ...', messageString));

    const isSubscribedABI: conditions.base.contract.FunctionAbiProps = {
        "name": "isSubscribed",
        "type": "function",
        "stateMutability": "view",
        "inputs": [
            {
                "internalType": "address",
                "name": "subscriber",
                "type": "address"
            }
        ],
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
    }

    const isSubscribed = new conditions.base.contract.ContractCondition({
        method: 'isSubscribed',
        functionAbi: isSubscribedABI,
        parameters: [':userAddress'],
        contractAddress: process.env.CONTRACT_ADDRESS!,
        chain: 80002,
        returnValueTest: {
            comparator: '==',
            value: true
        }
    });

    console.assert(
        isSubscribed.requiresSigner(),
        'Condition requires signer',
    );

    const messageKit = await encrypt(
        provider,
        domain,
        message,
        isSubscribed,
        ritualId,
        encryptorSigner,
    );

    return messageKit.toBytes();
};

const cypherData = async (data: string) => {
    return await encryptToBytes(data);
}

const writeToFile = async (path: string, content: Uint8Array) => {
    try {
        writeFileSync(path, Buffer.from(content))
    } catch (err) {
        console.log(err)
    }
}

const pinEncryptedFile = async (name: string, value: string) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pinataSDK = require('@pinata/sdk');
    const pinata = new pinataSDK({
        pinataJWTKey: `${process.env.PINATA_PIN_TO_IPFS_TOKEN}`
    });

    const options = {
        pinataMetadata: {
            name: name,
            keyvalues: {
                source: value
            }
        },
        pinataOptions: {
            cidVersion: 1
        }
    }

    const readableStreamForFile = createReadStream('./test/cifrado.txt');

    const result = await pinata.pinFileToIPFS(readableStreamForFile, options)
    console.log(result);
};

const uploadToPinata = async (encryptedBytes: Uint8Array) => {
    await writeToFile('./test/cifrado.txt', encryptedBytes)
    console.log('+ file stored locally');
    await pinEncryptedFile('openweather', 'openweather');
    console.log('+ encrypted file pinned');
}

const runSensor = async () => {
    const network = await provider.getNetwork();
    if (network.chainId !== 80002) {
        console.error('Please connect to Polygon Amoy testnet');
    }
    await initialize();

    console.log('+ get openweather information...')
    const weather = await getOpenweather()
    // console.log(weather)

    console.log('+ cypher data using taco...')
    const cypherMessage = await cypherData(JSON.stringify(weather))
    console.log(`+ encrypted message`)
    console.log(toHexString(cypherMessage))

    console.log('+ upload to pinata...')
    await uploadToPinata(cypherMessage)
}

runSensor()
    .then(ok => {
        console.log('+ end')
    })
    .catch(err => console.log(err))
