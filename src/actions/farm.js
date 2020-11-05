import {
  LOAD_FARM_DATA,
  FORM_SUBMITTING,
  CONFIRMING_FARM,
  OPEN_SEASON,
  OPENING_SEASON,
} from '../types'
import ipfs from '../ipfs'
import { randInt, initContract } from '../utils'

// Contracts
import Registry from '../abis/FRMRegistry.json'
import Season from '../abis/Season.json'
import Contracts from '../contracts.json'

export const loadFarm = farm => ({
  type: LOAD_FARM_DATA,
  farm,
})

export const submitting = status => ({
  type: FORM_SUBMITTING,
  status,
})

export const confirming = status => ({
  type: CONFIRMING_FARM,
  status,
})

const seasonOpened = farm => ({
  type: OPEN_SEASON,
  farm,
})

const openingSeason = status => ({
  type: OPENING_SEASON,
  status,
})

export const tokenize = (name, size, lon, lat, file, soil, message) => async dispatch => {
  // Init contracts
  const registryContract = initContract(Registry, Contracts['4'].FRMRegistry[0])
  // Upload file to IPFS
  const { cid } = await ipfs.add(file)
  const fileHash = cid.string
  const token = randInt(999, 999999999)
  const status = {}
  const accounts = await window.web3.eth.getAccounts()
  // Send transaction
  registryContract.methods.tokenizeLand(name, size, lon, lat, fileHash, soil, token).send({ from: accounts[0] })
    .on('transactionHash', (hash) => {
      message.info('Confirming transaction...')
      status.confirmingFarm = true
      dispatch(confirming({ ...status }))
    })
    .on('confirmation', (confirmationNumber, receipt) => {
      if (confirmationNumber === 1) {
        status.confirmingFarm = false
        dispatch(confirming({ ...status }))
        message.success('Registration was successful!')
        console.log(receipt)
      }
    })
  .on('error', error => {
    status.formSubmitting = false
    dispatch(submitting({ ...status }))
    window.alert(`Error: ${error.message}`)
    console.log(error)
  })
}

export const openSeason = (tokenId, message) => async dispatch => {
  // Init contracts
  const seasonContract = initContract(Season, Contracts['4'].Season[0])
  const accounts = await window.web3.eth.getAccounts()
  // Send transaction
  const status = {}
  status.openingSeason = true
  dispatch(openingSeason({ ...status }))
  seasonContract.methods.openSeason(tokenId).send({ from: accounts[0] })
    .on('transactionHash', () => {
      message.info('Confirming transaction...')
    })
    .on('confirmation', async(confirmationNumber, receipt) => {
      if (confirmationNumber === 1) {
        status.openingSeason = false
        dispatch(openingSeason({ ...status }))
        const farm = {}
        farm.season = await seasonContract.methods.getSeason(tokenId).call()
        dispatch(seasonOpened({ ...farm }))
        message.success('Season opened. Start seasonal activities!')
      }
    })
    .on('error', error => {
      window.alert(`Error: ${error.message}`)
      status.openingSeason = false
      dispatch(openingSeason({ ...status }))
      console.log(error)
    })
}

