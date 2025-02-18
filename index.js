import { http } from "viem"
import { abstract } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"
import { createAbstractClient } from "@abstract-foundation/agw-client"
import consola from "consola"

import { printGreetingMessage, readFromTxt } from "./utils.js"


const getBalance = async (address) => {
    const r = await fetch(`https://backend.portal.abs.xyz/api/user/${address}/wallet/balances`)
    const data = await r.json()
    
    const etherBalance = data.tokens[0].balance
    return etherBalance
}

const withdraw = async (abstractPrivateKey, address, val) => {
    try {
        const formattedPrivyKey = abstractPrivateKey.startsWith("0x")
                        ? abstractPrivateKey
                        : `0x${abstractPrivateKey}`

        const agwSigner = privateKeyToAccount(
            formattedPrivyKey
        )

        const abstractAccount = await createAbstractClient({
            signer: agwSigner,
            chain: abstract,
            transport: http(),
        })

        const formattedTransaction = {
            from: abstractAccount.account.address,
            to: address,
            value: val,
            data: '0x',
        };

        const txHash = await abstractAccount.sendTransaction(
            formattedTransaction
        )

        consola.success(`Withdrawal successful: ${txHash}`)

    } catch (e) {
        if(e.message.includes('insufficient funds')) {
            const fee = ((e.message.split('fee')[1]).split(' ')[1]).split(',')[0]

            const value = BigInt(val) - BigInt(Math.floor(fee))

            return await withdraw(abstractPrivateKey, address, value)
        }
    }
}

const processAccount = async (abstractPrivateKey, address) => {
    const formattedPrivyKey = abstractPrivateKey.startsWith("0x")
                        ? abstractPrivateKey
                        : `0x${abstractPrivateKey}`

    const agwSigner = privateKeyToAccount(
        formattedPrivyKey
    )

    const abstractAccount = await createAbstractClient({
        signer: agwSigner,
        chain: abstract,
        transport: http(),
    })

    const ethBalance = await getBalance(abstractAccount.account.address)
    const value = BigInt(ethBalance.raw)

    consola.info(`Balance: ${ethBalance.decimal} ETH`)

    await withdraw(abstractPrivateKey, address, value)
}


printGreetingMessage()
const abstractPrivateKeys = readFromTxt('./data/abstract_private_keys.txt')
const addresses = readFromTxt('./data/withdrawal_addresses.txt')

if (abstractPrivateKeys.length !== addresses.length) {
    consola.error('The number of private keys and addresses does not match')
    process.exit(1)
}

for(let i = 0; i < abstractPrivateKeys.length; i++) {
    try {
        const formattedPrivyKey = abstractPrivateKeys[i].startsWith("0x")
                        ? abstractPrivateKeys[i]
                        : `0x${abstractPrivateKeys[i]}`

        const agwSigner = privateKeyToAccount(
            formattedPrivyKey
        )

        const abstractAccount = await createAbstractClient({
            signer: agwSigner,
            chain: abstract,
            transport: http(),
        })


        consola.start(`Withdrawing from ${abstractAccount.account.address} to ${addresses[i]}`)

        await processAccount(abstractPrivateKeys[i], addresses[i])
    } catch (e) {
        consola.error(`Error processing account ${i + 1}: ${e.message}`)
    }
}

consola.success('All accounts processed')