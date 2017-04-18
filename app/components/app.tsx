import * as React from 'react'
import * as _ from 'lodash'
import * as io from 'socket.io-client'
import { Container, ContainerListItem } from './containerListItem'
import { ContainerList } from './containerList'
import { AppState } from '../appState'
import { NewContainerDialog } from './newContainerModal'
import { DialogTrigger } from './dialogTrigger'

let socket = io.connect()

// corresponding with
// https://auth0.com/blog/docker-dashboard-with-react-typescript-socketio/?utm_source=facebookgroups&utm_medium=sc&utm_campaign=docker_dashboard

export class AppComponent extends React.Component< {}, AppState> {

    constructor() {
      super()
          this.state = {
              containers: [],
              stoppedContainers: []
          }

          socket.on('containers.list', (containers: any) => {

              const partitioned = _.partition(containers, (c: any) => c.State == "running")

              this.setState({
                  containers: partitioned[0].map(this.mapContainer),
                  stoppedContainers: partitioned[1].map(this.mapContainer)
              })
          })

          socket.on('image.error', (args: any) => {
            alert(args.message.json.message)
          })
    }

    mapContainer(container:any): Container {
        return {
            id: container.Id,
            name: _.chain(container.Names)
                .map((n: string) => n.substr(1))
                .join(", ")
                .value(),
            state: container.State,
            status: `${container.State} (${container.Status})`,
            image: container.Image
        }
    }

    onRunImage(name: String) {
      socket.emit('image.run', { name: name })
    }


    componentDidMount() {
      socket.emit('containers.list')
    }

    render() {
        return (
          <div className="container">
              <h1 className="page-header">Docker Dashboard</h1>
              <DialogTrigger id="newContainerModal" buttonText="New container" />
              <ContainerList title="Running" containers={this.state.containers} />
              <ContainerList title="Stopped containers" containers={this.state.stoppedContainers} />

              <NewContainerDialog id="newContainerModal" onRunImage={this.onRunImage.bind(this)} />
          </div>
        )
    }


}
