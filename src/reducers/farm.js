import {
  LOAD_FARM_DATA,
  OPEN_SEASON,
  CLOSE_PREPARATION,
  CLOSE_PLANTING,
  CLOSE_GROWTH,
  FINISH_HARVEST,
} from '../types'

const INITIAL_STATE = {
  tokenId: 0,
  totalBookings: 0,
  txs: 0,
  season: '',
  img: '',
  owner: '',
  lat: 0.0,
  lon: 0.0,
  completedSeasons: 0,
  size: '',
  location: '',
  soil: '',
  farmBookings: [],
}

export function farm(state = INITIAL_STATE, action = {}) {
  switch(action.type) {
    case LOAD_FARM_DATA:
      return {
        ...action.farm,
      }
    case OPEN_SEASON:
      return {
        ...state,
        season: action.farm.season,
      }
    case CLOSE_PREPARATION:
      return {
        ...state,
        season: action.farm.season,
      }
    case CLOSE_PLANTING:
      return {
        ...state,
        season: action.farm.season,
      }
    case CLOSE_GROWTH:
      return {
        ...state,
        season: action.farm.season,
      }
    case FINISH_HARVEST:
      return {
        ...state,
        season: action.farm.season,
      }
    default:
      return state
  }
}

