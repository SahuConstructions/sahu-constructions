import {
    WebSocketGateway,
    WebSocketServer,
  } from '@nestjs/websockets';
  import { Server } from 'socket.io';
  
  @WebSocketGateway({ cors: true }) // allow frontend access
  export class AttendanceGateway {
    @WebSocketServer()
    server: Server;
  
    // method to emit events
    sendNewPunch(record: any) {
      this.server.emit('new-punch', record);
    }
  }
  