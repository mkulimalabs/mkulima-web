import {
  LOAD_FARM_DATA,
  FORM_SUBMITTING,
  OPEN_SEASON,
  OPENING_SEASON,
  CONFIRMING_PREPARATION,
  CLOSE_PREPARATION,
  CONFIRMING_PLANTING,
  CLOSE_PLANTING,
  CONFIRMING_GROWTH,
  CLOSE_GROWTH,
  CONFIRMING_HARVEST,
  FINISH_HARVEST,
  BOOKING_HARVEST,
  CLOSING_SEASON,
  CLOSING_FARM_SEASON,
  GOING_TO_MARKET,
  SEASON_MARKETED,
  CONFIRMING_RECEIVED,
  LISTEN_BOOKING,
  LISTEN_CONFIRMATION,
  DEFAULT_CLOSING,
} from '../types'
import ipfs from '../ipfs'
import Web3 from 'web3'
import { randInt, initContract } from '../utils'

// Contracts
import Registry from '../abis/FRMRegistry.json'
import Season from '../abis/Season.json'
import Market from '../abis/Market.json'
import Contracts from '../contracts.json'

export const loadFarm = farm => ({
  type: LOAD_FARM_DATA,
  farm,
})

export const submitting = status => ({
  type: FORM_SUBMITTING,
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

const confirmingPreparation = status => ({
  type: CONFIRMING_PREPARATION,
  status,
})

const closePreparation = farm => ({
  type: CLOSE_PREPARATION,
  farm,
})

const confirmingPlanting = status => ({
  type: CONFIRMING_PLANTING,
  status,
})

const closePlanting = farm => ({
  type: CLOSE_PLANTING,
  farm,
})

const confirmingGrowth = status => ({
  type: CONFIRMING_GROWTH,
  status,
})

const closeGrowth = farm => ({
  type: CLOSE_GROWTH,
  farm,
})

const confirmingHarvest = status => ({
  type: CONFIRMING_HARVEST,
  status,
})

const finishHarvesting = farm => ({
  type: FINISH_HARVEST,
  farm,
})

const bookingHarvest = status => ({
  type: BOOKING_HARVEST,
  status,
})

const closing = status => ({
  type: CLOSING_SEASON,
  status,
})

const closingSeason = farm => ({
  type: CLOSING_FARM_SEASON,
  farm,
})

const goingtoMarket = status => ({
  type: GOING_TO_MARKET,
  status,
})

const seasonMarketed = farm => ({
  type: SEASON_MARKETED,
  farm,
})

const confirming = status => ({
  type: CONFIRMING_RECEIVED,
  status,
})

const defaultClosure = status => ({
  type: DEFAULT_CLOSING,
  status,
})

export const listenBooking = resp => ({
  type: LISTEN_BOOKING,
  resp,
})

export const listenConfirmation = resp => ({
  type: LISTEN_CONFIRMATION,
  resp,
})

export const tokenize = (values, message) => async dispatch => {
  const { farmImage, farmLocation, farmName, farmSize, sizeUnit, soilType } = values
  const _size = `${farmSize} ${sizeUnit}`
  const status = {}
  status.formSubmitting = true
  dispatch(submitting({ ...status }))
  // Init contracts
  const registryContract = initContract(Registry, Contracts['4'].FRMRegistry[0])
  // Upload file to IPFS
  const { cid } = await ipfs.add(farmImage)
  const fileHash = cid.string
  const token = randInt(999, 999999999)
  const accounts = await window.web3.eth.getAccounts()
  // Send transaction
  registryContract.methods.tokenizeLand(farmName, _size, farmLocation, fileHash, soilType, token).send({
    from: accounts[0],
    gas: await registryContract.methods.tokenizeLand(farmName, _size, farmLocation, fileHash, soilType, token).estimateGas({ from: accounts[0] }),
  })
    .on('transactionHash', (hash) => {
      message.info('Confirming transaction...', 5)
    })
    .on('confirmation', (confirmationNumber, receipt) => {
      if (confirmationNumber === 1) {
        status.formSubmitting = false
        dispatch(submitting({ ...status }))
        message.success('Registration was successful!', 5)
        console.log(receipt)
      }
    })
    .on('error', error => {
      status.formSubmitting = false
      dispatch(submitting({ ...status }))
      message.error(`Error: ${error.message}`, 10)
      console.log(error)
    })
}

export const openSeason = (tokenId, message) => async dispatch => {
  // Init contracts
  const seasonContract = initContract(Season, Contracts['4'].Season[0])
  const accounts = await window.web3.eth.getAccounts()
  // Send tx
  const status = {}
  status.openingSeason = true
  dispatch(openingSeason({ ...status }))
  seasonContract.methods.openSeason(tokenId).send({
    from: accounts[0],
    gas: await seasonContract.methods.openSeason(tokenId).estimateGas({ from: accounts[0] }),
  })
    .on('transactionHash', () => {
      message.info('Confirming transaction...', 5)
    })
    .on('confirmation', async(confirmationNumber, receipt) => {
      if (confirmationNumber === 1) {
        status.openingSeason = false
        dispatch(openingSeason({ ...status }))
        const farm = {}
        farm.season = await seasonContract.methods.getSeason(tokenId).call()
        dispatch(seasonOpened({ ...farm }))
        message.success('Season opened. Start seasonal activities!', 5)
      }
    })
    .on('error', error => {
      status.openingSeason = false
      dispatch(openingSeason({ ...status }))
      message.error(`Error: ${error.message}`, 10)
      console.log(error)
    })
}

export const confirmPreparation = (tokenId, values, message) => async dispatch => {
  // Init contracts
  const seasonContract = initContract(Season, Contracts['4'].Season[0])
  const accounts = await window.web3.eth.getAccounts()
  // Send tx
  const status = {}
  if (values.fertilizerCheck) {
    status.confirmingPreparation = true
    dispatch(confirmingPreparation({ ...status }))
    const { crop, fertilizerProof, fertilizerSupplier, fertilizerType, fertilizerUsed } = values
    const fertilizerName = `${fertilizerType} (${fertilizerUsed})`
    const { cid } = await ipfs.add(fertilizerProof)
    const fileHash = cid.string
    seasonContract.methods.confirmPreparations(Number(tokenId), crop, fertilizerName, fertilizerSupplier, fileHash).send({
      from: accounts[0],
      gas: await seasonContract.methods.confirmPreparations(Number(tokenId), crop, fertilizerName, fertilizerSupplier, fileHash).estimateGas({ from: accounts[0] }),
    })
      .on('transactionHash', () => {
        message.info('Confirming transaction...', 5)
      })
      .on('confirmation', async(confirmationNumber, receipt) => {
        if (confirmationNumber === 1) {
          const farm = {}
          farm.season = await seasonContract.methods.getSeason(tokenId).call()
          dispatch(closePreparation({ ...farm }))
          status.confirmingPreparation = false
          dispatch(confirmingPreparation({ ...status }))
          message.success('Transaction confirmed!', 5)
        }
      })
      .on('error', err => {
        status.confirmingPreparation = false
        dispatch(confirmingPreparation({ ...status }))
        message.error(`Error: ${err.message}`, 10)
        console.log(err)
      })
  } else {
    status.confirmingPreparation = true
    dispatch(confirmingPreparation({ ...status }))
    const { crop } = values
    seasonContract.methods.confirmPreparations(tokenId, crop, "", "", "").send({
      from: accounts[0],
      gas: await seasonContract.methods.confirmPreparations(tokenId, crop, "", "", "").estimateGas({ from: accounts[0] }),
    })
      .on('transactionHash', () => {
        message.info('Confirming transaction...', 5)
      })
      .on('confirmation', async(confirmationNumber, receipt) => {
        if (confirmationNumber === 1) {
          const farm = {}
          farm.season = await seasonContract.methods.getSeason(tokenId).call()
          dispatch(closePreparation({ ...farm }))
          status.confirmingPreparation = false
          dispatch(confirmingPreparation({ ...status }))
          message.success('Confirmed!', 5)
        }
      })
      .on('error', err => {
        status.confirmingPreparation = false
        dispatch(confirmingPreparation({ ...status }))
        message.error(`Error: ${err.message}`, 10)
        console.log(err)
      })
  }
}

export const confirmPlanting = (tokenId, values, message) => async dispatch => {
  // Init contracts
  const seasonContract = initContract(Season, Contracts['4'].Season[0])
  const accounts = await window.web3.eth.getAccounts()
  const status = {}
  // Send tx
  if (values.fertilizerCheck) {
    status.confirmingPlanting = true
    dispatch(confirmingPlanting({ ...status }))
    const { expectedYield, yieldUnit, seedsUsed, seedsSupplier, seedProof, plantingFertilizer, fertilizerType, fertilizerSupplier, fertilizerProof } = values
    const fertilizerName = `${fertilizerType} (${plantingFertilizer})`
    const eYield = `${expectedYield} ${yieldUnit}`
    const _f = await ipfs.add(fertilizerProof)
    const fertHash = _f.cid.string
    const _s = await ipfs.add(seedProof)
    const seedHash = _s.cid.string
    seasonContract.methods.confirmPlanting(tokenId, seedsUsed, seedsSupplier, seedHash, eYield, fertilizerName, fertilizerSupplier, fertHash).send({
      from: accounts[0],
      gas: await seasonContract.methods.confirmPlanting(tokenId, seedsUsed, seedsSupplier, seedHash, eYield, fertilizerName, fertilizerSupplier, fertHash).estimateGas({ from: accounts[0] }),
    })
      .on('transactionHash', () => {
        message.info('Confirming transaction...', 5)
      })
      .on('confirmation', async(confirmationNumber, receipt) => {
        if (confirmationNumber === 1) {
          const farm = {}
          farm.season = await seasonContract.methods.getSeason(tokenId).call()
          dispatch(closePlanting({ ...farm }))
          status.confirmingPlanting = false
          dispatch(confirmingPlanting({ ...status }))
          message.success('Confirmed!', 5)
        }
      })
      .on('error', err => {
        status.confirmingPlanting = false
        dispatch(confirmingPlanting({ ...status }))
        message.error(`Error: ${err.message}`, 10)
        console.log(err)
      })
  } else {
    const { expectedYield, yieldUnit, seedsUsed, seedsSupplier, seedProof } = values
    status.confirmingPlanting = true
    dispatch(confirmingPlanting({ ...status }))
    const eYield = `${expectedYield} ${yieldUnit}`
    const _s = await ipfs.add(seedProof)
    const seedHash = _s.cid.string
    seasonContract.methods.confirmPlanting(tokenId, seedsUsed, seedsSupplier, seedHash, eYield, "", "", "").send({
      from: accounts[0],
      gas: await seasonContract.methods.confirmPlanting(tokenId, seedsUsed, seedsSupplier, seedHash, eYield, "", "", "").estimateGas({ from: accounts[0] }),
    })
      .on('transactionHash', () => {
        message.info('Confirming transaction...', 5)
      })
      .on('confirmation', async(confirmationNumber, receipt) => {
        if (confirmationNumber === 1) {
          const farm = {}
          farm.season = await seasonContract.methods.getSeason(tokenId).call()
          dispatch(closePlanting({ ...farm }))
          status.confirmingPlanting = false
          dispatch(confirmingPlanting({ ...status }))
          message.success('Transaction confirmed!', 5)
        }
      })
      .on('error', err => {
        status.confirmingPlanting = false
        dispatch(confirmingPlanting({ ...status }))
        message.error(`Error: ${err.message}`, 10)
        console.log(err)
      })
  }
}

export const confirmGrowth = (tokenId, values, message) => async dispatch => {
  // Init contracts
  const seasonContract = initContract(Season, Contracts['4'].Season[0])
  const accounts = await window.web3.eth.getAccounts()
  // Send tx
  const status = {}
  const { pesticideCheck } = values
  if (pesticideCheck) {
    const { pestName, pestProof, pesticideUsed, pesticideSupplier, pesticideProof } = values
    status.confirmingGrowth = true
    dispatch(confirmingGrowth({ ...status }))
    const _p = await ipfs.add(pestProof)
    const pestProofHash = _p.cid.string
    const _pf = await ipfs.add(pesticideProof)
    const pesticideProofHash = _pf.cid.string
    seasonContract.methods.confirmGrowth(tokenId, pestName, pestProofHash, pesticideUsed, pesticideSupplier, pesticideProofHash).send({
      from: accounts[0],
      gas: await seasonContract.methods.confirmGrowth(tokenId, pestName, pestProofHash, pesticideUsed, pesticideSupplier, pesticideProofHash).estimateGas({ from: accounts[0] }),
    })
      .on('transactionHash', () => {
        message.info('Confirming transaction...', 5)
      })
      .on('confirmation', async(confirmationNumber, receipt) => {
        if (confirmationNumber === 1) {
          const farm = {}
          farm.season = await seasonContract.methods.getSeason(tokenId).call()
          dispatch(closeGrowth({ ...farm }))
          status.confirmingGrowth = false
          dispatch(confirmingGrowth({ ...status }))
          message.success('Transaction confirmed!', 5)
        }
      })
      .on('error', err => {
        status.confirmingGrowth = false
        dispatch(confirmingGrowth({ ...status }))
        message.error(`Error: ${err.message}`, 10)
        console.log(err)
      })
  } else {
    status.confirmingGrowth = true
    dispatch(confirmingGrowth({ ...status }))
    seasonContract.methods.confirmGrowth(tokenId, "", "", "", "", "").send({
      from: accounts[0],
      gas: await seasonContract.methods.confirmGrowth(tokenId, "", "", "", "", "").estimateGas({ from: accounts[0] }),
    })
      .on('transactionHash', () => {
        message.info('Confirming transaction...', 5)
      })
      .on('confirmation', async(confirmationNumber, receipt) => {
        if (confirmationNumber === 1) {
          const farm = {}
          farm.season = await seasonContract.methods.getSeason(tokenId).call()
          dispatch(closeGrowth({ ...farm }))
          status.confirmingGrowth = false
          dispatch(confirmingGrowth({ ...status }))
          message.success('Transaction confirmed!', 5)
        }
      })
      .on('error', err => {
        status.confirmingGrowth = false
        dispatch(confirmingGrowth({ ...status }))
        message.error(`Error: ${err.message}`, 10)
        console.log(err)
      })
  }
}

export const confirmHarvest = (tokenId, values, message) => async dispatch => {
  const { unit, supply } = values
  const _supply = `${supply} ${unit}`
  // Init contracts
  const seasonContract = initContract(Season, Contracts['4'].Season[0])
  const marketContract = initContract(Market, Contracts['4'].Market[0])
  const accounts = await window.web3.eth.getAccounts()
  // Send tx
  const status = {}
  status.confirmingHarvest = true
  dispatch(confirmingHarvest({ ...status }))
  seasonContract.methods.confirmHarvesting(tokenId, _supply).send({
    from: accounts[0],
    gas: await seasonContract.methods.confirmHarvesting(tokenId, _supply).estimateGas({ from: accounts[0] }),
  })
    .on('transactionHash', () => {
      message.info('Confirming transaction...', 5)
    })
    .on('confirmation', async(confirmationNumber, receipt) => {
      if (confirmationNumber === 1) {
        const farm = {}
        farm.season = await seasonContract.methods.getSeason(tokenId).call()
        const _runningSeason = await seasonContract.methods.currentSeason(Number(tokenId)).call()
        const { crop, harvestSupply, traceHash } = await seasonContract.methods.querySeasonData(Number(tokenId), Number(_runningSeason)).call()
        farm.seasonCrop = crop
        farm.seasonSupply = harvestSupply.split(' ')[0]
        farm.completedSeasons = await seasonContract.methods.getFarmCompleteSeasons(tokenId).call()
        farm.seasonMarketed = await marketContract.methods.isSeasonMarketed(Number(tokenId), Number(_runningSeason)).call()
        farm.traceId = traceHash
        dispatch(finishHarvesting({ ...farm }))
        status.confirmingHarvest = false
        dispatch(confirmingHarvest({ ...status }))
        message.success('Transaction confirmed!', 5)
      } 
    })
    .on('error', err => {
      status.confirmingHarvest = false
      dispatch(confirmingHarvest({ ...status }))
      message.error(`Error: ${err.message}`, 10)
      console.log(err)
    })
}

export const bookHarvest = (values, message) => async dispatch => {
  const { tokenId, price, volume } = values
  // Init Contract
  const marketContract = initContract(Market, Contracts['4'].Market[0])
  const seasonContract = initContract(Season, Contracts['4'].Season[0])
  const accounts = await window.web3.eth.getAccounts()
  const runningSeason = Number(await seasonContract.methods.currentSeason(Number(tokenId)).call())
  // Send tx
  const status = {}
  status.booking = true
  dispatch(bookingHarvest({ ...status }))
  marketContract.methods.bookHarvest(Number(tokenId), Number(volume), runningSeason).send({
    from: accounts[0],
    value: new Web3.utils.BN(price).mul(new Web3.utils.BN(volume)).toString(),
  })
    .on('transactionHash', () => {
      message.info('Confirming transaction...', 5)
    })
    .on('confirmation', async(confirmationNumber, receipt) => {
      if (confirmationNumber === 1) {
        status.booking = false
        dispatch(bookingHarvest({ ...status }))
        message.success('Transaction confirmed!', 5)
      }
    })
    .on('error', err => {
      status.booking = false
      dispatch(bookingHarvest({ ...status }))
      message.error(`Error: ${err.message}`, 10)
    })
}

export const gotoMarket = (tokenId, values, message) => async dispatch => {
  const { price, supply, unit, seasonCrop, productImage } = values
  // Init contracts
  const marketContract = initContract(Market, Contracts['4'].Market[0])
  const seasonContract = initContract(Season, Contracts['4'].Season[0])
  // Send tx
  const accounts = await window.web3.eth.getAccounts()
  const status = {}
  const farm = {}
  status.goingToMarket = true
  dispatch(goingtoMarket({ ...status }))
  const { cid } = await ipfs.add(productImage)
  const harvestImage = cid.string
  marketContract.methods.createMarket(Number(tokenId), seasonCrop, harvestImage, Web3.utils.toWei(String(price), 'ether'), Number(supply), unit).send({
    from: accounts[0],
    gas: await marketContract.methods.createMarket(Number(tokenId), seasonCrop, harvestImage, Web3.utils.toWei(String(price), 'ether'), Number(supply), unit).estimateGas({ from: accounts[0] }),
  })
    .on('transactionHash', () => {
      message.info('Confirming transaction...', 5)
    })
    .on('confirmation', async(confirmationNumber, receipt) => {
      if (confirmationNumber === 1) {
        status.goingToMarket = false
        const _season = await seasonContract.methods.currentSeason(Number(tokenId)).call()
        farm.seasonMarketed = await marketContract.methods.isSeasonMarketed(Number(tokenId), _season).call()
        const _market = await marketContract.methods.getCurrentFarmMarket(Number(tokenId)).call()
        farm.currentSeasonSupply = _market.remainingSupply
        dispatch(seasonMarketed({ ...farm }))
        dispatch(goingtoMarket({ ...status }))
        message.success('Congratulation! Watch out for bookings.', 5)
      }
    })
    .on('error', err => {
      status.goingToMarket = false
      dispatch(goingtoMarket({ ...status }))
      message.error(`Error: ${err.message}`, 10)
    })
}

export const received = (values, message) => async dispatch => {
  const { tokenId, season, volume, review } = values
  // Init contracts
  const marketContract = initContract(Market, Contracts['4'].Market[0])
  const registryContract = initContract(Registry, Contracts['4'].FRMRegistry[0])
  // Send tx
  const provider = '0x603Fca0361F0F791f849a98F776bfdbE9ecE26A4'
  const accounts = await window.web3.eth.getAccounts()
  const farmer = await registryContract.methods.ownerOf(tokenId).call()
  const status = {}
  const comment = review ? review : ''
  status.confirmingReceived = true
  dispatch(confirming({ ...status }))
  marketContract.methods.confirmReceivership(tokenId, Number(volume), season, farmer, provider, comment).send({
      from: accounts[0],
      value: Web3.utils.toWei('0.0037', 'ether'),
    })
    .on('transactionHash', () => {
        message.info('Confirming...', 5)
    })
    .on('confirmation', async(confirmationNumber, receipt) => {
      if (confirmationNumber === 1) {
        status.confirmingReceived = false
        dispatch(confirming({ ...status }))
        message.success('Confirmed!', 5)
      }
    })
    .on('error', err => {
      status.confirmingReceived = false
      dispatch(confirming({ ...status }))
      message.error(`Error: ${err.message}`, 10)
    })
}

export const seasonClosure = (tokenId, message) => async dispatch => {
  // Init contracts
  const seasonContract = initContract(Season, Contracts['4'].Season[0])
  const accounts = await window.web3.eth.getAccounts()
  // Send tx
  const status = {}
  status.closingSeason = true
  dispatch(closing({ ...status }))
  seasonContract.methods.closeSeason(tokenId).send({
    from: accounts[0],
    gas: await seasonContract.methods.closeSeason(tokenId).estimateGas({ from: accounts[0] }),
  })
    .on('transactionHash', () => {
      message.info('Confirming transaction...', 5)
    })
    .on('confirmation', async(confirmationNumber, receipt) => {
      if (confirmationNumber === 1) {
        const farm = {}
        farm.season = await seasonContract.methods.getSeason(tokenId).call()
        dispatch(closingSeason({ ...farm }))
        status.closingSeason = false
        dispatch(closing({ ...status }))
        message.success('Transaction confirmed!', 5)
      } 
    })
    .on('error', err => {
      status.closingSeason = false
      dispatch(closing({ ...status }))
      message.error(`Error: ${err.message}`, 10)
      console.log(err)
    })
}

export const definiteClosure = (id, message) => async dispatch => {
  // Init contracts
  const seasonContract = initContract(Season, Contracts['4'].Season[0])
  const accounts = await window.web3.eth.getAccounts()
  // Send tx
  const status = {}
  status.defaultClosing = true
  dispatch(defaultClosure({ ...status }))
  seasonContract.methods.closeSeason(id).send({
    from: accounts[0],
    gas: await seasonContract.methods.closeSeason(id).estimateGas({ from: accounts[0] }),
  })
    .on('transactionHash', () => {
      message.info('Confirming transaction...', 5)
    })
    .on('confirmation', async(confirmationNumber, receipt) => {
      if (confirmationNumber === 1) {
        const farm = {}
        farm.season = await seasonContract.methods.getSeason(id).call()
        dispatch(closingSeason({ ...farm }))
        status.defaultClosing = false
        dispatch(defaultClosure({ ...status }))
        message.success('Transaction confirmed!', 5)
      } 
    })
    .on('error', err => {
      status.defaultClosing = false
      dispatch(defaultClosure({ ...status }))
      message.error(`Error: ${err.message}`, 10)
      console.log(err)
    })
}

