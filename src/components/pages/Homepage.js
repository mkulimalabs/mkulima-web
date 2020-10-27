import PropTypes from 'prop-types'
import React, { useEffect } from 'react'
import {
  Statistic,
  Tag,
  Row,
  Col,
  Typography,
  Card,
  Tooltip,
  Empty,
} from 'antd'
import { connect } from 'react-redux'
import { InfoCircleOutlined, LoadingOutlined } from '@ant-design/icons'

// Contracts
import Registry from '../../abis/FRMRegistry.json'
import Season from '../../abis/Season.json'
import Contracts from '../../contracts.json'

// Utils
import { initContract } from '../../utils'

// Redux store
import store from '../../store'

// Redux actions
import {
  loadDashboard,
  isDashLoading,
} from '../../actions'

const { Text } = Typography

const valueStyle = { fontFamily: 'Noto Sans SC' }

const infoStyle = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center'
}

const loadingInfo = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '60px'
}

function Homepage({ dash, isLoading }) {

  useEffect(() => {
    const registryContract = initContract(Registry, Contracts.dev.FRMRegistry[0])
    const seasonContract = initContract(Season, Contracts.dev.Season[0])

    async function loadDashboardData() {
      const dashboard = {}
      const loadingState = {}
      loadingState.dashLoading = true
      store.dispatch(isDashLoading({ ...loadingState }))
      dashboard.lands = await registryContract.methods.totalSupply().call()
      dashboard.seasons = await seasonContract.methods.completeSeasons().call()
      dashboard.bookings = await seasonContract.methods.totalBooking().call()
      dashboard.traces = await seasonContract.methods.allTraces().call()
      dashboard.farms = []
      // Load the first 3 farms
      if (Number(dashboard.lands) === 0) {
        dashboard.farms = []
      } else if (Number(dashboard.lands) > 3) {
        // Randomize querying the 1st 3 farms
        for (let i = 1; i <= 3; i++) {
          try {
            dashboard.farms[i] = await registryContract.methods.queryUserTokenizedFarm(Math.floor(Math.random() * Number(dashboard.lands) + 1))
          } catch(err) {
            console.log(err)
          }
        }
      } else {
        for (let i = 1; i <= Number(dashboard.lands); i++) {
          try {
            dashboard.farms[i] = await registryContract.methods.queryUserTokenizedFarm(i).call()
          } catch(err) {
            console.log(err)
          }
        }
      }
      store.dispatch(loadDashboard({ ...dashboard }))
      loadingState.dashLoading = false
      store.dispatch(isDashLoading({ ...loadingState }))
    }

    loadDashboardData()

  }, [])

  return (
    <>
      <Row justify='center' align='middle'>
        <Col xs={24} xl={6} className='column_con'>
          {isLoading ? (
            <div style={loadingInfo} className='head_line_con'>
              <LoadingOutlined style={{ marginTop: '20px' }}/>
            </div>
          ) : (
            <div style={infoStyle} className='head_line_con'>
              <Statistic title='Lands' value={Number(dash.lands)} valueStyle={valueStyle} />
              <div style={{ alignSelf: 'flex-start', marginLeft: '15px' }}>
                <Tooltip placement='top' title={<span>Number of tokenized farmlands</span>}>
                  <InfoCircleOutlined />
                </Tooltip>
              </div>
            </div>
          )} 
        </Col>
        <Col xs={24} xl={6} className='column_con'>
          {isLoading ? (
            <div style={loadingInfo} className='head_line_con'>
              <LoadingOutlined style={{ marginTop: '20px' }}/>
            </div>
          ) : (
            <div style={infoStyle} className='head_line_con'>
              <Statistic title='Seasons' value={Number(dash.seasons)} valueStyle={valueStyle} />
              <div style={{ alignSelf: 'flex-start', marginLeft: '15px' }}>
                <Tooltip placement='top' title={<span>Number of complete seasons</span>}>
                  <InfoCircleOutlined />
                </Tooltip>
              </div>
            </div>
          )}
        </Col>
        <Col xs={24} xl={6} className='column_con'>
          {isLoading ? (
            <div style={loadingInfo} className='head_line_con'>
              <LoadingOutlined style={{ marginTop: '20px' }}/>
            </div>
          ) : (
            <div style={infoStyle} className='head_line_con'>
              <Statistic title='Bookings' value={Number(dash.bookings)} valueStyle={valueStyle} />
              <div style={{ alignSelf: 'flex-start', marginLeft: '15px' }}>
                <Tooltip placement='top' title={<span>Number of complete bookings</span>}>
                  <InfoCircleOutlined />
                </Tooltip>
              </div>
            </div>
          )}
        </Col>
        <Col xs={24} xl={6} className='column_con'>
          {isLoading ? (
            <div style={loadingInfo} className='head_line_con'>
              <LoadingOutlined style={{ marginTop: '20px' }}/>
            </div>
          ) : (
            <div style={infoStyle} className='head_line_con'>
              <Statistic title='Traces' value={Number(dash.traces)} valueStyle={valueStyle} />
              <div style={{ alignSelf: 'flex-start', marginLeft: '15px' }}>
                <Tooltip placement='top' title={<span>Number of traces performed</span>}>
                  <InfoCircleOutlined />
                </Tooltip>
              </div>
            </div>
          )}
        </Col>
      </Row>
      <Row justify='center' align='center'>
        {isLoading ? (
          <Col xs={24} xl={24} className='column_con' style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <LoadingOutlined style={{ marginTop: '50px' }}/>
          </Col>
        ) : dash.farms.length === 0 ? (
          <Col xs={24} xl={24} className='column_con'>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span>No farm records</span>} />
          </Col>
        ) : dash.farms.map(farm => (
          <Col key={farm.id} xs={24} xl={8} className='column_con'>
            <Card
              hoverable
              style={{ width: 320 }}
              cover={<img alt='img' src={`${farm.img}`} />}
              actions={[
                <Text
                  underline
                  strong
                >
                  <a>View</a>
                </Text>
              ]}
            >
              <Card.Meta title={'#' + farm.tokenId} description={<Tag color='#7546C9'>{farm.season}</Tag>} />
            </Card>
          </Col>
        ))}
      </Row>
    </>
  )
}

Homepage.propTypes = {
  dash: PropTypes.object,
}

function mapStateToProps(state) {
  return {
    isLoading: state.loading.dashboardLoading,
    dash: state.dashboard,
  }
}

export default connect(mapStateToProps)(Homepage)
