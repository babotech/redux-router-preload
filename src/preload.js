import React, { Component } from 'react'
import { LOADER_FIELD } from './constants'

import { connect } from 'react-redux'
import hoist from 'hoist-non-react-statics'
import invariant from 'invariant'
import isEqual from 'lodash.isequal'

const mapStateToProps = state => ({
    preloadState: state.preload,
    state
})

const mapDispatchToProps = dispatch => ({
    dispatch
})

const defaultGetParams = props => props.routeParams

export const createPreload = (
    promiseCreator,
    WrappedComponent,
    shouldUpdate = () => true,
    getParams = defaultGetParams
) =>
    class Preload extends Component {

        constructor() {
            super()
            this.state = {
                loading: false
            }
        }

        componentWillReceiveProps(newProps) {
            const newParams = getParams(newProps)
            const oldParams = getParams(this.props)

            if (!isEqual(newParams, oldParams)) {
                this.preloadData(newProps)
            }
        }

        componentWillMount() {
            this.preloadData()
        }

        shouldComponentUpdate(nextProps, nextState) {
            const prevProps = this.props
            const props = {
                prevProps,
                nextProps
            }
            const prevState = this.state
            const state = {
                prevState,
                nextState
            }

            return shouldUpdate(props, state)
        }

        preloadData(newProps) {
            const {preloadState, dispatch, state, ...ownProps} = newProps || this.props

            if (!preloadState.loadedOnServer || preloadState.shouldReloadAfterServerPreload) {
                this.setState({
                    loading: true
                })

                const promise = promiseCreator(dispatch, state, ownProps)

                invariant(promise && promise.then, `first argument of the preload decorator should return a promise`)

                promise
                    .then(() =>
                        this.setState({
                            loading: false
                        }))
            }
        }

        render() {
            const {loading} = this.state

            const props = {
                loading,
                ...this.props
            }

            return <WrappedComponent {...props} />

        }
    }

const preload = (promiseCreator, shouldUpdate) => WrappedComponent => {

    const Preload = createPreload(promiseCreator, WrappedComponent, shouldUpdate)

    Preload[ LOADER_FIELD ] = promiseCreator

    const ResultPreload = hoist(Preload, WrappedComponent)

    return connect(mapStateToProps, mapDispatchToProps)(ResultPreload)
}

export default preload
